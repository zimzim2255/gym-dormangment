'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  dedupe.js - recent-event memory used to drop duplicate deliveries
//
//  CVAccess sources (poll intervals / push replays) deliver the same scan more
//  than once. We key on the deterministic eventKey (deviceId|userId|timestamp|
//  method|eventType) so an identical re-delivery within the window is ignored.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');

class Dedupe {
  /**
   * @param {object} opts
   * @param {number} [opts.windowSeconds=300]
   * @param {number} [opts.maxKeys=5000]
   * @param {string} [opts.file]           snapshot file (optional)
   * @param {number} [opts.now=Date.now]
   */
  constructor(opts = {}) {
    this.windowMs = (opts.windowSeconds ?? 300) * 1000;
    this.maxKeys = opts.maxKeys ?? 5000;
    this.file = opts.file || null;
    this.now = opts.now || Date.now;
    /** @type {Map<string, number>} key -> firstSeenMs */
    this.seen = new Map();
    if (this.file && fs.existsSync(this.file)) this._load();
  }

  _load() {
    try {
      const db = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      const cutoff = this.now() - this.windowMs * 2;
      const pairs = Array.isArray(db.seen)
        ? db.seen
        : Object.entries(db.seen || {});
      for (const [key, at] of pairs) {
        const atMs = typeof at === 'string' ? Number(at) : at;
        if (typeof atMs === 'number' && atMs > cutoff) this.seen.set(key, atMs);
      }
    } catch (_) {
      /* corrupted snapshot -> start clean */
    }
  }

  /** @returns {boolean} true if already seen (i.e. duplicate) */
  has(key) {
    this._prune(this.now());
    return this.seen.has(key);
  }

  /** Record a key. Returns true if it was new (not already in the window). */
  add(key) {
    const now = this.now();
    this._prune(now);
    if (this.seen.has(key)) return false;
    if (this.seen.size >= this.maxKeys) {
      // drop oldest
      let oldest = null;
      for (const [k, at] of this.seen) {
        if (!oldest || at < oldest[1]) oldest = [k, at];
      }
      if (oldest) this.seen.delete(oldest[0]);
    }
    this.seen.set(key, now);
    return true;
  }

  _prune(now) {
    const cutoff = now - this.windowMs;
    for (const [k, at] of this.seen) {
      if (at < cutoff) this.seen.delete(k);
    }
  }

  size() {
    return this.seen.size;
  }

  save() {
    if (!this.file) return;
    try {
      const tmp = this.file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify({ savedAt: new Date().toISOString(), seen: [...this.seen] }));
      fs.renameSync(tmp, this.file);
    } catch (_) {
      /* best effort */
    }
  }
}

module.exports = { Dedupe };