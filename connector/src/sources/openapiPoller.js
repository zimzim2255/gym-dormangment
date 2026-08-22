'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  sources/openapiPoller.js - CVAccess OpenAPI (REST) event source
//
//  ZKBio CVAccess exposes a documented REST OpenAPI on the CVAccess server
//  (verified live on the gym PC at http://192.168.100.30:8098 — the
//  /api/token/temp endpoint answers HTTP 400 without valid app credentials).
//  This adapter:
//    * authenticates with the standard ZKBio OpenAPI flow:
//        POST /api/token/temp  { appCode, appSecret }  -> { tempCode }
//        POST /api/token       { tempCode }            -> { accessToken }
//    * polls the transaction endpoint (GET or POST json-body, config driven)
//    * page-walks results using a persisted "since" cursor
//    * emits every record through the normalizer (config-driven mapping)
//
//  Port 8088 is never touched: CVAccess owns it for ADMS device push.
// ─────────────────────────────────────────────────────────────────────────────

const { requestJson } = require('./http');
const { normalizeEvent } = require('../normalizer');
const { TransientError } = require('../errors');

function buildOpen(base, endpoint) {
  const b = String(base).replace(/\/+$/, '');
  const e = String(endpoint || '');
  return e.startsWith('http') ? e : `${b}${e.startsWith('/') ? '' : '/'}${e}`;
}

function appendQuery(url, params) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v));
  }
  return u.toString();
}

function dig(obj, pathStr) {
  if (obj == null) return undefined;
  if (!pathStr) return obj;
  return String(pathStr)
    .split('.')
    .reduce((cur, p) => (cur == null ? undefined : cur[p]), obj);
}

const THROTTLE_MS = 5 * 60 * 1000; // log the same auth/poll error at most every 5 min

class OpenApiPoller {
  constructor({ cfg, sourceCfg, connectorId, log, cursors }) {
    this.cfg = cfg;
    this.sourceCfg = sourceCfg || {};
    this.connectorId = connectorId;
    this.log = log || console;
    this.cursors = cursors; // { has(), get(), set(), persist() }
    this.baseUrl = this.sourceCfg.baseUrl || '';
    this.pollIntervalMs = this.sourceCfg.pollIntervalMs || 3000;
    this.timer = null;
    this.stopped = false;
    this.token = null;
    this.tokenExpiresAt = 0;
    this.warnedNoBase = false;
    this.stat = { polls: 0, fetched: 0, lastPollAt: null, lastError: null };
    this.onEvent = null;
    this._lastLogKey = '';
    this._lastLogAt = 0;
  }

  _throttledWarn(event, data, key) {
    const now = Date.now();
    if (key !== this._lastLogKey || now - this._lastLogAt > THROTTLE_MS) {
      this._lastLogKey = key;
      this._lastLogAt = now;
      this.log.warn(event, data);
    }
  }

  async start(onEvent) {
    this.onEvent = onEvent;
    const run = async () => {
      if (this.stopped) return;
      try {
        await this.poll();
      } catch (e) {
        this.stat.lastError = e.message;
        this._throttledWarn('cvaccess.openapi.poll_error', {
          error: e.message, polls: this.stat.polls,
        }, e.message);
      }
    };
    await run();
    this.timer = setInterval(run, this.pollIntervalMs);
    // never keep the process alive just for the poller
    if (typeof this.timer.unref === 'function') this.timer.unref();
    return this;
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
  }

  // ZKBio OpenAPI auth: temp code -> access token (config driven).
  async ensureToken() {
    const auth = this.sourceCfg.auth || {};
    if (auth.mode !== 'tempCode') return null;
    if (!this.baseUrl) return null;
    if (this.token && Date.now() < this.tokenExpiresAt) return this.token;

    let tempCode = auth.tempCode || '';
    if (!tempCode && auth.tempTokenEndpoint) {
      const res = await requestJson({
        url: buildOpen(this.baseUrl, auth.tempTokenEndpoint),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { appCode: auth.appCode, appSecret: auth.appSecret },
        timeoutMs: 5000,
      });
      if (res.status !== 200) {
        const hint = auth.appCode
          ? 'OpenAPI appCode/appSecret rejected (create one in CVAccess web: System -> OpenAPI)'
          : 'OpenAPI appCode/appSecret missing (fill CVAACCESS_APP_CODE / CVAACCESS_APP_SECRET)';
        throw new TransientError(`CVAccess temp-token failed (${res.status}) - ${hint}`);
      }
      tempCode = dig(res.body, auth.tempCodeField || 'tempCode') || '';
    }
    if (!tempCode) throw new TransientError('no temp code for CVAccess auth');

    const res2 = await requestJson({
      url: buildOpen(this.baseUrl, auth.tokenEndpoint || '/api/token'),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { tempCode },
      timeoutMs: 5000,
    });
    if (res2.status !== 200) throw new TransientError(`CVAccess token exchange failed (${res2.status})`);
    this.token = dig(res2.body, auth.tokenField || 'accessToken') || '';
    const expiresIn = Number(dig(res2.body, auth.expiresInField || 'expiresIn') || 3600);
    this.tokenExpiresAt = Date.now() + Math.max(60, expiresIn * 1000);
    if (!this.token) throw new TransientError('CVAccess token body missing accessToken');
    return this.token;
  }

async poll() {
    if (!this.baseUrl) {
      if (!this.warnedNoBase) {
        this.warnedNoBase = true;
        this.log.warn('cvaccess.openapi.base_url_missing', {
          hint: 'Set CVAACCESS_BASE_URL or config [sources.cvaccessOpenApi.baseUrl]',
        });
      }
      return;
    }
    const fetchCfg = this.sourceCfg.eventFetch || {};
    let lastCursor = this.cursors ? this.cursors.get('cvapi.since') : undefined;
    if (lastCursor === undefined || lastCursor === null) {
      const lookback = this.sourceCfg.initialLookbackMs || 30000;
      lastCursor = new Date(Date.now() - lookback).toISOString();
      if (this.cursors) this.cursors.set('cvapi.since', lastCursor);
    }

    const token = await this.ensureToken();
    if (this.stopped) return;
    const headers = { ...(fetchCfg.headers || {}), 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const params = { ...(fetchCfg.params || {}) };
    const pageSizeName = fetchCfg.pageSize || 'pageSize';
    const pageNumName = fetchCfg.pageNum || 'pageNum';
    if (!(pageSizeName in params) && fetchCfg.pageSize) params[pageSizeName] = 100;
    const method = (fetchCfg.method || 'POST').toUpperCase();

    const maxPages = fetchCfg.maxPages || 10;
    let page = Number(params[pageNumName]) || 1;
    let nextCursorFromResponse = lastCursor;

    while (page <= maxPages) {
      let url;
      let body;
      const pageParams = { ...params, [pageNumName]: page };
      if (method === 'POST') {
        if (fetchCfg.sinceParam) pageParams[fetchCfg.sinceParam] = String(nextCursorFromResponse);
        if (fetchCfg.endTimeParam) pageParams[fetchCfg.endTimeParam] = new Date().toISOString();
        body = pageParams;
        url = buildOpen(this.baseUrl, fetchCfg.endpoint);
      } else {
        if (fetchCfg.sinceParam && nextCursorFromResponse !== undefined) {
          pageParams[fetchCfg.sinceParam] = String(nextCursorFromResponse);
        }
        url = appendQuery(buildOpen(this.baseUrl, fetchCfg.endpoint), pageParams);
      }

      const res = await requestJson({ url, method, headers, body, timeoutMs: 8000 });
      if (res.status !== 200) {
        throw new TransientError(
          `CVAccess transaction fetch failed (${res.status})` +
          (res.text ? ` ${res.text.slice(0, 140)}` : '')
        );
      }
      const records = Array.isArray(res.body) ? res.body : dig(res.body, fetchCfg.dataPath) || [];
      this.stat.polls += 1;
      this.stat.fetched += records.length;

      const sinceField = fetchCfg.sinceField || 'timestamp';
      for (const record of records) {
        const out = normalizeEvent(
          record,
          this.cfg,
          { mapping: this.sourceCfg.mapping },
          { connectorId: this.connectorId }
        );
        if (out.filtered) continue;
        const cur = dig(record, sinceField);
        if (cur !== undefined && cur !== null && String(cur) > String(nextCursorFromResponse)) {
          nextCursorFromResponse = cur;
        }
        if (this.onEvent) await this.onEvent({ source: 'cvaccess-openapi', record, normalized: out.normalized });
      }
      if (this.cursors && String(nextCursorFromResponse) !== String(lastCursor)) {
        this.cursors.set('cvapi.since', String(nextCursorFromResponse));
        this.cursors.persist();
      }

      const len = (records || []).length;
      if (!fetchCfg.pageNum || len < Number(params[pageSizeName] || 100)) break;
      page += 1;
    }
    this.stat.lastPollAt = new Date().toISOString();
  }
}

module.exports = { OpenApiPoller };