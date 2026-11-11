import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";

export async function runSeed() {
  console.log("Seeding Skill-Track SQLite database...");

  // Clear existing data in safe foreign-key order
  await prisma.followUp.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.salaryHistory.deleteMany();
  await prisma.employment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.traineeSkill.deleteMany();
  await prisma.courseSkill.deleteMany();
  await prisma.course.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.skillCategory.deleteMany();
  await prisma.trainee.deleteMany();
  await prisma.courseProvider.deleteMany();
  await prisma.user.deleteMany();
  await prisma.marketDoc.deleteMany();

  const adminHash = await bcrypt.hash("Admin@123!", 10);
  const cpHash = await bcrypt.hash("Provider@123!", 10);
  const traineeHash = await bcrypt.hash("Trainee@123!", 10);

  // 1. Seed Admin (not registrable via UI)
  await prisma.user.create({
    data: {
      email: "admin@skilltrack.local",
      passwordHash: adminHash,
      role: "admin",
      name: "System Admin",
      status: "active",
    },
  });

  // 2. Seed Course Providers (2 approved + 1 pending)
  const apexUser = await prisma.user.create({
    data: {
      email: "cp@apexacademy.edu",
      passwordHash: cpHash,
      role: "cp",
      name: "Apex Skill Academy",
      status: "active",
      provider: {
        create: {
          name: "Apex Skill Academy",
          contactEmail: "partners@apexacademy.edu",
          website: "https://apexacademy.example.com",
          description: "Enterprise Java, Spring Boot, TypeScript, and Full-Stack career programs.",
          approvalStatus: "approved",
        },
      },
    },
    include: { provider: true },
  });

  const cloudUser = await prisma.user.create({
    data: {
      email: "admissions@cloudnative.tech",
      passwordHash: cpHash,
      role: "cp",
      name: "CloudNative Institute",
      status: "active",
      provider: {
        create: {
          name: "CloudNative Institute",
          contactEmail: "admissions@cloudnative.tech",
          website: "https://cloudnative.example.com",
          description: "Cloud architecture, Kubernetes, Docker, and CI/CD automation accelerators.",
          approvalStatus: "approved",
        },
      },
    },
    include: { provider: true },
  });

  await prisma.user.create({
    data: {
      email: "pending@futurestack.io",
      passwordHash: cpHash,
      role: "cp",
      name: "FutureStack Labs",
      status: "pending",
      provider: {
        create: {
          name: "FutureStack Labs",
          contactEmail: "hello@futurestack.io",
          website: "https://futurestack.example.com",
          description: "Applied Data Engineering & LLM Ops cohort provider awaiting approval.",
          approvalStatus: "pending",
        },
      },
    },
  });

  // 3. Seed Skill Categories & Skills
  const catDevops = await prisma.skillCategory.create({
    data: { name: "DevOps", description: "Containers, orchestration, CI/CD, and version control" },
  });
  const catBackend = await prisma.skillCategory.create({
    data: { name: "Backend", description: "Server runtimes, typed APIs, and microservices" },
  });
  const catCloud = await prisma.skillCategory.create({
    data: { name: "Cloud", description: "Cloud infrastructure, IAM, and distributed systems" },
  });
  const catDatabase = await prisma.skillCategory.create({
    data: { name: "Database", description: "Relational modeling, SQL optimization, and storage" },
  });
  const catFrontendData = await prisma.skillCategory.create({
    data: { name: "Frontend & Data", description: "Interactive web UIs and Python data workflows" },
  });

  const skillDefs = [
    { name: "Docker", categoryId: catDevops.id },
    { name: "Kubernetes", categoryId: catDevops.id },
    { name: "Jenkins", categoryId: catDevops.id },
    { name: "Terraform", categoryId: catDevops.id },
    { name: "Git", categoryId: catDevops.id },
    { name: "Java", categoryId: catBackend.id },
    { name: "Spring Boot", categoryId: catBackend.id },
    { name: "Node.js", categoryId: catBackend.id },
    { name: "TypeScript", categoryId: catBackend.id },
    { name: "REST APIs", categoryId: catBackend.id },
    { name: "AWS / Cloud", categoryId: catCloud.id },
    { name: "PostgreSQL", categoryId: catDatabase.id },
    { name: "SQL Tuning", categoryId: catDatabase.id },
    { name: "React", categoryId: catFrontendData.id },
    { name: "Python", categoryId: catFrontendData.id },
  ];

  const skillMap: Record<string, number> = {};
  for (const s of skillDefs) {
    const created = await prisma.skill.create({ data: s });
    skillMap[s.name] = created.id;
  }

  // 4. Seed Courses
  const courseSpecs = [
    {
      title: "Core Java & Data Structures",
      description: "Foundational Java 21, OOP, concurrency, and Git workflows for backend careers.",
      category: "Backend",
      providerId: apexUser.provider!.id,
      popularity: 18,
      durationWeeks: 8,
      skills: ["Java", "Git", "REST APIs"],
    },
    {
      title: "Spring Boot Microservices Architecture",
      description: "Production REST APIs, PostgreSQL persistence, Spring Security, and Docker packaging.",
      category: "Backend",
      providerId: apexUser.provider!.id,
      popularity: 24,
      durationWeeks: 10,
      skills: ["Java", "Spring Boot", "PostgreSQL", "REST APIs", "Docker"],
    },
    {
      title: "Full-Stack TypeScript & React",
      description: "End-to-end TypeScript applications with React 18, Node.js, and relational schemas.",
      category: "Frontend & Data",
      providerId: apexUser.provider!.id,
      popularity: 15,
      durationWeeks: 10,
      skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Git"],
    },
    {
      title: "DevOps & CI/CD Foundations",
      description: "Docker containerization, Jenkins pipelines, and Git branching strategies.",
      category: "DevOps",
      providerId: cloudUser.provider!.id,
      popularity: 21,
      durationWeeks: 6,
      skills: ["Docker", "Jenkins", "Git"],
    },
    {
      title: "Advanced Kubernetes & Cloud IaC",
      description: "Production Kubernetes clusters, Terraform provisioning, and AWS Cloud operations.",
      category: "DevOps",
      providerId: cloudUser.provider!.id,
      popularity: 19,
      durationWeeks: 8,
      skills: ["Kubernetes", "Docker", "Terraform", "AWS / Cloud"],
    },
    {
      title: "PostgreSQL Internals & Python Data Ops",
      description: "SQL query tuning, indexing strategies, and Python ETL automation.",
      category: "Database",
      providerId: cloudUser.provider!.id,
      popularity: 11,
      durationWeeks: 6,
      skills: ["PostgreSQL", "SQL Tuning", "Python"],
    },
  ];

  const courseMap: Record<string, number> = {};
  for (const c of courseSpecs) {
    const created = await prisma.course.create({
      data: {
        title: c.title,
        description: c.description,
        category: c.category,
        providerId: c.providerId,
        popularity: c.popularity,
        durationWeeks: c.durationWeeks,
        courseSkills: {
          create: c.skills.map((name) => ({ skillId: skillMap[name] })),
        },
      },
    });
    courseMap[c.title] = created.id;
  }

  // 5. Seed Trainees (across all 5 employment statuses + IT vs Non-IT + consent variations)
  const fourMonthsAgo = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const t1 = await prisma.user.create({
    data: {
      email: "aarav.sharma@example.com",
      passwordHash: traineeHash,
      role: "trainee",
      name: "Aarav Sharma",
      status: "active",
      trainee: {
        create: {
          fullName: "Aarav Sharma",
          phone: "+91 98765 43210",
          location: "Bengaluru, IN",
          roleCategory: "IT",
          bio: "Backend engineer focused on resilient Java and containerized microservices.",
          lastProfileUpdate: oneMonthAgo,
          skills: {
            create: [
              { skillId: skillMap["Java"], source: "verified" },
              { skillId: skillMap["Git"], source: "verified" },
              { skillId: skillMap["REST APIs"], source: "verified" },
              { skillId: skillMap["Docker"], source: "detected" },
            ],
          },
          certifications: {
            create: [
              {
                title: "Oracle Certified Associate Java SE",
                issuer: "Oracle",
                issuedAt: new Date("2025-09-10"),
              },
            ],
          },
          projects: {
            create: [
              {
                title: "Banking Ledger API",
                description: "Idempotent ledger service with transactional auditing.",
                repoUrl: "https://github.com/aarav-demo/banking-ledger-api",
              },
            ],
          },
          enrollments: {
            create: [
              {
                courseId: courseMap["Core Java & Data Structures"],
                status: "completed",
                completedAt: oneMonthAgo,
              },
              {
                courseId: courseMap["Spring Boot Microservices Architecture"],
                status: "enrolled",
              },
            ],
          },
          employment: {
            create: {
              status: "full_time",
              role: "Java Backend Engineer",
              company: "TCS NextGen",
              salary: 750000,
            },
          },
          salaryHistory: {
            create: [
              {
                amount: 450000,
                role: "Junior Java Trainee",
                company: "TCS NextGen",
                recordedAt: new Date("2025-02-01"),
              },
              {
                amount: 750000,
                role: "Java Backend Engineer",
                company: "TCS NextGen",
                recordedAt: new Date("2026-01-15"),
              },
            ],
          },
          consent: { create: { status: true, emailsStopped: false } },
          followUps: {
            create: [
              {
                sentAt: fourMonthsAgo,
                respondedAt: oneMonthAgo,
                note: "Confirmed transition to mid-level Java Backend Engineer.",
              },
            ],
          },
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: "priya.nair@example.com",
      passwordHash: traineeHash,
      role: "trainee",
      name: "Priya Nair",
      status: "active",
      trainee: {
        create: {
          fullName: "Priya Nair",
          phone: "+91 98220 11223",
          location: "Pune, IN",
          roleCategory: "IT",
          bio: "Platform and CI/CD engineer automating multi-cluster Kubernetes rollouts.",
          lastProfileUpdate: oneMonthAgo,
          skills: {
            create: [
              { skillId: skillMap["Docker"], source: "verified" },
              { skillId: skillMap["Jenkins"], source: "verified" },
              { skillId: skillMap["Git"], source: "verified" },
              { skillId: skillMap["Kubernetes"], source: "verified" },
              { skillId: skillMap["Terraform"], source: "verified" },
              { skillId: skillMap["AWS / Cloud"], source: "verified" },
            ],
          },
          certifications: {
            create: [
              {
                title: "Certified Kubernetes Administrator (CKA)",
                issuer: "CNCF",
                issuedAt: new Date("2025-11-20"),
              },
            ],
          },
          projects: {
            create: [
              {
                title: "K8s Blue-Green Deployer",
                description: "GitOps Helm rollout controller with smoke-test gates.",
                repoUrl: "https://github.com/priya-demo/k8s-deployer",
              },
            ],
          },
          enrollments: {
            create: [
              {
                courseId: courseMap["DevOps & CI/CD Foundations"],
                status: "completed",
                completedAt: fourMonthsAgo,
              },
              {
                courseId: courseMap["Advanced Kubernetes & Cloud IaC"],
                status: "completed",
                completedAt: oneMonthAgo,
              },
            ],
          },
          employment: {
            create: {
              status: "full_time",
              role: "Cloud & DevOps Associate",
              company: "Infosys Labs",
              salary: 820000,
            },
          },
          salaryHistory: {
            create: [
              {
                amount: 500000,
                role: "Systems Associate",
                company: "Infosys Labs",
                recordedAt: new Date("2025-03-01"),
              },
              {
                amount: 820000,
                role: "Cloud & DevOps Associate",
                company: "Infosys Labs",
                recordedAt: new Date("2026-02-01"),
              },
            ],
          },
          consent: { create: { status: true, emailsStopped: false } },
          followUps: {
            create: [
              {
                sentAt: fourMonthsAgo,
                respondedAt: oneMonthAgo,
                note: "Completed CKA and moved to Cloud DevOps team.",
              },
            ],
          },
        },
      },
    },
  });

  // Trainee with consent revoked (hidden from Course Providers!) & overdue for follow-up except consent off
  await prisma.user.create({
    data: {
      email: "rohan.verma@example.com",
      passwordHash: traineeHash,
      role: "trainee",
      name: "Rohan Verma",
      status: "active",
      trainee: {
        create: {
          fullName: "Rohan Verma",
          phone: "+91 97110 33445",
          location: "Delhi, IN",
          roleCategory: "IT",
          bio: "Transitioning into backend Node.js & PostgreSQL systems.",
          lastProfileUpdate: fourMonthsAgo,
          skills: {
            create: [
              { skillId: skillMap["Java"], source: "verified" },
              { skillId: skillMap["Git"], source: "verified" },
            ],
          },
          enrollments: {
            create: [
              { courseId: courseMap["Core Java & Data Structures"], status: "completed", completedAt: fourMonthsAgo },
            ],
          },
          employment: {
            create: {
              status: "unemployed",
              reason: "actively_looking",
            },
          },
          consent: { create: { status: false, emailsStopped: false } },
          followUps: {
            create: [{ sentAt: fourMonthsAgo, note: "Initial check-in sent before consent opt-out." }],
          },
        },
      },
    },
  });

  // Unemployed on study break + consented + eligible for quarterly email trigger (>90 days)
  await prisma.user.create({
    data: {
      email: "sneha.m@example.com",
      passwordHash: traineeHash,
      role: "trainee",
      name: "Sneha Mukherjee",
      status: "active",
      trainee: {
        create: {
          fullName: "Sneha Mukherjee",
          phone: "+91 99332 44556",
          location: "Kolkata, IN",
          roleCategory: "IT",
          bio: "Full-stack TypeScript builder preparing for Master's examinations.",
          lastProfileUpdate: fourMonthsAgo,
          skills: {
            create: [
              { skillId: skillMap["TypeScript"], source: "verified" },
              { skillId: skillMap["React"], source: "verified" },
              { skillId: skillMap["Node.js"], source: "verified" },
            ],
          },
          enrollments: {
            create: [
              {
                courseId: courseMap["Full-Stack TypeScript & React"],
                status: "completed",
                completedAt: fourMonthsAgo,
              },
            ],
          },
          employment: {
            create: {
              status: "unemployed",
              reason: "break",
            },
          },
          consent: { create: { status: true, emailsStopped: false } },
          followUps: {
            create: [
              {
                sentAt: fourMonthsAgo,
                respondedAt: fourMonthsAgo,
                note: "Taking study break until Q3 2026.",
              },
            ],
          },
        },
      },
    },
  });

  // Part-time + admin emails stopped
  await prisma.user.create({
    data: {
      email: "vikram.patel@example.com",
      passwordHash: traineeHash,
      role: "trainee",
      name: "Vikram Patel",
      status: "active",
      trainee: {
        create: {
          fullName: "Vikram Patel",
          phone: "+91 98450 99887",
          location: "Ahmedabad, IN",
          roleCategory: "IT",
          bio: "Database tuning specialist supporting PostgreSQL workloads.",
          lastProfileUpdate: fourMonthsAgo,
          skills: {
            create: [
              { skillId: skillMap["PostgreSQL"], source: "verified" },
              { skillId: skillMap["SQL Tuning"], source: "verified" },
              { skillId: skillMap["Python"], source: "verified" },
            ],
          },
          enrollments: {
            create: [
              {
                courseId: courseMap["PostgreSQL Internals & Python Data Ops"],
                status: "completed",
                completedAt: fourMonthsAgo,
              },
            ],
          },
          employment: {
            create: {
              status: "part_time",
              role: "Database Consultant",
              company: "Wipro Digital",
              salary: 480000,
            },
          },
          consent: { create: { status: true, emailsStopped: true } },
          followUps: {
            create: [
              { sentAt: fourMonthsAgo, note: "Admin disabled follow-up emails per request." },
            ],
          },
        },
      },
    },
  });

  // Internship + ATS detected skill
  await prisma.user.create({
    data: {
      email: "ananya.iyer@example.com",
      passwordHash: traineeHash,
      role: "trainee",
      name: "Ananya Iyer",
      status: "active",
      trainee: {
        create: {
          fullName: "Ananya Iyer",
          phone: "+91 97401 66778",
          location: "Chennai, IN",
          roleCategory: "IT",
          bio: "Interning on container security and Kubernetes telemetry.",
          lastProfileUpdate: oneMonthAgo,
          skills: {
            create: [
              { skillId: skillMap["Docker"], source: "verified" },
              { skillId: skillMap["Jenkins"], source: "verified" },
              { skillId: skillMap["Git"], source: "verified" },
              { skillId: skillMap["Kubernetes"], source: "detected" },
              { skillId: skillMap["AWS / Cloud"], source: "detected" },
            ],
          },
          enrollments: {
            create: [
              {
                courseId: courseMap["DevOps & CI/CD Foundations"],
                status: "completed",
                completedAt: oneMonthAgo,
              },
            ],
          },
          employment: {
            create: {
              status: "internship",
              role: "Platform Engineering Intern",
              company: "RedHat Open Source Lab",
              salary: 300000,
            },
          },
          consent: { create: { status: true, emailsStopped: false } },
          followUps: {
            create: [{ sentAt: fourMonthsAgo, respondedAt: oneMonthAgo, note: "Started platform internship." }],
          },
        },
      },
    },
  });

  // Self-employed + Non-IT track (explicitly blocked from IT-only AI features)
  await prisma.user.create({
    data: {
      email: "meera.nair@example.com",
      passwordHash: traineeHash,
      role: "trainee",
      name: "Meera Nair",
      status: "active",
      trainee: {
        create: {
          fullName: "Meera Nair",
          phone: "+91 98112 55443",
          location: "Kochi, IN",
          roleCategory: "Non-IT",
          bio: "Independent workplace communication & facilitation specialist.",
          lastProfileUpdate: oneMonthAgo,
          employment: {
            create: {
              status: "self_employed",
              role: "Corporate Communication Coach",
              company: "Independent Practice",
              salary: 540000,
            },
          },
          consent: { create: { status: true, emailsStopped: false } },
          followUps: {
            create: [{ sentAt: oneMonthAgo, note: "Scheduled quarterly check-in." }],
          },
        },
      },
    },
  });

  // 6. Sync MarketDoc rows from /market-docs
  const marketDocsDir = path.join(env.rootDir, "market-docs");
  if (fs.existsSync(marketDocsDir)) {
    const files = fs.readdirSync(marketDocsDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const slug = file.replace(/\.md$/, "");
      const fullPath = path.join("market-docs", file);
      const raw = fs.readFileSync(path.join(marketDocsDir, file), "utf8");
      const heading = raw.split("\n")[0]?.replace(/^#\s*/, "").trim() || slug;
      await prisma.marketDoc.create({
        data: {
          title: heading,
          slug,
          path: fullPath,
          sourceUrl: "https://roadmap.sh / StackOverflow / CNCF Annual Report (curated)",
          summary: raw.slice(0, 220),
        },
      });
    }
  }

  console.log(`Seed complete! Primary trainee userId=${t1.id}`);
}

runSeed()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
