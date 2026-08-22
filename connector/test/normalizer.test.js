'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEvent } = require('../src/normalizer');

const cfg = {
  accessControl: {
    allowedMethods: ['fingerprint'],
    allowedEventTypes: ['ACCESS', 'CHECK_IN'],
    verifyModeMap: { 1: 'fingerprint', 2: 'face' },
  },
};
const srcCfg = {
  mapping: {
    deviceId: 'sn',
    userId: 'employeeNo',
    timestamp: 'recordTimeStr',
    method: 'verifyType',
    eventType: 'event',
    eventId: 'id',
  },
};

test('normalizes a fingerprint CVAccess record into the SDK payload', () => {
  const raw = {
    sn: 'TERMINAL_001',
    employeeNo: 'ADH001',
    verifyType: 1,
    recordTimeStr: '2026-08-22 18:00:31',
    event: 'CHECK_IN',
    id: 48213,
  };
  const out = normalizeEvent(raw, cfg, srcCfg, { connectorId: 'GYM_PC_001' });
  assert.equal(out.filtered, false);
  assert.deepEqual(Object.keys(out.normalized).sort(), [
    'connectorId', 'deviceId', 'eventId', 'eventType', 'method',
    'payloadVersion', 'sourceEventId', 'timestamp', 'userId',
  ].sort());
  assert.equal(out.normalized.connectorId, 'GYM_PC_001');
  assert.equal(out.normalized.deviceId, 'TERMINAL_001');
  assert.equal(out.normalized.userId, 'ADH001');
  assert.equal(out.normalized.method, 'fingerprint');
  assert.equal(out.normalized.timestamp, '2026-08-22T18:00:31.000Z');
  assert.equal(out.normalized.eventType, 'CHECK_IN');
  assert.equal(out.normalized.eventId, '48213');
});

test('filters non-fingerprint methods (face is not allowed here)', () => {
  const raw = { sn: 'T1', employeeNo: 'ADH001', verifyType: 2, recordTimeStr: '2026-08-22 18:00:31', event: 'CHECK_IN' };
  const out = normalizeEvent(raw, cfg, srcCfg, { connectorId: 'C1' });
  assert.equal(out.filtered, true);
  assert.match(out.reason, /method_not_allowed:face/);
});

test('filters records without a user id', () => {
  const out = normalizeEvent({ sn: 'T1', verifyType: 1 }, cfg, srcCfg, { connectorId: 'C1' });
  assert.equal(out.filtered, true);
  assert.equal(out.reason, 'missing_user_id');
});

test('filters non ACCESS event types when configured', () => {
  const cfg2 = {
    accessControl: { allowedMethods: ['fingerprint'], allowedEventTypes: ['ACCESS'] },
  };
  const out = normalizeEvent(
    { sn: 'T1', employeeNo: 'ADH001', verifyType: 1, recordTimeStr: '2026-08-22 18:00:31', event: 'ATTENDANCE' },
    cfg2,
    srcCfg,
    { connectorId: 'C1' }
  );
  assert.equal(out.filtered, true);
  assert.match(out.reason, /event_type_not_allowed/);
});

test('accepts string method "FingerPrint" and derives deterministic eventId', () => {
  const out = normalizeEvent(
    { sn: 'T1', userId: 'ADH001', method: 'FingerPrint', eventType: 'ACCESS', time: '2026-08-22T18:00:31Z', eventId: '' },
    cfg,
    { mapping: { deviceId: 'sn', userId: 'userId', method: 'method', timestamp: 'time', eventType: 'eventType' } },
    { connectorId: 'C1' }
  );
  assert.equal(out.filtered, false);
  assert.equal(out.normalized.method, 'fingerprint');
  assert.ok(out.normalized.eventId.length === 40); // sha1 hex
});

test('sensitive fields never leak into the normalized payload', () => {
  const raw = {
    sn: 'T1', employeeNo: 'ADH001', verifyType: 1, recordTimeStr: '2026-08-22 18:00:31',
    event: 'CHECK_IN', fingerprintTemplate: 'base64...', photo: 'face.jpg', rawImage: 'bin',
  };
  const out = normalizeEvent(raw, cfg, srcCfg, { connectorId: 'C1' });
  assert.equal(out.filtered, false);
  const joined = JSON.stringify(out.normalized);
  for (const banned of ['fingerprintTemplate', 'photo', 'rawImage', 'base64']) {
    assert.ok(!joined.includes(banned), `normalized payload must not contain ${banned}`);
  }
});