'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Dedupe } = require('../src/dedupe');

test('dedupe drops repeats inside the window', () => {
  const d = new Dedupe({ windowSeconds: 60 });
  assert.equal(d.add('k1'), true);
  assert.equal(d.add('k1'), false);
  assert.equal(d.has('k1'), true);
  assert.equal(d.add('k2'), true);
  assert.equal(d.maxKeys, 5000);
});

test('dedupe prunes expired keys', () => {
  let now = 100000;
  const d = new Dedupe({ windowSeconds: 10, now: () => now });
  d.add('old');
  now += 11000;
  assert.equal(d.has('old'), false);
  assert.equal(d.add('old'), true);
});

test('dedupe persists and reloads window', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gdc-dedupe-')), 'dedupe.json');
  const d1 = new Dedupe({ windowSeconds: 60, file });
  d1.add('warm');
  d1.save();
  const d2 = new Dedupe({ windowSeconds: 60, file });
  assert.equal(d2.has('warm'), true);
  assert.equal(d2.add('warm'), false);
});