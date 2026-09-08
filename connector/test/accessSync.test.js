'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  control/accessSync.test.js - pure logic tests for the allow-list sync.
// ─────────────────────────────────────────────────────────────────────────────
const test = require('node:test');
const assert = require('node:assert/strict');
const { computeChanges, buildUpdateSql, parseLocalUsers } = require('../src/control/accessSync');

test('computeChanges: enables missing, disables expired, skips invalid ids', () => {
  const allowedIds = new Set(['ADH001', 'ADH005']);
  const localUsers = [
    { id: 'ADH001', enabled: 0 },             // not enabled locally -> enable
    { id: 'ADH002', enabled: 'true' },        // not allowed anymore  -> disable
    { id: 'ADH005', enabled: true },          // already correct      -> no change
    { id: 'ADH006', enabled: 't' },           // expired/suspended    -> disable
    { id: 'bad id; --', enabled: 1 },         // unsafe id            -> skip
    { id: '', enabled: 1 },                   // empty id             -> skip
  ];
  const d = computeChanges({ allowedIds, localUsers });
  assert.deepEqual(d.toEnable, ['ADH001']);
  assert.deepEqual(d.toDisable, ['ADH002', 'ADH006']);
  assert.ok(d.skipped.some((s) => s === 'bad id; --'));
});

test('buildUpdateSql: only validated ids and fr-dates are interpolated', () => {
  const tpl = 'UPDATE users SET islockout = false, endtime = {{expiryDate}} WHERE userid = {{userId}}';
  const sql = buildUpdateSql(tpl, 'ADH001', { enabled: true, expiryDate: '31/12/2026' });
  assert.ok(sql.includes("'ADH001'"));
  assert.ok(sql.includes("'31/12/2026'"));
  // injection attempts / bad dates / missing template -> null
  assert.equal(buildUpdateSql(tpl, "ADH001'; DROP TABLE users; --", { enabled: true }), null);
  assert.equal(buildUpdateSql(tpl, 'ADH001', { expiryDate: '31/13/2026' }), null);
  assert.equal(buildUpdateSql(tpl, 'ADH001', { expiryDate: 'DROP' }), null);
  assert.equal(buildUpdateSql(null, 'ADH001', {}), null);
  assert.equal(buildUpdateSql('UPDATE t SET x=1', 'ADH001', {}), null);
});

test('parseLocalUsers: psql positional rows id|enabled', () => {
  const out = parseLocalUsers('ADH001|~|t\nADH002|~|f\n', 'psql');
  assert.equal(out.length, 2);
  assert.equal(out[0].id, 'ADH001');
  assert.equal(out[1].enabled, 'f');
});