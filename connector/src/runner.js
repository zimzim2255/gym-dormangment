'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  runner.js - the heart of the connector.
//
//  Pipeline (per normalized event):
//     1. eventKey()                    stable idempotency key
//     2. Dedupe                        drop re-deliveries from CVAccess
//     3. sendToWebhook()               Supabase edge function over HTTPS
//        ├─ ok                        -> record decision locally
//        ├─ permanent (4xx)           -> dead-letter + audit log
//        └─ transient (net/5xx/408)   -> DurableQueue with exponential backoff
//
//  A background sweeper retries the queue forever (with jittered backoff) so a
//  temporary internet outage never loses an event. Nothing is kept in memory
//  only: every queued event spans reboots on disk.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const { Logger } = require('./logger');
const { Dedupe } = require('./dedupe');
const { DurableQueue } = require('./queue');
const { CursorStore } = require('./cursorStore');
const { EventStore } = require('./eventStore');
const { sendToWebhook } = require('./webhookClient');
const { eventKey, toWire } = require('./normalizer');
const { startSources } = require('./sources');
const { TransientError } = require('./errors');
const { startControl } = require('./control');


class Runner {
  /**
   * @param {object} load { cfg, paths, logger }
   */
  constructor(load) {
    this.cfg = load.cfg;
    this.paths = load.paths;
    this.logger = load.logger || new Logger({
      logDir: load.paths.logDir,
      level: load.cfg.connector.logLevel,
      maxDays: load.cfg.connector.logMaxDays,
      connectorId: load.cfg.connector.id,
    });
    this.log = this.logger;
    this.connectorId = load.cfg.connector.id;
    this.stopped = false;
    this.sources = [];
this.controlItems = [];
    this.counters = {
      accepted: 0, filtered: 0, duplicated: 0, queued: 0,
      delivered: 0, deadLettered: 0, decisions: 0,
    };

    for (const dir of [load.paths.dataDir, load.paths.logDir]) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.dedupe = new Dedupe({
      windowSeconds: load.cfg.dedupe.windowSeconds,
      maxKeys: load.cfg.dedupe.maxKeys,
      file: load.paths.dedupeFile,
    });
    this.queue = new DurableQueue({
      file: load.paths.queueFile,
      deadLetterFile: load.paths.deadLetterFile,
      initialDelayMs: load.cfg.retry.initialDelayMs,
      maxDelayMs: load.cfg.retry.maxDelayMs,
      factor: load.cfg.retry.factor,
      maxAttempts: load.cfg.retry.maxAttempts,
    });
    this.cursors = new CursorStore(load.paths.cursorFile);
    this.store = new EventStore(load.paths.stateFile);
    this.warnedDryRun = false;
  }
async start() {
    this.log.info('runner.start', {
      connectorId: this.connectorId,
      webhookConfigured: !!this.cfg.webhook.url,
      webhookSecretSet: !!this.cfg.webhook.secret,
      version: require('../package.json').version,
    });
    this.sources = await startSources(
      {
        cfg: this.cfg,
        connectorId: this.connectorId,
        log: this.logger,
        cursors: this.cursors,
      },
      (evt) => this.handleSourceEvent(evt)
    );
    this.store.patch({
      sourcesRunning: this.sources.map((s) => s.name),
      running: true,
    });

    this.controlItems = await startControl({
      cfg: this.cfg, paths: this.paths, log: this.logger,
      connectorId: this.connectorId,
    });
    if (this.controlItems.length) {
      this.store.patch({
        sourcesRunning: this.sources.map((s) => s.name)
          .concat(this.controlItems.map((c) => c.name)),
        running: true,
      });
    }
    this.sweepTimer = setInterval(() => this.sweepQueue(), this.cfg.retry.sweepIntervalMs);
    if (this.sweepTimer.unref) this.sweepTimer.unref();

    this.heartbeatTimer = setInterval(() => this.heartbeat(), 10000);
    if (this.heartbeatTimer.unref) this.heartbeatTimer.unref();

    await this.sweepQueue();
    this.log.info('runner.ready', { sources: this.sources.map((s) => s.name) });
  }

  // ── event inlet ────────────────────────────────────────────────────────────
  async handleSourceEvent({ source, record, normalized }) {
    if (!normalized) {
      this.counters.filtered += 1;
      this.store.patch(this.countersToStore());
      return;
    }
    const wire = toWire(normalized);
    const key = eventKey(normalized);
    if (this.dedupe.has(key)) {
      this.counters.duplicated += 1;
      this.log.debug('event.duplicate', {
        eventId: wire.eventId, userId: wire.userId, deviceId: wire.deviceId,
      });
      this.store.patch(this.countersToStore());
      return;
    }
    this.dedupe.add(key);
    this.counters.accepted += 1;
    this.log.info('event.captured', {
      source, eventId: wire.eventId, userId: wire.userId,
      deviceId: wire.deviceId, timestamp: wire.timestamp,
    });
    await this.process(wire, key);
  }
/**
   * Deliver one normalized wire payload to the webhook (or dry-run).
   * @returns {'ok'|'queued'|'deadletter'}
   */
  async process(wire, key) {
    if (!this.cfg.webhook.url) {
      if (!this.warnedDryRun) {
        this.warnedDryRun = true;
        this.log.warn('webhook.not_configured', {
          hint: 'Set SUPABASE_WEBHOOK_URL - running in local dry-run mode for now.',
        });
      }
      this.counters.delivered += 1;
      this.store.patch({
        ...this.countersToStore(),
        lastEventId: wire.eventId,
        lastEventAt: new Date().toISOString(),
        lastDecision: 'LOCAL_DRY_RUN',
        lastDecisionMessage: 'webhook URL not configured',
      });
      return 'ok';
    }

    const result = await sendToWebhook(wire, {
      url: this.cfg.webhook.url,
      secret: this.cfg.webhook.secret,
      timeoutMs: this.cfg.webhook.timeoutMs,
      maxBodyBytes: this.cfg.webhook.maxBodyBytes,
    });

    if (result.ok) {
      this.counters.delivered += 1;
      this.counters.decisions += 1;
      this.log.info('event.result', {
        eventId: result.eventId || wire.eventId,
        userId: wire.userId,
        decision: result.decision,
        http: result.httpStatus,
        latencyMs: result.latencyMs,
      });
      this.store.patch({
        ...this.countersToStore(),
        lastWebhookOkAt: new Date().toISOString(),
        lastEventId: result.eventId || wire.eventId,
        lastEventAt: new Date().toISOString(),
        lastDecision: result.decision,
        lastDecisionMessage: result.message,
        lastWebhookError: null,
      });
      return 'ok';
    }

    if (result.error instanceof TransientError) {
      this.counters.queued += 1;
      this.queue.add(wire, { id: wire.eventId });
      this.log.warn('event.queued_for_retry', {
        eventId: wire.eventId, reason: result.error.message,
        backoffInitialMs: this.cfg.retry.initialDelayMs,
      });
      this.store.patch({
        ...this.countersToStore(),
        lastWebhookError: result.error.message,
      });
      return 'queued';
    }

    // permanent (4xx / invalid payload / insecure transport)
    this.counters.deadLettered += 1;
    this.queue.deadLetter(wire, {
      id: wire.eventId,
      reason: result.error ? result.error.message : 'rejected',
    });
    this.log.error('event.deadletter', {
      eventId: wire.eventId,
      reason: result.error ? result.error.message : 'rejected',
      http: result.httpStatus,
    });
    this.store.patch({
      ...this.countersToStore(),
      lastWebhookError: (result.error && result.error.message) || 'rejected',
    });
    return 'deadletter';
  }
// ── retry sweeper ──────────────────────────────────────────────────────────
  async sweepQueue() {
    if (this.stopped) return;
    const due = this.queue.takeDue();
    if (due.length === 0) {
      this.queue.persist();
      this.store.patch(this.countersToStore());
      return;
    }
    this.log.debug('queue.sweep', { due: due.length });
    for (const entry of due) {
      if (this.stopped) break;
      const wire = entry.payload;
      if (this.cfg.webhook.url) {
        const result = await sendToWebhook(wire, {
          url: this.cfg.webhook.url,
          secret: this.cfg.webhook.secret,
          timeoutMs: this.cfg.webhook.timeoutMs,
          maxBodyBytes: this.cfg.webhook.maxBodyBytes,
        });
        if (result.ok) {
          this.queue.remove(entry.id);
          this.counters.delivered += 1;
          this.counters.decisions += 1;
          this.log.info('queue.delivered', {
            eventId: result.eventId || wire.eventId, decision: result.decision,
          });
          this.store.patch({
            ...this.countersToStore(),
            lastWebhookOkAt: new Date().toISOString(),
            lastDecision: result.decision,
            lastDecisionMessage: result.message,
            lastWebhookError: null,
          });
        } else if (result.error instanceof TransientError) {
          const outcome = this.queue.scheduleRetry(entry);
          if (outcome.dropped) this.counters.deadLettered += 1;
          this.log.warn('retry.scheduled', {
            eventId: wire.eventId,
            attempt: entry.retryCount,
            nextAttemptInSec: Math.max(
              0, Math.round((entry.nextAttemptAt - Date.now()) / 1000)
            ),
          });
        } else {
          this.queue.remove(entry.id);
          this.counters.deadLettered += 1;
          this.log.error('retry.deadletter', {
            eventId: wire.eventId,
            reason: result.error ? result.error.message : 'rejected',
          });
        }
      } else {
        // dry-run: count as delivered locally
        this.queue.remove(entry.id);
        this.counters.delivered += 1;
        this.log.warn('retry.dry_run_delivery', { eventId: wire.eventId });
      }
      this.queue.persist();
      this.store.patch(this.countersToStore());
    }
  }

  countersToStore() {
    const c = this.queue.counts();
    return {
      pendingQueueDepth: c.pending,
      failedCount: c.failed,
      dedupeKeys: this.dedupe.size(),
      eventsAccepted: this.counters.accepted,
      eventsFiltered: this.counters.filtered,
      eventsDuplicated: this.counters.duplicated,
      eventsQueued: this.counters.queued,
      eventsDeadLettered: this.counters.deadLettered,
      eventsDelivered: this.counters.delivered,
    };
  }

  heartbeat() {
    this.dedupe.save();
    this.queue.persist();
    this.cursors.persist();
    this.store.patch(this.countersToStore());

    // Live proof-of-life at INFO level (default) - shows what the sources have
    // received so far, so it is impossible to tell "nothing is happening".
    const srcStats = {};
    for (const item of this.sources) {
      const s = item.src.stat || {};
      srcStats[item.name] = {
        received: s.received ?? s.polls ?? undefined,
        accepted: s.accepted ?? s.fetched ?? undefined,
        filtered: s.filtered ?? undefined,
        lastError: s.lastError ?? undefined,
      };
    }
    this.log.info('runner.alive', {
      uptimeSec: Math.round(process.uptime()),
      sources: srcStats,
      counters: this.counters,
      queueDepth: this.queue.counts().pending,
      lastDecision: this.store.snapshot().lastDecision ?? undefined,
      lastEventAt: this.store.snapshot().lastEventAt ?? undefined,
    });
  }

  async stop() {
    this.stopped = true;
    clearInterval(this.sweepTimer);
    clearInterval(this.heartbeatTimer);
    for (const item of this.sources) {
      try { item.src.stop(); } catch (_) {}
    }
    for (const item of this.controlItems) {
      try { item.src.stop(); } catch (_) {}
    }
    this.dedupe.save();
    this.queue.persist();
    this.cursors.persist();
    this.store.patch({ running: false });
    this.log.info('runner.stopped', {});
  }
}

module.exports = { Runner };