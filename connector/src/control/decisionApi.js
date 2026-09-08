'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  control/decisionApi.js - expose the Supabase decision as a local HTTP API.
//
//  Lets any local component ask "may this user enter?" and get the SAME
//  GRANTED/DENIED reply the edge function gives the terminal. This is the
//  "connector as API" piece: the door system / a test client POSTs here and
//  receives the decision. It never opens ports to the internet and shares the
//  webhook's bearer secret.
//
//  POST /  { userId, deviceId?, method?, eventType?, timestamp? }
//  -> 200 { decision: "GRANTED"|"DENIED"|"ERROR", message, eventId, granted }
// ─────────────────────────────────────────────────────────────────────────────

const http = require('http');
const { sendToWebhook } = require('../webhookClient');
const { toWire } = require('../normalizer');

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let received = 0;
    let overflow = false;
    req.on('data', (c) => {
      received += c.length;
      if (received > (maxBytes || 16384)) { overflow = true; req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(overflow ? '' : Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parseBody(contentType, text) {
  if (!text) return {};
  if ((contentType || '').includes('application/json') || text.trimStart().startsWith('{')) {
    try { return JSON.parse(text); } catch (_) { return { raw: text }; }
  }
  const out = {};
  for (const pair of text.split('&')) {
    const i = pair.indexOf('=');
    if (i < 0) continue;
    try {
      out[decodeURIComponent(pair.slice(0, i))] = decodeURIComponent(pair.slice(i + 1));
    } catch (_) { /* keep */ }
  }
  return out;
}

class DecisionApi {
  constructor({ cfg, connectorId, log }) {
    this.cfg = cfg;
    this.connectorId = connectorId;
    this.log = log || console;
    this.host = cfg.control?.decisionApi?.listenHost || '127.0.0.1';
    this.port = cfg.control?.decisionApi?.listenPort || 8092;
    this.server = null;
    this.stat = { received: 0, answered: 0, error: 0 };
  }

  async start() {
    this.server = http.createServer((req, res) => {
      try { this.handle(req, res); } catch (e) {
        this.stat.error += 1;
        this.log.error('decision.api.error', { error: e.message });
        if (!res.writableEnded) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ decision: 'ERROR', message: e.message }));
        }
      }
    });
    await new Promise((resolve) => this.server.listen(this.port, this.host, () => resolve()));
    return this;
  }

  stop() {
    if (this.server) { try { this.server.close(); } catch (_) {} }
  }

  async handle(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ decision: 'ERROR', message: 'method not allowed' }));
      return;
    }
    this.stat.received += 1;
    const body = await readBody(req, this.cfg.webhook?.maxBodyBytes);
    const parsed = parseBody(req.headers['content-type'] || '', body);

    const userId = String(parsed.userId || parsed.reId || '').trim();
    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ decision: 'DENIED', message: 'missing userId' }));
      return;
    }

    const normalized = {
      connectorId: this.connectorId,
      deviceId: String(parsed.deviceId || parsed.serialNumber || parsed.deviceSn || 'UNKNOWN_TERMINAL'),
      userId,
      method: String(parsed.method || 'fingerprint'),
      timestamp: parsed.timestamp || new Date().toISOString(),
      eventType: String(parsed.eventType || 'ACCESS').toUpperCase(),
      payloadVersion: 1,
    };
    const wire = toWire(normalized);

    const result = await sendToWebhook(wire, {
      url: this.cfg.webhook?.url,
      secret: this.cfg.webhook?.secret,
      timeoutMs: this.cfg.webhook?.timeoutMs,
      maxBodyBytes: this.cfg.webhook?.maxBodyBytes,
    });

    this.stat.answered += 1;
    res.writeHead(result.ok ? 200 : 502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      decision: result.decision || 'ERROR',
      message: result.message,
      eventId: result.eventId,
      granted: result.decision === 'GRANTED',
    }));
  }
}

module.exports = { DecisionApi };