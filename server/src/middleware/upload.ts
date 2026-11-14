import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../lib/env.js";
import { AppError } from "./errorHandler.js";

export const resumeUploadDir = path.join(env.rootDir, "server", "uploads", "resumes");
fs.mkdirSync(resumeUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(resumeUploadDir, { recursive: true });
    cb(null, resumeUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".txt";
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);
    const owner = req.auth?.traineeId ?? req.auth?.userId ?? "anon";
    cb(null, `resume_t${owner}_${Date.now()}_${safeBase}${ext}`);
  },
});

export const uploadResumeMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExt = [".pdf", ".txt", ".md"];
    if (!allowedExt.includes(ext)) {
      cb(new AppError(400, "Only .pdf, .txt, or .md resume files are supported"));
      return;
    }
    cb(null, true);
  },
});

export function removeDiskFile(relativeOrAbsolutePath: string) {
  try {
    const resolved = path.isAbsolute(relativeOrAbsolutePath)
      ? relativeOrAbsolutePath
      : path.join(env.rootDir, relativeOrAbsolutePath);
    if (fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
  } catch (err) {
    console.warn("Could not remove file on disk:", err);
  }
}
