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

test('push receiver unwraps the CVAccess cloud envelope payload.transactions (real captured shape)', async (t) => {
  const { rec, events } = await startReceiver(0, {
    mapping: {
      deviceId: 'deviceSn',
      userId: 'reId',
      timestamp: 'eventTime',
      method: 'verifyType',
      eventType: 'eventName',
      eventId: 'id',
    },
  });
  const port = rec.server.address().port;

  // a real captured remote-open event (no verifyType) -> must be filtered
  await post(`http://127.0.0.1:${port}/events`, {
    payload: {
      transactions: [{
        id: '4028e49ea02a55af01a02b0ce3030c7a',
        objKey: 'admin',
        objName: 'Inconnu',
        reId: 'admin',
        faceRate: '0.00',
        eventName: 'Ouverture à distance',
        eventNameKey: 'acc_eventNo_8',
        eventTime: 1787428659000,
        sourceModule: 'acc',
        deviceSn: 'TDBD260600977',
        deviceName: 'Entrée',
        subsetNo: '1',
        eventTypeCode: '8',
      }],
      timestamp: 1787428659000,
    },
    sid: 'push.hcc.data.transaction',
  });
  // No verifyType -> method unknown -> filtered
  assert.equal(events.length, 0);

  // Now a fingerprint transaction (verifyType=1) -> normalized + forwarded
  await post(`http://127.0.0.1:${port}/events`, {
    payload: {
      transactions: [{
        id: 'evt-fp-1',
        reId: 'ADH001',
        objName: 'Karim Benali',
        eventName: 'Fingerprint verify',
        eventTime: 1787429000000,
        deviceSn: 'TDBD260600977',
        verifyType: 1,
      }],
      timestamp: 1787429000000,
    },
    sid: 'push.hcc.data.transaction',
  });
  assert.equal(events.length, 1);
  assert.equal(events[0].normalized.method, 'fingerprint');
  assert.equal(events[0].normalized.userId, 'ADH001');
  assert.equal(events[0].normalized.deviceId, 'TDBD260600977');
  assert.equal(events[0].normalized.eventType, 'ACCESS');
  await rec.stop();
});