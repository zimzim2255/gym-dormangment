'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { DurableQueue } = require('../src/queue');

function makeQ(opts = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gdc-queue-'));
  return new DurableQueue({
    file: path.join(dir, 'queue.ndjson'),
    deadLetterFile: path.join(dir, 'dead.ndjson'),
    initialDelayMs: 1,
    maxDelayMs: 100,
    factor: 2,
    maxAttempts: opts.maxAttempts ?? 5,
  });
}

test('queue adds, takes due and retries with backoff', () => {
  const q = makeQ();
  const e = q.add({ userId: 'ADH001' });
  const due = q.takeDue();
  assert.equal(due.length, 1);
  assert.equal(due[0].id, e.id);
  const outcome = q.scheduleRetry(due[0]);
  assert.equal(outcome.dropped, false);
  assert.ok(due[0].retryCount === 1);
  assert.ok(due[0].nextAttemptAt > Date.now() - 1);
  assert.equal(q.depth(), 1);
});

test('queue drops to dead letter after maxAttempts', () => {
  const q = makeQ({ maxAttempts: 2 });
  let entry = q.add({ payload: { userId: 'ADH001' } });
  entry = q.takeDue()[0];
  q.scheduleRetry(entry); // attempt 1
  entry = q.takeDue(9999999999999)[0];
  const outcome = q.scheduleRetry(entry); // attempt 2 => dropped
  assert.equal(outcome.dropped, true);
  assert.equal(q.depth(), 0);
  const dead = fs.readFileSync(q.deadLetterFile, 'utf8');
  assert.ok(dead.includes('ADH001'));
});

test('queue persists across instances (survives a restart)', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gdc-queue2-')), 'queue.ndjson');
  const q1 = new DurableQueue({ file, deadLetterFile: file + '.dead', initialDelayMs: 1 });
  q1.add({ userId: 'ADH002' });
  q1.persist();
  const q2 = new DurableQueue({ file, deadLetterFile: file + '.dead', initialDelayMs: 1 });
  assert.equal(q2.depth(), 1);
  const due = q2.takeDue();
  assert.equal(due[0].payload.userId, 'ADH002');
});

test('deadLetter() writes straight to the dead-letter store', () => {
  const q = makeQ();
  q.deadLetter({ userId: 'BAD' }, { reason: 'webhook rejected (400)' });
  assert.equal(q.depth(), 0);
  const dead = fs.readFileSync(q.deadLetterFile, 'utf8');
  assert.ok(dead.includes('BAD'));
});