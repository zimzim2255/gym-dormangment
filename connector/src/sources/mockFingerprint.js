'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  sources/mockFingerprint.js - DEVELOPMENT-ONLY synthetic fingerprint source.
//
//  Never enable in production (sources.mockFingerprint.enabled=false by
//  default). It lets you prove the whole pipeline (normalizer -> webhook ->
//  logs/queue) on a PC with no CVAccess at all.
// ─────────────────────────────────────────────────────────────────────────────

const { normalizeEvent } = require('../normalizer');

class MockFingerprint {
  constructor({ cfg, sourceCfg, connectorId, log }) {
    this.cfg = cfg;
    this.sourceCfg = sourceCfg || {};
    this.connectorId = connectorId;
    this.log = log || console;
    this.intervalMs = this.sourceCfg.intervalMs || 10000;
    this.users = this.sourceCfg.users && this.sourceCfg.users.length ? this.sourceCfg.users : ['ADH001'];
    this.deviceId = this.sourceCfg.deviceId || 'TERMINAL_001';
    this.timer = null;
    this.stopped = false;
    this.seq = 0;
    this.onEvent = null;
  }

  async start(onEvent) {
    this.onEvent = onEvent;
    const emit = async () => {
      if (this.stopped) return;
      this.seq += 1;
      const userId = this.users[this.seq % this.users.length];
      const record = {
        empNo: userId,          // generic synthetic shape: maps through source mapping
        sn: this.deviceId,
        recordTime: new Date().toISOString(),
        verifyMode: 1,
        eventType: 'CHECK_IN',
        id: `mock-${this.seq}`,
      };
      const out = normalizeEvent(
        record,
        this.cfg,
        {
          mapping: {
            userId: 'empNo',
            deviceId: 'sn',
            timestamp: 'recordTime',
            method: 'verifyMode',
            eventType: 'eventType',
            eventId: 'id',
          },
        },
        { connectorId: this.connectorId }
      );
      if (out.filtered) return;
      this.log.info('mock.emit', { userId, seq: this.seq });
      if (this.onEvent) await this.onEvent({ source: 'mock', record, normalized: out.normalized });
    };
    await emit();
    this.timer = setInterval(emit, this.intervalMs);
    if (typeof this.timer.unref === 'function') this.timer.unref();
    return this;
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
  }
}

module.exports = { MockFingerprint };