'use strict';
process.env.GDC_ALLOW_INSECURE_HTTP = '1'; // local HTTP mock - tests only
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { sendToWebhook } = require('../src/webhookClient');
const { TransientError, PermanentError } = require('../src/errors');

function startMock(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

const payload = { connectorId: 'C1', deviceId: 'T1', userId: 'ADH001', method: 'fingerprint', timestamp: '2026-08-22T18:00:31Z', eventType: 'ACCESS', eventId: 'e1' };

test('webhook client delivers + reads Authorization header', async () => {
  let seenAuth = null;
  let seenBody = null;
  const { server, port } = await startMock((req, res) => {
    seenAuth = req.headers.authorization;
    let b = '';
    req.on('data', (c) => { b += c; });
    req.on('end', () => {
      seenBody = JSON.parse(b);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ decision: 'GRANTED', message: 'Accès autorisé', eventId: 'e1' }));
    });
  });
  try {
    const res = await sendToWebhook(payload, { url: `http://127.0.0.1:${port}/fn`, secret: 'topsecret', timeoutMs: 2000 });
    assert.equal(res.ok, true);
    assert.equal(res.decision, 'GRANTED');
    assert.equal(res.eventId, 'e1');
    assert.equal(seenAuth, 'Bearer topsecret');
    assert.equal(seenBody.connectorId, 'C1');
    assert.equal(seenBody.userId, 'ADH001');
    assert.ok(!JSON.stringify(seenBody).includes('fingerprintTemplate'));
  } finally {
    server.close();
  }
});

test('webhook client treats 500 as transient (retryable)', async () => {
  const { server, port } = await startMock((_req, res) => {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'edge function busy' }));
  });
  try {
    const res = await sendToWebhook(payload, { url: `http://127.0.0.1:${port}/fn`, timeoutMs: 2000 });
    assert.equal(res.ok, false);
    assert.ok(res.error instanceof TransientError);
  } finally {
    server.close();
  }
});

test('webhook client treats 400 as permanent (no retry)', async () => {
  const { server, port } = await startMock((_req, res) => {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ decision: 'DENIED', message: 'bad payload' }));
  });
  try {
    const res = await sendToWebhook(payload, { url: `http://127.0.0.1:${port}/fn`, timeoutMs: 2000 });
    assert.equal(res.ok, false);
    assert.ok(res.error instanceof PermanentError);
  } finally {
    server.close();
  }
});

test('webhook client refuses plain http unless explicitly allowed', async () => {
  const saved = process.env.GDC_ALLOW_INSECURE_HTTP;
  delete process.env.GDC_ALLOW_INSECURE_HTTP;
  try {
    const res = await sendToWebhook(payload, { url: 'http://127.0.0.1:9/fn', timeoutMs: 500 });
    assert.equal(res.ok, false);
    assert.ok(res.error instanceof PermanentError);
  } finally {
    process.env.GDC_ALLOW_INSECURE_HTTP = saved;
  }
});