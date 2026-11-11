import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: err.errors[0]?.message || "Validation failed",
      details: err.errors,
    });
    return;
  }

  if (typeof err === "object" && err !== null && "code" in err) {
    const prismaCode = String((err as { code?: unknown }).code);
    if (prismaCode === "P2002") {
      res.status(409).json({ error: "A record with this unique value already exists." });
      return;
    }
    if (prismaCode === "P2025") {
      res.status(404).json({ error: "Requested record was not found." });
      return;
    }
  }

  console.error("Unhandled server error:", err);
  res.status(500).json({ error: "Internal server error" });
}
