'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  main.js - GymDoorConnector CLI
//
//    node src/main.js serve          run connector (default; service/console)
//    node src/main.js health         human status summary
//    node src/main.js status --json  machine-readable status
//    node src/main.js inject --user ADH001 --device TERMINAL_001
//                                    push one synthetic fingerprint event
//                                    through the pipeline (test path)
//
//  Env knobs for operators/tests: GDC_EXIT_AFTER_MS (auto-exit for CI),
//  GDC_ALLOW_INSECURE_HTTP=1 (local webhook testing), GDC_NO_CONSOLE=1.
// ─────────────────────────────────────────────────────────────────────────────

const { loadConfig } = require('./config');
const { Runner } = require('./runner');
const { collectHealth, formatText } = require('./health');
const { toWire } = require('./normalizer');

const USAGE = `GymDoorConnector

Usage:
  node src/main.js serve                 run the connector (default)
  node src/main.js health                show status summary
  node src/main.js status --json         show status as JSON
  node src/main.js sync-members [opts]  sync Supabase allow-list into the
        --dry-run                       CVAccess local DB (no writes)

  node src/main.js inject [opts]         push one synthetic test event:
        --user ADH001  --device TERMINAL_001  --method fingerprint
        --event-type ACCESS              --timestamp 2026-08-22T18:00:31Z
  node src/main.js help                  this help

Environment (or .env / config/config.json):
  SUPABASE_WEBHOOK_URL    edge function HTTPS endpoint
  ZKTECO_WEBHOOK_SECRET   shared bearer secret (also accepted: WEBHOOK_SECRET, GYM_DOOR_SECRET, SUPABASE_WEBHOOK_SECRET)
  CONNECTOR_ID            this PC's connector id (default GYM_PC_001)
  GDC_EXIT_AFTER_MS       exit after N ms (used by automated tests)
  GDC_ALLOW_INSECURE_HTTP=1  allow http:// webhooks (LOWERCASE TESTS ONLY)
`;
function parseArgs(argv) {
  const args = { command: 'serve', flags: {} };
  let positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')
        ? argv[i + 1]
        : true;
      if (v !== true) i += 1;
      args.flags[k] = v;
    } else {
      positionals.push(a);
    }
  }
  if (positionals.length > 0) args.command = positionals[0];
  return args;
}

// ── serve ───────────────────────────────────────────────────────────────────
async function serve(load) {
  const runner = new Runner(load);
  await runner.start();

  const shutdown = async (code) => {
    try { await runner.stop(); } catch (_) {}
    process.exit(code);
  };
  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));

  if (process.env.GDC_EXIT_AFTER_MS) {
    setTimeout(() => shutdown(0), Number(process.env.GDC_EXIT_AFTER_MS));
  }

  // keep alive (sources unref their timers so this interval is the keeper)
  const keep = setInterval(() => {}, 1 << 30);
}

// ── status ──────────────────────────────────────────────────────────────────
function status(load, flags) {
  const h = collectHealth(load);
  if (flags.json) {
    process.stdout.write(JSON.stringify(h, null, 2) + '\n');
  } else {
    process.stdout.write(formatText(h) + '\n');
  }
  return h.running ? 0 : 1;
}

// ── inject (manual test path) ────────────────────────────────────────────────
async function inject(load, flags) {
  const runner = new Runner(load);
  const normalized = {
    connectorId: load.cfg.connector.id,
    deviceId: String(flags.device || 'TERMINAL_001'),
    userId: String(flags.userId || 'ADH001'),
    method: String(flags.method || 'fingerprint'),
    timestamp: String(flags.timestamp || new Date().toISOString()),
    eventType: String(flags['event-type'] || 'ACCESS').toUpperCase(),
    payloadVersion: 1,
  };
  const wire = toWire(normalized);
  await runner.handleSourceEvent({ source: 'manual-inject', record: {}, normalized });
  await runner.stop();
  process.stdout.write(`injected ${JSON.stringify(wire)}\n`);
  return 0;
}

// ── sync-members (manual allow-list sync CLI) ────────────────────────────────
async function syncMembers(load, flags) {
  const { AccessSync } = require('./control/accessSync');
  const log = {
    info: () => {},
    warn: (evt, data) => (console.warn || console.log)(`${evt}`, data),
    error: (evt, data) => console.error(`${evt}`, data),
  };
  const sync = new AccessSync({ cfg: load.cfg, log });
  const dryRun = !!(flags['dry-run'] || flags.dryRun);
  process.stdout.write(
    `syncing Supabase allow-list into CVAccess local DB (dryRun=${dryRun})...\n`
  );
  const r = await sync.runOnce({ dryRun });
  process.stdout.write(JSON.stringify({ dryRun, ...r }, null, 2) + '\n');
  return r.error ? 2 : 0;
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const load = loadConfig();

  if (args.command === 'help' || args.command === '--help') {
    process.stdout.write(USAGE);
    return 0;
  }

  if (args.command === 'health' || args.command === 'status') {
    return status(load, args.flags);
  }
  if (args.command === 'sync-members') {
    return syncMembers(load, args.flags);
  }
  if (args.command === 'inject') {
    return inject(load, args.flags);
  }

  // default: serve
  return serve(load);
}

main()
  .then((code) => {
    if (Number.isInteger(code)) process.exit(code);
  })
  .catch((err) => {
    console.error('GymDoorConnector fatal:', err && err.stack ? err.stack : err);
    process.exit(1);
  });