'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  eventStore.js - runtime heartbeat/state persisted to data/state.json
//
//  Lets `status.ps1` / `node src/main.js health` show exactly what the
//  connector has done recently without needing console access.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

class EventStore {
  constructor(file) {
    this.file = file;
    this.state = {
      bootedAt: new Date().toISOString(),
      lastHeartbeatAt: null,
      lastEventAt: null,
      lastEventId: null,
      lastDecision: null,
      lastDecisionMessage: null,
      lastWebhookOkAt: null,
      lastWebhookError: null,
      pendingQueueDepth: 0,
      failedCount: 0,
      dedupeKeys: 0,
      eventsAccepted: 0,
      eventsFiltered: 0,
      eventsDuplicated: 0,
      eventsQueued: 0,
      eventsDeadLettered: 0,
      sourcesRunning: [],
    };
    if (this.file && fs.existsSync(this.file)) {
      try {
        const saved = JSON.parse(fs.readFileSync(this.file, 'utf8'));
        Object.assign(this.state, saved);
        this.state.bootedAt = new Date().toISOString();
      } catch (_) {
        /* start fresh */
      }
    }
  }

  patch(patch) {
    Object.assign(this.state, patch);
    this.state.lastHeartbeatAt = new Date().toISOString();
    this._persist();
  }

  _persist() {
    if (!this.file) return;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = this.file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.state, null, 2));
      fs.renameSync(tmp, this.file);
    } catch (_) {
      /* state is diagnostic only */
    }
  }

  snapshot() {
    return { ...this.state };
  }
}

module.exports = { EventStore };