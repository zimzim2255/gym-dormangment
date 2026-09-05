'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  config.js - configuration loader
//
//  1. Parses <GDC_HOME>/.env (KEY=VALUE lines, comments allowed) - values in
//     process.env take precedence.
//  2. Loads config/config.json (template: config/config.example.json).
//  3. Expands ${VAR} and ${VAR:-default} references inside string values.
//  4. Applies process-level defaults and validates critical values.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

// Connector root = <this file>/.. (src -> connector)
const HOME = process.env.GDC_HOME || path.resolve(__dirname, '..');

//
// ─── minimal .env loader ─────────────────────────────────────────────────────
//
function loadEnvFile(file) {
  if (!file || !fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

//
// ─── ${VAR} and ${VAR:-default} expansion ────────────────────────────────────
//
function expand(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/\$\{([A-Za-z0-9_]+)(?::?(?:-([^}]*))?)\}/g, (_, name, def) => {
    const v = process.env[name];
    if (v !== undefined && v !== '') return v;
    return def !== undefined ? def : '';
  });
}

function expandDeep(node) {
  if (Array.isArray(node)) return node.map(expandDeep);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = expandDeep(v);
    return out;
  }
  return expand(node);
}

//
// ─── master loader ───────────────────────────────────────────────────────────
//
function loadConfig({ home = HOME } = {}) {
  const envFile = process.env.GDC_ENV_FILE || path.join(home, '.env');
  loadEnvFile(envFile);

  const configFile =
    process.env.GDC_CONFIG_FILE || path.join(home, 'config', 'config.json');
  const exampleFile = path.join(home, 'config', 'config.example.json');

  if (!fs.existsSync(configFile)) {
    if (fs.existsSync(exampleFile)) {
      fs.copyFileSync(exampleFile, configFile);
    } else {
      throw new Error(`Config file not found: ${configFile}`);
    }
  }

  const raw = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  const cfg = expandDeep(raw);

  // ── boolean coercion for flags that come from env as strings ("false" is
  //    truthy in JS, so these MUST be real booleans before the sources check them)
  const toBool = (v, fallback) => {
    if (v === undefined || v === null || v === '') return fallback;
    if (typeof v === 'boolean') return v;
    const s = String(v).toLowerCase().trim();
    if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
    return false;
  };
  cfg.sources.cvaccessOpenApi.enabled = toBool(
    cfg.sources?.cvaccessOpenApi?.enabled, false);
  cfg.sources.cvaccessPush.enabled = toBool(
    cfg.sources?.cvaccessPush?.enabled, false);
  cfg.sources.cvaccessPush.captureFirst = toBool(
    cfg.sources?.cvaccessPush?.captureFirst, true);
  cfg.sources.cvaccessDb.enabled = toBool(
    cfg.sources?.cvaccessDb?.enabled, false);
  cfg.sources.mockFingerprint.enabled = toBool(
    cfg.sources?.mockFingerprint?.enabled, false);

  // ── numeric coercion for the values we know must be numeric ────────────────
  cfg.connector.logLevel = cfg.connector?.logLevel || 'info';
  cfg.connector.logMaxDays = toInt(cfg.connector?.logMaxDays, 14);
  cfg.dedupe.windowSeconds = toInt(cfg.dedupe?.windowSeconds, 300);
  cfg.retry.initialDelayMs = toInt(cfg.retry?.initialDelayMs, 1500);
  cfg.retry.maxDelayMs = toInt(cfg.retry?.maxDelayMs, 600000);
  cfg.retry.factor = toFloat(cfg.retry?.factor, 3);
  cfg.retry.maxAttempts = toInt(cfg.retry?.maxAttempts, 15);
  cfg.retry.sweepIntervalMs = toInt(cfg.retry?.sweepIntervalMs, 2000);
  cfg.webhook.timeoutMs = toInt(cfg.webhook?.timeoutMs, 15000);
  cfg.webhook.maxBodyBytes = toInt(cfg.webhook?.maxBodyBytes, 16384);
  cfg.sources.cvaccessOpenApi.pollIntervalMs = toInt(
    cfg.sources?.cvaccessOpenApi?.pollIntervalMs, 3000);
  cfg.sources.cvaccessDb.pollIntervalMs = toInt(
    cfg.sources?.cvaccessDb?.pollIntervalMs, 5000);
  cfg.sources.cvaccessPush.listenPort = toInt(
    cfg.sources?.cvaccessPush?.listenPort, 8091);
  cfg.accessControl.allowedMethods = Array.isArray(cfg.accessControl?.allowedMethods)
    ? cfg.accessControl.allowedMethods
    : ['fingerprint'];
  cfg.accessControl.allowedEventTypes = Array.isArray(cfg.accessControl?.allowedEventTypes)
    ? cfg.accessControl.allowedEventTypes
    : ['ACCESS'];

  // webhook secret: accept multiple names (Supabase rejects names starting
  // with "SUPABASE_" - so the shared secret can live under ZKTECO_WEBHOOK_SECRET,
  // WEBHOOK_SECRET, or GYM_DOOR_SECRET instead; SUPABASE_WEBHOOK_SECRET kept for
  // local .env compatibility).
  cfg.webhook.secret =
    process.env.ZKTECO_WEBHOOK_SECRET ||
    process.env.WEBHOOK_SECRET ||
    process.env.GYM_DOOR_SECRET ||
    process.env.SUPABASE_WEBHOOK_SECRET ||
    cfg.webhook.secret ||
    '';

  // hard safety rails
  if (cfg.sources?.cvaccessPush?.listenPort === 8088) {
    throw new Error(
      'Refusing to start: cvaccessPush.listenPort must NOT be 8088 (' +
        'CVAccess owns that port). Configure another port, e.g. 8089.'
    );
  }

  const paths = {
    home,
    configFile,
    dataDir: path.join(home, 'data'),
    logDir: path.join(home, 'logs'),
    queueFile: path.join(home, 'data', 'queue.ndjson'),
    deadLetterFile: path.join(home, 'data', 'dead-letter.ndjson'),
    stateFile: path.join(home, 'data', 'state.json'),
    dedupeFile: path.join(home, 'data', 'dedupe.json'),
    cursorFile: path.join(home, 'data', 'cursor.json'),
  };
  return { cfg, paths };
}

function toInt(v, fallback) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function toFloat(v, fallback) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = { loadConfig, HOME };