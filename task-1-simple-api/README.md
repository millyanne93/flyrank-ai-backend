# Task API — CRUD Backend

> RESTful API for managing a to-do list, built with Express + TypeScript.  
> Week 2 Assignment 1 — FlyRank AI Backend Engineering Internship.

---

## Quick Start

```bash
git clone https://github.com/clear/flyrank-ai-backend.git
cd flyrank-ai-backend/task-1-simple-api
npm install
npm run dev
Server runs at http://localhost:3000

# Endpoints
Method	Endpoint	Description
GET	/	API info
GET	/hello	Hello message
GET	/health	Health check
GET	/tasks	List all tasks
GET	/tasks/:id	Get one task
POST	/tasks	Create a task
PUT	/tasks/:id	Update a task
DELETE	/tasks/:id	Delete a task
GET	/stats	Task statistics
POST	/reset	Reset to default tasks
# Example
bash
# Create a task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'

# List all tasks
curl http://localhost:3000/tasks

# Get task by ID
curl http://localhost:3000/tasks/1

# Update task (mark as done)
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"done":true}'

# Delete a task
curl -X DELETE http://localhost:3000/tasks/1
Sample Response
json
{"id":4,"title":"Buy milk","done":false}
## Swagger UI
Interactive API docs available at:
http://localhost:3000/docs

https://./swagger-screenshot.png

# In-Memory Storage
Data is stored in memory only. Restarting the server clears all tasks — intentional for this week's assignment.

"Create a few tasks, restart your server, GET /tasks, and watch them disappear."
# Tech Stack
Node.js + Express — Backend framework

TypeScript — Type safety

Swagger UI — API documentation

# Dependencies
bash
npm install express swagger-ui-express
npm install -D typescript @types/express @types/swagger-ui-express nodemon tsx
