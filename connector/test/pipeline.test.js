'use strict';
process.env.GDC_ALLOW_INSECURE_HTTP = '1'; // local HTTP mock - tests only
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { Runner } = require('../src/runner');
const { loadConfig } = require('../src/config');

function writeHome(home, overrides = {}) {
  const cfg = {
    connector: { id: 'TEST_CONN', logLevel: 'warn', logMaxDays: 1 },
    dedupe: { windowSeconds: 60, maxKeys: 5000 },
    retry: { initialDelayMs: 1, maxDelayMs: 50, factor: 2, maxAttempts: 5, sweepIntervalMs: 20 },
    webhook: { url: '', secret: 'topsecret', timeoutMs: 2000, maxBodyBytes: 16384 },
    accessControl: { allowedMethods: ['fingerprint'], allowedEventTypes: ['ACCESS', 'CHECK_IN'], verifyModeMap: {} },
    sources: {
      cvaccessOpenApi: { enabled: false },
      cvaccessPush: { enabled: false },
      cvaccessDb: { enabled: false },
      mockFingerprint: { enabled: false, intervalMs: 20, users: ['ADH001'], deviceId: 'TERMINAL_001' },
    },
    ...overrides,
  };
  fs.mkdirSync(path.join(home, 'config'), { recursive: true });
  fs.writeFileSync(path.join(home, 'config', 'config.json'), JSON.stringify(cfg));
}

function makeHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gdc-home-'));
}

function startMock(handler) {
  return new Promise((resolve) => {
    const srv = http.createServer(handler);
    srv.listen(0, '127.0.0.1', () => resolve({ server: srv, port: srv.address().port }));
  });
}

function waitFor(fn, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      let out;
      try { out = fn(); } catch (_) { out = false; }
      if (out) { clearInterval(timer); resolve(out); }
      else if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error('timeout waiting for condition'));
      }
    }, 25);
  });
}
test('full pipeline: mock fingerprint -> webhook GRANTED, no duplicates', async () => {
  const posts = [];
  const { server, port } = await startMock((req, res) => {
    let b = '';
    req.on('data', (c) => { b += c; });
    req.on('end', () => {
      const body = JSON.parse(b);
      assert.equal(req.headers.authorization, 'Bearer topsecret');
      posts.push(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ decision: 'GRANTED', message: 'Accès autorisé', eventId: body.eventId }));
    });
  });

  const home = makeHome();
  writeHome(home, {
    webhook: { url: `http://127.0.0.1:${port}/functions/v1/zkteco-webhook`, secret: 'topsecret', timeoutMs: 2000, maxBodyBytes: 16384 },
    sources: {
      cvaccessOpenApi: { enabled: false },
      cvaccessPush: { enabled: false },
      cvaccessDb: { enabled: false },
      mockFingerprint: { enabled: true, intervalMs: 20, users: ['ADH001'], deviceId: 'TERMINAL_001' },
    },
  });
  process.env.GDC_HOME = home;
  const load = loadConfig({ home });
  const runner = new Runner(load);
  await runner.start();

  try {
    await waitFor(() => runner.store.state.eventsDelivered >= 1);
    assert.equal(runner.store.state.lastDecision, 'GRANTED');
    assert.ok(posts.length >= 1);
    const first = posts[0];
    assert.equal(first.connectorId, 'TEST_CONN');
    assert.equal(first.userId, 'ADH001');
    assert.equal(first.method, 'fingerprint');
    assert.equal(first.eventType, 'CHECK_IN');
    assert.ok(!JSON.stringify(first).includes('verifyMode'));

    // identical re-delivery must NOT trigger a second webhook call
    const before = posts.length;
    const dup = { ...first, eventId: 'dup-key' };
    await runner.handleSourceEvent({ source: 'replay', record: {}, normalized: dup });
    assert.equal(posts.length, before, 'duplicate must be dropped by dedupe');
    assert.equal(runner.store.state.eventsDuplicated, 1);
  } finally {
    await runner.stop();
    server.close();
    delete process.env.GDC_HOME;
  }
});
test('retry path: transient webhook failure is queued then delivered via backoff', async () => {
  let calls = 0;
  const { server, port } = await startMock((_req, res) => {
    calls += 1;
    if (calls < 2) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'busy' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ decision: 'GRANTED', message: 'Accès autorisé' }));
  });

  const home = makeHome();
  writeHome(home, {
    webhook: { url: `http://127.0.0.1:${port}/fn`, secret: 'topsecret', timeoutMs: 2000, maxBodyBytes: 16384 },
  });
  process.env.GDC_HOME = home;
  const load = loadConfig({ home });
  const runner = new Runner(load);
  await runner.start();

  try {
    await runner.handleSourceEvent({
      source: 'live-terminal',
      record: {},
      normalized: {
        connectorId: 'TEST_CONN', deviceId: 'T1', userId: 'ADH002',
        method: 'fingerprint', timestamp: '2026-08-22T18:00:31Z',
        eventType: 'ACCESS', payloadVersion: 1,
      },
    });
    await waitFor(() => runner.store.state.eventsDelivered >= 1);
    assert.equal(runner.store.state.lastDecision, 'GRANTED');
    assert.ok(calls >= 2, 'second attempt should have happened');
    assert.equal(runner.store.state.pendingQueueDepth, 0);
  } finally {
    await runner.stop();
    server.close();
    delete process.env.GDC_HOME;
  }
});

test('dead-letter path: webhook 400 is not retried', async () => {
  const { server, port } = await startMock((_req, res) => {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ decision: 'DENIED', message: 'bad payload' }));
  });
  const home = makeHome();
  writeHome(home, {
    webhook: { url: `http://127.0.0.1:${port}/fn`, secret: 'topsecret', timeoutMs: 2000, maxBodyBytes: 16384 },
  });
  process.env.GDC_HOME = home;
  const load = loadConfig({ home });
  const runner = new Runner(load);
  await runner.start();

  try {
    await runner.handleSourceEvent({
      source: 'live-terminal',
      record: {},
      normalized: {
        connectorId: 'TEST_CONN', deviceId: 'T1', userId: 'ADH001',
        method: 'fingerprint', timestamp: '2026-08-22T12:00:00Z',
        eventType: 'ACCESS', payloadVersion: 1,
      },
    });
    await waitFor(() => runner.store.state.eventsDeadLettered >= 1);
    assert.ok(fs.existsSync(load.paths.deadLetterFile), 'dead-letter file must exist');
    assert.equal(runner.store.state.pendingQueueDepth, 0);
  } finally {
    await runner.stop();
    server.close();
    delete process.env.GDC_HOME;
  }
});
