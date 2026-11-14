import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  createCourseForProvider,
  deleteCourseForProvider,
  kickTraineeFromCourse,
  listCoursesForViewer,
  updateCourseForProvider,
} from "../services/core/course.service.js";

const router = Router();

const courseSchema = z.object({
  title: z.string().trim().min(3, "Course title must be at least 3 characters"),
  description: z.string().trim().min(10, "Course description must be at least 10 characters"),
  category: z.string().trim().min(2, "Category is required"),
  durationWeeks: z.coerce.number().int().min(1).max(104).default(8),
  skillIds: z.array(z.number().int().positive()).min(1, "Select at least one skill"),
});

const kickSchema = z.object({
  traineeId: z.number().int().positive(),
  reason: z.string().trim().min(3, "A reason is required to kick a trainee"),
});

router.get("/", requireAuth, requireRole("admin", "trainee", "cp"), async (req, res, next) => {
  try {
    const courses = await listCoursesForViewer(req.auth!, {
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      category: typeof req.query.category === "string" ? req.query.category : undefined,
      skillId: req.query.skillId ? Number(req.query.skillId) : undefined,
      providerId: req.query.providerId ? Number(req.query.providerId) : undefined,
      sort: typeof req.query.sort === "string" ? req.query.sort : "popularity",
      recommendedOnly: req.query.recommended === "true",
    });
    res.json({ courses });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  requireAuth,
  requireRole("cp"),
  validateBody(courseSchema),
  async (req, res, next) => {
    try {
      if (!req.auth!.providerId) throw new AppError(403, "Course provider profile missing");
      const course = await createCourseForProvider(req.auth!.providerId, req.body);
      res.status(201).json({ course });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  requireAuth,
  requireRole("cp"),
  validateBody(courseSchema.partial()),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || !req.auth!.providerId) throw new AppError(400, "Invalid request");
      const course = await updateCourseForProvider(id, req.auth!.providerId, req.body);
      res.json({ course });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", requireAuth, requireRole("cp"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || !req.auth!.providerId) throw new AppError(400, "Invalid request");
    await deleteCourseForProvider(id, req.auth!.providerId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:id/kick",
  requireAuth,
  requireRole("cp"),
  validateBody(kickSchema),
  async (req, res, next) => {
    try {
      const courseId = Number(req.params.id);
      if (!Number.isFinite(courseId) || !req.auth!.providerId) {
        throw new AppError(400, "Invalid course or provider");
      }
      const enrollment = await kickTraineeFromCourse(
        courseId,
        req.auth!.providerId,
        req.body.traineeId,
        req.body.reason
      );
      res.json({ enrollment });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
