'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  tools/mock-webhook.js - LOCAL TEST-ONLY stand-in for the Supabase edge
//  function. Returns GRANTED for known users (ADH001..ADH008), DENIED for the
//  rest, and echoes the eventId. Logs every request.
//
//  Usage:   node tools\mock-webhook.js [port] [secret]
//  Default: port 9099, no auth required.
//
//  Never deployed; used by connector/test + for a quick local smoke test.
// ─────────────────────────────────────────────────────────────────────────────

const http = require('http');
const port = Number(process.argv[2] || 9000);
const secret = process.argv[3] || null;

const KNOWN = new Set(['ADH001', 'ADH002', 'ADH003', 'ADH004']);

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    let payload = {};
    try { payload = JSON.parse(body); } catch (_) {}
    const auth = req.headers.authorization || '';
    if (secret && auth !== `Bearer ${secret}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ decision: 'UNAUTHORIZED', message: 'bad secret', eventId: null }));
      console.log(`[mock-webhook] 401 ${payload.userId || '?'}`);
      return;
    }
    const granted = KNOWN.has(String(payload.userId || ''));
    const out = {
      decision: granted ? 'GRANTED' : 'DENIED',
      message: granted ? 'Accès autorisé' : 'Membre non reconnu',
      eventId: payload.eventId || 'mock-evt',
    };
    console.log(`[mock-webhook] ${out.decision} ${payload.userId || '?'} method=${payload.method} event=${payload.eventId}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(out));
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`[mock-webhook] listening on http://127.0.0.1:${port}${secret ? ' (secret required)' : ' (no secret)'}`);
});