import cron, { type ScheduledTask } from "node-cron";
import { env } from "../../lib/env.js";
import { prisma } from "../../lib/prisma.js";
import {
  getMailTransportMode,
  sendQuarterlyFollowUpEmail,
  type MailTransportMode,
} from "./mailer.js";

export interface FollowUpRunSummary {
  trigger: "cron" | "manual";
  checkedAt: string;
  transportMode: MailTransportMode;
  sentCount: number;
  skippedCount: number;
  sentTo: Array<{ traineeId: number; fullName: string; email: string }>;
  skipped: Array<{
    traineeId: number;
    fullName: string;
    reason: "consent_off" | "emails_stopped" | "not_due";
  }>;
}

const CRON_SCHEDULE = "0 9 * * *"; // Daily check evaluating each trainee's 3-month anniversary
let cronTask: ScheduledTask | null = null;
let lastSummary: FollowUpRunSummary | null = null;

function threeMonthsAgo(from: Date): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() - 3);
  return d;
}

export async function runThreeMonthFollowUps(
  trigger: "cron" | "manual" = "manual"
): Promise<FollowUpRunSummary> {
  const now = new Date();
  const cutoff = threeMonthsAgo(now);

  const trainees = await prisma.trainee.findMany({
    include: {
      user: { select: { email: true, status: true } },
      consent: true,
      followUps: {
        orderBy: { sentAt: "desc" },
        take: 1,
      },
    },
    orderBy: { id: "asc" },
  });

  const sentTo: FollowUpRunSummary["sentTo"] = [];
  const skipped: FollowUpRunSummary["skipped"] = [];

  for (const trainee of trainees) {
    if (!trainee.consent?.status) {
      skipped.push({ traineeId: trainee.id, fullName: trainee.fullName, reason: "consent_off" });
      continue;
    }

    if (trainee.consent.emailsStopped) {
      skipped.push({ traineeId: trainee.id, fullName: trainee.fullName, reason: "emails_stopped" });
      continue;
    }

    const latestFollowUpSent = trainee.followUps[0]?.sentAt ?? null;
    const profileStale = trainee.lastProfileUpdate <= cutoff;
    const emailNotRecent = !latestFollowUpSent || latestFollowUpSent <= cutoff;

    if (!profileStale || !emailNotRecent) {
      skipped.push({ traineeId: trainee.id, fullName: trainee.fullName, reason: "not_due" });
      continue;
    }

    await sendQuarterlyFollowUpEmail({
      to: trainee.user.email,
      fullName: trainee.fullName,
      portalUrl: env.clientOrigin,
    });

    await prisma.followUp.create({
      data: {
        traineeId: trainee.id,
        sentAt: now,
        note: "3-month quarterly info update reminder email",
        channel: "email",
      },
    });

    sentTo.push({
      traineeId: trainee.id,
      fullName: trainee.fullName,
      email: trainee.user.email,
    });
  }

  const summary: FollowUpRunSummary = {
    trigger,
    checkedAt: now.toISOString(),
    transportMode: getMailTransportMode(),
    sentCount: sentTo.length,
    skippedCount: skipped.length,
    sentTo,
    skipped,
  };

  lastSummary = summary;
  return summary;
}

export function startFollowUpCron(): ScheduledTask {
  if (cronTask) return cronTask;

  cronTask = cron.schedule(CRON_SCHEDULE, () => {
    void runThreeMonthFollowUps("cron").catch((err) => {
      console.error("[FollowUpCron] Failed scheduled run:", err);
    });
  });

  return cronTask;
}

export function getFollowUpCronStatus() {
  return {
    schedule: CRON_SCHEDULE,
    cadenceDescription: "Every 3 months from each trainee's lastProfileUpdate (evaluated daily)",
    active: Boolean(cronTask),
    transportMode: getMailTransportMode(),
    lastSummary,
  };
}
