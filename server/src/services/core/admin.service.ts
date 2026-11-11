import { prisma } from "../../lib/prisma.js";

export async function getAdminDashboardStats() {
  const [trainees, providers, courses, skills, followUps] = await Promise.all([
    prisma.trainee.findMany({
      include: {
        consent: true,
        employment: true,
        followUps: true,
      },
    }),
    prisma.courseProvider.findMany(),
    prisma.course.count(),
    prisma.skill.findMany({
      include: {
        category: true,
        traineeSkills: { select: { traineeId: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.followUp.findMany({
      include: { trainee: { select: { id: true, fullName: true } } },
      orderBy: { sentAt: "desc" },
      take: 25,
    }),
  ]);

  const consentGivenCount = trainees.filter((t) => t.consent?.status).length;
  const consentRevokedCount = trainees.length - consentGivenCount;
  const emailsStoppedCount = trainees.filter((t) => t.consent?.emailsStopped).length;

  const followUpRespondedCount = trainees.filter((t) =>
    t.followUps.some((f) => f.respondedAt !== null)
  ).length;
  const followUpNotRespondedCount = trainees.length - followUpRespondedCount;

  const employmentByStatus: Record<string, number> = {
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

  let employedCount = 0;
  let unemployedCount = 0;
  let withoutEmploymentRecord = 0;

  for (const t of trainees) {
    if (!t.employment) {
      withoutEmploymentRecord += 1;
      continue;
    }
    const st = t.employment.status;
    employmentByStatus[st] = (employmentByStatus[st] || 0) + 1;
    if (st === "unemployed") {
      unemployedCount += 1;
      if (t.employment.reason) {
        unemployedReasons[t.employment.reason] =
          (unemployedReasons[t.employment.reason] || 0) + 1;
      }
    } else {
      employedCount += 1;
    }
  }

  const skillsDistribution = skills
    .map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category.name,
      traineeCount: new Set(s.traineeSkills.map((ts) => ts.traineeId)).size,
    }))
    .sort((a, b) => b.traineeCount - a.traineeCount);

  return {
    totalTrainees: trainees.length,
    totalCourseProviders: providers.length,
    approvedCourseProviders: providers.filter((p) => p.approvalStatus === "approved").length,
    pendingCourseProviders: providers.filter((p) => p.approvalStatus === "pending").length,
    totalCourses: courses,
    consentGivenCount,
    consentRevokedCount,
    emailsStoppedCount,
    followUpRespondedCount,
    followUpNotRespondedCount,
    employedCount,
    unemployedCount,
    withoutEmploymentRecord,
    employmentByStatus,
    unemployedReasons,
    skillsDistribution,
    recentFollowUps: followUps.map((f) => ({
      id: f.id,
      traineeId: f.traineeId,
      traineeName: f.trainee.fullName,
      sentAt: f.sentAt,
      respondedAt: f.respondedAt,
      note: f.note,
      channel: f.channel,
    })),
  };
}
