import { prisma } from "../../lib/prisma.js";
import type { UserRole } from "../../middleware/auth.js";

export const EMPLOYMENT_STATUSES = [
  "full_time",
  "part_time",
  "internship",
  "self_employed",
  "unemployed",
] as const;

export async function getEmploymentOverviewForViewer(
  viewerRole: UserRole,
  filters: { status?: string; search?: string }
) {
  const rows = await prisma.trainee.findMany({
    where: {
      employment: { isNot: null },
      ...(viewerRole === "cp" ? { consent: { is: { status: true } } } : {}),
    },
    include: {
      employment: true,
      consent: true,
    },
    orderBy: { id: "asc" },
  });

  const statusCounts: Record<string, number> = {
    full_time: 0,
    part_time: 0,
    internship: 0,
    self_employed: 0,
    unemployed: 0,
  };

  const unemployedReasons: Record<string, number> = {
    break: 0,
    actively_looking: 0,
  };

  for (const t of rows) {
    const st = t.employment!.status;
    statusCounts[st] = (statusCounts[st] || 0) + 1;
    if (st === "unemployed" && t.employment!.reason) {
      unemployedReasons[t.employment!.reason] =
        (unemployedReasons[t.employment!.reason] || 0) + 1;
    }
  }

  const q = (filters.search || "").trim().toLowerCase();
  const cleanId = q.replace(/^#/, "");

  const projected = rows.map((t) => ({
    traineeId: t.id,
    fullName: t.fullName,
    roleCategory: t.roleCategory,
    location: t.location,
    status: t.employment!.status,
    role: t.employment!.role,
    company: t.employment!.company,
    // Hide salary from CPs
    salary: viewerRole === "cp" ? null : t.employment!.salary,
    reason: t.employment!.reason,
    updatedAt: t.employment!.updatedAt,
  }));

  const filtered = projected.filter((row) => {
    const matchStatus = !filters.status || filters.status === "ALL" || row.status === filters.status;
    const matchSearch =
      !q ||
      row.fullName.toLowerCase().includes(q) ||
      String(row.traineeId) === cleanId ||
      (row.role?.toLowerCase().includes(q) ?? false);
    return matchStatus && matchSearch;
  });

  const employedSortedByRole = [...projected]
    .filter((r) => r.status !== "unemployed")
    .sort((a, b) => (a.role || "zzz").localeCompare(b.role || "zzz") || a.fullName.localeCompare(b.fullName));

  const unemployedList = projected.filter((r) => r.status === "unemployed");

  return {
    totalWithEmployment: rows.length,
    statusCounts,
    unemployedReasons,
    records: filtered,
    employedSortedByRole,
    unemployedList,
  };
}

export async function upsertOwnEmployment(
  traineeId: number,
  input: {
    status: (typeof EMPLOYMENT_STATUSES)[number];
    role?: string;
    company?: string;
    salary?: number | null;
    reason?: "break" | "actively_looking" | null;
  }
) {
  const isUnemployed = input.status === "unemployed";
  const cleanRole = isUnemployed ? null : input.role?.trim() || null;
  const cleanCompany = isUnemployed ? null : input.company?.trim() || null;
  const cleanSalary = isUnemployed ? null : input.salary ?? null;
  const cleanReason = isUnemployed ? input.reason || "actively_looking" : null;

  const employment = await prisma.employment.upsert({
    where: { traineeId },
    update: {
      status: input.status,
      role: cleanRole,
      company: cleanCompany,
      salary: cleanSalary,
      reason: cleanReason,
    },
    create: {
      traineeId,
      status: input.status,
      role: cleanRole,
      company: cleanCompany,
      salary: cleanSalary,
      reason: cleanReason,
    },
  });

  if (!isUnemployed && cleanSalary != null && cleanRole && cleanCompany) {
    const latest = await prisma.salaryHistory.findFirst({
      where: { traineeId },
      orderBy: { recordedAt: "desc" },
    });
    if (!latest || latest.amount !== cleanSalary || latest.role !== cleanRole) {
      await prisma.salaryHistory.create({
        data: {
          traineeId,
          amount: cleanSalary,
          role: cleanRole,
          company: cleanCompany,
        },
      });
    }
  }

  await prisma.trainee.update({
    where: { id: traineeId },
    data: { lastProfileUpdate: new Date() },
  });

  return employment;
}

export async function deleteOwnEmployment(traineeId: number) {
  await prisma.employment.deleteMany({ where: { traineeId } });
  await prisma.trainee.update({
    where: { id: traineeId },
    data: { lastProfileUpdate: new Date() },
  });
}
