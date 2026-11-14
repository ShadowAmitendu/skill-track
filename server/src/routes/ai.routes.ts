import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { requireItTrainee, requireRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";
import { uploadResumeMiddleware } from "../middleware/upload.js";
import { extractTextFromResumeFile } from "../services/ai/atsParser.js";
import { saveUploadedResume } from "../services/core/trainee.service.js";
import {
  analyzeSkillGap,
  getFutureCareerInsights,
  suggestRoleMatches,
} from "../services/ai/careerAi.service.js";
import {
  chatWithProviderAssistant,
  getProviderCourseSuggestions,
} from "../services/ai/providerAi.service.js";
import {
  getMarketDocsWithContent,
  getMarketResearchCronStatus,
  refreshMarketResearchDocs,
} from "../services/ai/marketResearch.js";

const router = Router();

const skillGapBodySchema = z.object({
  targetRole: z.string().trim().min(2, "Please enter a target role"),
  resumeText: z.string().optional(),
});

const futureCareersSchema = z.object({
  focusRole: z.string().trim().optional(),
});

const providerChatSchema = z.object({
  message: z.string().trim().min(2, "Message cannot be empty"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

router.get("/market-docs", requireAuth, async (_req, res, next) => {
  try {
    const { docs } = await getMarketDocsWithContent();
    res.json({
      docs: docs.map((d) => ({
        id: d.id,
        slug: d.slug,
        title: d.title,
        path: d.path,
        sourceUrl: d.sourceUrl,
        summary: d.summary,
        updatedAt: d.updatedAt,
      })),
      cron: getMarketResearchCronStatus(),
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/market-docs/refresh",
  requireAuth,
  requireRole("admin", "cp"),
  async (_req, res, next) => {
    try {
      const { docs } = await refreshMarketResearchDocs("manual");
      res.json({
        refreshed: true,
        count: docs.length,
        docs: docs.map((d) => ({
          id: d.id,
          slug: d.slug,
          title: d.title,
          path: d.path,
          updatedAt: d.updatedAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/skill-gap",
  requireAuth,
  requireItTrainee,
  uploadResumeMiddleware.single("resume"),
  async (req, res, next) => {
    try {
      const parsed = skillGapBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: parsed.error.issues[0]?.message || "Invalid skill-gap request",
        });
        return;
      }

      let resumeText = parsed.data.resumeText || "";
      if (req.file) {
        resumeText = await extractTextFromResumeFile(req.file.path);
        await saveUploadedResume(req.auth!.traineeId!, req.file);
      }

      const analysis = await analyzeSkillGap({
        traineeId: req.auth!.traineeId!,
        targetRole: parsed.data.targetRole,
        resumeText,
      });
      res.json(analysis);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/role-match", requireAuth, requireItTrainee, async (req, res, next) => {
  try {
    const data = await suggestRoleMatches(req.auth!.traineeId!);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/future-careers", requireAuth, requireItTrainee, async (req, res, next) => {
  try {
    const focusRole =
      typeof req.query.focusRole === "string" ? req.query.focusRole : undefined;
    const data = await getFutureCareerInsights({
      traineeId: req.auth!.traineeId!,
      focusRole,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/future-careers",
  requireAuth,
  requireItTrainee,
  validateBody(futureCareersSchema),
  async (req, res, next) => {
    try {
      const data = await getFutureCareerInsights({
        traineeId: req.auth!.traineeId!,
        focusRole: req.body.focusRole,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/provider/suggestions", requireAuth, requireRole("cp"), async (req, res, next) => {
  try {
    const courseId =
      typeof req.query.courseId === "string" && req.query.courseId
        ? Number(req.query.courseId)
        : undefined;
    const data = await getProviderCourseSuggestions(req.auth!.providerId!, courseId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/provider/chat",
  requireAuth,
  requireRole("cp"),
  validateBody(providerChatSchema),
  async (req, res, next) => {
    try {
      const data = await chatWithProviderAssistant({
        providerId: req.auth!.providerId!,
        message: req.body.message,
        history: req.body.history,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
