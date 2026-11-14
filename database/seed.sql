-- ============================================================
-- SKILL-TRACK: CORE SERVICE DATABASE SEED SCRIPT (POSTGRESQL)
-- ============================================================
-- Purpose: Populates all 19 tables with realistic test data
-- covering every ENUM, CHECK constraint, shared primary key,
-- soft-deleted/discontinued course badge, internal & external
-- certificates, JSONB ATS tokens, and consent-based tracking.
--
-- Default Password for all seeded accounts: Password@123
-- (BCrypt hash cost 10: $2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a)
-- ============================================================

BEGIN;

-- Clear existing data and reset identity sequences for idempotent re-runs
TRUNCATE TABLE
    trainee_resumes,
    trainee_projects,
    trainee_target_roles,
    role_required_skills,
    roles,
    follow_ups,
    salary_history,
    employment_records,
    employers,
    certifications,
    trainee_skills,
    course_enrolments,
    course_skills,
    courses,
    skills,
    course_providers,
    trainee_address,
    trainees,
    users
RESTART IDENTITY CASCADE;


-- ============================================================
-- 1. USERS (ADMIN, COURSE PROVIDERS, TRAINEES)
-- ============================================================
-- IDs:
-- 1      : System Admin
-- 2..4   : Course Providers (2 & 3 Approved, 4 Unapproved/Pending)
-- 5..10  : Trainees (5..9 Active, 10 Soft-Removed by Admin)

INSERT INTO users (id, email, password_hash, role, is_active)
OVERRIDING SYSTEM VALUE
VALUES
    -- Admin (managed dynamically via database table)
    (1,  'admin@skilltrack.gov.in',           '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'ADMIN',           TRUE),

    -- Course Providers
    (2,  'contact@wbscvt.gov.in',             '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'COURSE_PROVIDER', TRUE),
    (3,  'training@cloudforge.io',            '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'COURSE_PROVIDER', TRUE),
    (4,  'admissions@nexgenacademy.in',       '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'COURSE_PROVIDER', FALSE),

    -- Trainees
    (5,  'arjun.sen@example.com',             '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'TRAINEE',         TRUE),
    (6,  'priya.chatterjee@example.com',      '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'TRAINEE',         TRUE),
    (7,  'rohan.das@example.com',             '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'TRAINEE',         TRUE),
    (8,  'sneha.roy@example.com',             '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'TRAINEE',         TRUE),
    (9,  'vikram.bose@example.com',           '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'TRAINEE',         TRUE),
    (10, 'kunal.ghosh@example.com',           '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a', 'TRAINEE',         FALSE);


-- ============================================================
-- 2. TRAINEES & TRAINEE_ADDRESS (SHARED PRIMARY KEY WITH USERS)
-- ============================================================

INSERT INTO trainees (
    id, name, date_of_birth, last_educational_qualification,
    phone_primary, phone_secondary, current_employment_status,
    non_placement_reason, data_tracking_consent,
    is_removed, removal_reason, removed_at
)
VALUES
    (5,  'Arjun Sen',        '2003-04-15', 'GRADUATION',      '+919830011001', '+919830011002', 'FULL_TIME',     NULL,                                                   TRUE,  FALSE, NULL,                                                        NULL),
    (6,  'Priya Chatterjee', '2002-11-22', 'POST_GRADUATION', '+919830022001', NULL,            'INTERNSHIP',    NULL,                                                   TRUE,  FALSE, NULL,                                                        NULL),
    (7,  'Rohan Das',        '2004-01-09', 'GRADUATION',      '+919830033001', NULL,            'NOT_EMPLOYED',  'Preparing for higher studies and competitive exams.', TRUE,  FALSE, NULL,                                                        NULL),
    (8,  'Sneha Roy',        '2003-07-30', '12TH',            '+919830044001', '+919830044002', 'SELF_EMPLOYED', NULL,                                                   FALSE, FALSE, NULL,                                                        NULL),
    (9,  'Vikram Bose',      '2001-09-18', 'GRADUATION',      '+919830055001', NULL,            'PART_TIME',     NULL,                                                   TRUE,  FALSE, NULL,                                                        NULL),
    (10, 'Kunal Ghosh',      '2003-12-05', '12TH',            '+919830066001', NULL,            'NOT_EMPLOYED',  'Account terminated prior to placement.',               FALSE, TRUE,  'Duplicate account created with falsified documents.', NOW() - INTERVAL '15 days');

INSERT INTO trainee_address (id, address_line, city, district, state, pincode)
VALUES
    (5,  '42B Gariahat Road, Ballygunge',      'Kolkata',     'Kolkata',           'West Bengal', '700019'),
    (6,  '18 GT Road, Uttarpara',              'Uttarpara',   'Hooghly',           'West Bengal', '712258'),
    (7,  'Sector V, Salt Lake',                'Bidhannagar', 'North 24 Parganas', 'West Bengal', '700091'),
    (8,  'Station Road, Burdwan Town',         'Bardhaman',   'Purba Bardhaman',   'West Bengal', '713101'),
    (9,  'City Centre, Durgapur',              'Durgapur',    'Paschim Bardhaman', 'West Bengal', '713216'),
    (10, '74 Sevoke Road',                     'Siliguri',    'Darjeeling',        'West Bengal', '734001');


-- ============================================================
-- 3. COURSE PROVIDERS, SKILLS & COURSES
-- ============================================================

INSERT INTO course_providers (
    id, name, provider_type, phone, description, website_url, is_approved
)
VALUES
    (2, 'West Bengal State Council of Technical & Vocational Education', 'GOVERNMENT', '+913322103456',
        'State nodal agency providing subsidised technical and vocational upskilling programmes.',
        'https://sctvesd.wb.gov.in', TRUE),
    (3, 'CloudForge Systems Academy', 'PRIVATE', '+918041122334',
        'Industry-partnered bootcamps specialising in Cloud Engineering, DevOps, and Backend Microservices.',
        'https://cloudforge.io', TRUE),
    (4, 'NexGen AI & Robotics Institute', 'PRIVATE', '+913340019988',
        'Private training institute awaiting administrative onboarding verification.',
        'https://nexgenacademy.in', FALSE);

INSERT INTO skills (id, name, category)
OVERRIDING SYSTEM VALUE
VALUES
    (1,  'Java',                   'SOFTWARE_ENGINEERING'),
    (2,  'Spring Boot',            'SOFTWARE_ENGINEERING'),
    (3,  'PostgreSQL',             'DATABASE_ADMINISTRATION'),
    (4,  'React',                  'WEB_DEVELOPMENT'),
    (5,  'TypeScript',             'WEB_DEVELOPMENT'),
    (6,  'Docker',                 'DEVOPS_SYSADMIN'),
    (7,  'Kubernetes',             'DEVOPS_SYSADMIN'),
    (8,  'AWS',                    'CLOUD_COMPUTING'),
    (9,  'Linux System Admin',     'SYSTEMS_ENGINEERING'),
    (10, 'Python',                 'DATA_SCIENCE'),
    (11, 'Machine Learning',       'AI_MACHINE_LEARNING'),
    (12, 'Network Security',       'CYBERSECURITY');

-- Note: Course 4 has is_available = FALSE (soft-deleted/discontinued)
-- to test the "Discontinued" badge on existing certificates and enrolments.
INSERT INTO courses (
    id, provider_id, name, description, category, duration_weeks, level, is_available
)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 3, 'Enterprise Backend Engineering with Spring Boot',
        'Covers Java 21, Spring Boot 3 microservices, GraalVM Native Image, and PostgreSQL performance tuning.',
        'SOFTWARE_ENGINEERING', 12, 'INTERMEDIATE', TRUE),
    (2, 3, 'Cloud Native DevOps & AWS Infrastructure',
        'Hands-on infrastructure automation using Linux, Docker, Kubernetes, and AWS serverless deployment.',
        'CLOUD_COMPUTING', 10, 'ADVANCED', TRUE),
    (3, 2, 'Full-Stack Web Development Foundation',
        'Modern frontend and relational database fundamentals using React, TypeScript, and PostgreSQL.',
        'WEB_DEVELOPMENT', 8, 'BEGINNER', TRUE),
    (4, 2, 'Applied Data Science & Machine Learning (2025 Cohort)',
        'Legacy cohort covering statistical modelling, Python data pipelines, and supervised learning.',
        'DATA_SCIENCE', 14, 'INTERMEDIATE', FALSE);

INSERT INTO course_skills (course_id, skill_id)
VALUES
    -- Course 1: Java, Spring Boot, PostgreSQL
    (1, 1), (1, 2), (1, 3),
    -- Course 2: Docker, Kubernetes, AWS, Linux System Admin
    (2, 6), (2, 7), (2, 8), (2, 9),
    -- Course 3: React, TypeScript, PostgreSQL
    (3, 4), (3, 5), (3, 3),
    -- Course 4: Python, Machine Learning
    (4, 10), (4, 11);


-- ============================================================
-- 4. ENROLMENTS, SKILLS, CERTIFICATIONS, PROJECTS & RESUMES
-- ============================================================

INSERT INTO course_enrolments (
    id, trainee_id, course_id, enrolled_at, completed_at, status, termination_reason
)
OVERRIDING SYSTEM VALUE
VALUES
    -- Trainee 5 (Arjun): Completed Course 1 & Discontinued Course 4
    (1, 5, 1, '2026-01-10', '2026-04-05', 'COMPLETED',   NULL),
    (2, 5, 4, '2025-08-01', '2025-11-10', 'COMPLETED',   NULL),
    -- Trainee 5 (Arjun): Currently enrolled in Course 2
    (3, 5, 2, '2026-09-01', NULL,         'IN_PROGRESS', NULL),

    -- Trainee 6 (Priya): Completed Course 3, Dropped Course 2 (with mandatory reason)
    (4, 6, 3, '2026-02-01', '2026-04-01', 'COMPLETED',   NULL),
    (5, 6, 2, '2026-05-01', NULL,         'DROPPED',     'Schedule conflict with university final semester examinations.'),

    -- Trainee 7 (Rohan): Completed Course 1
    (6, 7, 1, '2026-01-10', '2026-04-05', 'COMPLETED',   NULL),

    -- Trainee 8 (Sneha): In progress in Course 3
    (7, 8, 3, '2026-10-01', NULL,         'IN_PROGRESS', NULL),

    -- Trainee 9 (Vikram): Kicked from Course 1 (with mandatory reason)
    (8, 9, 1, '2026-01-10', NULL,         'KICKED',      'Attendance fell below the mandatory 60% threshold for three consecutive weeks.');

INSERT INTO trainee_skills (trainee_id, skill_id, proficiency_level, source)
VALUES
    -- Arjun (Course completions + ATS extracted + Self-reported)
    (5, 1,  'ADVANCED',     'COURSE_COMPLETION'),
    (5, 2,  'ADVANCED',     'COURSE_COMPLETION'),
    (5, 3,  'INTERMEDIATE', 'COURSE_COMPLETION'),
    (5, 10, 'INTERMEDIATE', 'COURSE_COMPLETION'),
    (5, 11, 'INTERMEDIATE', 'COURSE_COMPLETION'),
    (5, 6,  'INTERMEDIATE', 'RESUME_ATS'),
    (5, 8,  'BEGINNER',     'RESUME_ATS'),
    (5, 9,  'ADVANCED',     'SELF_REPORTED'),

    -- Priya
    (6, 4,  'INTERMEDIATE', 'COURSE_COMPLETION'),
    (6, 5,  'INTERMEDIATE', 'COURSE_COMPLETION'),
    (6, 3,  'BEGINNER',     'COURSE_COMPLETION'),

    -- Rohan
    (7, 1,  'INTERMEDIATE', 'COURSE_COMPLETION'),
    (7, 2,  'INTERMEDIATE', 'COURSE_COMPLETION'),
    (7, 3,  'INTERMEDIATE', 'COURSE_COMPLETION'),
    (7, 12, 'BEGINNER',     'SELF_REPORTED'),

    -- Sneha
    (8, 4,  'BEGINNER',     'SELF_REPORTED');

-- Includes both Internal Certificates (course_id populated, including discontinued Course 4)
-- and External Platform Certificates (course_id IS NULL).
INSERT INTO certifications (
    id, trainee_id, course_id, certificate_name, file_s3_key, issued_at
)
OVERRIDING SYSTEM VALUE
VALUES
    -- Internal: Active Course 1
    (1, 5, 1,    'Enterprise Backend Engineering with Spring Boot',
        'certs/5/internal-course-1-f8a9d2.pdf', '2026-04-06'),

    -- Internal: Discontinued Course 4 (Course 4 has is_available = FALSE -> triggers "Discontinued" badge in UI)
    (2, 5, 4,    'Applied Data Science & Machine Learning (2025 Cohort)',
        'certs/5/internal-course-4-b3c1e7.pdf', '2025-11-12'),

    -- External: Trainee 5 uploaded multiple external certificates (course_id IS NULL)
    (3, 5, NULL, 'AWS Certified Cloud Practitioner (CLF-C02)',
        'certs/5/external-aws-ccp-991a4f.pdf', '2026-06-18'),
    (4, 5, NULL, 'Linux Foundation Certified System Administrator (LFCS)',
        'certs/5/external-lfcs-772b1c.pdf', '2026-08-24'),

    -- Internal: Trainee 6 Completed Course 3
    (5, 6, 3,    'Full-Stack Web Development Foundation',
        'certs/6/internal-course-3-d4e5f6.pdf', '2026-04-02'),

    -- Internal: Trainee 7 Completed Course 1
    (6, 7, 1,    'Enterprise Backend Engineering with Spring Boot',
        'certs/7/internal-course-1-a1b2c3.pdf', '2026-04-06'),

    -- External: Trainee 7 uploaded external certificate
    (7, 7, NULL, 'CompTIA Security+ (SY0-701)',
        'certs/7/external-comptia-secplus-554e8a.pdf', '2026-07-15');

INSERT INTO trainee_projects (id, trainee_id, title, description, repo_url)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 5, 'Cloud-Native Skill Tracking Microservice',
        'Serverless Spring Boot 3 backend compiled with GraalVM Native Image, deployed on AWS Lambda with PostgreSQL and S3 integration.',
        'https://github.com/arjun-sen/skill-track-service'),
    (2, 5, 'Real-Time Crypto Whale Alert Dashboard',
        'React and TypeScript web application monitoring high-value multi-chain transactions.',
        'https://github.com/arjun-sen/whale-hunter'),
    (3, 6, 'E-Commerce Bookstore Portal',
        'Full-stack web store featuring cart management, role-based access, and PostgreSQL persistence.',
        'https://github.com/priya-chatterjee/online-bookstore'),
    (4, 7, 'Automated Network Intrusion Detector',
        'Packet inspection utility written in Python and Java for flagging anomalous local traffic.',
        'https://github.com/rohan-das/net-sentinel');

INSERT INTO trainee_resumes (id, file_s3_key, extracted_tokens)
VALUES
    (5, 'resumes/5/arjun_sen_resume_2026.pdf',
        '{
            "skills": ["Java", "Spring Boot", "PostgreSQL", "Docker", "AWS", "Linux", "Python"],
            "education": "BCA",
            "cgpa": 8.4,
            "experience_months": 6,
            "certifications": ["AWS Certified Cloud Practitioner", "LFCS"],
            "keywords": ["microservices", "rest_api", "ci_cd", "serverless", "graalvm"]
        }'::jsonb),
    (6, 'resumes/6/priya_chatterjee_resume_2026.pdf',
        '{
            "skills": ["React", "TypeScript", "JavaScript", "PostgreSQL", "HTML", "CSS"],
            "education": "MCA",
            "cgpa": 8.8,
            "experience_months": 3,
            "certifications": [],
            "keywords": ["frontend", "spa", "responsive_design", "redux"]
        }'::jsonb),
    (7, 'resumes/7/rohan_das_resume_2026.pdf',
        '{
            "skills": ["Java", "Spring Boot", "PostgreSQL", "Network Security", "Linux"],
            "education": "B.Tech",
            "cgpa": 7.9,
            "experience_months": 0,
            "certifications": ["CompTIA Security+"],
            "keywords": ["backend", "cybersecurity", "owasp", "jdbc"]
        }'::jsonb);


-- ============================================================
-- 5. ROLES, ROLE_REQUIRED_SKILLS & TRAINEE_TARGET_ROLES
-- ============================================================

INSERT INTO roles (id, name, category, description)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Backend Software Engineer',  'SOFTWARE_ENGINEERING', 'Designs and maintains scalable APIs, microservices, and relational databases.'),
    (2, 'Cloud & DevOps Engineer',    'CLOUD_COMPUTING',      'Automates cloud infrastructure, CI/CD pipelines, and container orchestration.'),
    (3, 'Frontend Web Developer',     'WEB_DEVELOPMENT',      'Builds interactive, accessible user interfaces using modern component frameworks.'),
    (4, 'Machine Learning Engineer',  'AI_MACHINE_LEARNING',  'Develops, trains, and deploys predictive models and data pipelines.');

INSERT INTO role_required_skills (role_id, skill_id, required_proficiency)
VALUES
    -- Role 1: Backend Software Engineer -> Java (INTERMEDIATE), Spring Boot (INTERMEDIATE), PostgreSQL (INTERMEDIATE)
    (1, 1, 'INTERMEDIATE'),
    (1, 2, 'INTERMEDIATE'),
    (1, 3, 'INTERMEDIATE'),

    -- Role 2: Cloud & DevOps Engineer -> Docker (INTERMEDIATE), Kubernetes (INTERMEDIATE), AWS (INTERMEDIATE), Linux (ADVANCED)
    (2, 6, 'INTERMEDIATE'),
    (2, 7, 'INTERMEDIATE'),
    (2, 8, 'INTERMEDIATE'),
    (2, 9, 'ADVANCED'),

    -- Role 3: Frontend Web Developer -> React (INTERMEDIATE), TypeScript (BEGINNER)
    (3, 4, 'INTERMEDIATE'),
    (3, 5, 'BEGINNER'),

    -- Role 4: Machine Learning Engineer -> Python (ADVANCED), Machine Learning (INTERMEDIATE)
    (4, 10, 'ADVANCED'),
    (4, 11, 'INTERMEDIATE');

INSERT INTO trainee_target_roles (trainee_id, role_id, target_level)
VALUES
    (5, 1, 'JUNIOR'),
    (5, 2, 'ENTRY_LEVEL'),
    (6, 3, 'ENTRY_LEVEL'),
    (7, 1, 'ENTRY_LEVEL'),
    (8, 3, 'INTERN'),
    (9, 2, 'MID_LEVEL');


-- ============================================================
-- 6. EMPLOYERS, EMPLOYMENT_RECORDS, SALARY_HISTORY & FOLLOW_UPS
-- ============================================================
-- Note: Outcome tracking is only recorded for trainees where
-- data_tracking_consent = TRUE (Trainees 5, 6, 7, 9).

INSERT INTO employers (id, name, industry)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Apex Cloud Solutions Pvt Ltd', 'Information Technology & Cloud Services'),
    (2, 'FinTech Nova India',           'Financial Technology'),
    (3, 'Bengal Digital Labs',          'Software Consultancy');

INSERT INTO employment_records (
    id, trainee_id, employer_id, employment_type, role_title,
    start_date, end_date, is_current, verification_status,
    training_relevance, job_source
)
OVERRIDING SYSTEM VALUE
VALUES
    -- Trainee 5 (Arjun): Completed an internship, then promoted to Full-Time
    (1, 5, 1, 'INTERNSHIP', 'Backend Engineering Intern',  '2026-04-15', '2026-07-15', FALSE, 'VERIFIED',   'HIGH',   'TRAINING_PROVIDER'),
    (2, 5, 1, 'FULL_TIME',  'Associate Cloud & Java Dev',  '2026-07-16', NULL,         TRUE,  'VERIFIED',   'HIGH',   'EMPLOYER'),

    -- Trainee 6 (Priya): Currently in an Internship
    (3, 6, 2, 'INTERNSHIP', 'Frontend React Intern',       '2026-05-01', NULL,         TRUE,  'VERIFIED',   'HIGH',   'TRAINING_PROVIDER'),

    -- Trainee 9 (Vikram): Part-time IT role
    (4, 9, 3, 'PART_TIME',  'Junior Support Technician',   '2026-06-01', NULL,         TRUE,  'UNVERIFIED', 'LOW',    'SELF_REPORTED');

INSERT INTO salary_history (id, employment_id, salary_amount, salary_period, recorded_at)
OVERRIDING SYSTEM VALUE
VALUES
    -- Arjun's internship stipend -> full-time salary -> 3-month appraisal
    (1, 1, 18000.00,  'MONTHLY', '2026-04-15'),
    (2, 2, 45000.00,  'MONTHLY', '2026-07-16'),
    (3, 2, 52000.00,  'MONTHLY', '2026-10-16'),

    -- Priya's internship stipend
    (4, 3, 20000.00,  'MONTHLY', '2026-05-01'),

    -- Vikram's part-time compensation
    (5, 4, 12000.00,  'MONTHLY', '2026-06-01');

INSERT INTO follow_ups (
    id, trainee_id, scheduled_at, completed_at, employment_status, response_status
)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 5, '2026-07-10', '2026-07-11', 'INTERNSHIP',   'COMPLETED'),
    (2, 5, '2026-10-10', '2026-10-12', 'FULL_TIME',    'COMPLETED'),
    (3, 6, '2026-07-01', '2026-07-02', 'INTERNSHIP',   'COMPLETED'),
    (4, 6, '2026-11-15', NULL,         NULL,           'PENDING'),
    (5, 7, '2026-07-10', '2026-07-14', 'NOT_EMPLOYED', 'COMPLETED'),
    (6, 7, '2026-10-10', NULL,         NULL,           'NO_RESPONSE'),
    (7, 9, '2026-09-01', '2026-09-03', 'PART_TIME',    'COMPLETED');


-- ============================================================
-- 7. SYNCHRONISE IDENTITY SEQUENCES
-- ============================================================
-- Ensures subsequent INSERT statements from Spring Boot / Hibernate
-- continue smoothly from MAX(id) + 1 without primary key collisions.

SELECT setval(pg_get_serial_sequence('users',              'id'), COALESCE((SELECT MAX(id) FROM users),              1));
SELECT setval(pg_get_serial_sequence('skills',             'id'), COALESCE((SELECT MAX(id) FROM skills),             1));
SELECT setval(pg_get_serial_sequence('courses',            'id'), COALESCE((SELECT MAX(id) FROM courses),            1));
SELECT setval(pg_get_serial_sequence('course_enrolments',  'id'), COALESCE((SELECT MAX(id) FROM course_enrolments),  1));
SELECT setval(pg_get_serial_sequence('certifications',     'id'), COALESCE((SELECT MAX(id) FROM certifications),     1));
SELECT setval(pg_get_serial_sequence('trainee_projects',   'id'), COALESCE((SELECT MAX(id) FROM trainee_projects),   1));
SELECT setval(pg_get_serial_sequence('roles',              'id'), COALESCE((SELECT MAX(id) FROM roles),              1));
SELECT setval(pg_get_serial_sequence('employers',          'id'), COALESCE((SELECT MAX(id) FROM employers),          1));
SELECT setval(pg_get_serial_sequence('employment_records', 'id'), COALESCE((SELECT MAX(id) FROM employment_records), 1));
SELECT setval(pg_get_serial_sequence('salary_history',     'id'), COALESCE((SELECT MAX(id) FROM salary_history),     1));
SELECT setval(pg_get_serial_sequence('follow_ups',         'id'), COALESCE((SELECT MAX(id) FROM follow_ups),         1));

COMMIT;
