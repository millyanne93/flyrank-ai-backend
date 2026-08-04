 # Auth API — Secure Authentication with Supabase

A secure REST API that handles user authentication (Sign Up, Log In, Log Out) and protects routes using Supabase Auth and JWT tokens.

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/clear/flyrank-ai-backend.git
cd flyrank-ai-backend/BE-03-supabase-auth

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Start the server
npm run dev
The server runs at http://localhost:3000

**API Endpoints**
Method	Endpoint	Auth Required	Description
GET	/health	❌	Health check
POST	/auth/signup		Create a new user account
POST	/auth/login	❌	Login and receive JWT
POST	/auth/logout	✅	Logout and revoke token
GET	/public/info	❌	Public information
GET	/protected/profile	✅	Get user profile
GET	/protected/dashboard	✅	Get user dashboard
** Testing with curl**
Sign Up
bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'
Login
bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'
Access Protected Route
bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/protected/profile
Logout
bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
Public Route
bash
curl http://localhost:3000/public/info
## Swagger UI
Interactive API documentation is available at:

text
http://localhost:3000/docs

## Tech Stack
Node.js + Express — Backend framework

TypeScript — Type safety

Supabase — Authentication & user management

JWT — JSON Web Tokens for session management

Swagger UI — API documentation

## Authentication Flow
Sign Up — User creates account with email/password

Login — User receives a JWT access token

Protected Routes — Token must be sent in Authorization: Bearer <token> header

Logout — Token is blacklisted and invalidated

## Environment Variables
Create a .env file with:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
PORT=3000

