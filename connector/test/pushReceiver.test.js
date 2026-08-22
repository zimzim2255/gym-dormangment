'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { PushReceiver } = require('../src/sources/pushReceiver');

const cfg = {
  accessControl: { allowedMethods: ['fingerprint'], allowedEventTypes: ['ACCESS', 'CHECK_IN'] },
};

async function startReceiver(port, sourceCfg = {}) {
  const rec = new PushReceiver({
    cfg,
    connectorId: 'TEST_CONN',
    log: { info() {}, warn() {}, error() {} },
    sourceCfg: { listenHost: '127.0.0.1', listenPort: port, scheme: 'http', captureFirst: false, ...sourceCfg },
  });
  const events = [];
  await rec.start((evt) => events.push(evt));
  return { rec, events };
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
      let b = '';
      res.on('data', (c) => { b += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

test('push receiver accepts a CVAccess JSON event and normalizes a fingerprint event', async (t) => {
  const { rec, events } = await startReceiver(0);
  t.after(() => rec.stop());
  const port = rec.server.address().port;

  const res = await post(`http://127.0.0.1:${port}/events`, {
    sn: 'TERMINAL_001',
    userId: 'ADH001',
    verifyMode: 1,
    timestamp: '2026-08-22T18:00:31Z',
    eventType: 'CHECK_IN',
    eventId: 'evt-1',
  });
  assert.equal(res.status, 202);
  assert.equal(events.length, 1);
  assert.equal(events[0].normalized.method, 'fingerprint');
  assert.equal(events[0].normalized.userId, 'ADH001');
  assert.equal(events[0].normalized.deviceId, 'TERMINAL_001');
});

test('push receiver drops non-fingerprint events (face)', async (t) => {
  const { rec, events } = await startReceiver(0);
  const port = rec.server.address().port;
  await post(`http://127.0.0.1:${port}/events`, {
    sn: 'T1', userId: 'ADH001', verifyMode: 2, timestamp: '2026-08-22T18:00:31Z', eventType: 'CHECK_IN',
  });
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(events.length, 0);
  await rec.stop();
});