# Skill-Track

Role-based trainee, course-provider, skill, and career management platform built with **React 18 + TypeScript + BlueprintJS v5** on the frontend and **Node.js + Express + Prisma (SQLite, Postgres-portable)** on the backend.

## Architecture Overview

- `client/` — Vite + React 18 + TypeScript SPA using `@blueprintjs/core`, `/icons`, `/select`, `/table`, `/datetime2`, `recharts`, and `bp5-dark` theme toggle.
- `server/` — Express + TypeScript REST API (`PORT=4000` by default) organized into:
  - `src/routes/` — HTTP handlers with Zod input validation
  - `src/middleware/` — httpOnly JWT authentication & RBAC guards (`admin`, `cp`, `trainee`, IT-only AI guard)
  - `src/services/core/` — Auth, Trainees, Course Providers, Courses, Skills, Enrollments, Employment, Admin analytics
  - `src/services/email/` — `nodemailer` transport + `node-cron` 3-month quarterly follow-up job
  - `src/services/ai/` — Isolated LLM adapter (`LLM_API_KEY` server-only), resume ATS token extractor (`pdf-parse`), weekly `/market-docs` updater, IT Career Skill Gap / Role Match / Future Careers, and CP Course Suggestions + Chatbot
- `prisma/` — Portable Prisma schema (`schema.prisma`), SQLite DB (`dev.db`), and seed script (`seed.ts`)
- `market-docs/` — Weekly refreshed Markdown briefs used as context by the AI services

## Environment Variables

Copy `.env.example` to `.env` at the repository root:

```bash
PORT=4000
NODE_ENV=development
DATABASE_URL="file:../prisma/dev.db"
JWT_SECRET="change-this-secret-in-production"
JWT_EXPIRES_IN="7d"
CLIENT_ORIGIN="http://localhost:5173"

# Optional SMTP credentials (omit for logged dev-json email transport)
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Skill-Track <noreply@skilltrack.local>"

# Optional server-side LLM key (omit for deterministic /market-docs analyzer)
AI_PROVIDER="openai" # or "gemini"
LLM_API_KEY=""
LLM_MODEL="gpt-4o-mini"
```

## Setup & Running Locally

1. **Install dependencies**

   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **Generate Prisma client, push schema, and seed sample data**

   ```bash
   cd server
   npm run prisma:generate
   npm run prisma:push
   npm run seed
   ```

3. **Run development servers** (in separate terminals)

   ```bash
   # Terminal 1 — API server (http://localhost:4000)
   cd server && npm run dev

   # Terminal 2 — React BlueprintJS UI (http://localhost:5173, proxies /api -> 4000)
   cd client && npm run dev
   ```

4. **Production build**

   ```bash
   cd server && npm run build
   cd ../client && npm run build
   ```

## Seeded Demo Accounts

Admin accounts cannot be self-registered via `/register`; they are seeded directly into the database.

| Role | Email | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@skilltrack.local` | `Admin@123!` | Full dashboard, CP approvals, trainee management |
| **Course Provider (Approved)** | `cp@apexacademy.edu` | `Provider@123!` | Owns courses, AI syllabus suggestions & chatbot |
| **Course Provider (Approved)** | `cp@cloudcraft.io` | `Provider@123!` | DevOps & Kubernetes courses |
| **Course Provider (Pending)** | `pending@futurestack.io` | `Provider@123!` | Login blocked (`403`) until Admin approves |
| **Trainee (IT)** | `aarav.sharma@example.com` | `Trainee@123!` | IT track; AI Skill Gap, Role Match, Future Careers |
| **Trainee (Non-IT)** | `meera.nair@example.com` | `Trainee@123!` | Non-IT track; AI career tools hidden & `403`-guarded |
