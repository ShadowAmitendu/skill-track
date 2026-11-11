import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";
import { AppError } from "../middleware/errorHandler.js";
import { getAdminDashboardStats } from "../services/core/admin.service.js";
import { createTraineeByAdmin, deleteTraineeAndFiles } from "../services/core/trainee.service.js";
import {
  createProviderByAdmin,
  removeProviderByAdmin,
  updateProviderByAdmin,
} from "../services/core/provider.service.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

const createTraineeSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6).default("Trainee@123!"),
  phone: z.string().optional(),
  location: z.string().optional(),
  roleCategory: z.enum(["IT", "Non-IT"]).default("IT"),
  consentGiven: z.boolean().default(true),
});

const createProviderSchema = z.object({
  name: z.string().trim().min(2, "Organization name is required"),
  email: z.string().email("Valid login email is required"),
  password: z.string().min(6).default("Provider@123!"),
  contactEmail: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  approvalStatus: z.enum(["approved", "pending"]).default("approved"),
});

const updateProviderSchema = z.object({
  name: z.string().trim().min(2).optional(),
  contactEmail: z.string().email().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
});

router.post("/trainees", validateBody(createTraineeSchema), async (req, res, next) => {
  try {
    const trainee = await createTraineeByAdmin(req.body);
    res.status(201).json({ trainee });
  } catch (err) {
    next(err);
  }
});

router.delete("/trainees/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new AppError(400, "Invalid trainee ID");
    await deleteTraineeAndFiles(id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/providers", validateBody(createProviderSchema), async (req, res, next) => {
  try {
    const provider = await createProviderByAdmin(req.body);
    res.status(201).json({ provider });
  } catch (err) {
    next(err);
  }
});

router.put("/providers/:id", validateBody(updateProviderSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new AppError(400, "Invalid provider ID");
    const provider = await updateProviderByAdmin(id, req.body);
    res.json({ provider });
  } catch (err) {
    next(err);
  }
});

router.delete("/providers/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new AppError(400, "Invalid provider ID");
    await removeProviderByAdmin(id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const emailToggleSchema = z.object({
  emailsStopped: z.boolean(),
});

router.get("/dashboard", async (_req, res, next) => {
  try {
    const dashboard = await getAdminDashboardStats();
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
});

router.patch("/trainees/:id/emails", validateBody(emailToggleSchema), async (req, res, next) => {
  try {
    const traineeId = Number(req.params.id);
    if (!Number.isFinite(traineeId)) throw new AppError(400, "Invalid trainee ID");
    const consent = await prisma.consent.upsert({
      where: { traineeId },
      update: { emailsStopped: req.body.emailsStopped },
      create: { traineeId, status: true, emailsStopped: req.body.emailsStopped },
    });
    res.json({ consent });
  } catch (err) {
    next(err);
  }
});

export default router;
