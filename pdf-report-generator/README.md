# PDF Report Generator

A small backend service that queries a SQLite database, aggregates the data into a sales
report, renders it as a real PDF using a headless browser, and serves the finished file by
link. Built for the FlyRank Internship — Backend Track, Week 4, Assignment A8.

## Dataset

**Option A — the little shop.** A `report.db` SQLite file with one `orders` table
(`id, customer, product, amount, created_at`), seeded with 200 randomly generated orders
across 6 products and the last 30 days.

## Stack

- Node.js 22+ (uses the built-in `node:sqlite` module — no external DB driver)
- Express
- Playwright (Chromium) for HTML → PDF rendering

## How to run it

```bash
# install dependencies
npm install
npx playwright install chromium

# seed the database (safe to run more than once — it clears first)
node seed.js

# start the server
node server.js
```

Server runs at `http://localhost:3000`.

Quick check:
```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

## Generating a report

```bash
curl -i -X POST http://localhost:3000/reports
```

This runs the full pipeline synchronously — query the database, render HTML, print to PDF,
save it to disk, and record it in the `reports` table — then returns a link to the file.

Sample output:
```
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"id":1,"file":"/reports/1/file"}

real    0m3.352s
```

Download it:
```bash
curl -o my-report.pdf http://localhost:3000/reports/1/file
```

## Aggregation SQL

Four queries feed the report, all in `report.js`:

```sql
-- Totals
SELECT
  COUNT(*) as total_orders,
  SUM(amount) as total_revenue
FROM orders;

-- Top 5 products by revenue
SELECT
  product,
  COUNT(*) as order_count,
  SUM(amount) as revenue
FROM orders
GROUP BY product
ORDER BY revenue DESC
LIMIT 5;

-- Orders per day, last 7 days
SELECT
  created_at as date,
  COUNT(*) as orders
FROM orders
WHERE created_at >= date('now', '-7 days')
GROUP BY created_at
ORDER BY created_at DESC;

-- All orders (feeds the long table in the PDF)
SELECT * FROM orders ORDER BY created_at DESC;
```

## API

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/reports` | Generates (or reuses today's) report. Returns `201` if newly created, `200` if an existing report from today was reused. Accepts `{ "force": true }` to bypass the daily reuse check. |
| `GET` | `/reports/:id` | Returns the report record. `404` if the id doesn't exist. |
| `GET` | `/reports/:id/file` | Streams the actual PDF from disk. |

## Design notes

**On background jobs (Stage 4):** Right now `POST /reports` runs the entire pipeline inline,
so the client waits the full ~3 seconds for a response. This is acceptable for a single user
clicking a button once, but it wouldn't scale — a slow request holds a connection open and
degrades badly under concurrent load. I'd move report generation into a background job (e.g.
an Inngest function) once either the render time grows significantly (large datasets, more
complex templates) or multiple users can trigger generation concurrently — at that point
`POST /reports` should return `202 Accepted` immediately with a `pending` status, and the
client polls or gets notified when the PDF is ready.

**On idempotency (Stage 5):** The `POST /reports` check protects against duplicate work from
double-clicks, retried requests, or flaky networks that cause a client to resend the same
POST — without it, the same "generate report" action could silently produce two (or more)
files representing the same underlying data. A real-world example: an e-commerce checkout
button that isn't idempotent can charge a customer's card twice if they double-click "Pay Now"
or their connection hiccups and their client silently retries.

## Duplicate-request proof

```bash
$ curl -s -X POST http://localhost:3000/reports
{"id":1,"file":"/reports/1/file"}   # 201, newly generated

$ curl -s -X POST http://localhost:3000/reports
{"id":1,"file":"/reports/1/file"}   # 200, same id, no new file, no wait

$ curl -s -X POST http://localhost:3000/reports -H "Content-Type: application/json" -d '{"force": true}'
{"id":2,"file":"/reports/2/file"}   # 201, forced — new id, new file
```

## Screenshot



## Project structure

```
pdf-report-generator/
├── server.js       # Express app + all routes
├── database.js     # SQLite connection + schema
├── seed.js         # Generates 200 random orders
├── report.js        # getReportData() — the 4 aggregation queries
├── render.js        # Builds the HTML report from data
├── pdf.js           # Renders HTML to PDF via Playwright
├── reports/          # Generated PDFs (gitignored)
└── report.db          # SQLite database (gitignored)
```
