import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

const enrollSchema = z.object({
  courseId: z.number().int().positive(),
});

const dropSchema = z.object({
  reason: z.string().trim().min(3, "Drop reason is required"),
});

router.post(
  "/",
  requireAuth,
  requireRole("trainee"),
  validateBody(enrollSchema),
  async (req, res, next) => {
    try {
      const traineeId = req.auth!.traineeId!;
      const courseId = req.body.courseId;

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { provider: { select: { approvalStatus: true } } },
      });
      if (!course || course.provider.approvalStatus !== "approved") {
        throw new AppError(404, "Course not found or provider not approved");
      }

      const existing = await prisma.enrollment.findUnique({
        where: { traineeId_courseId: { traineeId, courseId } },
      });

      if (existing?.status === "enrolled") {
        throw new AppError(409, "Already enrolled in this course");
      }
      if (existing?.status === "completed") {
        throw new AppError(409, "Course already completed");
      }

      const enrollment = existing
        ? await prisma.enrollment.update({
            where: { id: existing.id },
            data: { status: "enrolled", dropReason: null, kickReason: null },
          })
        : await prisma.$transaction(async (tx) => {
            await tx.course.update({
              where: { id: courseId },
              data: { popularity: { increment: 1 } },
            });
            return tx.enrollment.create({
              data: { traineeId, courseId, status: "enrolled" },
            });
          });

      await prisma.trainee.update({
        where: { id: traineeId },
        data: { lastProfileUpdate: new Date() },
      });

      res.status(201).json({ enrollment });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:courseId/complete",
  requireAuth,
  requireRole("trainee"),
  async (req, res, next) => {
    try {
      const traineeId = req.auth!.traineeId!;
      const courseId = Number(req.params.courseId);

      const enrollment = await prisma.enrollment.findUnique({
        where: { traineeId_courseId: { traineeId, courseId } },
      });
      if (!enrollment || enrollment.status !== "enrolled") {
        throw new AppError(404, "Active enrollment not found");
      }

      const courseSkills = await prisma.courseSkill.findMany({
        where: { courseId },
        include: { skill: true },
      });

      const updated = await prisma.$transaction(async (tx) => {
        const enr = await tx.enrollment.update({
          where: { id: enrollment.id },
          data: { status: "completed", completedAt: new Date() },
        });

        for (const cs of courseSkills) {
          await tx.traineeSkill.upsert({
            where: {
              traineeId_skillId_source: {
                traineeId,
                skillId: cs.skillId,
                source: "verified",
              },
            },
            update: {},
            create: {
              traineeId,
              skillId: cs.skillId,
              source: "verified",
            },
          });
        }

        await tx.trainee.update({
          where: { id: traineeId },
          data: { lastProfileUpdate: new Date() },
        });

        return enr;
      });

      res.json({
        enrollment: updated,
        grantedVerifiedSkills: courseSkills.map((cs) => cs.skill.name),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:courseId/drop",
  requireAuth,
  requireRole("trainee"),
  validateBody(dropSchema),
  async (req, res, next) => {
    try {
      const traineeId = req.auth!.traineeId!;
      const courseId = Number(req.params.courseId);

      const enrollment = await prisma.enrollment.findUnique({
        where: { traineeId_courseId: { traineeId, courseId } },
      });
      if (!enrollment || enrollment.status !== "enrolled") {
        throw new AppError(404, "Active enrollment not found");
      }

      const updated = await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { status: "dropped", dropReason: req.body.reason.trim() },
      });

      res.json({ enrollment: updated });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
