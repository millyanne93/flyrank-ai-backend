# Task 1: Simple Backend API

A minimal backend with two JSON endpoints built with Next.js + TypeScript.

## Overview

This assignment demonstrates the request-response loop by building a simple server with two endpoints that respond with JSON. The endpoints can be tested via `curl`, browser, or any HTTP client.

**Tech Stack:**
- Next.js 16 (App Router)
- TypeScript
- Node.js

## Endpoints

| Method | Endpoint | Response |
|--------|----------|----------|
| `GET` | `/api` | `{ "message": "Hello, world!" }` |
| `GET` | `/api/ping` | `{ "status": "ok", "message": "pong" }` |

## Quick Start

### Prerequisites
- Node.js >= 20.9.0
- npm

### Installation

```bash
git clone https://github.com/clear/flyrank-ai-backend.git
cd flyrank-ai-backend/task-1-simple-api
npm install
npm run dev
```

The server runs on `http://localhost:3000`

## Testing

### Using curl

```bash
# Test endpoint 1
curl http://localhost:3000/api

# Test endpoint 2
curl http://localhost:3000/api/ping
```

### Using Browser

Visit these URLs in your browser:
- `http://localhost:3000/api`
- `http://localhost:3000/api/ping`

### Expected Response

Both endpoints return JSON:

```json
{
  "message": "Hello, world!"
}

{
  "status": "ok",
  "message": "pong"
}
```  
- Testing endpoints with curl and browser
- Version control with Git/GitHub
