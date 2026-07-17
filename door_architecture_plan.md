# SenseFace 3A Door Control Architecture - Redesign Plan

## Current Problem
The current implementation **requires admin to manually scan** (simulating a terminal). 
**Real world**: The SenseFace 3A terminal does biometric matching **locally**, then asks our app:

> "Member X matched at time Y - is entry allowed?"

## Real Architecture (What we need)

```
┌──────────────────────────────────────────────┐
│ SenseFace 3A Terminal (Gym Entrance)         │
│ • User scans face/fingerprint/RFID locally   │
│ • Terminal matches biometric locally         │
│ • If matched: HTTP POST → our webhook       │
│ • Waits for response to unlock/lock door     │
└──────────┬───────────────────────────────────┘
           │ PUSH Protocol (ZKTeco standard)
           │ POST /api/zkteco/webhook
           │ {
           │   "memberId": "ADH001",       ← From terminal's local DB
           │   "method": "face",            ← face/fingerprint/rfid/qr
           │   "deviceId": "TERMINAL_001",
           │   "accessTime": "2025-07-16T14:30:45Z",
           │   "confidence": 98.5           ← Matching confidence %
           │ }
           ▼
┌──────────────────────────────────────────────┐
│ Supabase Edge Function (Webhook Endpoint)    │
│                                              │
│ 1. Parse request from terminal               │
│ 2. Lookup member in database by memberId     │
│ 3. Check: Is member status = "Actif"?        │
│ 4. Check: Is subscription valid?             │
│    • Not expired (end_date > today)          │
│    • Paid or partial payment allowed         │
│ 5. Check: Time schedule (if configured)      │
│    • Is current day allowed?                 │
│    • Is current time within hours?           │
│ 6. Create session + log entry in database    │
│ 7. Return decision to terminal               │
│                                              │
│ Response:                                    │
│ {                                            │
│   "sessionId": "sess_...",                   │
│   "decision": "GRANTED",                     │
│   "message": "Accès autorisé Bon sport!"     │
│ }                                            │
└──────────┬───────────────────────────────────┘
           ▼
┌──────────────────────────────────────────────┐
│ SenseFace 3A Terminal                        │
│ • If GRANTED → Unlock relay → Door opens     │
│ • If DENIED → Show message on screen         │
│ • Logs locally + syncs to ZKBio software     │
└──────────────────────────────────────────────┘
```

## What Files Need to Change

### BACKEND (`backend/`)

1. **`backend/functions/process-access.ts`** → RENAME to `backend/functions/zkteco-webhook.ts`
   - Accept ZKTeco PUSH protocol format (raw from terminal)
   - Add time/day schedule checking
   - Add subscription period validation (start_date, end_date)
   - Response must be fast (< 500ms for terminal timeout)
   
2. **`backend/functions/door-management.ts`** → Keep but simplify
   - Remove mock/heartbeat stuff
   - Add: `sync-users` endpoint → to push user list to terminal
   
3. **`backend/migrations/00001_door_system.sql`** → ADD new tables:
   - `member_schedules` → allowed days/times per member type
   - Add schedule fields to subscription logic

### FRONTEND (`src/app/`)

4. **`src/app/types/door.ts`** → Update:
   - Add ZKTeco webhook request/response types
   - Add schedule types (allowed_days, allowed_hours)
   
5. **`src/app/services/doorService.ts`** → Simplify:
   - Remove offline queue logic (terminal handles offline)
   - Add function to push user list to terminal
   
6. **`src/app/hooks/useDoorSystem.ts`** → Can DELETE - logic moves to edge function
   
7. **`src/app/components/door/AccessControlPanel.tsx`** → Convert to dashboard:
   - Show **live** access logs from database (auto-refresh)
   - Show terminal status (online/offline)
   - Show today's stats
   - DO NOT have a scan button - everything is automatic

8. **`src/app/App.tsx`** → Keep same, the component just changes behavior

## New Tables Needed

```sql
-- Member access schedule (per subscription type)
CREATE TABLE access_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_type VARCHAR(50) NOT NULL,  -- Mensuel, Trimestriel, etc.
  allowed_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',  -- 1=Mon...7=Sun
  start_time TIME NOT NULL DEFAULT '06:00',
  end_time TIME NOT NULL DEFAULT '23:00',
  max_daily_entries INTEGER DEFAULT NULL,  -- NULL = unlimited
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default schedule
INSERT INTO access_schedules VALUES
  ('Journalier', '{1,2,3,4,5,6,7}', '06:00', '23:00', 1),
  ('Mensuel', '{1,2,3,4,5,6,7}', '06:00', '23:00', NULL),
  ('Trimestriel', '{1,2,3,4,5,6,7}', '06:00', '23:00', NULL),
  ('Semestriel', '{1,2,3,4,5,6,7}', '06:00', '23:00', NULL),
  ('Annuel', '{1,2,3,4,5,6,7}', '06:00', '23:00', NULL);
```

## Terminal PUSH Protocol (ZKTeco Standard)

The SenseFace 3A sends:
```
POST /api/zkteco/webhook
Content-Type: application/json

{
  "serialNumber": "TERMINAL_001",     // Terminal serial
  "eventType": "CHECK_IN",            // Door event
  "userId": "ADH001",                 // User ID from terminal DB
  "verifyMode": 1,                    // 1=fingerprint, 2=face, 3=RFID, 4=QR, 5=password
  "timestamp": "2025-07-16T14:30:45", // Event time
  "confidence": 98                     // Recognition confidence %
}
```

Response back to terminal:
```
HTTP 200
{
  "sessionId": "sess_1721147445_TERMINAL_001_ADH001_a1b2",
  "decision": "GRANTED",
  "message": "Accès autorisé"
}
```

## Implementation Steps

1. Update migration SQL → add `access_schedules` table + seed data
2. Rewrite `backend/functions/zkteco-webhook.ts` → real ZKTeco format + schedule validation
3. Add `backend/functions/sync-users.ts` → push allowed users to terminal
4. Update frontend types
5. Simplify `doorService.ts` → remove mock/offline, real API calls only
6. Rewrite `AccessControlPanel.tsx` → live dashboard (no scan button)
7. Delete `useDoorSystem.ts` → logic is in edge functions now

## Verification

- The terminal POSTs to our edge function
- Edge function returns correct GRANTED/DENIED based on:
  - Member exists in DB
  - Subscription is paid and not expired
  - Current time/day is within schedule
- Logs are written to `access_logs` table
- Frontend dashboard auto-refreshes to show real-time logs



## How the SenseFace 3A Terminal Communicates With Our Web App

### 1. Terminal Configuration (On the Device)

On the SenseFace 3A touchscreen, go to **Communication → PUSH Settings** and set:

| Setting | Value |
|---------|-------|
| **Server URL** | `https://zpxobitwvitkidcmhlyg.supabase.co/functions/v1/zkteco-webhook` |
| **Port** | `443` |
| **Protocol** | `HTTP PUSH` |
| **Events** | `CHECK_IN` |

### 2. What Happens When a User Scans

```
User presents face/fingerprint/RFID
         │
         ▼
SenseFace 3A matches biometric LOCALLY (in its own database)
         │
         ├── If NOT matched → Door stays locked, error on screen
         │
         └── If MATCHED → Terminal sends HTTP POST to our edge function
                          POST /functions/v1/zkteco-webhook
                          Body: { userId, serialNumber, verifyMode, timestamp }
                                    │
                                    ▼
                    Edge Function checks Supabase:
                    ├── Member exists? → "Membre introuvable"
                    ├── Member is "Actif"? → "Compte suspendu"  
                    ├── Subscription within date range? → "Abonnement expiré"
                    ├── Subscription is paid? → "Abonnement non payé"
                    └── ALL GOOD → "Accès autorisé. Bon sport !"
                                    │
                                    ▼
                    Response sent back to terminal
                    ├── GRANTED → Terminal unlocks door relay
                    └── DENIED → Terminal shows refusal message
```

### 3. Edge Function Deployed and Ready

The webhook is already deployed at:
```
https://zpxobitwvitkidcmhlyg.supabase.co/functions/v1/zkteco-webhook
```

### 4. The Frontend (Web App) is a Dashboard

The web app (`AccessControlPanel.tsx`) is just a **monitoring dashboard** - it does NOT scan anything. It shows:
- Live access logs from the database
- Terminal online/offline status
- Today's stats (entries, authorized, denied)

### 5. Next Step

You need to:
1. Run the SQL migration to create `members`, `subscriptions`, `door_terminals`, `access_logs` tables
2. Enroll your members' faces/fingerprints/RFID cards in the SenseFace 3A terminal
3. Configure the PUSH server URL on the terminal to point to our edge function

1. Admin registers user on SenseFace 3A terminal
   → Terminal creates user with ID: "ADH001"
   → Scans face/fingerprint/RFID → stored locally on terminal

2. Admin opens web app → "Ajouter un adhérent"
   → First field: "ID sur le terminal" → enters "ADH001"
   → Fills rest of the form → saves to Supabase

3. User scans at the door
   → Terminal matches biometric locally
   → Sends to webhook: { userId: "ADH001", verifyMode: 2 }
   → Webhook looks up "ADH001" in Supabase `members` table
   → Checks subscription → returns GRANTED/DENIED

