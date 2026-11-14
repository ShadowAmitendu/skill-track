import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { prisma } from "../../lib/prisma.js";

const require = createRequire(import.meta.url);

export async function extractTextFromResumeFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === ".pdf") {
    try {
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const parsed = await pdfParse(buffer);
      if (parsed?.text?.trim()) {
        return parsed.text;
      }
    } catch (err) {
      console.warn("pdf-parse fallback to utf8 scan:", err);
    }
  }
  return buffer.toString("utf8");
}

const TOKEN_SYNONYMS: Record<string, string[]> = {
  "AWS / Cloud": ["aws", "amazon web services", "cloud", "ec2", "iam", "s3"],
  "SQL Tuning": ["sql tuning", "query optimization", "indexing", "explain analyze"],
  "REST APIs": ["rest", "restful", "openapi", "http api"],
  "Spring Boot": ["spring boot", "spring", "jpa", "hibernate"],
  "Node.js": ["node.js", "nodejs", "express"],
  TypeScript: ["typescript", "ts"],
  PostgreSQL: ["postgresql", "postgres", "psql"],
  Kubernetes: ["kubernetes", "k8s", "helm", "kubectl"],
  Docker: ["docker", "container", "dockerfile", "compose"],
  Jenkins: ["jenkins", "ci/cd", "pipeline"],
  Terraform: ["terraform", "iac", "hcl"],
  React: ["react", "reactjs", "vite"],
  Python: ["python", "pandas", "fastapi", "etl"],
  Java: ["java", "jvm", "maven", "gradle"],
  Git: ["git", "github", "gitlab"],
};

export async function extractAtsSkillTokens(rawText: string) {
  const catalogSkills = await prisma.skill.findMany({ include: { category: true } });
  const normalizedText = rawText.toLowerCase();

  const matched: Array<{ skillId: number; name: string; categoryName: string }> = [];

  for (const skill of catalogSkills) {
    const terms = new Set<string>([
      skill.name.toLowerCase(),
      ...(TOKEN_SYNONYMS[skill.name] || []),
    ]);

    const found = Array.from(terms).some((term) => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
      return regex.test(normalizedText);
    });

    if (found) {
      matched.push({
        skillId: skill.id,
        name: skill.name,
        categoryName: skill.category.name,
      });
    }
  }

  // Extract additional general technical tokens even if not yet in Skill table
  const extraMatches = rawText.match(
    /\b(Go|Golang|Rust|GraphQL|Redis|Kafka|Linux|Ansible|Prometheus|Grafana|Next\.js|Tailwind)\b/gi
  );
  const extraTokens = Array.from(new Set((extraMatches || []).map((t) => t.trim())));

  return {
    matchedSkills: matched,
    tokens: Array.from(new Set([...matched.map((m) => m.name), ...extraTokens])),
  };
}

export async function syncDetectedTraineeSkills(traineeId: number, skillIds: number[]) {
  if (skillIds.length === 0) return;

  const existingVerified = await prisma.traineeSkill.findMany({
    where: { traineeId, source: "verified" },
    select: { skillId: true },
  });
  const verifiedSet = new Set(existingVerified.map((s) => s.skillId));

  for (const skillId of skillIds) {
    if (verifiedSet.has(skillId)) continue;
    await prisma.traineeSkill.upsert({
      where: {
        traineeId_skillId_source: {
          traineeId,
          skillId,
          source: "detected",
        },
      },
      update: {},
      create: {
        traineeId,
        skillId,
        source: "detected",
      },
    });
  }
}
