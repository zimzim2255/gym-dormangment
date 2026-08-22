'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  errors.js - typed errors used by the retry layer
// ─────────────────────────────────────────────────────────────────────────────

/** Transient: safe and worth retrying (timeout, network, 5xx, 408/429). */
class TransientError extends Error {
  constructor(message, opts = {}) {
    super(message);
    this.name = 'TransientError';
    this.httpStatus = opts.httpStatus || null;
    this.attempt = opts.attempt || 0;
  }
}

/** Permanent: routing it to the dead-letter store, no further retry. */
class PermanentError extends Error {
  constructor(message, opts = {}) {
    super(message);
    this.name = 'PermanentError';
    this.httpStatus = opts.httpStatus || null;
  }
}

module.exports = { TransientError, PermanentError };