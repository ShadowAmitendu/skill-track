import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import { generateLlmText } from "./llmClient.js";
import { getMarketDocsWithContent } from "./marketResearch.js";

async function loadProviderAnalytics(providerId: number) {
  const provider = await prisma.courseProvider.findUnique({
    where: { id: providerId },
    include: {
      courses: {
        include: {
          courseSkills: { include: { skill: true } },
          enrollments: {
            select: {
              status: true,
              dropReason: true,
              kickReason: true,
            },
          },
        },
        orderBy: { popularity: "desc" },
      },
    },
  });

  if (!provider) {
    throw new AppError(404, "Course provider not found");
  }
  return provider;
}

export async function getProviderCourseSuggestions(providerId: number, courseId?: number) {
  const provider = await loadProviderAnalytics(providerId);
  const { docs, combinedContext } = await getMarketDocsWithContent();

  const targetCourses = courseId
    ? provider.courses.filter((c) => c.id === courseId)
    : provider.courses;

  if (courseId && targetCourses.length === 0) {
    throw new AppError(403, "You can only analyze courses owned by your provider account");
  }

  const courseInsights = targetCourses.map((course) => {
    const skillNames = course.courseSkills.map((cs) => cs.skill.name);
    const total = course.enrollments.length;
    const completed = course.enrollments.filter((e) => e.status === "completed").length;
    const dropped = course.enrollments.filter((e) => e.status === "dropped").length;
    const kicked = course.enrollments.filter((e) => e.status === "kicked").length;
    const dropReasons = course.enrollments
      .map((e) => e.dropReason)
      .filter((r): r is string => Boolean(r));

    const suggestions: string[] = [];
    if (course.category === "DevOps" && !skillNames.includes("Kubernetes")) {
      suggestions.push(
        "Pair introductory Docker & CI/CD lessons with a Kubernetes debugging lab to match Platform Engineer demand."
      );
    }
    if (course.category === "Backend" && !skillNames.includes("Docker")) {
      suggestions.push(
        "Add a Docker packaging & REST API contract testing module so graduates meet employer container-readiness expectations."
      );
    }
    if (skillNames.includes("PostgreSQL") && !skillNames.includes("SQL Tuning")) {
      suggestions.push(
        "Include EXPLAIN ANALYZE indexing and SQL Tuning labs alongside schema design."
      );
    }
    if (dropped > 0) {
      suggestions.push(
        `Address learner drop-off (${dropped} drop${dropped > 1 ? "s" : ""}; reasons: ${
          dropReasons.join("; ") || "pacing"
        }) with shorter milestone checkpoints.`
      );
    }
    if (suggestions.length === 0) {
      suggestions.push(
        "Add cloud security/IAM least-privilege labs and portfolio capstone projects aligned with 2026 market briefs."
      );
    }

    return {
      courseId: course.id,
      title: course.title,
      category: course.category,
      popularity: course.popularity,
      currentSkills: skillNames,
      metrics: { totalEnrollments: total, completed, dropped, kicked },
      suggestions,
    };
  });

  const llm = await generateLlmText([
    {
      role: "system",
      content:
        "You are an AI curriculum strategist advising a Skill-Track Course Provider. Base advice solely on course syllabus tags, aggregate completion/drop metrics, and market research briefs. Never invent personal trainee data.",
    },
    {
      role: "user",
      content: [
        `Provider: ${provider.name}`,
        JSON.stringify(courseInsights, null, 2),
        "",
        "Market Research Briefs:",
        combinedContext,
        "",
        "Summarize the highest-impact curriculum improvements across these courses in 3 concise bullet points.",
      ].join("\n"),
    },
  ]);

  const fallbackSummary =
    courseInsights.length === 0
      ? "Publish your first course on Courses & Providers to receive tailored AI syllabus suggestions."
      : courseInsights
          .map((ci) => `• ${ci.title}: ${ci.suggestions[0]}`)
          .join("\n");

  return {
    providerName: provider.name,
    courseInsights,
    executiveRecommendations: llm?.content || fallbackSummary,
    marketSourcesUsed: docs.map((d) => ({ slug: d.slug, title: d.title, updatedAt: d.updatedAt })),
    engine: llm ? `external-llm:${llm.provider}:${llm.model}` : "market-doc-analyzer",
  };
}

export async function chatWithProviderAssistant(input: {
  providerId: number;
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  const provider = await loadProviderAnalytics(input.providerId);
  const { combinedContext, docs } = await getMarketDocsWithContent();

  const courseContextLines = provider.courses.map((c) => {
    const skills = c.courseSkills.map((s) => s.skill.name).join(", ");
    const completed = c.enrollments.filter((e) => e.status === "completed").length;
    const dropped = c.enrollments.filter((e) => e.status === "dropped").length;
    return `- ${c.title} [${c.category}] | Popularity: ${c.popularity} | Skills: ${skills} | Completed: ${completed}, Dropped: ${dropped}`;
  });

  const llm = await generateLlmText([
    {
      role: "system",
      content: [
        `You are Skill-Track's Course Provider Curriculum Assistant for "${provider.name}".`,
        "Help the provider improve courses, close industry skill gaps, and reduce learner dropouts using ONLY their own course metadata and the market briefs below.",
        "Provider Courses:",
        courseContextLines.join("\n") || "No courses yet.",
        "",
        "Market Research Context:",
        combinedContext,
      ].join("\n"),
    },
    ...(input.history || []).slice(-6),
    { role: "user", content: input.message },
  ]);

  let reply = llm?.content || "";
  if (!reply) {
    const lower = input.message.toLowerCase();
    const topCourse = provider.courses[0];
    if (lower.includes("drop") || lower.includes("retention") || lower.includes("complete")) {
      const drops = provider.courses.flatMap((c) =>
        c.enrollments
          .filter((e) => e.status === "dropped" && e.dropReason)
          .map((e) => `${c.title}: "${e.dropReason}"`)
      );
      reply = drops.length
        ? `Looking at your own courses' anonymized drop feedback (${drops.join(
            "; "
          )}), consider adding modular pre-checks, flexible async checkpoints, and clear starter templates.`
        : `Your courses show zero drop alerts right now. Keep reinforcement labs concise and tie every module directly to verified skill outcomes.`;
    } else if (lower.includes("new") || lower.includes("launch") || lower.includes("trend")) {
      reply = `Based on our latest ${docs.length} market briefs, **Platform Engineering (Kubernetes + Terraform + Git)**, **DevSecOps CI/CD security**, and **Data & AI Systems (Python + SQL Tuning + LLM Evals)** have the strongest employer demand gap.`;
    } else {
      reply = topCourse
        ? `For ${provider.name}'s top course "${topCourse.title}" (${topCourse.category}, popularity ${
            topCourse.popularity
          }), our market briefs recommend adding production debugging labs, API contract validation or container hardening alongside ${topCourse.courseSkills
            .map((s) => s.skill.name)
            .join(", ")}. Ask me about retention, syllabus gaps, or new course ideas!`
        : `You haven't published any courses yet under ${provider.name}. Start with a high-demand DevOps (Docker + Kubernetes) or Backend (TypeScript + PostgreSQL) track aligned to current market briefs.`;
    }
  }

  return {
    reply,
    providerName: provider.name,
    engine: llm ? `external-llm:${llm.provider}:${llm.model}` : "market-doc-analyzer",
    sources: docs.map((d) => d.title),
  };
}
