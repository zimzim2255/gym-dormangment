'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  health.js - "health / status" command implementation.
//
//  Read by win/status.ps1. Returns a human-readable summary (or --json) built
//  from data/state.json + the on-disk queue depth + recent log lines.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

function readJsonOrNull(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return null;
  }
}

function queueDepthFromFile(file) {
  if (!file || !fs.existsSync(file)) return 0;
  let n = 0;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (line.trim()) n += 1;
  }
  return n;
}

function recentLogs(logDir, count = 20) {
  const day = new Date().toISOString().slice(0, 10);
  const file = path.join(logDir, `connector-${day}.ndjson`);
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
  return lines.slice(-count).map((l) => {
    try {
      return JSON.parse(l);
    } catch (_) {
      return { raw: l };
    }
  });
}

/**
 * @param {object} load { cfg, paths }
 * @returns {object} machine-readable snapshot (use --json for raw)
 */
function collectHealth(load) {
  const { cfg, paths } = load;
  const state = readJsonOrNull(paths.stateFile) || {};
  const sourcesEnabled = [];
  if (cfg.sources?.cvaccessOpenApi?.enabled) sourcesEnabled.push('cvaccess-openapi');
  if (cfg.sources?.cvaccessPush?.enabled) sourcesEnabled.push('cvaccess-push');
  if (cfg.sources?.cvaccessDb?.enabled) sourcesEnabled.push('cvaccess-db');
  if (cfg.sources?.mockFingerprint?.enabled) sourcesEnabled.push('mock-fingerprint(DEV)');

  return {
    connectorId: cfg.connector.id,
    version: (() => {
      try { return require('../package.json').version; } catch (_) { return 'n/a'; }
    })(),
    running: state.running === true,
    bootedAt: state.bootedAt || null,
    lastHeartbeatAt: state.lastHeartbeatAt || null,
    lastEventAt: state.lastEventAt || null,
    lastEventId: state.lastEventId || null,
    lastDecision: state.lastDecision || null,
    lastDecisionMessage: state.lastDecisionMessage || null,
    lastWebhookOkAt: state.lastWebhookOkAt || null,
    lastWebhookError: state.lastWebhookError || null,
    pendingQueueDepth: state.pendingQueueDepth ?? queueDepthFromFile(paths.queueFile),
    failedCount: state.failedCount ?? 0,
    counts: {
      accepted: state.eventsAccepted ?? 0,
      delivered: state.eventsDelivered ?? 0,
      duplicated: state.eventsDuplicated ?? 0,
      filtered: state.eventsFiltered ?? 0,
      queued: state.eventsQueued ?? 0,
      deadLettered: state.eventsDeadLettered ?? 0,
    },
    sourcesEnabled,
    sourcesRunning: state.sourcesRunning || [],
    webhookConfigured: !!cfg.webhook.url,
    lastLogLines: recentLogs(paths.logDir),
  };
}

function formatText(h) {
  const L = [];
  const line = (label, value) => `  ${String(label).padEnd(24)}: ${value ?? 'n/a'}`;
  L.push(`GymDoorConnector ${h.connectorId} v${h.version}`);
  L.push('-'.repeat(52));
  L.push(line('running', h.running ? 'YES' : 'NO'));
  L.push(line('bootedAt', h.bootedAt));
  L.push(line('lastHeartbeat', h.lastHeartbeatAt || '(not started)'));
  L.push(line('lastEventAt', h.lastEventAt));
  L.push(line('lastEventId', h.lastEventId));
  L.push(line('lastDecision', h.lastDecision));
  L.push(line('lastMessage', h.lastDecisionMessage));
  L.push(line('lastWebhookOk', h.lastWebhookOkAt));
  L.push(line('lastWebhookErr', h.lastWebhookError || 'none'));
  L.push(line('queueDepth', h.pendingQueueDepth));
  L.push(line('deadLettered', h.counts.deadLettered));
  L.push(line('webhookConfigured', h.webhookConfigured ? 'yes' : 'NO - dry-run mode'));
  L.push(line('sourcesEnabled', h.sourcesEnabled.join(', ') || 'NONE'));
  L.push(line('sourcesRunning', h.sourcesRunning.join(', ') || 'none'));
  L.push('');
  L.push('--- counts ---');
  L.push(line('accepted', h.counts.accepted));
  L.push(line('delivered', h.counts.delivered));
  L.push(line('duplicated', h.counts.duplicated));
  L.push(line('filtered', h.counts.filtered));
  L.push(line('queued', h.counts.queued));
  L.push('');
  L.push('--- recent log lines ---');
  for (const rec of h.lastLogLines) {
    L.push(`${rec.ts || '?'} ${rec.level || '?'} ${rec.event || rec.raw || ''}`);
  }
  return L.join('\n');
}

module.exports = { collectHealth, formatText };