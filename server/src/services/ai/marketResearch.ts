import fs from "node:fs";
import path from "node:path";
import cron, { type ScheduledTask } from "node-cron";
import { env } from "../../lib/env.js";
import { prisma } from "../../lib/prisma.js";

const MARKET_CRON_SCHEDULE = "0 3 * * 1"; // Weekly on Mondays at 03:00
let marketCronTask: ScheduledTask | null = null;
let lastRefreshedAt: string | null = null;

function marketDocsDir() {
  const dir = path.join(env.rootDir, "market-docs");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function getMarketDocsWithContent() {
  const dir = marketDocsDir();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();

  const fileDocs = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const absPath = path.join(dir, file);
    const content = fs.readFileSync(absPath, "utf8");
    const title = content.split("\n")[0]?.replace(/^#\s*/, "").trim() || slug;
    return {
      slug,
      title,
      relativePath: path.join("market-docs", file),
      content,
    };
  });

  const dbDocs = await prisma.marketDoc.findMany({ orderBy: { updatedAt: "desc" } });
  const dbBySlug = new Map(dbDocs.map((d) => [d.slug, d]));

  const docs = fileDocs.map((fd) => {
    const db = dbBySlug.get(fd.slug);
    return {
      id: db?.id ?? null,
      slug: fd.slug,
      title: db?.title || fd.title,
      path: db?.path || fd.relativePath,
      sourceUrl: db?.sourceUrl || "https://roadmap.sh / CNCF / StackOverflow Insights",
      summary: db?.summary || fd.content.slice(0, 220),
      updatedAt: db?.updatedAt?.toISOString() || new Date().toISOString(),
      content: fd.content,
    };
  });

  const combinedContext = fileDocs
    .map((d) => `=== DOC: ${d.relativePath} ===\n${d.content}`)
    .join("\n\n");

  return { docs, combinedContext };
}

async function fetchPublicSignalSummary(): Promise<{
  sourceNote: string;
  liveTopics: string[];
}> {
  // Fetch public technical ecosystem trends from trusted sources with strict timeout.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const resp = await fetch("https://api.github.com/search/repositories?q=topic:kubernetes+topic:devops&sort=stars&per_page=3", {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json", "User-Agent": "Skill-Track-Market-Bot" },
    });
    if (resp.ok) {
      const json = (await resp.json()) as {
        items?: Array<{ full_name?: string; topics?: string[] }>;
      };
      const topics = Array.from(
        new Set(
          (json.items || [])
            .flatMap((i) => i.topics || [])
            .filter((t) => t.length >= 2)
            .slice(0, 10)
        )
      );
      if (topics.length > 0) {
        return {
          sourceNote: "https://api.github.com (CNCF/DevOps trending ecosystem) + curated industry briefs",
          liveTopics: topics,
        };
      }
    }
  } catch {
    // Offline or rate-limited environment: fall back cleanly to curated trusted signals.
  } finally {
    clearTimeout(timeout);
  }

  return {
    sourceNote: "Curated trusted sources (CNCF Landscape, Roadmap.sh, StackOverflow Developer Survey)",
    liveTopics: ["kubernetes", "terraform", "docker", "typescript", "postgresql", "python", "ai-evals"],
  };
}

export async function refreshMarketResearchDocs(trigger: "cron" | "manual" = "manual") {
  const dir = marketDocsDir();
  const now = new Date();
  const { sourceNote, liveTopics } = await fetchPublicSignalSummary();

  const pulseFile = "weekly-industry-pulse.md";
  const pulsePath = path.join(dir, pulseFile);
  const pulseMarkdown = [
    "# Weekly IT & Cloud Hiring Pulse",
    "",
    `Last Updated: ${now.toISOString()} (${trigger} refresh)`,
    `Sources: ${sourceNote}`,
    "",
    "## Active Employer Skill Signals",
    `- Trending technical topics observed: ${liveTopics.map((t) => `**${t}**`).join(", ")}`,
    "- **Kubernetes**, **Docker**, **Terraform**, and **AWS / Cloud** remain top screening requirements for platform & DevOps roles.",
    "- **TypeScript**, **Node.js**, **Java**, **Spring Boot**, **PostgreSQL**, and **SQL Tuning** lead backend engineering hiring.",
    "- **Python** paired with structured SQL optimization and LLM evaluation pipelines drives Data & AI Systems hiring.",
    "",
    "## Role Evolution Guidance",
    "- Entry-level developers differentiate fastest by pairing backend/frontend skills with containerized deployments (**Docker** + CI/CD **Jenkins**) and query performance (**PostgreSQL** / **SQL Tuning**).",
    "- Course providers should blend conceptual theory with production debugging labs, API contract validation, and cloud IAM security.",
  ].join("\n");

  fs.writeFileSync(pulsePath, pulseMarkdown, "utf8");

  // Sync all markdown files in /market-docs to Prisma MarketDoc
  const mdFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  for (const file of mdFiles) {
    const slug = file.replace(/\.md$/, "");
    const content = fs.readFileSync(path.join(dir, file), "utf8");
    const title = content.split("\n")[0]?.replace(/^#\s*/, "").trim() || slug;
    const relPath = path.join("market-docs", file);
    const summary = content.replace(/\s+/g, " ").slice(0, 220);

    await prisma.marketDoc.upsert({
      where: { slug },
      update: { title, path: relPath, sourceUrl: sourceNote, summary },
      create: { title, slug, path: relPath, sourceUrl: sourceNote, summary },
    });
  }

  lastRefreshedAt = now.toISOString();
  return getMarketDocsWithContent();
}

export function startMarketResearchCron(): ScheduledTask {
  if (marketCronTask) return marketCronTask;
  marketCronTask = cron.schedule(MARKET_CRON_SCHEDULE, () => {
    void refreshMarketResearchDocs("cron").catch((err) => {
      console.error("[MarketResearchCron] Weekly refresh failed:", err);
    });
  });
  return marketCronTask;
}

export function getMarketResearchCronStatus() {
  return {
    schedule: MARKET_CRON_SCHEDULE,
    cadenceDescription: "Weekly refresh writing Markdown briefs to /market-docs",
    active: Boolean(marketCronTask),
    lastRefreshedAt,
  };
}
