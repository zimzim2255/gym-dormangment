'use strict';
// sources/dbPoller.js - read-only CVAccess DB watcher (psql + sqlcmd drivers).
// Supports two drivers ("psql" for the bundled ZKBio Postgres, "sqlcmd" for
// legacy SQL Server). Config-driven: query (may contain {{since}}), sinceField,
// table/initQuery (start from latest row), and mapping -> normalized event.
// The {{since}} cursor is persisted in data/cursor.json so restarts resume.

const { execFile } = require('child_process');
const { normalizeEvent } = require('../normalizer');
const { TransientError } = require('../errors');

const SQL_SEP = '|~|';
const NL = String.fromCharCode(10);

function runExec(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 20000, maxBuffer: 4 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new TransientError(cmd + ' failed: ' + String(stderr || error.message).split(NL)[0]));
        return;
      }
      resolve(stdout);
    });
  });
}

// psql -A keeps the header row; -F sets our delimiter; -q quiets. WARNING/NOTICE
// lines psql injects are stripped so they never corrupt the header row.
function runPsql(c, sql) {
  const args = ['-h', String(c.host || '127.0.0.1'), '-p', String(c.port || 5442)];
  if (c.user) args.push('-U', String(c.user));
  if (c.database) args.push('-d', String(c.database));
  args.push('-A', '-F', SQL_SEP, '-q', '-c', sql);
  return runExec(c.bin || 'psql', args).then((stdout) =>
    String(stdout || '')
      .split(/\r?\n/)
      .filter((l) => !/^(psql:|WARNING:|NOTICE:|ERROR:)/i.test(l.trim()))
      .join(NL)
  );
}

// First line = header (column names), following lines = data rows. Works with
// psql -A and sqlcmd -s alike.
function parseRows(stdout, separator) {
  const lines = String(stdout || '').split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows = [];
  let header = null;
  for (const line of lines) {
    const cells = line.split(separator);
    if (!header) {
      header = cells.map((c) => c.trim().toLowerCase());
      continue;
    }
    const row = {};
    header.forEach((name, i) => { row[name] = (cells[i] === undefined ? '' : cells[i].trim()); });
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
    this.pollIntervalMs = Number(this.sourceCfg.pollIntervalMs) || 5000;
    this.timer = null;
    this.stopped = false;
    this.onEvent = null;
    this.stat = { polls: 0, rows: 0, lastPollAt: null, lastError: null };
  }

  get driver() {
    return String(this.sourceCfg.driver || (this.sourceCfg.server ? 'sqlcmd' : 'psql')).toLowerCase();
  }
  get isPsql() {
    const d = this.driver;
    return d === 'psql' || d === 'postgres' || d === 'postgresql';
  }

  runQuery(sql) {
    if (!this.isPsql) {
      const c = this.sourceCfg;
      const args = [];
      const server = c.host ? String(c.host) + (c.port ? ',' + c.port : '') : '';
      if (server) args.push('-S', server);
      if (c.database) args.push('-d', String(c.database));
      if (c.user) args.push('-U', String(c.user), '-P', String(c.password || ''));
      else args.push('-E');
      args.push('-h', '-1', '-W', '-w', '32767', '-s', SQL_SEP);
      args.push('-Q', 'SET NOCOUNT ON; ' + sql);
      return runExec(c.sqlcmdPath || 'sqlcmd', args);
    }
    return runPsql(this.sourceCfg, sql);
  }

  // First run: start AFTER the current max so we don't re-feed all history.
  async initialCursor() {
    const c = this.sourceCfg;
    if (c.initQuery) return String(await this.runQuery(c.initQuery)).trim();
    if (this.isPsql && c.table) {
      const sinceField = c.sinceField || 'log_id';
      const sql = 'SELECT COALESCE(MAX("' + sinceField + '"),0) AS m FROM ' + c.table;
      const rows = parseRows(await this.runQuery(sql), SQL_SEP);
      if (rows.length && rows[0].m !== undefined && rows[0].m !== '') return String(rows[0].m).trim();
    }
    return '0';
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

    let lastCursor = this.cursors ? this.cursors.get('cvapi.db.since') : undefined;
    if (lastCursor === undefined || lastCursor === null || lastCursor === '') {
      const fromLatest = String(c.initialFromLatest ?? 'true').toLowerCase() !== 'false';
      lastCursor = fromLatest ? await this.initialCursor() : '0';
      if (this.cursors) {
        this.cursors.set('cvapi.db.since', String(lastCursor));
        this.cursors.persist();
      }
      this.log.info('cvaccess.db.cursor_init', { since: String(lastCursor), fromLatest });
    }

    const q = c.query.includes('{{since}}')
      ? c.query.replace(/\{\{since\}\}/g, String(lastCursor))
      : c.query;

    const rows = parseRows(await this.runQuery(q), SQL_SEP);
    this.stat.polls += 1;
    this.stat.rows += rows.length;

    const sinceField = c.sinceField || 'log_id';
    let maxCursor = String(lastCursor);
    for (const row of rows) {
      const out = normalizeEvent(
        row,
        this.cfg,
        { mapping: c.mapping },
        { connectorId: this.connectorId }
      );
      if (out.filtered) continue;
      const cur = row[sinceField];
      if (cur !== undefined && cur !== null && String(cur) > String(maxCursor)) maxCursor = String(cur);
      if (this.onEvent) await this.onEvent({ source: 'cvaccess-db', record: row, normalized: out.normalized });
    }
    if (this.cursors && maxCursor !== undefined) {
      this.cursors.set('cvapi.db.since', String(maxCursor));
      this.cursors.persist();
    }
    this.stat.lastPollAt = new Date().toISOString();
    this.stat.lastError = null;
  }
}

module.exports = { DbPoller };