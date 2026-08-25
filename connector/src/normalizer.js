'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  normalizer.js - maps a raw CVAccess event into the SDK-normalized payload.
//
//  The mapping (source-specific) lives in config/config.json `sources.<x>.mapping`,
//  produced from the real event shape discovered by tools/probe-cvaccess.ps1.
//  We deliberately do NOT invent ZKTeco wire formats here: the only thing the
//  connector understands is a *config-driven mapping* plus the generic
//  ZKTeco verify-mode table (documented in the ZKTeco developer portal).
//
//  This module also enforces the safety rules of the project:
//    * only fingerprint events move on
//    * biometric data (templates/images/records) is never propagated
//    * an event is emitted with ONLY the normalized fields
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');

// Fields that are allowed on the normalized payload. Everything else is dropped,
// which is the guarantee that fingerprints/templates/images never reach Supabase.
const NORMALIZED_FIELDS = new Set([
  'connectorId', 'deviceId', 'userId', 'method', 'timestamp', 'eventType',
  'eventId', 'source', 'sourceEventId', 'payloadVersion',
]);

/** Get a (possibly dotted) property path from an object. */
function deepGet(obj, pathStr) {
  if (obj == null) return undefined;
  if (obj[pathStr] !== undefined) return obj[pathStr];
  const parts = String(pathStr).split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

// Generic ZKTeco verify-mode table. Numeric codes follow the ZKTeco SDK/PUSH
// convention (1=FP, 2=face, 3=RFID, 4=QR, 5=password). The connector also
// accepts "fingerprint"/"fp" strings directly.
const DEFAULT_VERIFY_MODE_MAP = {
  1: 'fingerprint', 2: 'face', 3: 'rfid', 4: 'qr', 5: 'password',
};

function normalizeMethod(rawMethod, verifyModeMap) {
  if (rawMethod === undefined || rawMethod === null || rawMethod === '') return undefined;
  const map = { ...DEFAULT_VERIFY_MODE_MAP, ...(verifyModeMap || {}) };
  const s = String(rawMethod).toLowerCase().trim();
  if (s === 'fingerprint' || s === 'fp' || s === 'finger') return 'fingerprint';
  if (s === 'face') return 'face';
  if (s === 'rfid' || s === 'card' || s === 'ic' || s === 'id-card') return 'rfid';
  if (s === 'qr' || s === 'qrcode') return 'qr';
  if (s === 'password' || s === 'pin') return 'password';
  if (map[s] !== undefined) return map[s];
  if (Number.isFinite(Number(rawMethod))) return map[Number(rawMethod)] || 'unknown';
  return s;
}
// Accepts ISO-8601, "YYYY-MM-DD HH:mm:ss", unix seconds / milliseconds.
function normalizeTimestamp(ts) {
  if (ts === undefined || ts === null || ts === '') return new Date().toISOString();
  if (typeof ts === 'number') {
    const d = new Date(ts < 1e12 ? ts * 1000 : ts);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  const s = String(ts).trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) {
    const d = new Date(s.replace(' ', 'T') + (s.includes('T') ? '' : 'Z'));
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/**
 * Normalize a raw source record.
 *
 * @param {object} raw            raw record from a CVAccess source
 * @param {object} cfg            full config
 * @param {object} sourceCfg      the source block (mapping/eventFields)
 * @param {object} opts           { connectorId }
 * @returns {{ normalized?: object, filtered: boolean, reason?: string }}
 */
function normalizeEvent(raw, cfg, sourceCfg, opts = {}) {
  const connectorId = opts.connectorId || 'GYM_PC_001';
  const allowedMethods = cfg.accessControl?.allowedMethods || ['fingerprint'];
  const allowedTypes = cfg.accessControl?.allowedEventTypes || ['ACCESS', 'CHECK_IN'];
  const map = { ...(sourceCfg?.mapping || {}), ...(raw.mappingOverrides || {}) };

  const deviceId = String(deepGet(raw, map.deviceId) ?? raw.deviceId ?? 'UNKNOWN').trim();
  const userId = String(deepGet(raw, map.userId) ?? raw.userId ?? '').trim();
  // CVAccess user ids are opaque strings like "ADH001" - we carry them as-is.
  // A scan without a user id cannot be validated -> filtered.
  if (!userId) return { filtered: true, reason: 'missing_user_id' };

  const methodSrc = deepGet(raw, map.method !== undefined ? map.method : 'method');
  let method = normalizeMethod(methodSrc, cfg.accessControl?.verifyModeMap);

  // CVAccess cloud push often omits verifyType for door-open transactions.
  // Fallbacks (aligned with this deployment which uses fingerprint only):
  //   1. faceRate > 0  -> a face match happened -> NOT allowed -> filter
  //   2. event looks like a normal verification opening -> fingerprint
  if (!method) {
    const faceRate = raw.faceRate ?? raw.faceScore;
    if (faceRate !== undefined && faceRate !== null && Number(faceRate) > 0) {
      method = 'face';
    } else {
      const evName = String(deepGet(raw, map.eventType) ?? raw.eventName ?? '').toLowerCase();
      const evKey = String(raw.eventNameKey ?? '');
      const accentFree = evName.replace(/é/g, 'e').replace(/è/g, 'e').replace(/à/g, 'a');
      const isVerification =
        evName.includes('vérif') ||
        evKey === 'acc_newEventNo_0' ||
        accentFree.includes('verif') ||
        accentFree.includes('normale');
      const isRemoteOpen = evName.includes('distance') || accentFree.includes('distance');
      if (isVerification && !isRemoteOpen) method = 'fingerprint';
    }
  }

  if (!method || !allowedMethods.includes(method)) {
    // Remote-open / admin / face events are not treated as fingerprint scans.
    return { filtered: true, reason: `method_not_allowed:${method || 'unknown'}` };
  }

  // Any verified fingerprint scan is an access attempt, regardless of how
  // CVAccess labels the event ("Fingerprint verify", "acc_eventNo_*", ...).
  const eventTypeSrc = deepGet(raw, map.eventType) ?? raw.eventType ?? 'ACCESS';
  const eventTypeGuess = String(eventTypeSrc).toUpperCase().trim() || 'ACCESS';
  const eventType = allowedMethods.includes(method) && !allowedTypes.includes(eventTypeGuess)
    ? 'ACCESS'
    : eventTypeGuess;
  if (!allowedTypes.includes(eventType)) {
    return { filtered: true, reason: `event_type_not_allowed:${eventType}` };
  }

  const eventIdRaw = deepGet(raw, map.eventId);
  const sourceEventId = eventIdRaw !== undefined ? String(eventIdRaw) : undefined;

  const normalized = {
    connectorId,
    deviceId,
    userId,
    method,
    timestamp: normalizeTimestamp(deepGet(raw, map.timestamp) ?? raw.timestamp),
    eventType,
    payloadVersion: 1,
  };
  if (sourceEventId !== undefined) {
    normalized.sourceEventId = sourceEventId;
  }
  // eventId: prefer the raw id, else a deterministic key. It is the
  // idempotency key echoed back by the webhook.
  normalized.eventId = sourceEventId || eventKey(normalized);

  return { normalized, filtered: false };
}

/** Stable idempotency key for a normalized event (never hashes biometrics). */
function eventKey(n) {
  return crypto
    .createHash('sha1')
    .update([n.deviceId, n.userId, n.timestamp, n.method, n.eventType].join('|'))
    .digest('hex');
}

/** Produce the minimal wire payload (also strips anything else that slipped in). */
function toWire(normalized) {
  const out = {};
  for (const k of NORMALIZED_FIELDS) {
    if (normalized[k] !== undefined) out[k] = normalized[k];
  }
  return out;
}

module.exports = { normalizeEvent, eventKey, toWire, deepGet, normalizeTimestamp };