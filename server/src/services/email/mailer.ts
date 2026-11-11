import nodemailer from "nodemailer";
import { env } from "../../lib/env.js";

export type MailTransportMode = "smtp" | "dev-json";

let cachedTransporter: nodemailer.Transporter | null = null;

function buildTransporter(): { transporter: nodemailer.Transporter; mode: MailTransportMode } {
  if (env.smtpHost) {
    if (!cachedTransporter) {
      cachedTransporter = nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpPort === 465,
        auth: env.smtpUser
          ? {
              user: env.smtpUser,
              pass: env.smtpPass,
            }
          : undefined,
      });
    }
    return { transporter: cachedTransporter, mode: "smtp" };
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }
  return { transporter: cachedTransporter, mode: "dev-json" };
}

export function getMailTransportMode(): MailTransportMode {
  return env.smtpHost ? "smtp" : "dev-json";
}

export async function sendQuarterlyFollowUpEmail(input: {
  to: string;
  fullName: string;
  portalUrl: string;
}) {
  const { transporter, mode } = buildTransporter();

  const subject = "Skill-Track 3-Month Profile & Career Update Reminder";
  const profileLink = `${input.portalUrl.replace(/\/$/, "")}/my-profile`;
  const text = [
    `Hello ${input.fullName},`,
    "",
    "It has been over 3 months since your last profile update on Skill-Track.",
    "Please take a moment to review your skills, course progress, employment details, and privacy consent:",
    profileLink,
    "",
    "If you wish to stop receiving these quarterly reminders while keeping your account data, toggle 'Stop quarterly follow-up reminder emails' in My Profile.",
    "",
    "— Skill-Track Team",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1c2127;">
      <h2 style="margin: 0 0 12px 0;">Skill-Track Quarterly Check-In</h2>
      <p>Hello ${escapeHtml(input.fullName)},</p>
      <p>It has been more than 3 months since your last update on <strong>Skill-Track</strong>.</p>
      <p>
        Please sign in to review your current employment status, certifications, projects, or resume:
        <a href="${escapeHtml(profileLink)}">${escapeHtml(profileLink)}</a>
      </p>
      <p style="font-size: 12px; color: #5c7080;">
        You can pause reminder emails or manage tracking consent anytime in your My Profile settings.
      </p>
    </div>
  `.trim();

  const info = await transporter.sendMail({
    from: env.smtpFrom,
    to: input.to,
    subject,
    text,
    html,
  });

  if (mode === "dev-json") {
    console.log(`[Email dev-json] Queued 3-month reminder to ${input.to} (messageId=${info.messageId})`);
  }

  return {
    mode,
    messageId: info.messageId,
  };
}

function escapeHtml(raw: string): string {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
