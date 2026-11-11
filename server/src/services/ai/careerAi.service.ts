import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import { extractAtsSkillTokens } from "./atsParser.js";
import { generateLlmText } from "./llmClient.js";
import { getMarketDocsWithContent } from "./marketResearch.js";

interface RoleBenchmark {
  role: string;
  category: string;
  requiredSkills: string[];
  preferredSkills: string[];
  marketDemandTrend: string;
  evolutionSummary: string;
}

const IT_ROLE_BENCHMARKS: RoleBenchmark[] = [
  {
    role: "Cloud DevOps Engineer",
    category: "DevOps",
    requiredSkills: ["Docker", "Kubernetes", "Jenkins", "Terraform", "Git", "AWS / Cloud"],
    preferredSkills: ["Python", "PostgreSQL"],
    marketDemandTrend: "High demand (+22% YoY); CI/CD automation and Kubernetes reliability are baseline.",
    evolutionSummary:
      "Shifting toward platform self-service templates, distroless container hardening, and automated DevSecOps gates.",
  },
  {
    role: "Platform Engineer",
    category: "DevOps",
    requiredSkills: ["Kubernetes", "Terraform", "Docker", "AWS / Cloud", "Git"],
    preferredSkills: ["Jenkins", "Python", "TypeScript"],
    marketDemandTrend: "Rapidly replacing siloed build-release roles across mid-to-large engineering teams.",
    evolutionSummary:
      "Blends Infrastructure as Code (Terraform), Kubernetes orchestration, observability, and cloud IAM governance.",
  },
  {
    role: "Backend API Developer",
    category: "Backend",
    requiredSkills: ["Java", "Spring Boot", "REST APIs", "PostgreSQL", "Git", "Docker"],
    preferredSkills: ["SQL Tuning", "TypeScript", "Node.js"],
    marketDemandTrend: "Steady strong demand when paired with SQL tuning and containerization.",
    evolutionSummary:
      "Pure CRUD roles are shrinking; employers expect schema indexing, API schema validation, and Docker delivery.",
  },
  {
    role: "Full-Stack Software Engineer",
    category: "Frontend & Data",
    requiredSkills: ["TypeScript", "React", "Node.js", "REST APIs", "PostgreSQL", "Git"],
    preferredSkills: ["Docker", "SQL Tuning", "AWS / Cloud"],
    marketDemandTrend: "Consistent demand across product startups and SaaS teams favoring unified TypeScript stacks.",
    evolutionSummary:
      "End-to-end ownership from strict TypeScript APIs and PostgreSQL queries to containerized CI deployments.",
  },
  {
    role: "Data & AI Systems Engineer",
    category: "Database",
    requiredSkills: ["Python", "PostgreSQL", "SQL Tuning", "Docker", "AWS / Cloud", "Git"],
    preferredSkills: ["REST APIs", "Kubernetes", "Terraform"],
    marketDemandTrend: "Fast-growing specialty driven by production data reliability and LLM evaluation pipelines.",
    evolutionSummary:
      "Combines Python data engineering and SQL query optimization with cloud storage, containers, and evaluation harnesses.",
  },
];

function normalizeName(s: string): string {
  return s.trim().toLowerCase();
}

function resolveRoleBenchmark(targetRole: string): RoleBenchmark {
  const q = normalizeName(targetRole);
  const direct = IT_ROLE_BENCHMARKS.find(
    (b) => normalizeName(b.role).includes(q) || q.includes(normalizeName(b.role))
  );
  if (direct) return direct;

  if (q.includes("data") || q.includes("ai") || q.includes("ml") || q.includes("python")) {
    return {
      ...IT_ROLE_BENCHMARKS[4],
      role: targetRole,
    };
  }
  if (q.includes("frontend") || q.includes("react") || q.includes("full") || q.includes("web")) {
    return {
      ...IT_ROLE_BENCHMARKS[3],
      role: targetRole,
    };
  }
  if (q.includes("devops") || q.includes("sre") || q.includes("cloud") || q.includes("platform")) {
    return {
      ...IT_ROLE_BENCHMARKS[0],
      role: targetRole,
    };
  }
  return {
    ...IT_ROLE_BENCHMARKS[2],
    role: targetRole,
  };
}

async function loadItTraineeContext(traineeId: number) {
  const trainee = await prisma.trainee.findUnique({
    where: { id: traineeId },
    include: {
      skills: { include: { skill: { include: { category: true } } } },
      resumes: { orderBy: { uploadedAt: "desc" }, take: 3 },
      enrollments: {
        include: {
          course: { include: { courseSkills: { include: { skill: true } } } },
        },
      },
      employment: true,
    },
  });

  if (!trainee) throw new AppError(404, "Trainee profile not found");
  if (trainee.roleCategory !== "IT") {
    throw new AppError(403, "AI career analysis is restricted to trainees in the IT category");
  }

  const verifiedSkills = trainee.skills
    .filter((s) => s.source === "verified")
    .map((s) => s.skill.name);
  const detectedSkills = trainee.skills
    .filter((s) => s.source === "detected")
    .map((s) => s.skill.name);

  const resumeTokens = trainee.resumes.flatMap((r) => {
    try {
      const parsed = JSON.parse(r.extractedTokens);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  });

  return { trainee, verifiedSkills, detectedSkills, resumeTokens };
}

export async function analyzeSkillGap(input: {
  traineeId: number;
  targetRole: string;
  resumeText?: string;
}) {
  const { trainee, verifiedSkills, detectedSkills, resumeTokens } = await loadItTraineeContext(
    input.traineeId
  );

  let freshResumeTokens: string[] = [];
  if (input.resumeText?.trim()) {
    const ats = await extractAtsSkillTokens(input.resumeText);
    freshResumeTokens = ats.tokens;
  }

  const combinedSkills = Array.from(
    new Set([...verifiedSkills, ...detectedSkills, ...resumeTokens, ...freshResumeTokens])
  );
  const combinedNorm = new Set(combinedSkills.map(normalizeName));

  const benchmark = resolveRoleBenchmark(input.targetRole);
  const requiredAll = [...benchmark.requiredSkills, ...benchmark.preferredSkills];

  const matchedRequired = benchmark.requiredSkills.filter((sk) =>
    combinedNorm.has(normalizeName(sk))
  );
  const missingRequired = benchmark.requiredSkills.filter(
    (sk) => !combinedNorm.has(normalizeName(sk))
  );
  const missingPreferred = benchmark.preferredSkills.filter(
    (sk) => !combinedNorm.has(normalizeName(sk))
  );
  const missingAll = [...missingRequired, ...missingPreferred];

  const readinessScore = Math.round(
    (matchedRequired.length / Math.max(1, benchmark.requiredSkills.length)) * 100
  );

  const courses = await prisma.course.findMany({
    include: {
      provider: { select: { name: true, approvalStatus: true } },
      courseSkills: { include: { skill: true } },
    },
    orderBy: { popularity: "desc" },
  });

  const missingSet = new Set(missingAll.map(normalizeName));
  const recommendedCourses = courses
    .filter((c) => c.provider.approvalStatus === "approved")
    .map((c) => {
      const covered = c.courseSkills
        .map((cs) => cs.skill.name)
        .filter((name) => missingSet.has(normalizeName(name)));
      return {
        id: c.id,
        title: c.title,
        providerName: c.provider.name,
        category: c.category,
        popularity: c.popularity,
        coversMissingSkills: covered,
      };
    })
    .filter((c) => c.coversMissingSkills.length > 0)
    .sort((a, b) => b.coversMissingSkills.length - a.coversMissingSkills.length || b.popularity - a.popularity)
    .slice(0, 4);

  const { docs, combinedContext } = await getMarketDocsWithContent();

  const llm = await generateLlmText([
    {
      role: "system",
      content:
        "You are an expert technical career mentor for Skill-Track IT trainees. Be concise, practical, and grounded strictly in the provided skill tokens and market research documents.",
    },
    {
      role: "user",
      content: [
        `Trainee: ${trainee.fullName}`,
        `Target Role: ${input.targetRole}`,
        `Verified Skills: ${verifiedSkills.join(", ") || "None"}`,
        `ATS Detected / Resume Tokens: ${Array.from(new Set([...detectedSkills, ...freshResumeTokens])).join(", ") || "None"}`,
        `Required Skills Matched: ${matchedRequired.join(", ") || "None"}`,
        `Missing Required Skills: ${missingRequired.join(", ") || "None"}`,
        `Missing Preferred Skills: ${missingPreferred.join(", ") || "None"}`,
        "",
        "Market Research Context:",
        combinedContext,
        "",
        "Provide a 2-sentence gap diagnosis followed by 3 concrete 30-day action steps.",
      ].join("\n"),
    },
  ]);

  const fallbackNarrative =
    missingRequired.length === 0
      ? `Strong alignment for ${input.targetRole} (${readinessScore}% core match). Focus on cementing production projects and closing preferred gaps (${
          missingPreferred.join(", ") || "none"
        }).`
      : `For ${input.targetRole}, you currently match ${matchedRequired.length} of ${
          benchmark.requiredSkills.length
        } core competencies (${readinessScore}% readiness). Prioritize acquiring ${missingRequired.join(
          ", "
        )} through hands-on courses and container/cloud portfolio labs highlighted in the 2026 market briefs.`;

  const actionPlan = [
    missingRequired.length > 0
      ? `Close core gap first: study ${missingRequired.slice(0, 2).join(" & ")} using structured provider labs.`
      : `Deepen advanced specialization in ${benchmark.preferredSkills.join(", ")}.`,
    `Verify ATS resume coverage by shipping a repository project demonstrating ${
      requiredAll.slice(0, 3).join(", ")
    }.`,
    recommendedCourses[0]
      ? `Enroll in "${recommendedCourses[0].title}" to unlock verified skills for ${recommendedCourses[0].coversMissingSkills.join(", ")}.`
      : "Update your My Profile certifications and resume after completing target coursework.",
  ];

  return {
    targetRole: input.targetRole,
    readinessScore,
    traineeSkills: {
      verified: verifiedSkills,
      detected: detectedSkills,
      freshResumeTokens,
    },
    matchedRequired,
    missingRequired,
    missingPreferred,
    recommendedCourses,
    marketSourcesUsed: docs.map((d) => ({ slug: d.slug, title: d.title, updatedAt: d.updatedAt })),
    narrative: llm?.content || fallbackNarrative,
    actionPlan,
    engine: llm ? `external-llm:${llm.provider}:${llm.model}` : "market-doc-analyzer",
  };
}

export async function suggestRoleMatches(traineeId: number) {
  const { trainee, verifiedSkills, detectedSkills, resumeTokens } = await loadItTraineeContext(
    traineeId
  );
  const owned = new Set(
    [...verifiedSkills, ...detectedSkills, ...resumeTokens].map(normalizeName)
  );
  const { docs, combinedContext } = await getMarketDocsWithContent();

  const rankedRoles = IT_ROLE_BENCHMARKS.map((b) => {
    const matchedReq = b.requiredSkills.filter((s) => owned.has(normalizeName(s)));
    const matchedPref = b.preferredSkills.filter((s) => owned.has(normalizeName(s)));
    const missing = b.requiredSkills.filter((s) => !owned.has(normalizeName(s)));

    const reqScore = (matchedReq.length / Math.max(1, b.requiredSkills.length)) * 80;
    const prefScore = (matchedPref.length / Math.max(1, b.preferredSkills.length)) * 20;
    const fitScore = Math.round(reqScore + prefScore);

    return {
      role: b.role,
      category: b.category,
      fitScore,
      matchedSkills: [...matchedReq, ...matchedPref],
      missingSkills: missing,
      marketDemandTrend: b.marketDemandTrend,
      evolutionSummary: b.evolutionSummary,
    };
  }).sort((a, b) => b.fitScore - a.fitScore);

  const top = rankedRoles[0];
  const llm = await generateLlmText([
    {
      role: "system",
      content:
        "You are an IT career advisor inside Skill-Track. Give a crisp 2-3 sentence summary explaining the top role fit and quickest upgrade path based on verified/detected skills and market briefs.",
    },
    {
      role: "user",
      content: [
        `Trainee: ${trainee.fullName}`,
        `Verified skills: ${verifiedSkills.join(", ") || "None"}`,
        `Detected skills: ${detectedSkills.join(", ") || "None"}`,
        `Top Ranked Role: ${top.role} (${top.fitScore}% fit)`,
        `Missing for top role: ${top.missingSkills.join(", ") || "None"}`,
        "",
        combinedContext,
      ].join("\n"),
    },
  ]);

  const fallbackSummary = `Your strongest match today is ${top.role} (${top.fitScore}% fit based on ${
    top.matchedSkills.length
  } matched skills). Closing ${
    top.missingSkills.join(", ") || "advanced specializations"
  } will maximize interview readiness.`;

  return {
    traineeName: trainee.fullName,
    verifiedSkills,
    detectedSkills,
    matches: rankedRoles,
    advisorSummary: llm?.content || fallbackSummary,
    marketSourcesUsed: docs.map((d) => ({ slug: d.slug, title: d.title, updatedAt: d.updatedAt })),
    engine: llm ? `external-llm:${llm.provider}:${llm.model}` : "market-doc-analyzer",
  };
}

export async function getFutureCareerInsights(input: { traineeId: number; focusRole?: string }) {
  const { verifiedSkills, detectedSkills } = await loadItTraineeContext(input.traineeId);
  const { docs, combinedContext } = await getMarketDocsWithContent();

  const focus = input.focusRole?.trim() || "Platform Engineer";
  const focusBenchmark = resolveRoleBenchmark(focus);

  const emergingRoles = [
    {
      role: "Platform Engineer",
      growthSignal: "High Growth",
      whyEmerging:
        "Organizations consolidate standalone DevOps/build scripts into paved internal developer platforms using Kubernetes, Terraform, and GitOps.",
      keySkills: ["Kubernetes", "Terraform", "Docker", "AWS / Cloud", "Git"],
    },
    {
      role: "DevSecOps Associate",
      growthSignal: "+24% YoY Demand",
      whyEmerging:
        "Container SBOM scanning, secret hygiene, and pipeline security gates are now mandatory inside CI/CD workflows.",
      keySkills: ["Docker", "Jenkins", "Kubernetes", "AWS / Cloud"],
    },
    {
      role: "AI Application & Data Systems Engineer",
      growthSignal: "Fastest Emerging",
      whyEmerging:
        "Teams need engineers who pair Python workflows and PostgreSQL/SQL tuning with REST APIs, containers, and LLM evaluation harnesses.",
      keySkills: ["Python", "PostgreSQL", "SQL Tuning", "REST APIs", "Docker"],
    },
  ];

  const llm = await generateLlmText([
    {
      role: "system",
      content:
        "You summarize IT market trends, emerging career paths, and how a specified role is changing using provided market research briefs. Respond in 4 concise bullet points.",
    },
    {
      role: "user",
      content: [
        `Focus Role: ${focus}`,
        `Trainee Skills: ${Array.from(new Set([...verifiedSkills, ...detectedSkills])).join(", ") || "General IT"}`,
        "",
        combinedContext,
      ].join("\n"),
    },
  ]);

  const fallbackBrief = [
    `• Macro Shift: Routine manual release and CRUD-only roles are contracting while automation-first engineering (${emergingRoles
      .map((e) => e.role)
      .join(", ")}) expands.`,
    `• How "${focus}" Is Changing: ${focusBenchmark.evolutionSummary}`,
    `• Priority Skills to Watch: ${focusBenchmark.requiredSkills.join(", ")}.`,
    `• Market Brief Basis: Grounded in ${docs.length} active Markdown intelligence files inside /market-docs.`,
  ].join("\n");

  return {
    focusRole: focus,
    focusAnalysis: {
      demandTrend: focusBenchmark.marketDemandTrend,
      evolutionSummary: focusBenchmark.evolutionSummary,
      coreFutureSkills: focusBenchmark.requiredSkills,
    },
    emergingRoles,
    briefingNarrative: llm?.content || fallbackBrief,
    marketDocs: docs.map((d) => ({
      slug: d.slug,
      title: d.title,
      path: d.path,
      sourceUrl: d.sourceUrl,
      updatedAt: d.updatedAt,
      summary: d.summary,
    })),
    engine: llm ? `external-llm:${llm.provider}:${llm.model}` : "market-doc-analyzer",
  };
}
