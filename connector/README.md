# GymDoorConnector

Windows connector/service that links the **ZKBio CVAccess** system (running on
the gym PC `192.168.100.30`, port **8088** is owned by CVAccess ADMS PUSH) to
the existing **Supabase** edge function `zkteco-webhook` for member /
subscription / schedule validation.

```
SenseFace 3A (fingerprint scan)
      │ fingerprint matched locally
      ▼
ZKBio CVAccess  (192.168.100.30 / ADMS PUSH on 8088)
      │
      ▼
GymDoorConnector  (Node.js service on the same PC)
      │  normalize + dedupe + durable queue
      │  HTTPS POST /functions/v1/zkteco-webhook
      ▼
Supabase edge function zkteco-webhook
      │  member → subscription → schedule → access log
      ▼
 GRANTED / DENIED   (returned + stored in connector logs)
```

> **Important:** the connector only **watches** CVAccess events. It will never
> take over port **8088**, never opens inbound ports to the internet, and never
> sends fingerprints/templates/images/biometric data upstream. Only the
> terminal **user id** (e.g. `ADH001`), device id, method (`fingerprint`),
> timestamp, event type and event id are carried.

---

## 1. Prerequisites

| Component | Where | Notes |
|-----------|-------|-------|
| Node.js 18+ | Gym PC (192.168.144.30) | `node --version` ≥ 18; **zero npm packages needed** |
| ZKBio CVAccess | Gym PC | already installed & online (ADMS on 8088, app on 8098) |
| Supabase edge function | cloud | already deployed: `zkteco-webhook` (this repo) |
| NSSM (optional) | auto-downloaded | used by `install.ps1` for auto-restart |

The connector has **zero runtime dependencies** (pure Node built-ins), so you
can just copy the `connector\` folder to the gym PC — no `npm install`.

## 2. First: discover how YOUR CVAccess exposes events (requirement #1)

We do **not** invent a ZKTeco wire format. On the gym PC (you have AnyDesk)
run the **read-only** probe:

```powershell
cd connector
powershell -ExecutionPolicy Bypass -File tools\probe-cvaccess.ps1
```

It writes `tools\cvaccess-report.json` and prints the CVAccess/ZKBio services,
listening ports, install folders, config files, and whether the OpenAPI token
endpoint answers.

**Confirmed on the gym PC (192.168.100.30):**

| Thing | Discovery |
|-------|-----------|
| CVAccess install | `C:\Program Files\ZKBio CVAccess\` |
| Backend | Java on **8088** (ADMS device PUSH) **and** **8098** (CVAccess web app / OpenAPI) — same process |
| Local DB | PostgreSQL **5442** + Redis **6390** (BioPlatform) |
| Biometrics | `zkfinger-served` on **38088** (port fingerprint server), DetectFace on 26110/26111 |
| OpenAPI | `http://192.168.100.30:8098/api/token/temp` **answers** (it returned HTTP 400 for dummy credentials → the OpenAPI server is alive, it needs the real App Code/Secret) |

So the **supported integration surface is the CVAccess OpenAPI on `:8098`**
(ZKTeco's documented REST API for access/attendance events), and port **8088**
stays untouched (the terminal PUSH stays there).

To get the *exact* endpoint + field names (we will not guess them), on-site run
the verifier after creating an OpenAPI app in the CVAccess web admin:

```powershell
powershell -ExecutionPolicy Bypass -File tools\cvaccess-api-verify.ps1 `
  -BaseUrl http://192.168.100.30:8098 `
  -AppCode <YOUR_APP_CODE> -AppSecret <YOUR_APP_SECRET>
```

It prints the real JSON of `/api/token/temp` + `/api/token` and crawls the
CVAccess web UI JS bundles for the real `/api/...` endpoint paths, then writes
`tools\cvaccess-openapi-report.json`. Paste that back so we wire the actual
field names into `config\config.json`.

### Event sources (enable what the probe confirms)

### Event sources (enable what the probe confirms)

| Source | Config flag | Notes |
|--------|-------------|-------|
| `cvaccessPush` (recommended now) | `enabled: true` | **Receives CVAccess Cloud-Settings push on `127.0.0.1:8091`** — real-time, never touches 8088/6001 |
| `cvaccessOpenApi` | `enabled: true` | Polls the CVAccess OpenAPI on 8098 with token flow + `since` cursor (needs AppCode/AppSecret) |
| `cvaccessDb` | `enabled: true` | *Optional/experimental:* read-only DB watcher (PostgreSQL is local on 5442) |
| `mockFingerprint` | `enabled: true` | DEV ONLY — synthetic events to test the pipeline |

At least one real source must be enabled in production.

### The CVAccess "Cloud Settings" push path (what we found on the gym PC)

The gym CVAccess web console has **System → System Management → Cloud Settings**
with exactly:

| Field | Value to use |
|---|---|
| Enable | **Yes** |
| Is pushing event data to the cloud platform enabled | **Yes** |
| ZKBio CVConnect Server Url | `http://127.0.0.1:8091` |

With our connector's `cvaccessPush` receiver running on `127.0.0.1:8091`,
CVAccess itself will POST every access event there (that's the URL it uses).
The connector then validates with Supabase and logs GRANTED/DENIED.

Two notes:
- **TLS**: the URL starts with `https`. Generate
  `config\cert.pem` + `config\key.pem` with `tools\make-cert.bat` and import
  `cert.pem` into Windows **Trusted Root Certification Authorities** so
  CVAccess's Java client trusts our local server. If the CVAccess URL field
  accepts `http://`, set `cvaccessPush.scheme` to `"http"` and skip TLS.
- **First event**: enable `cvaccessPush.captureFirst` — the first real event
  CVAccess pushes is logged **verbatim** so we can map the exact fields into
  `config/config.json` (it's the real wire format, nothing guessed).

At least one real source must be enabled in production.

## 3. Configure

```powershell
cd connector
Copy-Item .env.example .env
Copy-Item config\config.example.json config\config.json
```

Edit `.env` (use a strong random value — same as the Supabase secret `ZKTECO_WEBHOOK_SECRET`):

```dotenv
SUPABASE_WEBHOOK_URL=https://zpxobitwvitkidcmhlyg.supabase.co/functions/v1/zkteco-webhook
ZKTECO_WEBHOOK_SECRET=<long-random-value-match-supabase-secret>
CONNECTOR_ID=GYM_PC_001
```

Fill `config\config.json` from the probe report (base URLs, OpenAPI app
code/secret/temp code, and the real field mapping).

> **Security:** secrets are never hard-coded. The connector reads `.env` (env
> vars override). The webhook enforces `Authorization: Bearer
> <ZKTECO_WEBHOOK_SECRET>` only when that secret is configured on the edge
> function — set it in **both** places.

## 4. Run for a minute in the foreground to verify

```powershell
cd connector
node src\main.js serve
```

In another shell:

```powershell
node src\main.js status          # human summary
node src\main.js status --json   # machine-readable
```

With the mock source enabled you should see `event.captured` then
`event.result` lines with `GRANTED`/`DENIED`.
### End-to-end self-test (no CVAccess needed)

```bash
node --test        # 20 tests: normalization/filter, dedupe, retry/backoff,
                   # dead-letter, Bearer auth, full pipeline with mock webhook
```

The tests spin up a local mock webhook and verify that a simulated transient
failure is queued and later delivered via backoff, that duplicates are dropped,
and that 4xx goes to the dead-letter file.

## 5. Install as a Windows service

Run as Administrator on the gym PC:

```powershell
cd connector
.\install.ps1      # self-elevates; downloads NSSM if needed; registers GymDoorConnector
.\start.ps1        # start service
.\status.ps1       # live health/status
.\stop.ps1         # stop
.\uninstall.ps1    # remove
```

- `install.ps1` auto-creates `.env` and `config\config.json` from examples the
  first time (never overwrites existing).
- The service auto-starts at boot and (when NSSM is used) auto-restarts 5s
  after a crash.
- Logs: `logs\connector-<date>.ndjson` (structured NDJSON) + `logs\service-*
  {out,err}.log` (NSSM).

## 6. Reliability

- **Automatic retry + exponential backoff** for transient failures (timeout,
  network, 5xx) — jittered `[1.5s → 10 min]`.
- **Local durable queue** (`data\queue.ndjson`) + **dead-letter file** — events
  survive internet outages and PC restarts.
- **Duplicate protection** — deterministic `eventId` + persisted recent-events
  memory; replays from CVAccess never double-log.
- **Structured logs** — every line is NDJSON (`ts/level/event/…`).
- **Health/status command** — `node src\main.js status`, `.\status.ps1`.
- **Crash-safe service** — NSSM `AppExit=Restart`, `AppRestartDelay=5000`.

## 7. Webhook contract (already updated in this repo)

The existing `zkteco-webhook` edge function (both `backend/functions` and
`supabase/functions` copies are now identical) accepts the connector payload:

```json
{
  "connectorId": "GYM_PC_001",
  "deviceId": "TERMINAL_001",
  "userId": "ADH001",
  "method": "fingerprint",
  "timestamp": "2026-08-22T18:00:31Z",
  "eventType": "ACCESS",
  "eventId": "…"
}
```

- remains **backward compatible** with raw ZKTeco PUSH keys
  (`serialNumber` / `verifyMode` / `CHECK_IN`),
- optionally requires `Authorization: Bearer <secret>` when
  `ZKTECO_WEBHOOK_SECRET` (or `WEBHOOK_SECRET`/`GYM_DOOR_SECRET`) is configured
  on the edge function,
- responds `{ "decision": "GRANTED"|"DENIED", "message": …, "eventId": … }`,
  echoing the event id for connector-side idempotency.

## 8. Door relay / online authorization – honest status

**We do not claim the door-control (relay) part works.** The SenseFace 3A is
managed by CVAccess/ADMS itself; in the standard ADMS + external cloud
validation setup there is **no documented, supported** channel to push a
GRANTED/DENIED decision from Supabase back into the SenseFace relay in real
time. So this connector:

- **monitors** the real CVAccess fingerprint events,
- **validates** each event in the cloud,
- **records** the GRANTED/DENIED result locally (and in Supabase via the
  webhook's own access log).

The physical door release stays under **CVAccess access rules** (time windows /
access group membership configured inside CVAccess). If you later need true
real-time cloud-based relay control, that must be validated on-site with the
actual SenseFace firmware/SDK variant — we will not fake an unverifiable
integration.

## 8. Rollout checklist (gym PC, over AnyDesk)

1. Copy the `connector\` folder onto the gym PC.
2. `node --version` — install Node if missing.
3. `.\tools\probe-cvaccess.ps1` → read `tools\cvaccess-report.json`.
4. Fill `.env` and `config\config.json` from that report.
5. Add `ZKTECO_WEBHOOK_SECRET` to the Supabase edge function secrets
   (same value as `.env`).
6. Foreground smoke: `node src\main.js serve` (observe log lines).
7. `.\install.ps1`, `.\start.ps1`, `.\status.ps1`.
8. Live fingerprint at the door → confirm a GRANTED/DENIED log line.

## 10. Troubleshooting

| Symptom | Fix |
|---------|-----|
| log says `webhook.not_configured` (dry-run) | set `SUPABASE_WEBHOOK_URL` in `.env` |
| log says `cvaccessor.base_url_missing` | fill OpenAPI baseUrl from the probe report |
| webhook returns 401 | `.env` secret ≠ Supabase secret, or header stripped |
| duplicates in dashboards | keep the 5-min dedupe window or add a UNIQUE constraint on `event_id` |
| service keeps stopping | check `logs\service-err.log`; connector is crash-restartable by design |

## 11. Layout

```
connector/
  package.json                 # npm scripts: start / test / status
  .env.example                 # env template (secrets never committed)
  src/                         # main, config, logger, normalizer, dedupe,
                               #   queue, webhookClient, runner, sources/, …
  config/config.example.json   # source + mapping template
  tools/probe-cvaccess.ps1     # on-site read-only CVAccess discovery
  test/*.test.js               # automated tests (node --test)
  install.ps1 / uninstall.ps1 / start.ps1 / stop.ps1 / status.ps1
  README.md
```

_This project lives inside the existing gym ERP repo and does not touch the
`src/` web application or any other Supabase function._