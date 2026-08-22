'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  clock.js - time helpers shared across the connector
// ─────────────────────────────────────────────────────────────────────────────

const nowMs = () => Date.now();

function nowIso() {
  return new Date().toISOString();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Full-jitter exponential backoff delay (AwsJitter-ish, capped).
 * @param {number} attempt  zero-based attempt number
 * @param {number} baseMs
 * @param {number} maxMs
 * @param {number} factor
 * @returns {number}
 */
function backoffDelayMs(attempt, baseMs, maxMs, factor) {
  const exp = Math.min(maxMs, baseMs * Math.pow(factor, Math.max(0, attempt)));
  return Math.floor(exp * 0.5 + Math.random() * exp);
}

module.exports = { nowMs, nowIso, sleep, backoffDelayMs };