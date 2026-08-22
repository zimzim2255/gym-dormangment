'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  sources/index.js - starts every source enabled in config and funnels all
//  normalized events to the runner's onEvent handler.
// ─────────────────────────────────────────────────────────────────────────────

const { OpenApiPoller } = require('./openapiPoller');
const { PushReceiver } = require('./pushReceiver');
const { DbPoller } = require('./dbPoller');
const { MockFingerprint } = require('./mockFingerprint');

/**
 * @param {object} loadout { cfg, connectorId, log, cursors }
 * @param {(evt:object)=>Promise<void>} onEvent
 * @returns {Promise<Array<{name:string, src:object}>>} list of running sources
 */
async function startSources(loadout, onEvent) {
  const { cfg, connectorId, log, cursors } = loadout;
  const running = [];
  const src = cfg.sources || {};

  if (src.cvaccessOpenApi?.enabled) {
    const poller = new OpenApiPoller({
      cfg, sourceCfg: src.cvaccessOpenApi, connectorId, log, cursors,
    });
    await poller.start(onEvent);
    running.push({ name: 'cvaccess-open-api', src: poller });
    log.info('source.started', { name: 'cvaccess-open-api' });
  }

  if (src.cvaccessPush?.enabled) {
    const receiver = new PushReceiver({
      cfg, sourceCfg: src.cvaccessPush, connectorId, log, home: loadout.home,
    });
    await receiver.start(onEvent);
    running.push({ name: 'cvaccess-push', src: receiver });
    log.info('source.started', { name: 'cvaccess-push' });
  }

  if (src.cvaccessDb?.enabled) {
    const poller = new DbPoller({
      cfg, sourceCfg: src.cvaccessDb, connectorId, log, cursors,
    });
    await poller.start(onEvent);
    running.push({ name: 'cvaccess-db', src: poller });
    log.info('source.started', { name: 'cvaccess-db' });
  }

  if (src.mockFingerprint?.enabled) {
    const mock = new MockFingerprint({
      cfg, sourceCfg: src.mockFingerprint, connectorId, log,
    });
    await mock.start(onEvent);
    running.push({ name: 'mock-fingerprint', src: mock });
    log.warn('source.started', {
      name: 'mock-fingerprint',
      warning: 'DEV-ONLY synthetic source - disable in production',
    });
  }

  if (running.length === 0) {
    log.error('source.none_enabled', {
      hint: 'Enable at least one source in config/config.json (run tools/probe-cvaccess.ps1 first).',
    });
  }
  return running;
}

module.exports = { startSources };