import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import {
  getFollowUpCronStatus,
  runThreeMonthFollowUps,
} from "../services/email/followupCron.js";

const router = Router();

router.get("/status", requireAuth, requireRole("admin"), (_req, res) => {
  res.json(getFollowUpCronStatus());
});

router.post("/run-reminders", requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const summary = await runThreeMonthFollowUps("manual");
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

export default router;
