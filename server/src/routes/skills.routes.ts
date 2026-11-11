import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { listFlatSkills, listGroupedSkillsForViewer } from "../services/core/skill.service.js";

const router = Router();

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const categories = await listGroupedSkillsForViewer(req.auth?.role);
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

router.get("/flat", async (_req, res, next) => {
  try {
    const skills = await listFlatSkills();
    res.json({ skills });
  } catch (err) {
    next(err);
  }
});

export default router;
