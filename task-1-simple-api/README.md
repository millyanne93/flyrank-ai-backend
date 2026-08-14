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
# Task API with LLM Classification

A production-ready task management API with an AI-powered classification endpoint that automatically categorizes and prioritizes tasks.

---

## 📋 Overview

This API extends a CRUD task management system with an LLM-powered endpoint that classifies tasks by category and priority. Built with Express, TypeScript, and OpenRouter (free LLM provider), it demonstrates production-grade LLM integration with:

- ✅ Input validation and output schema enforcement
- ✅ Repair retry logic (one retry on validation failure)
- ✅ Quarantine logging for unrecoverable failures
- ✅ Explicit timeout (30 seconds)
- ✅ Retry logic with exponential backoff and jitter
- ✅ Cost logging (tokens, duration, repair count)
- ✅ Kill switch (`LLM_ENABLED=false`)
- ✅ Stub mode for development (`LLM_STUB=1`)
- ✅ Evaluation suite with 9 test cases (100% score)

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/millyanne93/flyrank-ai-backend.git
cd flyrank-ai-backend/task-1-simple-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Start the server
npm run dev
📊 API Endpoints
Method	Endpoint	Description	Auth
GET	/tasks	List all tasks	❌
POST	/tasks	Create a task	❌
GET	/tasks/:id	Get a task	❌
PUT	/tasks/:id	Update a task	❌
DELETE	/tasks/:id	Delete a task	❌
POST	/tasks/:id/classify	Classify a task	❌
GET	/stats	Get task statistics	❌
POST	/reset	Reset tasks	❌
GET	/docs	Swagger UI	❌
🤖 Classification Endpoint
POST /tasks/:id/classify

Classifies an existing task by category and priority.

Response
json
{
  "category": "work",
  "priority": "high",
  "confidence": 0.95,
  "reason": "Financial report with a deadline suggests a work task."
}
Categories
Category	Description
work	Job-related tasks
personal	Personal errands or activities
learning	Educational or skill-building
health	Exercise, wellness, medical
errand	Shopping, repairs, chores
other	Ambiguous or uncategorized
Priorities
Priority	Description
high	Urgent, deadline-driven, blocking
medium	Important but not urgent
low	Can wait, nice-to-have
🔧 Environment Variables
bash
# Database
DATABASE_URL=postgresql://taskuser:taskpass@localhost:5432/tasks

# LLM Configuration (OpenRouter)
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=your-api-key-here
LLM_MODEL=openrouter/free

# Feature Flags
LLM_STUB=1          # 1 = stub mode (no LLM call), 0 = real LLM call
LLM_ENABLED=true    # Kill switch — set to false to disable LLM
🧪 Testing
Create a Task
bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Complete Q4 financial report"}'
Classify a Task
bash
curl -X POST http://localhost:3000/tasks/1/classify
Response:

json
{
  "category": "work",
  "priority": "high",
  "confidence": 0.95,
  "reason": "Financial report with a deadline suggests a work task."
}
Run the Evaluation Suite
bash
npm run eval
Output:

text
Category score: 9/9
Priority score: 9/9
📊 Evaluation Results
Date	Prompt Version	Category Score	Priority Score
2026-08-14	v1	9/9 (100%)	9/9 (100%)
Test Cases
Title	Expected Category	Expected Priority
Complete Q4 financial report by Friday	work	high
Call mom for her birthday	personal	high
Read chapter 5 of TypeScript handbook	learning	medium
Buy groceries for the week	errand	medium
Go for a 30-minute run	health	medium
Fix the kitchen sink	errand	medium
Team standup meeting at 10am	work	medium
Watch the new episode of The Bear	personal	low
asdf	other	low
💰 Cost Logging Example
Every LLM call is logged with token usage and duration:

json
{
  "taskId": 6,
  "promptVersion": "v1",
  "model": "openrouter/free",
  "inputTokens": 284,
  "outputTokens": 255,
  "durationMs": 24572,
  "repaired": false,
  "timestamp": "2026-08-14T12:36:52.550Z"
}
Cost Breakdown
Metric	Value
Input tokens	284
Output tokens	255
Total tokens	539
Duration	24.6 seconds
Repair needed	No
🏗️ Architecture
text
User Request
    ↓
POST /tasks/:id/classify
    ↓
Input Validation (Zod)
    ↓
┌───────────────┴───────────────┐
│                               │
↓ Kill Switch                  ↓ Stub Mode
(LLM_ENABLED=false)            (LLM_STUB=1)
│                               │
↓                               ↓
503 Error                      Mock Response
    │
    └───────────────┬───────────────┘
                    │
                    ↓
            LLM Call (OpenRouter)
            with timeout + retries
                    │
                    ↓
            Parse JSON
                    │
                    ↓
    ┌───────────────┴───────────────┐
    │                               │
↓ Valid                          ↓ Invalid
Return JSON                       Repair Retry (1x)
    │                               │
    │                               ↓
    │                        ┌──────┴──────┐
    │                        │             │
    │                       ↓ Valid        ↓ Invalid
    │                       Return          Quarantine
    │                                        (422)
    └─────────────────────────────────────────┘
🛠️ Production Features
Feature	Implementation
Timeout	30 seconds (explicit, not SDK default)
Retry Logic	Exponential backoff with jitter: 1s, 2s, 4s
Retryable Errors	429, 5xx, timeouts
Non-Retryable Errors	400, 401, 403
Cost Logging	Input/output tokens, duration, repair count
Kill Switch	LLM_ENABLED=false — no code deploy needed
Stub Mode	LLM_STUB=1 — develop without spending quota
📁 Project Structure
text
task-1-simple-api/
├── src/
│   └── llm/
│       ├── classify.ts       # Core classification logic
│       ├── client.ts         # LLM client (timeout, retries)
│       └── schema.ts         # Zod input/output schemas
├── prompts/
│   └── classify-task-v1.md   # Versioned prompt file
├── evals/
│   ├── cases.json            # 9 test cases
│   └── run.ts                # Evaluation script
├── logs/
│   └── quarantine.jsonl      # Failed outputs (quarantine)
├── server.ts                 # Main Express app
├── postgresRepository.ts     # Database operations
├── JOB-CARD.md               # Job definition
├── .env.example              # Environment variables template
└── README.md                 # This file
🔐 Security & Ethics
API keys are stored in .env (never committed)

Input validation rejects garbage before any LLM call

Output validation ensures only schema-compliant data is returned

Quarantine logging isolates failed outputs for review

Kill switch allows immediate disable without code deploy

Never return raw model text — only validated JSON

🧠 What I Learned
Stage 0: Job Card & Provider Setup
Define the job before writing code

Environment variables keep secrets out of the repository

Stage 1: Endpoint Without AI
The contract (schema) exists before the model does

Stub mode enables development without spending quota

Stage 2: Prompt as a Specification
The prompt is code — version it, review it, diff it

A good prompt includes: role, output shape, rules, examples, and "when unsure" behavior

Stage 3: Make Output Trustworthy
The model is an external API — treat its output like untrusted input

Parse → Validate → Repair once → Quarantine

Stage 4: Production-Ready
Timeouts prevent hanging requests

Retry with backoff handles temporary failures gracefully

Cost logging enables measurement and optimization

A kill switch lets you disable the feature without deploying

Stage 5: Prove It Works
An eval set is evidence, not intuition

A perfect score is nice — honest reporting is the real value
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
