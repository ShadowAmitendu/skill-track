import { prisma } from "../../lib/prisma.js";
import type { UserRole } from "../../middleware/auth.js";

export async function listGroupedSkillsForViewer(viewerRole?: UserRole) {
  const canSeeTrainees = viewerRole === "admin" || viewerRole === "cp";

  const categories = await prisma.skillCategory.findMany({
    include: {
      skills: {
        include: {
          traineeSkills: {
            include: {
              trainee: {
                select: {
                  id: true,
                  fullName: true,
                  roleCategory: true,
                  consent: { select: { status: true } },
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    skills: cat.skills.map((skill) => {
      // Deduplicate trainee IDs across verified + detected sources
      const uniqueTraineesMap = new Map<
        number,
        { id: number; fullName: string; roleCategory: string; consented: boolean }
      >();

      for (const ts of skill.traineeSkills) {
        const consented = ts.trainee.consent?.status ?? false;
        if (viewerRole === "cp" && !consented) continue;
        uniqueTraineesMap.set(ts.trainee.id, {
          id: ts.trainee.id,
          fullName: ts.trainee.fullName,
          roleCategory: ts.trainee.roleCategory,
          consented,
        });
      }

      const trainees = Array.from(uniqueTraineesMap.values()).map(
        ({ id, fullName, roleCategory }) => ({ id, fullName, roleCategory })
      );

      return {
        id: skill.id,
        name: skill.name,
        traineeCount: trainees.length,
        ...(canSeeTrainees ? { trainees } : {}),
      };
    }),
  }));
}

export async function listFlatSkills() {
  const skills = await prisma.skill.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return skills.map((s) => ({
    id: s.id,
    name: s.name,
    categoryId: s.categoryId,
    categoryName: s.category.name,
  }));
}
