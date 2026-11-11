import { Router } from "express";
import { z } from "zod";
import { AUTH_COOKIE_NAME, getAuthCookieOptions, requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import {
  loginWithCredentials,
  registerProviderAccount,
  registerTraineeAccount,
} from "../services/core/auth.service.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.discriminatedUnion("accountType", [
  z.object({
    accountType: z.literal("trainee"),
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
    location: z.string().optional(),
    roleCategory: z.enum(["IT", "Non-IT"]).default("IT"),
    consentGiven: z.boolean().default(true),
  }),
  z.object({
    accountType: z.literal("cp"),
    name: z.string().trim().min(2, "Organization name must be at least 2 characters"),
    email: z.string().email("Valid login email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    contactEmail: z.string().email("Valid contact email is required").optional().or(z.literal("")),
    website: z.string().url("Website must be a valid URL").optional().or(z.literal("")),
    description: z.string().optional(),
  }),
]);

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { token, user } = await loginWithCredentials(req.body.email, req.body.password);
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    if (req.body.accountType === "trainee") {
      const { token, user } = await registerTraineeAccount(req.body);
      res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
      res.status(201).json({ user, pendingApproval: false });
      return;
    }

    const result = await registerProviderAccount(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.auth });
});

export default router;
