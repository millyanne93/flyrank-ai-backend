# BE-03 — Supabase Auth API

A secure Express + TypeScript API that handles user sign up, log in, and log out using **Supabase Auth**, and protects specific routes with bearer-token verification middleware.

Previous assignments in this track (`task-1-simple-api`) had wide-open endpoints — anyone could read, create, or delete data. This project introduces real authentication: users sign up and log in through Supabase (acting as the Identity Provider), receive a JWT access token, and must present that token to access protected routes.

---

## Tech Stack

- **Node.js + Express** — backend framework
- **TypeScript** — type safety
- **@supabase/supabase-js** — Supabase Auth SDK (sign up, log in, token verification, sign out)
- **dotenv** — environment variable loading
- **swagger-ui-express** — interactive API docs with Bearer Auth support
- **tsx + nodemon** — dev server with auto-reload

---

## Project Structure

```
BE-03-supabase-auth/
├── server.ts        # Express app, routes
├── middleware.ts     # verifyToken middleware (extracts + verifies bearer token)
├── openapi.json       # Swagger/OpenAPI spec, incl. bearer securityScheme
├── .env               # local secrets (gitignored)
├── .env.example        # template for required env vars
├── package.json
└── tsconfig.json
```

---

## Setup

### 1. Create a Supabase project

- Go to [supabase.com](https://supabase.com) and create a free project.
- In **Project Settings → API**, copy your **Project URL** and **anon public key**.
- In **Authentication → Providers → Email**, you may want to **disable "Confirm email"** for local testing, otherwise newly signed-up users can't log in until they click a confirmation email.

### 2. Clone and configure

```bash
git clone https://github.com/<your-username>/flyrank-ai-backend.git
cd flyrank-ai-backend/BE-03-supabase-auth
cp .env.example .env
```

Fill in `.env` with your own Supabase project values:

```
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
PORT=3000
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the server

```bash
npm run dev
```

You should see:

```
Server running at http://localhost:3000
Connected to Supabase
```

---

## API Reference

| Method | Endpoint | Auth Required | Description |
|--------|-----------|:---:|-------------|
| GET | `/health` | ❌ | Health check |
| GET | `/public/info` | ❌ | Public, unprotected data |
| POST | `/auth/signup` | ❌ | Create a new user account |
| POST | `/auth/login` | ❌ | Authenticate and receive JWT access/refresh tokens |
| POST | `/auth/logout` | ✅ Bearer | Sign out the current session |
| GET | `/protected/profile` | ✅ Bearer | Read the authenticated user's profile data |
| GET | `/protected/dashboard` | ✅ Bearer | Example second protected route (demonstrates reusable middleware) |

Protected routes require the header:

```
Authorization: Bearer <access_token>
```

### Status codes used

| Code | Meaning | Where |
|------|---------|-------|
| 200 | OK | successful login, public info, protected reads |
| 201 | Created | successful signup |
| 204 | No Content | successful logout |
| 400 | Bad Request | missing email/password on signup or login |
| 401 | Unauthorized | wrong login credentials, missing/malformed/invalid/expired token |
| 500 | Internal Server Error | unexpected failure (e.g. logout error) |

---

## Example Requests

**Sign up**
```bash
curl -i -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'
```

**Log in**
```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'
```
Response includes `access_token` and `refresh_token` — copy the `access_token` for the requests below.

**Public route (no auth)**
```bash
curl -i http://localhost:3000/public/info
```

**Protected route**
```bash
curl -i http://localhost:3000/protected/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Second protected route**
```bash
curl -i http://localhost:3000/protected/dashboard \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Log out**
```bash
curl -i -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Missing/invalid token**
```bash
curl -i http://localhost:3000/protected/profile
# 401 { "error": "Access token required" }

curl -i http://localhost:3000/protected/profile -H "Authorization: Bearer invalid.token.here"
# 401 { "error": "Invalid or expired token" }
```

---

## Middleware

Token verification is extracted into a single reusable middleware (`middleware.ts`), applied to every protected route rather than duplicated per-endpoint:

```ts
export async function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  // 1. Extract token from Authorization header
  // 2. Reject with 401 if missing/malformed/empty
  // 3. Verify with supabase.auth.getUser(token)
  // 4. Reject with 401 if invalid/expired
  // 5. Attach verified user to req.user, call next()
}
```

Route handlers only run after the middleware confirms the token is valid, and can read the verified user off `req.user`.

---

## Swagger UI

Interactive API docs, including a bearer-token "Authorize" flow, are available at:

```
http://localhost:3000/docs
```

Click **Authorize**, paste an access token obtained from `/auth/login`, and use **Try it out** on any `/protected/*` route directly from the browser.

**Screenshot:**

<!-- Add your Swagger UI screenshot here, e.g.: -->
<!-- ![Swagger UI](./docs/swagger-screenshot.png) -->

---

## Design Notes

### JWT logout limitations

`POST /auth/logout` calls Supabase's `signOut()` and returns `204` on success. However, since access tokens are **stateless, self-contained JWTs**, calling logout does not retroactively invalidate the specific token that was passed in — that token remains technically valid (and will pass `verifyToken`) until it naturally expires (~1 hour from issuance, per the `exp` claim).

This is an inherent property of JWT-based auth without a server-side token blocklist or session store — not a bug specific to this implementation. `signOut()` primarily clears the **refresh token**, preventing the client from silently minting new access tokens after logout; it does not revoke an already-issued access token. A production system wanting immediate revocation would need a server-side denylist of revoked token IDs, checked on every request in addition to signature verification.

### Stateless server, single Supabase client

The server holds a single Supabase client instance (initialized once at startup from `.env`), rather than a per-session client. This matches the stateless nature of a JWT-secured REST API: each request carries its own proof of identity (the bearer token) rather than relying on server-side session state.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL (Project Settings → API) |
| `SUPABASE_KEY` | Your Supabase project's anon/public API key |
| `PORT` | Port the Express server listens on (default `3000`) |

`.env` is gitignored. Use `.env.example` as a template — copy it to `.env` and fill in your own Supabase project values.

---

## Requirements Checklist

- [x] Server starts with a single documented command (`npm run dev`)
- [x] `.env` used for secrets, `.gitignore` prevents it from being committed
- [x] `POST /auth/signup` and `POST /auth/login` integrate with Supabase Auth
- [x] `GET /protected/profile` extracts and verifies the bearer token
- [x] Correct status codes: `201` signup, `200` login/read, `204` logout, `400` missing input, `401` invalid/missing/expired token
- [x] Token verification extracted into reusable middleware
- [x] Swagger UI at `/docs` with working Bearer Authorization
- [x] Public GitHub repo, ≥6 commits, README

---

## Author

Millyanne — Backend AI Engineering track, FlyRank internship
