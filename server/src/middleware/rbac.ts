import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler.js";
import type { UserRole } from "./auth.js";

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(new AppError(401, "Authentication required"));
      return;
    }
    if (!allowedRoles.includes(req.auth.role)) {
      next(new AppError(403, "Forbidden: insufficient role permissions"));
      return;
    }
    if (req.auth.role === "cp" && req.auth.approvalStatus !== "approved") {
      next(new AppError(403, "Course provider account is pending admin approval"));
      return;
    }
    next();
  };
}

export function requireItTrainee(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) {
    next(new AppError(401, "Authentication required"));
    return;
  }
  if (req.auth.role !== "trainee" || !req.auth.traineeId) {
    next(new AppError(403, "Only trainees can access AI career endpoints"));
    return;
  }
  if (req.auth.roleCategory !== "IT") {
    next(
      new AppError(
        403,
        "AI career tools (Skill Gap, Role Match, Future Careers) are restricted to trainees in the IT category"
      )
    );
    return;
  }
  next();
}
