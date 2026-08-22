'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  webhookClient.js - outbound HTTPS client for the Supabase edge function.
//
//  Security rules enforced here:
//   * only outbound HTTPS (plain http allowed only when explicitly forced for
//     local testing via GDC_ALLOW_INSECURE_HTTP=1)
//   * "Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>" when a secret is set
//   * nothing beyond the normalized payload is ever serialised
// ─────────────────────────────────────────────────────────────────────────────

const https = require('https');
const http = require('http');
const { URL } = require('url');
const { TransientError, PermanentError } = require('./errors');

/**
 * POST a normalized payload to the webhook and parse the decision.
 *
 * @param {object} payload  normalized event (see normalizer.toWire)
 * @param {object} opts
 *   { url, secret, timeoutMs, maxBodyBytes, acceptedStatusCodes }
 * @returns {Promise<object>} { ok, httpStatus, decision, message, eventId,
 *                             latencyMs, raw }
 */
function sendToWebhook(payload, opts) {
  const url = new URL(opts.url);
  const secure = url.protocol === 'https:';
  if (!secure && process.env.GDC_ALLOW_INSECURE_HTTP !== '1') {
    return Promise.resolve({
      ok: false,
      httpStatus: 0,
      decision: null,
      message: 'Refusing insecure webhook transport; configure https',
      eventId: null,
      latencyMs: 0,
      error: new PermanentError(
        'Refusing insecure webhook transport; use https (or set GDC_ALLOW_INSECURE_HTTP=1 only for local tests).'
      ),
    });
  }
  const timeoutMs = opts.timeoutMs || 15000;
  const maxBodyBytes = opts.maxBodyBytes || 16384;
  const body = Buffer.from(JSON.stringify(payload), 'utf8');

  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': body.length,
    'Accept': 'application/json',
    'User-Agent': 'GymDoorConnector/1.0',
  };
  const secret = opts.secret;
  if (secret) headers.Authorization = `Bearer ${secret}`;
  if (payload.connectorId) headers['X-Connector-Id'] = String(payload.connectorId);

  const mod = secure ? https : http;
  const started = Date.now();

  return new Promise((resolve) => {
    const req = mod.request(
      url,
      { method: 'POST', headers, timeout: timeoutMs },
      (res) => {
        const chunks = [];
        let received = 0;
        let overflow = false;
        res.on('data', (c) => {
          received += c.length;
          if (received > maxBodyBytes) {
            overflow = true;
            res.destroy();
            return;
          }
          chunks.push(c);
        });
        res.on('end', () => {
          const latencyMs = Date.now() - started;
          const text = overflow ? '' : Buffer.concat(chunks).toString('utf8');
          let parsed = {};
          if (text) {
            try {
              parsed = JSON.parse(text);
            } catch (_) {
              parsed = { raw: text.slice(0, 512) };
            }
          }
          const status = res.statusCode || 0;
          const decision = parsed.decision ?? null;
          if (status >= 200 && status < 300) {
            return resolve({
              ok: true,
              httpStatus: status,
              decision,
              message: parsed.message ?? null,
              eventId: parsed.eventId ?? payload.eventId ?? null,
              latencyMs,
            });
          }
          const bodySummary = parsed.message || parsed.raw || `http ${status}`;
          if (status === 401 || status === 403 || status === 404 || status === 400) {
            return resolve({
              ok: false,
              httpStatus: status,
              decision,
              message: bodySummary,
              eventId: null,
              latencyMs,
              error: new PermanentError(`webhook rejected (${status})`, { httpStatus: status }),
            });
          }
          // 408/429/5xx => retryable
          return resolve({
            ok: false,
            httpStatus: status,
            decision,
            message: bodySummary,
            eventId: null,
            latencyMs,
            error: new TransientError(`webhook transient failure (${status})`, { httpStatus: status }),
          });
        });
        res.on('error', (e) => {
          // partial body / chunk error -> retryable
          resolve({
            ok: false, httpStatus: 0, decision: null, message: e.message,
            eventId: null, latencyMs: Date.now() - started,
            error: new TransientError(`response error: ${e.message}`),
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error(`webhook timeout after ${timeoutMs}ms`));
    });
    req.on('error', (e) => {
      resolve({
        ok: false, httpStatus: 0, decision: null, message: e.message,
        eventId: null, latencyMs: Date.now() - started,
        error: new TransientError(`network error: ${e.message}`),
      });
    });

    req.write(body);
    req.end();
  });
}

module.exports = { sendToWebhook };