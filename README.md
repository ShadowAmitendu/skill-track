# Skill-Track

A role-based trainee outcome tracking and career progression platform. The system tracks trainee outcomes beyond course completion, provides skill gap analysis, enables course providers to align syllabi with market demand, and automates quarterly employment follow-ups.

---

## Architecture Overview

The repository is structured into the following components:

- **[`frontend/`](./frontend)** — React single-page application built with Vite, Tailwind CSS, Radix UI primitives, Lucide icons, and Mock Service Worker (MSW) for offline testing and rapid UI development.
- **[`backend/`](./backend)** — Spring Boot 3 / Java 21 REST API (`backend-st`) providing:
  - **Core Service**: Trainee records, course provider onboarding, courses, skills, enrollments, and employment history with PostgreSQL persistence via Spring Data JPA.
  - **AI Service**: Resume ATS token parsing, skill gap analysis against target industry roles, career progression recommendations, and course provider syllabus improvement.
  - **Email Service**: Automated quarterly (every 3 months) trainee follow-up scheduler and email notification triggers.
- **[`database/`](./database)** — PostgreSQL database DDL schemas, comprehensive relational seed data, and data-privacy cleanup scripts:
  - `tables.sql`: Full database schema including roles, skills, courses, enrollments, employment, and indexes.
  - `seed.sql`: Rich development and demo datasets.
  - `cleanup-nonconsent-orphans.sql`: GDPR/privacy enforcement script removing tracking data for non-consenting trainees.
- **[`docs/`](./docs)** — Architecture design specifications, role access control matrices, and UI page wireframe requirements.

---

## Getting Started

### 1. Database Setup (PostgreSQL)
Ensure PostgreSQL is running, create the database, and run the SQL scripts:
```bash
psql -U postgres -d skill_track -f database/tables.sql
psql -U postgres -d skill_track -f database/seed.sql
```

### 2. Backend (Spring Boot)
Requires Java 21 and Maven:
```bash
cd backend
./mvnw clean spring-boot:run
```
The API server starts on `http://localhost:8080`.

### 3. Frontend (React)
Requires Node.js 18+:
```bash
cd frontend
npm install
npm run dev
```
The client starts on `http://localhost:5173` with proxy configuration forwarding `/api/v1` calls to the Spring Boot backend on port 8080.
