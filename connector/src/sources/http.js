'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  sources/http.js - tiny HTTP(S) JSON client used by CVAccess sources
//  (never used for the Supabase webhook - see src/webhookClient.js)
// ─────────────────────────────────────────────────────────────────────────────

const https = require('https');
const http = require('http');

/**
 * @param {object} opts { url, method, headers, body, timeoutMs }
 * @returns {Promise<{status:number, json?:object, text:string}>}
 */
function requestJson(opts) {
  const { URL } = require('url');
  const url = new URL(opts.url);
  const secure = url.protocol === 'https:';
  const mod = secure ? https : http;
  const timeoutMs = opts.timeoutMs || 5000;

  const headers = { Accept: 'application/json', ...(opts.headers || {}) };
  let bodyBuf;
  if (opts.body !== undefined) {
    const b = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
    bodyBuf = Buffer.from(b, 'utf8');
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = bodyBuf.length;
  }

  return new Promise((resolve, reject) => {
    const req = mod.request(url, { method: opts.method || 'GET', headers, timeout: timeoutMs }, (res) => {
      const chunks = [];
      res.on('data', (c) => {
        if (chunks.length * 65536 + c.length > 2 * 1024 * 1024) {
          res.destroy();
          reject(new Error('source response too large'));
          return;
        }
        chunks.push(c);
      });
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let parsed;
        try {
          parsed = text ? JSON.parse(text) : undefined;
        } catch (_) {
          parsed = undefined;
        }
        resolve({ status: res.statusCode || 0, body: parsed, text });
      });
    });
    req.on('timeout', () => req.destroy(new Error(`timeout after ${timeoutMs}ms`)));
    req.on('error', reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

module.exports = { requestJson };