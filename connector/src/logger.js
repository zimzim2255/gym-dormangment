'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  logger.js - structured NDJSON logger with daily files + rotation
//
//  Every line written to disk is a single JSON object:
//    {"ts":"2026-08-22T18:00:31.000Z","level":"info","event":"access_result",
//     "connectorId":"GYM_PC_001","decision":"GRANTED", ...}
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const { nowIso } = require('./clock');

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, fatal: 50 };

class Logger {
  /**
   * @param {object} opts
   * @param {string} opts.logDir          absolute dir for daily files
   * @param {string} [opts.level='info']  log level
   * @param {number} [opts.maxDays=14]    files older than N days get removed
   * @param {string}  [opts.connectorId]
   */
  constructor(opts) {
    this.dir = opts.logDir;
    this.level = LEVELS[opts.level?.toLowerCase()] ?? LEVELS.info;
    this.maxDays = opts.maxDays ?? 14;
    this.connectorId = opts.connectorId || 'GymDoorConnector';
    this.consoleOut = !!process.env.GDC_CONSOLE_LOGS || !process.env.GDC_NO_CONSOLE;
    if (this.dir) fs.mkdirSync(this.dir, { recursive: true });
    this._openDay();
  }

  _dayStamp() {
    return new Date().toISOString().slice(0, 10);
  }

  _openDay() {
    if (!this.dir) return;
    const day = this._dayStamp();
    if (this.file === day) return;
    this.file = day;
    this.fd = fs.openSync(path.join(this.dir, `connector-${day}.ndjson`), 'a');
    this._cleanupOld();
  }

  _cleanupOld() {
    if (!this.dir || !this.maxDays) return;
    const cutoff = Date.now() - this.maxDays * 86400000;
    for (const name of fs.readdirSync(this.dir)) {
      const full = path.join(this.dir, name);
      try {
        const st = fs.statSync(full);
        if (st.isFile() && st.mtimeMs < cutoff) fs.unlinkSync(full);
      } catch {
        /* keep going */
      }
    }
  }

  _rotateIfNeeded() {
    const day = this._dayStamp();
    if (this.file !== day) {
      try { if (this.fd) fs.closeSync(this.fd); } catch (_) {}
      this._openDay();
    }
  }

  _write(level, event, data = {}) {
    if (LEVELS[level] < this.level) return;
    this._rotateIfNeeded();
    const rec = { ts: nowIso(), level, event, connectorId: this.connectorId, ...data };
    const line = JSON.stringify(rec);
    if (this.dir) {
      try { fs.writeSync(this.fd, line + '\n'); } catch (_) { /* disk problems must not kill the loop */ }
    }
    if (this.consoleOut) {
      if (level === 'error' || level === 'fatal') console.error(line);
      else console.log(line);
    }
  }

  debug(event, data) { this._write('debug', event, data); }
  info(event, data) { this._write('info', event, data); }
  warn(event, data) { this._write('warn', event, data); }
  error(event, data) { this._write('error', event, data); }
  fatal(event, data) { this._write('fatal', event, data); }

  child(patch) {
    const child = new Logger({
      logDir: this.logDir,
      level: Object.keys(LEVELS).find((k) => LEVELS[k] === this.level) || 'info',
      maxDays: this.maxDays,
      connectorId: this.connectorId,
    });
    child.patch = patch;
    const origWrite = child._write.bind(child);
    child._write = (level, event, data = {}) =>
      origWrite(level, event, { ...this.patch, ...patch, ...data });
    return child;
  }
}

module.exports = { Logger, LEVELS };