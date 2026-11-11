import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { AuthUser } from "../../middleware/auth.js";

export async function listCoursesForViewer(
  viewer: AuthUser,
  filters: {
    search?: string;
    skillId?: number;
    category?: string;
    providerId?: number;
    sort?: string;
    recommendedOnly?: boolean;
  }
) {
  const courses = await prisma.course.findMany({
    where: {
      provider: { approvalStatus: "approved" },
      ...(filters.category && filters.category !== "ALL" ? { category: filters.category } : {}),
      ...(filters.providerId ? { providerId: filters.providerId } : {}),
      ...(filters.skillId
        ? { courseSkills: { some: { skillId: filters.skillId } } }
        : {}),
    },
    include: {
      provider: { select: { id: true, name: true } },
      courseSkills: { include: { skill: { include: { category: true } } } },
      enrollments: {
        where: { status: "enrolled" },
        include: {
          trainee: {
            select: { id: true, fullName: true, consent: { select: { status: true } } },
          },
        },
      },
    },
    orderBy:
      filters.sort === "title" ? { title: "asc" } : [{ popularity: "desc" }, { id: "asc" }],
  });

  // Deterministic rule-based recommendation for trainees:
  // skills the trainee lacks within their category, ranked by course popularity (no ML)
  let traineeSkillIds = new Set<number>();
  let traineeCategories = new Set<string>();
  let activeOrCompletedCourseIds = new Set<number>();

  if (viewer.role === "trainee" && viewer.traineeId) {
    const trainee = await prisma.trainee.findUnique({
      where: { id: viewer.traineeId },
      include: {
        skills: { include: { skill: { include: { category: true } } } },
        enrollments: { where: { status: { in: ["enrolled", "completed"] } } },
      },
    });
    if (trainee) {
      traineeSkillIds = new Set(trainee.skills.map((s) => s.skillId));
      traineeCategories = new Set(trainee.skills.map((s) => s.skill.category.name));
      activeOrCompletedCourseIds = new Set(trainee.enrollments.map((e) => e.courseId));
      if (traineeCategories.size === 0 && trainee.roleCategory === "IT") {
        traineeCategories = new Set(["Backend", "DevOps", "Cloud"]);
      }
    }
  }

  const q = (filters.search || "").trim().toLowerCase();

  let mapped = courses
    .filter((c) => {
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.provider.name.toLowerCase().includes(q) ||
        c.courseSkills.some((cs) => cs.skill.name.toLowerCase().includes(q))
      );
    })
    .map((c) => {
      const skills = c.courseSkills.map((cs) => ({
        id: cs.skill.id,
        name: cs.skill.name,
        categoryId: cs.skill.categoryId,
        categoryName: cs.skill.category.name,
      }));

      let recommendationScore = 0;
      let recommendedReason: string | undefined;

      if (viewer.role === "trainee" && !activeOrCompletedCourseIds.has(c.id)) {
        const missingSameCategory = skills.filter(
          (s) =>
            !traineeSkillIds.has(s.id) &&
            (traineeCategories.has(s.categoryName) || traineeCategories.has(c.category))
        );
        const missingAny = skills.filter((s) => !traineeSkillIds.has(s.id));

        if (missingSameCategory.length > 0) {
          recommendationScore = missingSameCategory.length * 100 + c.popularity;
          recommendedReason = `Covers ${missingSameCategory.length} missing skill(s) in your category: ${missingSameCategory
            .map((m) => m.name)
            .join(", ")}`;
        } else if (missingAny.length > 0 && traineeCategories.size === 0) {
          recommendationScore = missingAny.length * 50 + c.popularity;
          recommendedReason = `Builds new skills: ${missingAny.map((m) => m.name).join(", ")}`;
        }
      }

      const canSeeRoster =
        viewer.role === "admin" ||
        (viewer.role === "cp" && viewer.providerId === c.providerId);

      const activeTrainees = canSeeRoster
        ? c.enrollments
            .filter((en) => viewer.role === "admin" || en.trainee.consent?.status)
            .map((en) => ({
              enrollmentId: en.id,
              traineeId: en.traineeId,
              fullName: en.trainee.fullName,
              status: en.status,
            }))
        : undefined;

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        providerId: c.providerId,
        providerName: c.provider.name,
        popularity: c.popularity,
        durationWeeks: c.durationWeeks,
        skills,
        recommendationScore,
        recommendedReason,
        ...(activeTrainees ? { activeTrainees } : {}),
      };
    });

  if (filters.recommendedOnly && viewer.role === "trainee") {
    mapped = mapped
      .filter((c) => (c.recommendationScore || 0) > 0)
      .sort(
        (a, b) =>
          b.popularity - a.popularity ||
          (b.recommendationScore || 0) - (a.recommendationScore || 0)
      );
  }

  return mapped;
}

export async function createCourseForProvider(
  providerId: number,
  input: {
    title: string;
    description: string;
    category: string;
    durationWeeks: number;
    skillIds: number[];
  }
) {
  return prisma.course.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      durationWeeks: input.durationWeeks,
      providerId,
      popularity: 1,
      courseSkills: {
        create: input.skillIds.map((skillId) => ({ skillId })),
      },
    },
    include: {
      provider: { select: { name: true } },
      courseSkills: { include: { skill: { include: { category: true } } } },
    },
  });
}

export async function updateCourseForProvider(
  courseId: number,
  providerId: number,
  input: {
    title?: string;
    description?: string;
    category?: string;
    durationWeeks?: number;
    skillIds?: number[];
  }
) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found");
  if (course.providerId !== providerId) {
    throw new AppError(403, "Course providers may only edit their own courses");
  }

  return prisma.$transaction(async (tx) => {
    if (input.skillIds) {
      await tx.courseSkill.deleteMany({ where: { courseId } });
      await tx.courseSkill.createMany({
        data: input.skillIds.map((skillId) => ({ courseId, skillId })),
      });
    }
    return tx.course.update({
      where: { id: courseId },
      data: {
        ...(input.title ? { title: input.title.trim() } : {}),
        ...(input.description ? { description: input.description.trim() } : {}),
        ...(input.category ? { category: input.category.trim() } : {}),
        ...(input.durationWeeks ? { durationWeeks: input.durationWeeks } : {}),
      },
    });
  });
}

export async function deleteCourseForProvider(courseId: number, providerId: number) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found");
  if (course.providerId !== providerId) {
    throw new AppError(403, "Course providers may only delete their own courses");
  }
  await prisma.course.delete({ where: { id: courseId } });
}

export async function kickTraineeFromCourse(
  courseId: number,
  providerId: number,
  traineeId: number,
  reason: string
) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found");
  if (course.providerId !== providerId) {
    throw new AppError(403, "You can only kick trainees from your own courses");
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { traineeId_courseId: { traineeId, courseId } },
  });
  if (!enrollment || enrollment.status !== "enrolled") {
    throw new AppError(404, "Trainee is not currently enrolled in this course");
  }

  return prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      status: "kicked",
      kickReason: reason.trim(),
    },
  });
}
