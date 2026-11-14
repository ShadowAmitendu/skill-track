import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import traineesRoutes from "./routes/trainees.routes.js";
import providersRoutes from "./routes/providers.routes.js";
import coursesRoutes from "./routes/courses.routes.js";
import enrollmentsRoutes from "./routes/enrollments.routes.js";
import skillsRoutes from "./routes/skills.routes.js";
import employmentRoutes from "./routes/employment.routes.js";
import consentRoutes from "./routes/consent.routes.js";
import emailRoutes from "./routes/email.routes.js";
import aiRoutes from "./routes/ai.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/trainees", traineesRoutes);
  app.use("/api/providers", providersRoutes);
  app.use("/api/courses", coursesRoutes);
  app.use("/api/enrollments", enrollmentsRoutes);
  app.use("/api/skills", skillsRoutes);
  app.use("/api/employment", employmentRoutes);
  app.use("/api/consent", consentRoutes);
  app.use("/api/email", emailRoutes);
  app.use("/api/ai", aiRoutes);

  app.get("/api/health", async (_req, res, next) => {
    try {
      const [users, trainees, providers, courses, skills] = await Promise.all([
        prisma.user.count(),
        prisma.trainee.count(),
        prisma.courseProvider.count(),
        prisma.course.count(),
        prisma.skill.count(),
      ]);
      res.json({
        ok: true,
        service: "skill-track-server",
        counts: { users, trainees, providers, courses, skills },
      });
    } catch (err) {
      next(err);
    }
  });

  app.use(errorHandler);
  return app;
}
