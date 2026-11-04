-- ============================================================
-- SKILL-TRACK: CORE SERVICE COMPLETE DATABASE SCHEMA (POSTGRESQL)
-- ============================================================
-- Key Architectural Features:
-- 1. Unified Authentication (`users`) with Shared Primary Keys (`id`)
--    across 1-to-1 tables (`trainees`, `trainee_address`,
--    `course_providers`, `trainee_resumes`).
-- 2. Course Provider Onboarding & Approval Queue (`is_approved` + `is_active`).
-- 3. Native PostgreSQL ENUM types for Education and Domain Categories.
-- 4. Skills, Categories & Course-Skill Tagging (`course_skills`).
-- 5. Course Enrolments with Mandatory Drop/Kick Reasons (`TEXT`).
-- 6. Certifications, Projects & AI/ATS Resume Tokens (`JSONB`).
-- 7. Roles & Target Roles Mapping.
-- 8. Employment Records, Salary History & Automated Follow-ups.
-- 9. B-Tree & Partial Indexes for High-Performance Queries.
-- ============================================================

-- Drop existing tables and types in reverse dependency order for clean re-runs
DROP TABLE IF EXISTS trainee_resumes CASCADE;
DROP TABLE IF EXISTS trainee_projects CASCADE;
DROP TABLE IF EXISTS trainee_target_roles CASCADE;
DROP TABLE IF EXISTS role_required_skills CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS follow_ups CASCADE;
DROP TABLE IF EXISTS salary_history CASCADE;
DROP TABLE IF EXISTS employment_records CASCADE;
DROP TABLE IF EXISTS employers CASCADE;
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS trainee_skills CASCADE;
DROP TABLE IF EXISTS course_enrolments CASCADE;
DROP TABLE IF EXISTS course_skills CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS course_providers CASCADE;
DROP TABLE IF EXISTS trainee_address CASCADE;
DROP TABLE IF EXISTS trainees CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS education_level CASCADE;
DROP TYPE IF EXISTS domain_category CASCADE;


-- ============================================================
-- 1. CUSTOM TYPES & USERS (UNIFIED AUTHENTICATION)
-- ============================================================

CREATE TYPE education_level AS ENUM (
    '10TH',
    '12TH',
    'GRADUATION',
    'POST_GRADUATION',
    'PHD'
);

-- Standardized categories for courses, skills, and roles
CREATE TYPE domain_category AS ENUM (
-- Core Software & Web
    'SOFTWARE_ENGINEERING',
    'WEB_DEVELOPMENT',
    'MOBILE_DEVELOPMENT',
    'GAME_DEVELOPMENT',
    'CLOUD_COMPUTING',
    'DEVOPS_SYSADMIN',
    'SYSTEMS_ENGINEERING',
    'CYBERSECURITY',
    'NETWORKING_TELECOM',
    'DATABASE_ADMINISTRATION',
    'IT_SUPPORT_HELP_DESK',
    'AI_MACHINE_LEARNING',
    'DATA_SCIENCE',
    'BUSINESS_ANALYTICS',
    'IOT',
    'ROBOTICS_AUTOMATION',
    'BLOCKCHAIN_WEB3',
    'AR_VR_SPATIAL_COMPUTING',
    'HARDWARE_ENGINEERING',
    'UI_UX_DESIGN',
    'QA_TESTING',
);

-- Unified login table for Admin, Course Provider, and Trainee.
CREATE TABLE users (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(30) NOT NULL
                  CHECK (role IN ('ADMIN', 'COURSE_PROVIDER', 'TRAINEE')),
    is_active     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. TRAINEES & ADDRESS (SHARED PRIMARY KEY WITH USERS)
-- ============================================================

CREATE TABLE trainees (
    -- Shared Primary Key: uses the exact same id generated in users(id)
    id                             BIGINT PRIMARY KEY
                                   REFERENCES users(id) ON DELETE CASCADE,
    name                           VARCHAR(150) NOT NULL,
    date_of_birth                  DATE,
    last_educational_qualification education_level,
    phone_primary                  VARCHAR(20) NOT NULL,
    phone_secondary                VARCHAR(20),

    -- Current employment snapshot for immediate dashboard & employment filtering
    current_employment_status      VARCHAR(30) NOT NULL DEFAULT 'NOT_EMPLOYED'
                                   CHECK (current_employment_status IN (
                                       'FULL_TIME', 'PART_TIME', 'INTERNSHIP',
                                       'SELF_EMPLOYED', 'NOT_EMPLOYED'
                                   )),
    non_placement_reason           TEXT,

    -- Consent flag: if FALSE, outcome-tracking data (employment/salary/follow-ups) is not kept
    data_tracking_consent          BOOLEAN NOT NULL DEFAULT FALSE,

    -- Soft-removal tracking when an Admin removes a trainee (with mandatory reason)
    is_removed                     BOOLEAN NOT NULL DEFAULT FALSE,
    removal_reason                 TEXT,
    removed_at                     TIMESTAMPTZ,

    created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Enforces that removal_reason cannot be NULL when is_removed is TRUE
    CONSTRAINT chk_trainee_removal_reason
        CHECK (NOT is_removed OR removal_reason IS NOT NULL)
);

CREATE TABLE trainee_address (
    -- Shared Primary Key: 1-to-1 with trainees(id) (which is also users(id))
    id           BIGINT PRIMARY KEY
                 REFERENCES trainees(id) ON DELETE CASCADE,
    address_line VARCHAR(250) NOT NULL,
    city         VARCHAR(100),
    district     VARCHAR(100) NOT NULL,
    state        VARCHAR(100) NOT NULL,
    pincode      VARCHAR(10) NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. COURSE PROVIDERS, SKILLS & COURSES
-- ============================================================

CREATE TABLE course_providers (
    -- Shared Primary Key: uses the exact same id generated in users(id)
    id            BIGINT PRIMARY KEY
                  REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(200) NOT NULL,
    provider_type VARCHAR(50) NOT NULL
                  CHECK (provider_type IN ('GOVERNMENT', 'PRIVATE')),
    phone         VARCHAR(20) NOT NULL,
    description   TEXT,
    website_url   VARCHAR(255),

    -- Verification queue flag: FALSE while pending Admin review, TRUE once approved
    is_approved   BOOLEAN NOT NULL DEFAULT FALSE,

    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE skills (
    id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name     VARCHAR(120) UNIQUE NOT NULL,
    category domain_category NOT NULL
);

CREATE TABLE courses (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider_id    BIGINT NOT NULL
                   REFERENCES course_providers(id) ON DELETE CASCADE,
    name           VARCHAR(200) NOT NULL,
    description    TEXT,
    category       domain_category NOT NULL,
    duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
    level          VARCHAR(30) NOT NULL
                   CHECK (level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    is_available   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction table: maps multiple skills taught by a course (skill tags)
CREATE TABLE course_skills (
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    skill_id  BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, skill_id)
);


-- ============================================================
-- 4. ENROLMENTS, SKILLS, CERTIFICATIONS, PROJECTS & RESUMES
-- ============================================================

CREATE TABLE course_enrolments (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trainee_id         BIGINT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
    course_id          BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at        DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_at       DATE,
    status             VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS'
                       CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'DROPPED', 'KICKED')),
    termination_reason TEXT,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Enforces that dropping out or kicking a trainee requires a reason
    CONSTRAINT chk_enrolment_termination_reason
        CHECK (status NOT IN ('DROPPED', 'KICKED') OR termination_reason IS NOT NULL),
    UNIQUE (trainee_id, course_id)
);

CREATE TABLE trainee_skills (
    trainee_id        BIGINT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
    skill_id          BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(30) NOT NULL DEFAULT 'BEGINNER'
                      CHECK (proficiency_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    source            VARCHAR(30) NOT NULL
                      CHECK (source IN ('COURSE_COMPLETION', 'ASSESSMENT', 'SELF_REPORTED', 'RESUME_ATS')),
    acquired_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (trainee_id, skill_id)
);

CREATE TABLE certifications (
    trainee_id       BIGINT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
    course_id        BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    certificate_name VARCHAR(200) NOT NULL,
    file_s3_key      VARCHAR(500) UNIQUE NOT NULL,
    issued_at        DATE NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (trainee_id, file_s3_key),
    UNIQUE (trainee_id, course_id)
);

CREATE TABLE trainee_projects (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trainee_id  BIGINT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    repo_url    VARCHAR(500) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trainee_resumes (
    -- Shared Primary Key: 1 active resume per trainee (matches trainees.id / users.id)
    id               BIGINT PRIMARY KEY
                     REFERENCES trainees(id) ON DELETE CASCADE,
    file_s3_key      VARCHAR(500) NOT NULL,
    extracted_tokens JSONB,
    uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 5. ROLES & TARGET ROLES
-- ============================================================

CREATE TABLE roles (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(150) UNIQUE NOT NULL,
    category    domain_category NOT NULL,
    description TEXT
);

-- Composite PK (role_id, skill_id) allows a role to require many skills
-- and a skill to belong to many roles without duplicate pairs.
CREATE TABLE role_required_skills (
    role_id              BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    skill_id             BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    required_proficiency VARCHAR(30) NOT NULL DEFAULT 'INTERMEDIATE'
                         CHECK (required_proficiency IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    PRIMARY KEY (role_id, skill_id)
);

CREATE TABLE trainee_target_roles (
    trainee_id   BIGINT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
    role_id      BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    target_level VARCHAR(50) NOT NULL DEFAULT 'ENTRY_LEVEL',
    PRIMARY KEY (trainee_id, role_id)
);


-- ============================================================
-- 6. EMPLOYMENT, SALARY HISTORY & FOLLOW-UPS
-- ============================================================

CREATE TABLE employers (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                VARCHAR(200) NOT NULL,
    industry            VARCHAR(100)
);

CREATE TABLE employment_records (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trainee_id          BIGINT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
    employer_id         BIGINT REFERENCES employers(id) ON DELETE SET NULL,
    employment_type     VARCHAR(30) NOT NULL
                        CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'SELF_EMPLOYED')),
    role_title          VARCHAR(150) NOT NULL,
    start_date          DATE NOT NULL,
    end_date            DATE,
    is_current          BOOLEAN NOT NULL DEFAULT TRUE,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'UNVERIFIED'
                        CHECK (verification_status IN ('UNVERIFIED', 'VERIFIED')),
    training_relevance  VARCHAR(30)
                        CHECK (training_relevance IN ('HIGH', 'MEDIUM', 'LOW', 'UNRELATED')),
    job_source          VARCHAR(50)
                        CHECK (job_source IN ('SELF_REPORTED', 'TRAINING_PROVIDER', 'EMPLOYER', 'JOB_PORTAL')),

    CONSTRAINT chk_employment_dates
        CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE salary_history (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employment_id BIGINT NOT NULL REFERENCES employment_records(id) ON DELETE CASCADE,
    salary_amount NUMERIC(12,2) NOT NULL CHECK (salary_amount >= 0),
    salary_period VARCHAR(20) NOT NULL DEFAULT 'MONTHLY'
                  CHECK (salary_period IN ('MONTHLY', 'YEARLY')),
    recorded_at   DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE follow_ups (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trainee_id        BIGINT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
    scheduled_at      DATE NOT NULL,
    completed_at      DATE,
    employment_status VARCHAR(30)
                      CHECK (employment_status IN (
                          'FULL_TIME', 'PART_TIME', 'INTERNSHIP',
                          'SELF_EMPLOYED', 'NOT_EMPLOYED'
                      )),
    response_status   VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                      CHECK (response_status IN ('PENDING', 'COMPLETED', 'NO_RESPONSE'))
);


-- ============================================================
-- 7. INDEXES FOR PERFORMANCE OPTIMISATION
-- ============================================================

-- User role filtering
CREATE INDEX idx_users_role ON users(role);

-- Partial index: fast lookup of unapproved Course Providers on Admin login
CREATE INDEX idx_course_providers_unapproved
    ON course_providers(id)
    WHERE NOT is_approved;

-- Trainee filtering & dashboard aggregations
CREATE INDEX idx_trainees_employment_status
    ON trainees(current_employment_status)
    WHERE NOT is_removed;
CREATE INDEX idx_trainees_tracking_consent ON trainees(data_tracking_consent);
CREATE INDEX idx_address_district ON trainee_address(district);

-- Course & skill lookups
CREATE INDEX idx_courses_provider ON courses(provider_id);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_course_skills_skill ON course_skills(skill_id);
CREATE INDEX idx_trainee_skills_skill ON trainee_skills(skill_id);

-- Enrolments, certifications & projects
CREATE INDEX idx_enrolments_trainee ON course_enrolments(trainee_id);
CREATE INDEX idx_enrolments_course ON course_enrolments(course_id);
CREATE INDEX idx_enrolments_status ON course_enrolments(status);
CREATE INDEX idx_certifications_course ON certifications(course_id);
CREATE INDEX idx_projects_trainee ON trainee_projects(trainee_id);

-- Employment & salary progression
CREATE INDEX idx_employment_trainee ON employment_records(trainee_id);
CREATE INDEX idx_employment_employer ON employment_records(employer_id);
CREATE INDEX idx_employment_role_title ON employment_records(role_title);
CREATE INDEX idx_salary_employment ON salary_history(employment_id);

-- Follow-ups
CREATE INDEX idx_followups_trainee ON follow_ups(trainee_id);
CREATE INDEX idx_followups_response ON follow_ups(response_status);

-- Role skill mapping
CREATE INDEX idx_role_req_skills_skill ON role_required_skills(skill_id);
CREATE INDEX idx_target_roles_role ON trainee_target_roles(role_id);