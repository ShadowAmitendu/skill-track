import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { UserRole } from "../../middleware/auth.js";

export async function listProvidersForViewer(viewerRole: UserRole, search = "") {
  const providers = await prisma.courseProvider.findMany({
    where:
      viewerRole === "admin"
        ? undefined
        : {
            approvalStatus: "approved",
          },
    include: {
      _count: { select: { courses: true } },
    },
    orderBy: { id: "asc" },
  });

  const q = search.trim().toLowerCase();
  const filtered = q
    ? providers.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.contactEmail.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false)
      )
    : providers;

  return filtered.map((p) => ({
    id: p.id,
    userId: p.userId,
    name: p.name,
    contactEmail: p.contactEmail,
    website: p.website,
    description: p.description,
    approvalStatus: p.approvalStatus,
    courseCount: p._count.courses,
  }));
}

export async function getProviderProfileById(id: number, viewerRole: UserRole) {
  const provider = await prisma.courseProvider.findUnique({
    where: { id },
    include: {
      courses: {
        include: {
          courseSkills: { include: { skill: { include: { category: true } } } },
        },
        orderBy: { popularity: "desc" },
      },
    },
  });

  if (!provider) {
    throw new AppError(404, "Course provider not found");
  }

  if (viewerRole !== "admin" && provider.approvalStatus !== "approved") {
    throw new AppError(404, "Course provider is not publicly available");
  }

  return {
    id: provider.id,
    name: provider.name,
    contactEmail: provider.contactEmail,
    website: provider.website,
    description: provider.description,
    approvalStatus: provider.approvalStatus,
    courses: provider.courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      providerId: c.providerId,
      providerName: provider.name,
      popularity: c.popularity,
      durationWeeks: c.durationWeeks,
      skills: c.courseSkills.map((cs) => ({
        id: cs.skill.id,
        name: cs.skill.name,
        categoryId: cs.skill.categoryId,
        categoryName: cs.skill.category.name,
      })),
    })),
  };
}

export async function createProviderByAdmin(input: {
  name: string;
  email: string;
  password: string;
  contactEmail?: string;
  website?: string;
  description?: string;
  approvalStatus?: "approved" | "pending";
}) {
  const email = input.email.trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError(409, "A user with this email already exists");

  const status = input.approvalStatus ?? "approved";
  const passwordHash = await bcrypt.hash(input.password, 10);

  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "cp",
      name: input.name.trim(),
      status: status === "approved" ? "active" : "pending",
      provider: {
        create: {
          name: input.name.trim(),
          contactEmail: (input.contactEmail || email).trim().toLowerCase(),
          website: input.website?.trim() || null,
          description: input.description?.trim() || null,
          approvalStatus: status,
        },
      },
    },
    include: { provider: true },
  });

  return created.provider!;
}

export async function updateProviderByAdmin(
  providerId: number,
  input: {
    name?: string;
    contactEmail?: string;
    website?: string;
    description?: string;
    approvalStatus?: "pending" | "approved" | "rejected";
  }
) {
  const existing = await prisma.courseProvider.findUnique({ where: { id: providerId } });
  if (!existing) throw new AppError(404, "Course provider not found");

  const updated = await prisma.courseProvider.update({
    where: { id: providerId },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.contactEmail ? { contactEmail: input.contactEmail.trim().toLowerCase() } : {}),
      ...(input.website !== undefined ? { website: input.website.trim() || null } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
      ...(input.approvalStatus ? { approvalStatus: input.approvalStatus } : {}),
    },
  });

  if (input.name || input.approvalStatus) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.approvalStatus
          ? {
              status:
                input.approvalStatus === "approved"
                  ? "active"
                  : input.approvalStatus === "rejected"
                    ? "rejected"
                    : "pending",
            }
          : {}),
      },
    });
  }

  return updated;
}

export async function removeProviderByAdmin(providerId: number) {
  const existing = await prisma.courseProvider.findUnique({ where: { id: providerId } });
  if (!existing) throw new AppError(404, "Course provider not found");
  await prisma.user.delete({ where: { id: existing.userId } });
}
