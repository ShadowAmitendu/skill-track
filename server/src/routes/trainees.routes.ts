import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";
import { AUTH_COOKIE_NAME, requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";
import { uploadResumeMiddleware } from "../middleware/upload.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  deleteTraineeAndFiles,
  getTraineeProfileForViewer,
  listTraineesForViewer,
  saveUploadedResume,
  updateOwnTraineeProfile,
} from "../services/core/trainee.service.js";

const router = Router();

const updateMeSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  roleCategory: z.enum(["IT", "Non-IT"]).optional(),
  bio: z.string().optional(),
});

const projectSchema = z.object({
  title: z.string().trim().min(2, "Project title is required"),
  description: z.string().optional(),
  repoUrl: z.string().url("Valid repository URL is required"),
});

const certSchema = z.object({
  title: z.string().trim().min(2, "Certification title is required"),
  issuer: z.string().trim().min(2, "Issuer is required"),
  issuedAt: z.string().optional(),
  credentialUrl: z.string().url().optional().or(z.literal("")),
});

router.get("/", requireAuth, requireRole("admin", "cp"), async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const trainees = await listTraineesForViewer(req.auth!.role, search);
    res.json({ trainees });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, requireRole("trainee"), async (req, res, next) => {
  try {
    const profile = await getTraineeProfileForViewer(req.auth!.traineeId!, "trainee");
    res.json({ trainee: profile });
  } catch (err) {
    next(err);
  }
});

router.put(
  "/me",
  requireAuth,
  requireRole("trainee"),
  validateBody(updateMeSchema),
  async (req, res, next) => {
    try {
      const trainee = await updateOwnTraineeProfile(req.auth!.traineeId!, req.body);
      res.json({ trainee });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/me", requireAuth, requireRole("trainee"), async (req, res, next) => {
  try {
    await deleteTraineeAndFiles(req.auth!.traineeId!);
    res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/me/projects",
  requireAuth,
  requireRole("trainee"),
  validateBody(projectSchema),
  async (req, res, next) => {
    try {
      const project = await prisma.project.create({
        data: {
          traineeId: req.auth!.traineeId!,
          title: req.body.title,
          description: req.body.description?.trim() || null,
          repoUrl: req.body.repoUrl,
        },
      });
      await prisma.trainee.update({
        where: { id: req.auth!.traineeId! },
        data: { lastProfileUpdate: new Date() },
      });
      res.status(201).json({ project });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/me/projects/:projectId", requireAuth, requireRole("trainee"), async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.traineeId !== req.auth!.traineeId!) {
      throw new AppError(404, "Project not found");
    }
    await prisma.project.delete({ where: { id: projectId } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/me/certifications",
  requireAuth,
  requireRole("trainee"),
  validateBody(certSchema),
  async (req, res, next) => {
    try {
      const certification = await prisma.certification.create({
        data: {
          traineeId: req.auth!.traineeId!,
          title: req.body.title,
          issuer: req.body.issuer,
          issuedAt: req.body.issuedAt ? new Date(req.body.issuedAt) : null,
          credentialUrl: req.body.credentialUrl || null,
        },
      });
      res.status(201).json({ certification });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/me/certifications/:certId",
  requireAuth,
  requireRole("trainee"),
  async (req, res, next) => {
    try {
      const certId = Number(req.params.certId);
      const cert = await prisma.certification.findUnique({ where: { id: certId } });
      if (!cert || cert.traineeId !== req.auth!.traineeId!) {
        throw new AppError(404, "Certification not found");
      }
      await prisma.certification.delete({ where: { id: certId } });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/me/resume",
  requireAuth,
  requireRole("trainee"),
  uploadResumeMiddleware.single("resume"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError(400, "Please attach a resume file (.pdf, .txt, or .md)");
      }
      const result = await saveUploadedResume(req.auth!.traineeId!, req.file);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/resumes/:resumeId/download",
  requireAuth,
  requireRole("admin", "trainee"),
  async (req, res, next) => {
    try {
      const resumeId = Number(req.params.resumeId);
      const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
      if (!resume) throw new AppError(404, "Resume not found");
      if (req.auth!.role === "trainee" && resume.traineeId !== req.auth!.traineeId) {
        throw new AppError(403, "Forbidden: you can only access your own resume");
      }
      const absPath = path.resolve(env.rootDir, resume.path);
      if (!fs.existsSync(absPath)) {
        throw new AppError(404, "Resume file missing on disk");
      }
      res.download(absPath, resume.fileName);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/:id", requireAuth, requireRole("admin", "cp"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new AppError(400, "Invalid trainee ID");
    const trainee = await getTraineeProfileForViewer(id, req.auth!.role);
    res.json({ trainee });
  } catch (err) {
    next(err);
  }
});

export default router;
