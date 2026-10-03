'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  control/accessSync.js - keep the CVAccess LOCAL user state in sync with
//  Supabase so the terminal refuses non-members locally. The device fires the
//  relay on a LOCAL match, so the only enforcement with this hardware is making
//  the local match fail: we lock/set-expiry users in CVAccess's own DB and let
//  CVAccess push that user state down to the terminal.
//
//  Flow (user-requested, config-driven, OFF until the CVAccess schema is
//  confirmed on-site with tools/probe-cvaccess.ps1):
//     Supabase (source of truth) -> allowed-members edge function
//     AccessSync (this module)   -> diff vs local CVAccess user rows
//     CVAccess local DB          -> enable/lock/expiry writes (psql/sqlcmd)
//
//  SAFETY: nothing is guessed. Query templates are EMPTY until on-site schema
//  confirmation. User ids and expiry dates are validated before any SQL
//  interpolation (no injection through config data).
// ─────────────────────────────────────────────────────────────────────────────

const https = require('https');
const http = require('http');
const { URL } = require('url');
const { execFile } = require('child_process');

const USER_ID_RE = /^[A-Za-z0-9_\-]{1,64}$/;
const FR_DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;
const SQL_SEP = '|~|';

function toBoolValue(v) {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 't' || s === 'yes' || s === 'on';
}

/**
 * Diff Supabase allow-list vs what CVAccess stores locally.
 * @param {object} o
 * @param {Set<string>} o.allowedIds   user ids allowed RIGHT NOW (Supabase)
 * @param {Array<{id:string,enabled:*}>} o.localUsers   users stored by CVAccess
 * @returns {{changes:Array<{userId:string,enabled:boolean}>, toEnable:string[],
 *            toDisable:string[], skipped:string[]}}
 */
function normalizeAllowed(a) {
  if (a instanceof Set) return { ids: a, expiry: new Map() };
  return { ids: a?.ids ? a.ids : new Set(), expiry: a?.expiry ? a.expiry : new Map() };
}

function computeChanges({ allowedIds, localUsers }) {
  const { ids, expiry } = normalizeAllowed(allowedIds);
  const changes = [];
  const skipped = [];
  for (const u of localUsers || []) {
    if (!u || u.id === undefined || u.id === null || u.id === '') continue;
    const id = String(u.id);
    if (!USER_ID_RE.test(id)) { skipped.push(id); continue; }
    const shouldEnable = ids.has(id);
    const isEnabled = toBoolValue(u.enabled);
    if (shouldEnable !== isEnabled) {
      changes.push({
        userId: id,
        enabled: shouldEnable,
        expiryDate: shouldEnable ? (expiry.get(id) || undefined) : undefined,
      });
    }
  }
  return {
    changes,
    toEnable: changes.filter((c) => c.enabled).map((c) => c.userId),
    toDisable: changes.filter((c) => !c.enabled).map((c) => c.userId),
    skipped,
  };
}

/**
 * Safe SQL templating. Only validated ids and DD/MM/YYYY dates are injected.
 * Templates may contain {{userId}}, {{enabled}}, {{expiryDate}} placeholders.
 * @returns {string|null}
 */
function buildUpdateSql(template, userId, { enabled, expiryDate } = {}) {
  if (!template || !template.includes('{{userId}}')) return null;
  if (!USER_ID_RE.test(userId)) return null;
  if (String(template).includes('{{expiryDate}}')) {
    const [dd, mm, yyyy] = String(expiryDate || '').split('/').map(Number);
    const ok = FR_DATE_RE.test(expiryDate || '') &&
      mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31 && yyyy >= 1900 && yyyy <= 2999;
    if (!ok) return null;
  }
  let sql = template.replace('{{userId}}', `'${userId}'`);
  sql = sql.replace('{{expiryDate}}', expiryDate ? `'${expiryDate}'` : 'NULL');
  sql = sql.replace('{{enabled}}', enabled ? 'true' : 'false');
  return sql;
}

// ── Supabase allowed-list fetch (edge function `allowed-members`) ─────────────
// Returns { ids: Set<string>, expiry: Map<id, "DD/MM/YYYY"> } so the sync can
// BOTH enable the user AND set their local access-end date to the subscription
// end date - the exact "set the end date on the device DB" requirement.
function fetchAllowed({ url, secret, timeoutMs }) {
  return new Promise((resolve, reject) => {
    if (!url) { reject(new Error('control.allowedList.url is not set')); return; }
    const u = new URL(url);
    const secure = u.protocol === 'https:';
    if (!secure && process.env.GDC_ALLOW_INSECURE_HTTP !== '1') {
      reject(new Error('allowed-members must be https (or GDC_ALLOW_INSECURE_HTTP=1 for local tests only)'));
      return;
    }
    const mod = secure ? https : http;
    const body = Buffer.from(JSON.stringify({}), 'utf8');
    const headers = {
      'Content-Type': 'application/json', 'Content-Length': body.length,
      'Accept': 'application/json', 'User-Agent': 'GymDoorConnector/1.0',
    };
    if (secret) headers.Authorization = `Bearer ${secret}`;

    const req = mod.request(u, { method: 'POST', headers, timeout: timeoutMs || 15000 }, (res) => {
      const chunks = [];
      let received = 0;
      let overflow = false;
      res.on('data', (c) => {
        received += c.length;
        if (received > 131072) { overflow = true; res.destroy(); return; }
        chunks.push(c);
      });
      res.on('end', () => {
        const text = overflow ? '' : Buffer.concat(chunks).toString('utf8');
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`allowed-members http ${res.statusCode}: ${text.slice(0, 256)}`));
          return;
        }
        let parsed = {};
        try { parsed = JSON.parse(text); } catch (_) { /* fallthrough */ }
        const list = Array.isArray(parsed.allowed) ? parsed.allowed : [];
        const ids = new Set();
        const expiry = new Map();
        for (const item of list) {
          if (typeof item === 'string') { ids.add(item); continue; }
          if (item && item.userId) {
            ids.add(String(item.userId));
            if (item.subEnd) expiry.set(String(item.userId), String(item.subEnd));
          }
        }
        resolve({ ids, expiry });
      });
      res.on('error', (e) => reject(new Error(`response error: ${e.message}`)));
    });
    req.on('error', (e) => reject(new Error(`network error: ${e.message}`)));
    req.write(body);
    req.end();
  });
}

// ── config-driven CVAccess local DB write (psql primary, sqlcmd fallback) ────
function connString(c) {
  const auth = c.user
    ? `${encodeURIComponent(c.user)}:${encodeURIComponent(c.password || '')}@`
    : '';
  return `postgresql://${auth}${c.host || '127.0.0.1'}:${c.port || 5442}/${c.database || ''}`;
}

function runPsql(c, sql) {
  // Use psql's flag form with options BEFORE the command (-c). The bundled
  // ZKBio psql rejects options placed after a positional connection string
  // ("extra option ignored"), but -h/-p/-U/-d/-c are confirmed working:
  //   psql -h <host> -p <port> -U <user> -d <db> -tA -F '|~|' -c '<sql>'
  const args = ['-h', String(c.host || '127.0.0.1'), '-p', String(c.port || 5442)];
  if (c.user) args.push('-U', String(c.user));
  if (c.database) args.push('-d', String(c.database));
  // -tA = tuples-only + unaligned; -F sets our delimiter so each line reads
  // <id>|~|<enabled>. On a build that warns-but-continues, a warning still
  // yields output; a hard error is surfaced below.
  args.push('-tA', '-F', SQL_SEP, '-c', sql);
  return new Promise((resolve, reject) => {
    execFile(c.bin || 'psql', args, { timeout: 20000, maxBuffer: 4 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`psql failed: ${(stderr || error.message).split('\n')[0]}`));
        return;
      }
      resolve(stdout);
    });
  });
}

function runSqlcmd(c, sql) {
  const args = [];
  const server = c.host ? String(c.host) + (c.port ? `,${c.port}` : '') : '';
  if (server) args.push('-S', server);
  if (c.database) args.push('-d', String(c.database));
  if (c.user) {
    args.push('-U', String(c.user), '-P', String(c.password || ''));
  } else {
    args.push('-E');
  }
  args.push('-h', '-1', '-W', '-w', '32767', '-s', SQL_SEP);
  args.push('-Q', `SET NOCOUNT ON; ${sql}`);
  return new Promise((resolve, reject) => {
    execFile(c.bin || 'sqlcmd', args, { timeout: 20000, maxBuffer: 4 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`sqlcmd failed: ${(stderr || error.message).split('\n')[0]}`));
        return;
      }
      resolve(stdout);
    });
  });
}

/** Parse query output into [{id, enabled}]. psql: positional; sqlcmd: headers. */
function parseLocalUsers(stdout, driver) {
  const out = [];
  const lines = String(stdout || '').split(/\r?\n/).filter((l) => l.trim().length > 0);
  if ((driver || 'psql').toLowerCase() === 'sqlcmd') {
    let header = null;
    for (const line of lines) {
      const cells = line.split(SQL_SEP).map((c) => c.trim());
      if (!header) { header = cells.map((c) => c.toLowerCase()); continue; }
      const row = {};
      header.forEach((name, i) => { row[name] = cells[i] === undefined ? '' : cells[i]; });
      if (row.id !== undefined && row.id !== '') out.push({ id: row.id, enabled: row.enabled });
    }
  } else {
    for (const line of lines) {
      const [id, enabled] = line.split(SQL_SEP);
      if (id !== undefined && id.trim() !== '') out.push({ id: id.trim(), enabled });
    }
  }
  return out;
}

// ── orchestrator ─────────────────────────────────────────────────────────────
class AccessSync {
  constructor({ cfg, log }) {
    this.cfg = cfg;
    this.log = log || console;
    this.c = cfg.control?.cvaccessDb || {};
    this.intervalMs = Math.max(10000, Number(cfg.control?.syncIntervalMs || 300000));
    this.timer = null;
    this.stopped = false;
    this.stat = {
      runs: 0, lastRunAt: null, lastEnabled: 0, lastDisabled: 0,
      lastApplied: 0, lastError: null,
    };
  }

  async start() {
    await this.runOnce({});
    if (this.stopped) return this;
    this.timer = setInterval(() => this.runOnce({}), this.intervalMs);
    if (typeof this.timer.unref === 'function') this.timer.unref();
    return this;
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
  }

  /**
   * One full pass: fetch allowed -> read local users -> diff -> apply.
   * @param {object} o
   * @param {boolean} o.dryRun  show the diff WITHOUT writing a single byte
   * @returns {Promise<object>} summary (changes / applied / error)
   */
  async runOnce({ dryRun = false } = {}) {
    const started = Date.now();
    try {
      const control = this.cfg.control || {};
      const { ids, expiry } = await fetchAllowed({
        url: control.allowedList?.url,
        secret: control.allowedList?.secret || this.cfg.webhook?.secret,
        timeoutMs: this.cfg.webhook?.timeoutMs,
      });
      if (!this.c.listQuery) {
        throw new Error('control.cvaccessDb.listQuery is not set - run on-site discovery first');
      }
      const local = await this.queryUsers();
      const diff = computeChanges({ allowedIds: { ids, expiry }, localUsers: local });

      let applied = 0;
      if (!dryRun) {
        for (const ch of diff.changes) {
          const tpl = ch.enabled
            ? this.c.enableUpdateQuery
            : (this.c.disableUpdateQuery || this.c.enableUpdateQuery);
          const sql = buildUpdateSql(tpl, ch.userId, {
            enabled: ch.enabled, expiryDate: ch.expiryDate,
          });
          if (!sql) {
            this.log.warn('control.sync.skip_no_template', {
              userId: ch.userId, enabled: ch.enabled,
            });
            continue;
          }
          try {
            await this.runSql(sql);
            applied += 1;
            this.log.info('control.sync.apply', {
              userId: ch.userId, enabled: ch.enabled, expiryDate: ch.expiryDate,
            });
          } catch (e) {
            this.log.error('control.sync.apply_failed', {
              userId: ch.userId, enabled: ch.enabled, error: e.message,
            });
          }
        }
      }

      this.stat.runs += 1;
      this.stat.lastRunAt = new Date().toISOString();
      this.stat.lastEnabled = diff.toEnable.length;
      this.stat.lastDisabled = diff.toDisable.length;
      this.stat.lastApplied = applied;
      this.stat.lastError = null;
      this.log.info('control.sync.summary', {
        allowed: ids.size, local: local.length, dryRun,
        enabled: diff.toEnable.length, disabled: diff.toDisable.length,
        applied, skipped: diff.skipped.length, slowMs: Date.now() - started,
      });
      return {
        ...diff, allowed: ids.size, applied, dryRun, durationMs: Date.now() - started,
      };
    } catch (e) {
      this.stat.lastError = e.message;
      this.log.warn('control.sync.error', { error: e.message });
      return { error: e.message };
    }
  }

  async queryUsers() {
    const stdout = await this.runSql(this.c.listQuery);
    return parseLocalUsers(stdout, this.c.driver);
  }

  async runSql(sql) {
    const driver = (this.c.driver || 'psql').toLowerCase();
    return driver === 'sqlcmd' ? runSqlcmd(this.c, sql) : runPsql(this.c, sql);
  }
}

module.exports = { AccessSync, computeChanges, buildUpdateSql, parseLocalUsers, fetchAllowed };