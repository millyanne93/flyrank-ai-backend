# Your First Background Job

A small API that hands slow work off to a background job instead of making the client wait.
The endpoint answers instantly, a status endpoint reports progress, and one job runs on a
schedule with no request involved at all.

---

## Why this pattern matters

A slow endpoint (8+ seconds) makes the user wait, risks timeouts, and encourages retries that
duplicate work. Moving slow work out of the request — accepting it immediately with a `202`,
doing the work in the background, and letting the client poll for status — is the professional
fix behind every "we'll email you when it's ready" flow.

---

## Stack

- Node.js 20+
- Express
- Inngest (background jobs, retries, and cron — run locally via the Inngest Dev Server)

---

## How to run it

Two terminals, both need to stay open.

**Terminal 1 — the API**
```bash
npm install
npm run dev
```
Runs at `http://localhost:3000`.

**Terminal 2 — the Inngest Dev Server**
```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```
Dashboard at `http://localhost:8288` — every function, run, step, and retry is visible there.

**Quick check**
```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

---

## Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/reports` | Accepts `{ "topic": "..." }`. Returns `202` instantly with `{ id, status: "pending" }`. Sends a `report/requested` event — the actual report is built in the background. Missing `topic` → `400`, no job created. |
| `GET` | `/reports/:id` | Returns the report's current state: `pending` → later `done` with a `result`. Unknown id → `404`. |

---

## Inngest functions

| Function | Trigger | What it does |
|---|---|---|
| `say-hello` | event `test/hello` | Test function — sleeps 5s, returns a greeting. Used to confirm Inngest is wired up correctly. |
| `make-report` | event `report/requested` | Sleeps 8s (stands in for slow work like an AI call), then builds the report and updates its status to `done`. Configured with `retries: 2` (3 total attempts). If `topic` is `"fail"`, it throws intentionally to demonstrate retry + backoff behavior. |
| `heartbeat` | cron `* * * * *` (every minute) | No event, no request — the clock is the only trigger. Logs a one-line summary of how many reports are `pending` / `done` / `failed`. |

---

## Validation vs. retries

| Input | Response | Retry? | Why |
|---|---|---|---|
| `{"topic":"cats"}` | `202 Accepted` | ✅ Yes, if it fails | Transient failures can be retried |
| `{"topic":"fail"}` | `202 Accepted` | ✅ Yes | Server sees a failure, retries up to 3 times |
| `{"topic":""}` | `400 Bad Request` | ❌ No | Client error — retrying won't fix it |
| `{}` (missing topic) | `400 Bad Request` | ❌ No | Client error — retrying won't fix it |

---

## Proof — 202 then poll

```bash
$ curl -i -X POST http://localhost:3000/reports \
    -H "Content-Type: application/json" \
    -d '{"topic":"cats"}'
HTTP/1.1 202 Accepted
{"id":"1787593148907","status":"pending"}

$ curl http://localhost:3000/reports/1787593148907
{"id":"1787593148907","topic":"cats","status":"pending"}

# ~10 seconds later:
$ curl http://localhost:3000/reports/1787593148907
{"id":"1787593148907","topic":"cats","status":"done","result":"Report on \"cats\" generated at 2026-08-24T17:39:17.233Z"}
```

The POST answers in well under a second. The actual 8-second render happens entirely in the
background — the client only finds out it's done by polling.

---

## Design notes

**On validation vs. retries (Stage 3):** A missing `topic` fails validation instantly and never
becomes a job — it's a client mistake, and retrying it wouldn't help since it would fail the
exact same way every time. A `topic: "fail"` job, on the other hand, is accepted and retried 3
times (with increasing backoff between attempts) because from the server's perspective a
failure inside `build-report` looks like it could be transient — a flaky dependency or a
timeout — so it's worth trying again before giving up.

**On cron scheduling (Stage 4):**
- Every day at 08:00 → `0 8 * * *`
- Every Sunday at 22:00 → `0 22 * * 0`

Cron schedules typically run in UTC by default, so it's worth double-checking (or explicitly
setting) the timezone before trusting a schedule in a real deployment — "08:00" server time
isn't necessarily 08:00 local time for your users.

**On background jobs generally:** this pattern — accept fast, work in the background, report
status — is the same one behind every "we'll email you when it's ready" flow. The endpoint
never has to hold a connection open for slow work, which is what makes it resilient under load.

---

## Dashboard screenshot
<img width="1366" height="728" alt="2026-08-24 (2)" src="https://github.com/user-attachments/assets/1be0286e-83ec-4778-bc63-d2cd0e192cb3" />



---

## Notes on background jobs

**What makes this production-ready:**
- **202 Accepted** — the server acknowledges the request without waiting for work to finish
- **Retries with backoff** — failed jobs retry with increasing delays, so a struggling service gets breathing room
- **Cron** — scheduled work runs without any request
- **No duplicate work** — jobs that fail mid-step can resume without redoing completed work (if extended with a database)

**What you'd add in production:**
- Persistent storage (a real database instead of the in-memory `store.js`)
- Authentication, so not just anyone can start reports
- Monitoring / alerts when jobs fail
- Idempotency, so the same request twice produces one report, not two

---

## Project structure

```
background-job/
├── server.js              # Express app: /health, /reports, /reports/:id, serves Inngest
├── store.js                # Shared in-memory reports object (imported by server + functions)
├── inngest/
│   ├── client.js            # Inngest client setup
│   └── functions.js         # say-hello, make-report, heartbeat
├── .env                     # Environment variables (optional — INNGEST_DEV=1)
└── README.md                # This file
```
