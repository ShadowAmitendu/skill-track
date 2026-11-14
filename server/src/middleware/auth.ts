import type { CookieOptions, NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "./errorHandler.js";

export type UserRole = "admin" | "trainee" | "cp";

export interface AuthUser {
  userId: number;
  email: string;
  role: UserRole;
  name: string;
  status: string;
  traineeId: number | null;
  roleCategory: string | null;
  providerId: number | null;
  approvalStatus: string | null;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export const AUTH_COOKIE_NAME = "skilltrack_token";

export function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function signAuthToken(payload: { userId: number; role: UserRole }) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export async function loadAuthUser(userId: number): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      status: true,
      trainee: { select: { id: true, roleCategory: true } },
      provider: { select: { id: true, approvalStatus: true } },
    },
  });

  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
    name: user.name,
    status: user.status,
    traineeId: user.trainee?.id ?? null,
    roleCategory: user.trainee?.roleCategory ?? null,
    providerId: user.provider?.id ?? null,
    approvalStatus: user.provider?.approvalStatus ?? null,
  };
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      next();
      return;
    }
    const decoded = jwt.verify(token, env.jwtSecret) as { userId?: number; role?: string };
    if (decoded?.userId) {
      const user = await loadAuthUser(decoded.userId);
      if (user) {
        req.auth = user;
      }
    }
    next();
  } catch {
    next();
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    let decoded: { userId?: number; role?: string };
    try {
      decoded = jwt.verify(token, env.jwtSecret) as { userId?: number; role?: string };
    } catch {
      throw new AppError(401, "Invalid or expired session");
    }

    if (!decoded.userId) {
      throw new AppError(401, "Invalid session token");
    }

    const user = await loadAuthUser(decoded.userId);
    if (!user) {
      throw new AppError(401, "Account no longer exists");
    }

    if (user.role === "cp" && user.approvalStatus !== "approved") {
      throw new AppError(403, "Course provider account is awaiting admin approval");
    }

    if (user.status === "rejected") {
      throw new AppError(403, "Account access has been rejected");
    }

    req.auth = user;
    next();
  } catch (err) {
    next(err);
  }
}
