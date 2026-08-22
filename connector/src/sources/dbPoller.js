'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  sources/dbPoller.js - optional read-only watcher over the local SQL Server
//  database used by CVAccess (experimental / site-specific).
//
//  CVAccess stores its records on the local SQL Server instance it installs.
//  Polling that database is NOT an officially documented ZKTeco interface, so
//  this adapter is opt-in and purely config-driven: you tell it the query and
//  the column mapping once you have confirmed the schema on the gym PC (see
//  the probe report). Optional cursor placeholder `{{since}}` in the query.
// ─────────────────────────────────────────────────────────────────────────────

const { execFile } = require('child_process');
const { normalizeEvent } = require('../normalizer');
const { TransientError } = require('../errors');

// sqlcmd text output: one row per line, fields separated by our sentinel.
function parseRows(stdout, separator) {
  const lines = stdout.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows = [];
  let header = null;
  for (const line of lines) {
    const cells = line.split(separator);
    // first non-header row is the column header when using 'SET NOCOUNT ON'
    if (!header) {
      header = cells.map((c) => c.trim().toLowerCase());
      continue;
    }
    const row = {};
    header.forEach((name, i) => {
      row[name] = cells[i] === undefined ? '' : cells[i].trim();
    });
    rows.push(row);
  }
  return rows;
}

class DbPoller {
  constructor({ cfg, sourceCfg, connectorId, log, cursors }) {
    this.cfg = cfg;
    this.sourceCfg = sourceCfg || {};
    this.connectorId = connectorId;
    this.log = log || console;
    this.cursors = cursors;
    this.pollIntervalMs = this.sourceCfg.pollIntervalMs || 5000;
    this.timer = null;
    this.stopped = false;
    this.onEvent = null;
    this.stat = { polls: 0, rows: 0, lastPollAt: null, lastError: null };
  }

  async start(onEvent) {
    this.onEvent = onEvent;
    const run = async () => {
      if (this.stopped) return;
      try {
        await this.poll();
      } catch (e) {
        this.stat.lastError = e.message;
        this.log.warn('cvaccess.db.poll_error', { error: e.message });
      }
    };
    await run();
    this.timer = setInterval(run, this.pollIntervalMs);
    if (typeof this.timer.unref === 'function') this.timer.unref();
    return this;
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
  }

  async poll() {
    const c = this.sourceCfg;
    if (!c.query) return;
    const lastCursor = this.cursors ? this.cursors.get('cvapi.db.since') : undefined;

    const sep = '|~|';
    const q = c.query.includes('{{since}}')
      ? c.query.replace(/\{\{since\}\}/g, lastCursor || '')
      : c.query;

    const args = [];
    if (c.server) args.push('-S', String(c.server));
    if (c.database) args.push('-d', String(c.database));
    if (c.user) {
      args.push('-U', String(c.user), '-P', String(c.password || ''));
    } else {
      args.push('-E');
    }
    args.push('-h', '-1', '-W', '-w', '32767', '-s', sep);
    args.push('-Q', `SET NOCOUNT ON; ${q}`);

    const stdout = await runSql(c.sqlcmdPath || 'sqlcmd', args);
    const rows = parseRows(stdout, sep);
    this.stat.polls += 1;
    this.stat.rows += rows.length;

    let maxCursor = lastCursor;
    const sinceField = c.sinceField || 'auto_id';
    for (const row of rows) {
      const out = normalizeEvent(
        row,
        this.cfg,
        { mapping: c.mapping },
        { connectorId: this.connectorId }
      );
      if (out.filtered) continue;
      const cur = row[sinceField];
      if (cur !== undefined && String(cur) > String(maxCursor ?? '')) maxCursor = cur;
      if (this.onEvent) await this.onEvent({ source: 'cvaccess-db', record: row, normalized: out.normalized });
    }
    if (this.cursors && maxCursor !== undefined) {
      this.cursors.set('cvapi.db.since', String(maxCursor));
      this.cursors.persist();
    }
    this.stat.lastPollAt = new Date().toISOString();
  }
}

function runSql(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 20000, maxBuffer: 4 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        // sqlcmd exists but is not on PATH
        reject(new TransientError(`sqlcmd failed: ${(stderr || error.message).split('\n')[0]}`));
        return;
      }
      resolve(stdout);
    });
  });
}

module.exports = { DbPoller };