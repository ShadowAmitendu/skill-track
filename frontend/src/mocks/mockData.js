/**
 * Mock data mirroring the SkillTrack domain DTOs.
 * Used exclusively by MSW when the explicit dev Demo Mode toggle is enabled.
 */

export const mockTrainees = [
  {
    id: 1,
    fullName: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phoneNumber: "+91 98765 43210",
    consentGiven: true,
    allowEmails: true,
    adminStoppedEmail: false,
    employmentStatus: "FULL_TIME",
    companyName: "TCS NextGen",
    currentRole: "Java Backend Engineer",
    currentSalary: 650000,
    salaryProgression: "3.5LPA -> 5.0LPA -> 6.5LPA",
    unemployedReason: "",
    projectsSummary: "Microservices banking platform with Spring Cloud and Docker",
    projectRepoUrl: "https://github.com/aarav/bank-services",
    skills: ["Java", "Spring Boot", "PostgreSQL", "Docker", "Git"],
    certifications: ["Oracle Certified Associate Java SE", "AWS Cloud Practitioner"],
    enrolledCourses: ["Spring Boot Microservices Architecture"],
    completedCourses: ["Core Java & Data Structures"],
    followUpResponded: true,
    followUpNotes: ["Followed up Q1 2026: Confirmed full-time promotion to mid-level engineer."],
  },
  {
    id: 2,
    fullName: "Priya Nair",
    email: "priya.nair@example.com",
    phoneNumber: "+91 98220 11223",
    consentGiven: true,
    allowEmails: true,
    adminStoppedEmail: false,
    employmentStatus: "FULL_TIME",
    companyName: "Infosys Labs",
    currentRole: "Cloud & DevOps Associate",
    currentSalary: 720000,
    salaryProgression: "4.2LPA -> 7.2LPA",
    unemployedReason: "",
    projectsSummary: "Kubernetes CI/CD pipeline automation using Jenkins & Terraform",
    projectRepoUrl: "https://github.com/priya/k8s-cicd-pipeline",
    skills: ["Docker", "Kubernetes", "Jenkins", "Cloud", "Git"],
    certifications: ["Certified Kubernetes Administrator (CKA)"],
    enrolledCourses: ["Advanced Kubernetes Orchestration"],
    completedCourses: ["DevOps Fundamentals"],
    followUpResponded: true,
    followUpNotes: ["Followed up Q4 2025: Transitioned successfully from SysAdmin to DevOps."],
  },
  {
    id: 3,
    fullName: "Rohan Verma",
    email: "rohan.verma@example.com",
    phoneNumber: "+91 97110 33445",
    consentGiven: false,
    allowEmails: false,
    adminStoppedEmail: false,
    employmentStatus: "UNEMPLOYED",
    companyName: "",
    currentRole: "",
    currentSalary: null,
    salaryProgression: "",
    unemployedReason: "Actively looking — interviewing for Junior Backend Engineer roles",
    projectsSummary: "E-commerce REST API built with Spring Boot and Redis caching",
    projectRepoUrl: "https://github.com/rohan/ecommerce-api",
    skills: ["Java", "Spring Boot", "PostgreSQL", "Git"],
    certifications: [],
    enrolledCourses: ["Spring Boot Microservices Architecture"],
    completedCourses: ["Core Java & Data Structures"],
    followUpResponded: false,
    followUpNotes: [],
  },
  {
    id: 4,
    fullName: "Sneha Mukherjee",
    email: "sneha.m@example.com",
    phoneNumber: "+91 99332 44556",
    consentGiven: true,
    allowEmails: true,
    adminStoppedEmail: false,
    employmentStatus: "UNEMPLOYED",
    companyName: "",
    currentRole: "",
    currentSalary: null,
    salaryProgression: "",
    unemployedReason: "Career break for higher education preparation (GATE / Masters)",
    projectsSummary: "Portfolio site and fullstack task manager",
    projectRepoUrl: "https://github.com/sneha/portfolio",
    skills: ["React", "JavaScript", "Git"],
    certifications: ["Frontend Web Development Bootcamp"],
    enrolledCourses: [],
    completedCourses: ["Modern Web Development with React"],
    followUpResponded: true,
    followUpNotes: ["Requested follow-up pause until graduation in late 2026."],
  },
  {
    id: 5,
    fullName: "Vikram Patel",
    email: "vikram.patel@example.com",
    phoneNumber: "+91 98450 99887",
    consentGiven: true,
    allowEmails: false,
    adminStoppedEmail: true,
    employmentStatus: "PART_TIME",
    companyName: "Wipro Digital",
    currentRole: "Database Consultant",
    currentSalary: 420000,
    salaryProgression: "3.2LPA -> 4.2LPA (Part-Time)",
    unemployedReason: "",
    projectsSummary: "PostgreSQL query optimization and partition management",
    projectRepoUrl: "https://github.com/vikram/db-performance",
    skills: ["PostgreSQL", "SQL Tuning"],
    certifications: ["PostgreSQL Professional"],
    enrolledCourses: [],
    completedCourses: ["Database Systems & Advanced SQL"],
    followUpResponded: false,
    followUpNotes: ["Admin halted email reminders per trainee request."],
  },
  {
    id: 6,
    fullName: "Ananya Iyer",
    email: "ananya.iyer@example.com",
    phoneNumber: "+91 97401 66778",
    consentGiven: true,
    allowEmails: true,
    adminStoppedEmail: false,
    employmentStatus: "INTERNSHIP",
    companyName: "RedHat Open Source Lab",
    currentRole: "Platform Engineering Intern",
    currentSalary: 300000,
    salaryProgression: "25k/mo stipend",
    unemployedReason: "",
    projectsSummary: "Automated Helm release verification and Docker scanning workflows",
    projectRepoUrl: "https://github.com/ananya/helm-verify",
    skills: ["Docker", "Kubernetes", "Cloud", "Git"],
    certifications: [],
    enrolledCourses: ["DevOps Fundamentals"],
    completedCourses: ["Core Java & Data Structures"],
    followUpResponded: true,
    followUpNotes: ["Internship cohort check-in completed Q1 2026."],
  },
  {
    id: 7,
    fullName: "Kabir Mehta",
    email: "kabir.mehta@example.com",
    phoneNumber: "+91 98112 55443",
    consentGiven: true,
    allowEmails: true,
    adminStoppedEmail: false,
    employmentStatus: "SELF_EMPLOYED",
    companyName: "Independent Cloud Practice",
    currentRole: "Freelance Cloud Solutions Architect",
    currentSalary: 960000,
    salaryProgression: "6.0LPA -> 9.6LPA (Independent)",
    unemployedReason: "",
    projectsSummary: "Multi-region Kubernetes clusters and Java microservices consulting",
    projectRepoUrl: "https://github.com/kabir/cloud-blueprints",
    skills: ["Java", "Cloud", "Docker", "Kubernetes", "PostgreSQL"],
    certifications: ["AWS Solutions Architect Associate"],
    enrolledCourses: [],
    completedCourses: ["Advanced Kubernetes Orchestration"],
    followUpResponded: false,
    followUpNotes: [],
  },
];

export const mockProviders = [
  {
    id: 1,
    name: "Apex Skill Academy",
    contactEmail: "partners@apexacademy.edu",
    description: "Industry-aligned Java, Spring Boot and Cloud enterprise skilling programs.",
    website: "https://apexacademy.example.com",
  },
  {
    id: 2,
    name: "CloudNative Institute",
    contactEmail: "admissions@cloudnative.tech",
    description: "Specialized cloud engineering, Kubernetes, and modern DevOps career tracks.",
    website: "https://cloudnative.example.com",
  },
  {
    id: 3,
    name: "DataMinds Learning",
    contactEmail: "info@dataminds.org",
    description: "Database architecture, SQL optimization, and modern web engineering.",
    website: "https://dataminds.example.com",
  },
];

export const mockCourses = [
  {
    id: 1,
    title: "Core Java & Data Structures",
    description: "Foundational Java 21, object-oriented design, collections, and concurrency.",
    category: "Backend",
    providerId: 1,
    providerName: "Apex Skill Academy",
    skillsTaught: ["Java", "OOP", "Data Structures", "Git"],
  },
  {
    id: 2,
    title: "Spring Boot Microservices Architecture",
    description: "Production REST APIs, JPA/Hibernate, Spring Security, and Cloud configuration.",
    category: "Backend",
    providerId: 1,
    providerName: "Apex Skill Academy",
    skillsTaught: ["Java", "Spring Boot", "PostgreSQL", "REST APIs", "Docker"],
  },
  {
    id: 3,
    title: "DevOps Fundamentals",
    description: "Containerization with Docker, CI/CD pipeline automation, and Git workflows.",
    category: "DevOps",
    providerId: 2,
    providerName: "CloudNative Institute",
    skillsTaught: ["Docker", "Jenkins", "Git"],
  },
  {
    id: 4,
    title: "Advanced Kubernetes Orchestration",
    description: "Production Kubernetes deployments, Helm charts, cloud ingress, and monitoring.",
    category: "DevOps",
    providerId: 2,
    providerName: "CloudNative Institute",
    skillsTaught: ["Kubernetes", "Docker", "Cloud"],
  },
  {
    id: 5,
    title: "Database Systems & Advanced SQL",
    description: "Relational database design, query optimization, indexing, and PostgreSQL admin.",
    category: "Database",
    providerId: 3,
    providerName: "DataMinds Learning",
    skillsTaught: ["PostgreSQL", "SQL Tuning"],
  },
  {
    id: 6,
    title: "Modern Web Development with React",
    description: "Component architecture, React hooks, routing, and modern Git collaboration.",
    category: "Frontend",
    providerId: 3,
    providerName: "DataMinds Learning",
    skillsTaught: ["React", "JavaScript", "Git"],
  },
];

export const mockSkillCatalog = [
  { skillId: 1, skillName: "Java", category: "Backend" },
  { skillId: 2, skillName: "Spring Boot", category: "Backend" },
  { skillId: 3, skillName: "Docker", category: "DevOps" },
  { skillId: 4, skillName: "Kubernetes", category: "DevOps" },
  { skillId: 5, skillName: "Jenkins", category: "DevOps" },
  { skillId: 6, skillName: "Cloud", category: "Cloud" },
  { skillId: 7, skillName: "Git", category: "DevOps" },
  { skillId: 8, skillName: "PostgreSQL", category: "Database" },
  { skillId: 9, skillName: "React", category: "Frontend" },
];

export const mockSkillsSummary = mockSkillCatalog.map((skill) => {
  const holders = mockTrainees.filter((t) =>
    t.skills.some((s) => s.toLowerCase() === skill.skillName.toLowerCase())
  );
  return {
    ...skill,
    enrolledTraineesCount: holders.length,
    traineeNames: holders.map((h) => h.fullName),
  };
});

export const mockAdminDashboard = {
  totalTrainees: mockTrainees.length,
  totalCourseProviders: mockProviders.length,
  totalCourses: mockCourses.length,
  totalConsents: mockTrainees.filter((t) => t.consentGiven).length,
  followUpRespondedCount: mockTrainees.filter((t) => t.followUpResponded).length,
  followUpNotRespondedCount: mockTrainees.filter((t) => !t.followUpResponded).length,
  employedStudentsCount: mockTrainees.filter((t) => t.employmentStatus !== "UNEMPLOYED").length,
  unemployedStudentsCount: mockTrainees.filter((t) => t.employmentStatus === "UNEMPLOYED").length,
  jobSeekingStudentsCount: mockTrainees.filter(
    (t) =>
      t.employmentStatus === "UNEMPLOYED" &&
      t.unemployedReason?.toLowerCase().includes("looking")
  ).length,
  unemployedReasonsBreakdown: mockTrainees.reduce((acc, t) => {
    if (t.employmentStatus === "UNEMPLOYED" && t.unemployedReason) {
      acc[t.unemployedReason] = (acc[t.unemployedReason] || 0) + 1;
    }
    return acc;
  }, {}),
};

export const mockMarketResearchDocs = {
  "cloud-devops-2026.md": `# Cloud & DevOps Market Pulse (2026)

- **Top In-Demand Capabilities:** Docker multi-stage containers, Kubernetes workload hardening, Terraform Infrastructure as Code, and GitHub Actions CI/CD automation.
- **Placement Impact:** Cohort graduates demonstrating containerized microservices with PostgreSQL monitoring place ~35% faster than textbook-only profiles.
- **Recommended Course Additions:** Add observability (Prometheus/OpenTelemetry) and zero-downtime blue/green deployment labs.`,

  "it-software-roles-2026.md": `# IT Software Roles & Hiring Signals (2026)

- **Backend Developer:** Strong preference for Java 21, Spring Boot, RESTful API design, SQL indexing, and containerized deployments.
- **Frontend / Fullstack Developer:** TypeScript, React, automated accessibility, and end-to-end API contract safety lead technical screening criteria.
- **Emerging Specializations:** AI Platform Engineering, LLM Application Architecture, and FinOps Cost Optimization.`,

  "weekly-industry-pulse.md": `# Weekly Industry Demand Brief

- Employers increasingly screen resumes with ATS keyword matching for Git workflows, automated testing, cloud deployment basics, and relational database tuning.
- Outdated XML-heavy J2EE and SOAP topics are rapidly being deprioritized in favor of modern REST/gRPC services.`,
};
