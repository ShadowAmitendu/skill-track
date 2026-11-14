import path from "node:path";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import { removeDiskFile } from "../../middleware/upload.js";
import type { UserRole } from "../../middleware/auth.js";
import {
  extractAtsSkillTokens,
  extractTextFromResumeFile,
  syncDetectedTraineeSkills,
} from "../ai/atsParser.js";

const traineeFullInclude = {
  user: { select: { id: true, email: true, status: true } },
  skills: {
    include: {
      skill: { include: { category: true } },
    },
  },
  certifications: true,
  projects: true,
  enrollments: {
    include: {
      course: { include: { provider: { select: { id: true, name: true } } } },
    },
    orderBy: { enrolledAt: "desc" as const },
  },
  employment: true,
  salaryHistory: { orderBy: { recordedAt: "desc" as const } },
  consent: true,
  followUps: { orderBy: { sentAt: "desc" as const } },
  resumes: { orderBy: { uploadedAt: "desc" as const } },
};

type RawTraineeRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.trainee.findUnique<{ where: { id: number }; include: typeof traineeFullInclude }>>>
>;

export function projectTraineeForRole(record: RawTraineeRecord, viewerRole: UserRole) {
  const base = {
    id: record.id,
    userId: record.userId,
    fullName: record.fullName,
    roleCategory: record.roleCategory,
    bio: record.bio,
    lastProfileUpdate: record.lastProfileUpdate,
    consentGiven: record.consent?.status ?? false,
    consentUpdatedAt: record.consent?.updatedAt ?? null,
    skills: record.skills.map((ts) => ({
      id: ts.id,
      skillId: ts.skillId,
      name: ts.skill.name,
      categoryName: ts.skill.category.name,
      source: ts.source as "verified" | "detected",
    })),
    certifications: record.certifications,
    projects: record.projects,
    enrollments: record.enrollments.map((en) => ({
      id: en.id,
      courseId: en.courseId,
      courseTitle: en.course.title,
      courseCategory: en.course.category,
      providerId: en.course.providerId,
      providerName: en.course.provider.name,
      status: en.status as "enrolled" | "completed" | "dropped" | "kicked",
      dropReason: en.dropReason,
      kickReason: en.kickReason,
      enrolledAt: en.enrolledAt,
      completedAt: en.completedAt,
    })),
  };

  if (viewerRole === "cp") {
    return {
      ...base,
      location: record.location,
      // Strict redaction: NO email, phone, salary, salaryHistory, resumes, or followUp private details for CP
      employment: record.employment
        ? {
            status: record.employment.status,
            role: record.employment.role,
            company: record.employment.company,
            salary: null,
            reason: record.employment.reason,
            updatedAt: record.employment.updatedAt,
          }
        : null,
    };
  }

  // Admin & self trainee get complete details (still never exposing passwordHash)
  return {
    ...base,
    email: record.user.email,
    phone: record.phone,
    location: record.location,
    emailsStopped: record.consent?.emailsStopped ?? false,
    employment: record.employment,
    salaryHistory: record.salaryHistory,
    followUps: record.followUps,
    resumes: record.resumes.map((r) => ({
      id: r.id,
      fileName: r.fileName,
      extractedTokens: safeParseTokens(r.extractedTokens),
      uploadedAt: r.uploadedAt,
    })),
  };
}

function safeParseTokens(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function listTraineesForViewer(viewerRole: UserRole, search = "") {
  const rows = await prisma.trainee.findMany({
    where:
      viewerRole === "cp"
        ? {
            consent: { is: { status: true } },
          }
        : undefined,
    include: traineeFullInclude,
    orderBy: { id: "asc" },
  });

  const q = search.trim().toLowerCase();
  const cleanId = q.replace(/^#/, "");

  const filtered = q
    ? rows.filter(
        (t) =>
          t.fullName.toLowerCase().includes(q) ||
          String(t.id) === cleanId ||
          (t.employment?.role?.toLowerCase().includes(q) ?? false) ||
          (t.location?.toLowerCase().includes(q) ?? false) ||
          (viewerRole !== "cp" && t.user.email.toLowerCase().includes(q))
      )
    : rows;

  return filtered.map((row) => projectTraineeForRole(row, viewerRole));
}

export async function getTraineeProfileForViewer(traineeId: number, viewerRole: UserRole) {
  const row = await prisma.trainee.findUnique({
    where: { id: traineeId },
    include: traineeFullInclude,
  });

  if (!row) {
    throw new AppError(404, "Trainee not found");
  }

  if (viewerRole === "cp" && !row.consent?.status) {
    throw new AppError(403, "Trainee has not granted consent for Course Provider visibility");
  }

  return projectTraineeForRole(row, viewerRole);
}

export async function updateOwnTraineeProfile(
  traineeId: number,
  data: {
    fullName?: string;
    phone?: string;
    location?: string;
    roleCategory?: "IT" | "Non-IT";
    bio?: string;
  }
) {
  const updated = await prisma.trainee.update({
    where: { id: traineeId },
    data: {
      ...(data.fullName ? { fullName: data.fullName.trim() } : {}),
      ...(data.phone !== undefined ? { phone: data.phone.trim() || null } : {}),
      ...(data.location !== undefined ? { location: data.location.trim() || null } : {}),
      ...(data.roleCategory ? { roleCategory: data.roleCategory } : {}),
      ...(data.bio !== undefined ? { bio: data.bio.trim() || null } : {}),
      lastProfileUpdate: new Date(),
    },
    include: traineeFullInclude,
  });

  if (data.fullName) {
    await prisma.user.update({
      where: { id: updated.userId },
      data: { name: data.fullName.trim() },
    });
  }

  return projectTraineeForRole(updated, "trainee");
}

export async function createTraineeByAdmin(input: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  location?: string;
  roleCategory: "IT" | "Non-IT";
  consentGiven: boolean;
}) {
  const email = input.email.trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError(409, "A user with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "trainee",
      name: input.fullName.trim(),
      status: "active",
      trainee: {
        create: {
          fullName: input.fullName.trim(),
          phone: input.phone?.trim() || null,
          location: input.location?.trim() || null,
          roleCategory: input.roleCategory,
          consent: {
            create: {
              status: input.consentGiven,
              emailsStopped: false,
            },
          },
        },
      },
    },
    include: { trainee: { include: traineeFullInclude } },
  });

  return projectTraineeForRole(user.trainee!, "admin");
}

export async function deleteTraineeAndFiles(traineeId: number) {
  const trainee = await prisma.trainee.findUnique({
    where: { id: traineeId },
    include: { resumes: true },
  });
  if (!trainee) throw new AppError(404, "Trainee not found");

  for (const resume of trainee.resumes) {
    removeDiskFile(resume.path);
  }

  await prisma.user.delete({ where: { id: trainee.userId } });
}

export async function saveUploadedResume(traineeId: number, file: Express.Multer.File) {
  const relPath = path.relative(process.cwd().includes("server") ? path.resolve(process.cwd(), "..") : process.cwd(), file.path);
  const rawText = await extractTextFromResumeFile(file.path);
  const { matchedSkills, tokens } = await extractAtsSkillTokens(rawText);

  await syncDetectedTraineeSkills(
    traineeId,
    matchedSkills.map((s) => s.skillId)
  );

  const saved = await prisma.resume.create({
    data: {
      traineeId,
      fileName: file.originalname,
      path: relPath.replace(/\\/g, "/"),
      extractedTokens: JSON.stringify(tokens),
    },
  });

  await prisma.trainee.update({
    where: { id: traineeId },
    data: { lastProfileUpdate: new Date() },
  });

  return {
    resume: {
      id: saved.id,
      fileName: saved.fileName,
      extractedTokens: tokens,
      uploadedAt: saved.uploadedAt,
    },
    matchedSkills,
    rawTextPreview: rawText.slice(0, 600),
  };
}
