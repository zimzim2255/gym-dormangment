'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  queue.js - durable retry queue (JSONL on disk, atomic rewrites)
//
//  Every normalized event that could not be delivered to Supabase (offline,
//  timeout, 5xx) is parked on disk in `data/queue.ndjson` with its retry state.
//  On restart the queue is reloaded automatically, so no event is lost when the
//  gym PC reboots or the network blips.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const crypto = require('crypto');
const { backoffDelayMs } = require('./clock');

class DurableQueue {
  /**
   * @param {object} opts
   *   { file, deadLetterFile, initialDelayMs, maxDelayMs, factor, maxAttempts,
   *     now }
   */
  constructor(opts) {
    this.file = opts.file;
    this.deadLetterFile = opts.deadLetterFile;
    this.initialDelayMs = opts.initialDelayMs ?? 1500;
    this.maxDelayMs = opts.maxDelayMs ?? 600000;
    this.factor = opts.factor ?? 3;
    this.maxAttempts = opts.maxAttempts ?? 15;
    this.now = opts.now || Date.now;
    /** @type {Map<string, object>} id -> entry */
    this.entries = new Map();
    this.dirt = false;
    if (this.file) {
      fs.mkdirSync(require('path').dirname(this.file), { recursive: true });
      this._load();
    }
  }

  _load() {
    if (!fs.existsSync(this.file)) return;
    for (const line of fs.readFileSync(this.file, 'utf8').split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line);
        this.entries.set(e.id, e);
      } catch (_) {
        /* skip corrupted line */
      }
    }
  }

  /**
   * Enqueue an event payload for delivery (due immediately unless given delay).
   * @param {object} payload        normalized wire payload
   * @param {object} [meta]
   * @returns {object} entry
   */
  add(payload, meta = {}) {
    const id = meta.id || crypto.randomUUID();
    const entry = {
      id,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: meta.retryCount ?? 0,
      nextAttemptAt: (meta.delayMs ?? 0) > 0 ? this.now() + meta.delayMs : this.now(),
    };
    this.entries.set(id, entry);
    this._markDirty();
    return entry;
  }

  /** Entries whose nextAttemptAt has passed (remove them from active view). */
  takeDue(now = this.now()) {
    const due = [];
    for (const [id, e] of this.entries) {
      if (e.nextAttemptAt <= now) {
        due.push(e);
        this.entries.delete(id);
      }
    }
    if (due.length) this._markDirty();
    return due;
  }

  /** Schedule a failed attempt for later (exponential backoff). */
  scheduleRetry(entry, now = this.now()) {
    entry.retryCount += 1;
    entry.lastErrorAt = new Date().toISOString();
    if (entry.retryCount >= this.maxAttempts) {
      entry.delivered = false;
      entry.dropped = true;
      this._appendDeadLetter(entry);
      this._markDirty();
      return { dropped: true };
    }
    entry.nextAttemptAt =
      now +
      backoffDelayMs(entry.retryCount - 1, this.initialDelayMs, this.maxDelayMs, this.factor);
    entry.nextAttemptAt = now + Math.max(this.initialDelayMs, entry.nextAttemptAt - now);
    this.entries.set(entry.id, entry);
    this._markDirty();
    return { dropped: false };
  }

  _appendDeadLetter(entry) {
    if (!this.deadLetterFile) return;
    try {
      fs.mkdirSync(require('path').dirname(this.deadLetterFile), { recursive: true });
      fs.appendFileSync(this.deadLetterFile, JSON.stringify(entry) + '\n');
    } catch (_) {
      /* best effort */
    }
  }

  /** Move a payload straight to the dead-letter store (no retry). */
  deadLetter(payload, meta = {}) {
    const id = meta.id || crypto.randomUUID();
    const entry = {
      id,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: meta.retryCount ?? 0,
      dropped: true,
      reason: meta.reason || 'permanent-failure',
    };
    this._appendDeadLetter(entry);
    this._markDirty();
    return entry;
  }

  remove(id) {
    if (this.entries.delete(id)) this._markDirty();
  }

  depth() {
    return this.entries.size;
  }

  counts() {
    let total = 0;
    let failed = 0;
    for (const e of this.entries.values()) {
      total += 1;
      if (e.dropped) failed += 1;
    }
    return { pending: total, failed };
  }

  _markDirty() {
    this._dirty = true;
  }

  /** Flush state to disk (atomic rename). */
  persist() {
    if (!this._dirty) return;
    if (!this.file) return;
    const lines = [];
    for (const e of this.entries.values()) lines.push(JSON.stringify(e));
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, lines.join('\n') + (lines.length ? '\n' : ''));
    try {
      fs.renameSync(tmp, this.file);
    } catch (e) {
      if (e.code === 'EPERM' || e.code === 'EACCES') {
        // Windows rename race - keep tmp content, best effort
        fs.copyFileSync(tmp, this.file);
      } else {
        throw e;
      }
    }
    this._dirty = false;
  }
}

module.exports = { DurableQueue };