# Task API — CRUD Backend

RESTful API for managing a to-do list, built with Express + TypeScript, backed by PostgreSQL running in Docker.

---
## Quick Start

### Option 1: Run with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/clear/flyrank-ai-backend.git
cd flyrank-ai-backend/task-1-simple-api

# Start the stack (PostgreSQL + Node.js app)
docker compose up -d --build

# Test the API
curl http://localhost:3000/health
curl http://localhost:3000/tasks
Option 2: Run locally (without Docker)
bash
npm install
npm run dev
Note: This will use SQLite (tasks.db) instead of PostgreSQL.
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

### Docker Commands
Command What It Does
docker compose up -d    Start the stack in the background
docker compose up -d --build    Rebuild images and start
docker compose logs -f app  View app logs
docker compose logs -f db   View database logs
docker compose down Stop containers (keeps data)
docker compose down -v  Stop containers and delete data
docker compose restart  Restart all containers

### Example

```bash
## Health check
curl http://localhost:3000/health

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
## Database

PostgreSQL (with Docker)
Image: postgres:16

Database: tasks

User: taskuser

Password: taskpass (via .env)

Port: 5432

Data Volume: pgdata (persists across restarts)

Schema
sql
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
Why PostgreSQL + Docker?
Data persists across container restarts

Production-ready database

No manual installation required

Consistent development environment

Easy to switch to other databases later

Persistence Proof
bash
# Create a task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"This will survive restart"}'

# Restart containers
docker compose restart

# Task is still there 
curl http://localhost:3000/tasks


**Database viewer screenshot:**

<img width="1366" height="728" alt="2026-07-23" src="https://github.com/user-attachments/assets/1fdd6567-d0d0-4842-9745-5128a57a585e" />

---

## Tech Stack

- Node.js + Express — Backend framework
- TypeScript — Type safety
- PostgreSQL — Production database (via Docker)
- Docker + Docker Compose — Containerization
- Swagger UI — API documentation

## Dependencies

```bash
npm install express swagger-ui-express better-sqlite3
npm install -D typescript @types/express @types/swagger-ui-express @types/pg nodemon tsx
```
## Switching Between Databases
The API supports both PostgreSQL (Docker) and SQLite (local):

Database    How to Use
PostgreSQL  docker compose up -d
SQLite  npm run dev (uses database.ts)
The import in server.ts determines which database is used:

```typescript
// For PostgreSQL (Docker)
import { ... } from './postgresRepository';

// For SQLite (local)
import { ... } from './database';
```
