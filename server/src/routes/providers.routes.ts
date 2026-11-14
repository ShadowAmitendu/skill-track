import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { AppError } from "../middleware/errorHandler.js";
import { getProviderProfileById, listProvidersForViewer } from "../services/core/provider.service.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin", "trainee", "cp"), async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const providers = await listProvidersForViewer(req.auth!.role, search);
    res.json({ providers });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, requireRole("admin", "trainee", "cp"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new AppError(400, "Invalid provider ID");
    const provider = await getProviderProfileById(id, req.auth!.role);
    res.json({ provider });
  } catch (err) {
    next(err);
  }
});

export default router;
