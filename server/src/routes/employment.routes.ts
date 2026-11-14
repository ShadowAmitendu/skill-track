import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";
import {
  deleteOwnEmployment,
  getEmploymentOverviewForViewer,
  upsertOwnEmployment,
} from "../services/core/employment.service.js";

const router = Router();

const employmentSchema = z.object({
  status: z.enum(["full_time", "part_time", "internship", "self_employed", "unemployed"]),
  role: z.string().optional(),
  company: z.string().optional(),
  salary: z.coerce.number().int().min(0).nullable().optional(),
  reason: z.enum(["break", "actively_looking"]).nullable().optional(),
});

router.get("/", requireAuth, requireRole("admin", "cp"), async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : "ALL";
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const data = await getEmploymentOverviewForViewer(req.auth!.role, { status, search });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.put(
  "/me",
  requireAuth,
  requireRole("trainee"),
  validateBody(employmentSchema),
  async (req, res, next) => {
    try {
      const employment = await upsertOwnEmployment(req.auth!.traineeId!, req.body);
      res.json({ employment });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/me", requireAuth, requireRole("trainee"), async (req, res, next) => {
  try {
    await deleteOwnEmployment(req.auth!.traineeId!);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
