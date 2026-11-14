import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import { loadAuthUser, signAuthToken, type UserRole } from "../../middleware/auth.js";

export async function loginWithCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      trainee: { select: { id: true, roleCategory: true } },
      provider: { select: { id: true, approvalStatus: true } },
    },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.role === "cp" && user.provider?.approvalStatus === "pending") {
    throw new AppError(403, "Course provider account is pending administrator approval");
  }

  if (user.role === "cp" && user.provider?.approvalStatus === "rejected") {
    throw new AppError(403, "Course provider account was rejected by an administrator");
  }

  const token = signAuthToken({ userId: user.id, role: user.role as UserRole });
  const authUser = await loadAuthUser(user.id);
  if (!authUser) {
    throw new AppError(500, "Failed to load account profile");
  }

  return { token, user: authUser };
}

export async function registerTraineeAccount(input: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  location?: string;
  roleCategory: "IT" | "Non-IT";
  consentGiven: boolean;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const created = await prisma.user.create({
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
  });

  const token = signAuthToken({ userId: created.id, role: "trainee" });
  const authUser = await loadAuthUser(created.id);
  return { token, user: authUser };
}

export async function registerProviderAccount(input: {
  name: string;
  email: string;
  password: string;
  contactEmail?: string;
  website?: string;
  description?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "cp",
      name: input.name.trim(),
      status: "pending",
      provider: {
        create: {
          name: input.name.trim(),
          contactEmail: (input.contactEmail || email).trim().toLowerCase(),
          website: input.website?.trim() || null,
          description: input.description?.trim() || null,
          approvalStatus: "pending",
        },
      },
    },
    include: { provider: true },
  });

  return {
    pendingApproval: true,
    message: "Course provider registration submitted. An administrator must approve your account before login.",
    provider: {
      id: created.provider!.id,
      name: created.provider!.name,
      approvalStatus: created.provider!.approvalStatus,
    },
  };
}
