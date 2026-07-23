# Task API — CRUD Backend

RESTful API for managing a to-do list, built with Express + TypeScript, backed by a SQLite database.

---

## Quick Start

```bash
git clone https://github.com/clear/flyrank-ai-backend.git
cd flyrank-ai-backend/task-1-simple-api
npm install
npm run dev
```

Server runs at http://localhost:3000

On first run, a `tasks.db` SQLite file is created automatically in the project root, with the `tasks` table created and seeded with three example tasks.

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | API info |
| GET | /hello | Hello message |
| GET | /health | Health check |
| GET | /tasks | List all tasks |
| GET | /tasks?search=milk | Search tasks by title (SQL `LIKE`) |
| GET | /tasks?done=true | Filter tasks by completion status |
| GET | /tasks?sort=title | List tasks sorted alphabetically |
| GET | /tasks/:id | Get one task |
| POST | /tasks | Create a task |
| PUT | /tasks/:id | Update a task |
| DELETE | /tasks/:id | Delete a task |
| GET | /stats | Task statistics (via SQL `COUNT()`) |
| POST | /reset | Reset to default tasks |

### Example

```bash
## Create a task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'

## List all tasks
curl http://localhost:3000/tasks

## Search tasks
curl "http://localhost:3000/tasks?search=milk"

## Filter completed tasks
curl "http://localhost:3000/tasks?done=true"

## Sort tasks alphabetically
curl "http://localhost:3000/tasks?sort=title"

## Get task by ID
curl http://localhost:3000/tasks/1

## Update task (mark as done)
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"done":true}'

## Delete a task
curl -X DELETE http://localhost:3000/tasks/1

## Task statistics
curl http://localhost:3000/stats
```

### Sample Response

```json
{
  "id": 4,
  "title": "Buy milk",
  "done": 0,
  "created_at": "2026-07-23 14:37:02",
  "updated_at": "2026-07-23 14:37:02"
}
```

---

## Swagger UI

Interactive API docs available at:
http://localhost:3000/docs

<img width="1366" height="728" alt="2026-07-16" src="https://github.com/user-attachments/assets/92900158-bded-4786-be14-517de6f4f31b" />

---

## Database

Data is now persisted in **SQLite** instead of an in-memory array — tasks survive server restarts.

**Why SQLite:** it requires no separate database server or installation, stores everything in a single file, and is ideal for a small project like this where the goal is to learn the fundamentals of persistence and SQL without the overhead of setting up Postgres/MySQL.

**Where the database lives:** `tasks.db`, created automatically in the project root on first run. It is git-ignored (see `.gitignore`) since it's a generated file, not source code — anyone cloning this repo gets a fresh `tasks.db` created and seeded automatically the first time they run `npm run dev`.

**Schema:**

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Three example tasks are inserted automatically the first time the table is created, and only then — restarting the server does not duplicate them.

**Example SQL query run manually via the SQLite CLI:**

```sql
sqlite3 tasks.db "SELECT * FROM tasks WHERE done = 1;"
```

**Database viewer screenshot:**


---

## Optional Extras Implemented

- ✅ Search tasks by title (`GET /tasks?search=`) using SQL `LIKE`
- ✅ Filter by completion status (`GET /tasks?done=`) using SQL `WHERE`
- ✅ Alphabetical sorting (`GET /tasks?sort=title`)
- ✅ Statistics endpoint (`GET /stats`) using SQL `COUNT()` instead of counting in JavaScript
- ✅ Timestamps (`created_at`, `updated_at`) tracked for every task

---

## Tech Stack

- Node.js + Express — Backend framework
- TypeScript — Type safety
- better-sqlite3 — SQLite database driver
- Swagger UI — API documentation

## Dependencies

```bash
npm install express swagger-ui-express better-sqlite3
npm install -D typescript @types/express @types/swagger-ui-express @types/better-sqlite3 nodemon tsx
```
