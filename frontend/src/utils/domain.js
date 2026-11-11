export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "FULL_TIME", label: "Full-Time", note: "Full-time salaried roles", variant: "emerald" },
  { value: "PART_TIME", label: "Part-Time", note: "Part-time positions", variant: "primary" },
  { value: "INTERNSHIP", label: "Internship", note: "Internships & apprenticeships", variant: "amber" },
  { value: "SELF_EMPLOYED", label: "Self-Employed", note: "Freelance or independent", variant: "default" },
  { value: "UNEMPLOYED", label: "Unemployed", note: "Break or actively looking", variant: "rose" },
];

const LEGACY_STATUS_MAP = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  INTERNSHIP: "INTERNSHIP",
  SELF_EMPLOYED: "SELF_EMPLOYED",
  EMPLOYED: "FULL_TIME",
  SEEKING: "UNEMPLOYED",
  UNEMPLOYED: "UNEMPLOYED",
};

export function normalizeEmploymentStatus(rawStatus) {
  if (!rawStatus) return "UNEMPLOYED";
  return LEGACY_STATUS_MAP[String(rawStatus).toUpperCase()] || "UNEMPLOYED";
}

export function isEmployedStatus(rawStatus) {
  return normalizeEmploymentStatus(rawStatus) !== "UNEMPLOYED";
}

export function getEmploymentMeta(rawStatus) {
  const normalized = normalizeEmploymentStatus(rawStatus);
  return (
    EMPLOYMENT_STATUS_OPTIONS.find((opt) => opt.value === normalized) ||
    EMPLOYMENT_STATUS_OPTIONS[EMPLOYMENT_STATUS_OPTIONS.length - 1]
  );
}

export function getUnemployedReasonText(trainee) {
  if (!trainee) return "";
  const explicit = trainee.unemployedReason?.trim();
  if (explicit) return explicit;
  if (String(trainee.employmentStatus).toUpperCase() === "SEEKING") {
    return "Actively looking";
  }
  return "";
}

export function categorizeUnemployedReason(reason) {
  const text = (reason || "").toLowerCase();
  if (text.includes("break") || text.includes("education") || text.includes("pause")) {
    return "Break / Study";
  }
  if (text.includes("looking") || text.includes("interview") || text.includes("seeking")) {
    return "Actively Looking";
  }
  return reason?.trim() ? "Other Reason" : "Not Specified";
}

export function toApiEmploymentStatus(status) {
  const normalized = normalizeEmploymentStatus(status);
  const isDemoMode =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    localStorage.getItem("skilltrack_demo_mode") !== "false";

  if (isDemoMode) {
    return normalized;
  }
  return normalized === "UNEMPLOYED" ? "UNEMPLOYED" : "EMPLOYED";
}

export function hasTraineeRespondedFollowUp(trainee) {
  if (!trainee) return false;
  if (typeof trainee.followUpResponded === "boolean") {
    return trainee.followUpResponded;
  }
  return (trainee.followUpNotes?.length || 0) > 0;
}

export function deriveCourseCategory(skillsTaught = [], explicitCategory = "") {
  if (explicitCategory && explicitCategory.trim()) {
    return explicitCategory.trim();
  }
  const joined = (skillsTaught || []).join(" ").toLowerCase();
  if (joined.includes("docker") || joined.includes("kubernetes") || joined.includes("jenkins") || joined.includes("devops")) {
    return "DevOps";
  }
  if (joined.includes("cloud") || joined.includes("aws") || joined.includes("azure")) {
    return "Cloud";
  }
  if (joined.includes("postgresql") || joined.includes("sql") || joined.includes("database") || joined.includes("mysql")) {
    return "Database";
  }
  if (joined.includes("react") || joined.includes("javascript") || joined.includes("html") || joined.includes("css")) {
    return "Frontend";
  }
  if (joined.includes("java") || joined.includes("spring") || joined.includes("rest") || joined.includes("backend")) {
    return "Backend";
  }
  return "General";
}
