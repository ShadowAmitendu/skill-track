import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();

const consentPatchSchema = z.object({
  status: z.boolean().optional(),
  emailsStopped: z.boolean().optional(),
});

const respondFollowUpSchema = z.object({
  note: z.string().trim().min(2, "Please provide a brief update note"),
});

router.patch(
  "/me",
  requireAuth,
  requireRole("trainee"),
  validateBody(consentPatchSchema),
  async (req, res, next) => {
    try {
      const traineeId = req.auth!.traineeId!;
      const existing = await prisma.consent.findUnique({ where: { traineeId } });

      const consent = await prisma.consent.upsert({
        where: { traineeId },
        update: {
          ...(req.body.status !== undefined ? { status: req.body.status } : {}),
          ...(req.body.emailsStopped !== undefined ? { emailsStopped: req.body.emailsStopped } : {}),
        },
        create: {
          traineeId,
          status: req.body.status ?? existing?.status ?? true,
          emailsStopped: req.body.emailsStopped ?? existing?.emailsStopped ?? false,
        },
      });

      res.json({ consent });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/me/followup-response",
  requireAuth,
  requireRole("trainee"),
  validateBody(respondFollowUpSchema),
  async (req, res, next) => {
    try {
      const traineeId = req.auth!.traineeId!;
      const pendingFollowUp = await prisma.followUp.findFirst({
        where: { traineeId, respondedAt: null },
        orderBy: { sentAt: "desc" },
      });

      const followUp = pendingFollowUp
        ? await prisma.followUp.update({
            where: { id: pendingFollowUp.id },
            data: { respondedAt: new Date(), note: req.body.note },
          })
        : await prisma.followUp.create({
            data: {
              traineeId,
              sentAt: new Date(),
              respondedAt: new Date(),
              note: req.body.note,
              channel: "portal",
            },
          });

      await prisma.trainee.update({
        where: { id: traineeId },
        data: { lastProfileUpdate: new Date() },
      });

      res.json({ followUp });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
