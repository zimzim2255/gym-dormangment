'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  control/index.js - optional enforcement layer (disabled by default).
//  Starts whatever is enabled in config `control`:
//    * access-sync  - push the Supabase allow-list into CVAccess (user
//                     enabled state) so the terminal refuses the rest locally.
//    * decision-api - local HTTP endpoint answering GRANTED/DENIED.
// ─────────────────────────────────────────────────────────────────────────────

const { AccessSync } = require('./accessSync');
const { DecisionApi } = require('./decisionApi');

/**
 * @param {object} loadout { cfg, paths, log, connectorId }
 * @returns {Promise<Array<{name:string, src:object}>>} running control items
 */
async function startControl({ cfg, paths, log, connectorId }) {
  const running = [];
  const control = cfg.control || {};

  if (control.enabled && control.cvaccessDb?.enabled && control.allowedList?.url) {
    const sync = new AccessSync({ cfg, log });
    await sync.start();
    running.push({ name: 'access-sync', src: sync });
    log.info('control.started', { name: 'access-sync', intervalMs: control.syncIntervalMs });
  }

  if (control.decisionApi?.enabled) {
    const api = new DecisionApi({ cfg, connectorId, log });
    await api.start();
    running.push({ name: 'decision-api', src: api });
    log.info('control.started', { name: 'decision-api', port: api.port });
  }

  return running;
}

module.exports = { startControl };