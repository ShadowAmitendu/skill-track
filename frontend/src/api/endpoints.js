import { apiClient } from "./client";

/**
 * @typedef {Object} AdminDashboardDto
 * @property {number} totalTrainees
 * @property {number} totalCourseProviders
 * @property {number} totalCourses
 * @property {number} employedStudentsCount
 * @property {number} unemployedStudentsCount
 * @property {number} jobSeekingStudentsCount
 * @property {Record<string, number>} unemployedReasonsBreakdown
 */

/**
 * @typedef {Object} TraineeProfileDto
 * @property {number} id
 * @property {string} fullName
 * @property {string} email
 * @property {string} [phoneNumber]
 * @property {boolean} consentGiven
 * @property {boolean} allowEmails
 * @property {boolean} adminStoppedEmail
 * @property {"EMPLOYED"|"UNEMPLOYED"|"SEEKING"|"FULL_TIME"|"PART_TIME"|"INTERNSHIP"|"SELF_EMPLOYED"} employmentStatus
 * @property {string} [companyName]
 * @property {string} [currentRole]
 * @property {number|null} [currentSalary]
 * @property {string} [salaryProgression]
 * @property {string} [unemployedReason]
 * @property {string} [projectsSummary]
 * @property {string} [projectRepoUrl]
 * @property {string[]} skills
 * @property {string[]} certifications
 * @property {string[]} enrolledCourses
 * @property {string[]} completedCourses
 * @property {string[]} followUpNotes
 * @property {boolean} [followUpResponded]
 */

/**
 * @typedef {Object} TraineeRequestDto
 * @property {string} fullName
 * @property {string} email
 * @property {string} [phoneNumber]
 * @property {boolean} [consentGiven]
 * @property {boolean} [allowEmails]
 * @property {"EMPLOYED"|"UNEMPLOYED"|"SEEKING"|"FULL_TIME"|"PART_TIME"|"INTERNSHIP"|"SELF_EMPLOYED"} [employmentStatus]
 * @property {string} [companyName]
 * @property {string} [currentRole]
 * @property {number} [currentSalary]
 * @property {string} [salaryProgression]
 * @property {string} [unemployedReason]
 * @property {string} [projectsSummary]
 * @property {string} [projectRepoUrl]
 */

/**
 * @typedef {Object} CourseDto
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} [category]
 * @property {number} providerId
 * @property {string} providerName
 * @property {string[]} skillsTaught
 * @property {number} [enrolledCount]
 */

/**
 * @typedef {Object} CourseProviderDto
 * @property {number} id
 * @property {string} name
 * @property {string} contactEmail
 * @property {string} [description]
 * @property {string} [website]
 */

/**
 * @typedef {Object} SkillSummaryDto
 * @property {number} skillId
 * @property {string} skillName
 * @property {string} category
 * @property {number} enrolledTraineesCount
 * @property {string[]} traineeNames
 */

// ==========================================
// Admin Endpoints
// ==========================================
export const adminApi = {
  getDashboard: (signal) => apiClient("/admin/dashboard", { signal }),
  getAllTrainees: (signal) => apiClient("/admin/trainees", { signal }),
  addTrainee: (dto) => apiClient("/admin/trainees", { method: "POST", body: dto }),
  removeTrainee: (id) => apiClient(`/admin/trainees/${id}`, { method: "DELETE" }),
  getAllProviders: (signal) => apiClient("/admin/providers", { signal }),
  addCourseProvider: (dto) => apiClient("/admin/providers", { method: "POST", body: dto }),
  updateCourseProvider: (id, dto) => apiClient(`/admin/providers/${id}`, { method: "PUT", body: dto }),
  removeCourseProvider: (id) => apiClient(`/admin/providers/${id}`, { method: "DELETE" }),
  stopEmails: (traineeId, stop) =>
    apiClient(`/admin/trainees/${traineeId}/stop-emails?stop=${Boolean(stop)}`, {
      method: "PATCH",
    }),
};

// ==========================================
// Trainee Endpoints
// ==========================================
export const traineeApi = {
  getAll: (signal) => apiClient("/trainees", { signal }),
  getById: (id, signal) => apiClient(`/trainees/${id}`, { signal }),
  create: (dto) => apiClient("/trainees", { method: "POST", body: dto }),
  update: (id, dto) => apiClient(`/trainees/${id}`, { method: "PUT", body: dto }),
  delete: (id) => apiClient(`/trainees/${id}`, { method: "DELETE" }),
  updateConsent: (id, consentGiven) =>
    apiClient(`/trainees/${id}/consent?consentGiven=${Boolean(consentGiven)}`, {
      method: "PATCH",
    }),
  updateEmailPreference: (id, allowEmails) =>
    apiClient(`/trainees/${id}/email-preference?allowEmails=${Boolean(allowEmails)}`, {
      method: "PATCH",
    }),
  removeEmploymentInfo: (id, forbidEmails = false) =>
    apiClient(`/trainees/${id}/employment-info?forbidEmails=${Boolean(forbidEmails)}`, {
      method: "DELETE",
    }),
  enroll: (traineeId, courseId) =>
    apiClient(`/trainees/${traineeId}/enroll/${courseId}`, { method: "POST" }),
  drop: (traineeId, courseId, reason) =>
    apiClient(`/trainees/${traineeId}/drop/${courseId}`, {
      method: "POST",
      body: { reason },
    }),
  complete: (traineeId, courseId) =>
    apiClient(`/trainees/${traineeId}/complete/${courseId}`, { method: "POST" }),
};

// ==========================================
// Course Endpoints
// ==========================================
export const courseApi = {
  getAll: (signal) => apiClient("/courses", { signal }),
  getByProvider: (providerId, signal) =>
    apiClient(`/courses/provider/${providerId}`, { signal }),
  getSkillsSummary: (signal) => apiClient("/courses/skills-summary", { signal }),
};

// ==========================================
// Course Provider Endpoints
// ==========================================
export const providerApi = {
  getAll: (signal) => apiClient("/providers", { signal }),
  getById: (id, signal) => apiClient(`/providers/${id}`, { signal }),
  addCourse: (providerId, dto) =>
    apiClient(`/providers/${providerId}/courses`, { method: "POST", body: dto }),
  updateCourse: (courseId, dto) =>
    apiClient(`/providers/courses/${courseId}`, { method: "PUT", body: dto }),
  removeCourse: (courseId) =>
    apiClient(`/providers/courses/${courseId}`, { method: "DELETE" }),
  kickTrainee: (courseId, traineeId, reason) =>
    apiClient(`/providers/courses/${courseId}/kick/${traineeId}`, {
      method: "POST",
      body: { reason },
    }),
  getAllTraineesReadOnly: (signal) => apiClient("/providers/trainees", { signal }),
};

// ==========================================
// Email Endpoints
// ==========================================
export const emailApi = {
  triggerQuarterlyReminders: () =>
    apiClient("/email/trigger-quarterly-reminders", { method: "POST" }),
};

/**
 * @typedef {Object} AtsAnalysisResponseDto
 * @property {number} totalTokens
 * @property {string[]} extractedSkillTokens
 * @property {string[]} detectedTechnologies
 */

/**
 * @typedef {Object} SkillGapRequestDto
 * @property {string} targetRole
 * @property {string} [resumeText]
 * @property {string[]} [currentSkills]
 */

/**
 * @typedef {Object} SkillGapResponseDto
 * @property {string} targetRole
 * @property {string[]} matchedSkills
 * @property {string[]} missingSkills
 * @property {number} matchPercentage
 * @property {string[]} recommendedTopics
 */

/**
 * @typedef {Object} RoleMatchmakingResponseDto
 * @property {string} roleTitle
 * @property {number} fitScore
 * @property {string[]} matchingSkills
 * @property {string[]} growthAreas
 */

/**
 * @typedef {Object} CareerTrendsResponseDto
 * @property {string} itRole
 * @property {string[]} currentMarketTrends
 * @property {string[]} emergingFutureRoles
 * @property {string} futureCareerProspect
 * @property {string[]} evolvingSkillDemands
 */

/**
 * @typedef {Object} CourseImprovementDto
 * @property {string} currentCourseTitle
 * @property {string[]} suggestedCurriculumAdditions
 * @property {string[]} outdatedTopicsToRemove
 * @property {string[]} newCourseIdeas
 * @property {string} marketRationale
 */

/**
 * @typedef {Object} ChatRequestDto
 * @property {string} message
 * @property {number} [providerId]
 * @property {number} [courseId]
 */

/**
 * @typedef {Object} ChatResponseDto
 * @property {string} reply
 * @property {string} [timestamp]
 */

// ==========================================
// AI Endpoints (mirrors AiController)
// ==========================================
export const aiApi = {
  /** @param {string} resumeText @returns {Promise<AtsAnalysisResponseDto>} */
  atsExtract: (resumeText) =>
    apiClient("/ai/ats-extract", {
      method: "POST",
      body: resumeText,
      rawBody: true,
      headers: { "Content-Type": "text/plain" },
    }),

  /** @param {SkillGapRequestDto} dto @returns {Promise<SkillGapResponseDto>} */
  analyzeSkillGap: (dto) =>
    apiClient("/ai/skill-gap", { method: "POST", body: dto }),

  /** @param {string[]} skills @returns {Promise<RoleMatchmakingResponseDto[]>} */
  matchRoles: (skills) =>
    apiClient("/ai/matchmaking", { method: "POST", body: skills }),

  /** @param {string} [role] @param {AbortSignal} [signal] @returns {Promise<CareerTrendsResponseDto>} */
  getCareerTrends: (role = "Backend Developer", signal) =>
    apiClient(`/ai/career-trends?role=${encodeURIComponent(role)}`, { signal }),

  /** @param {string} [courseTitle] @param {AbortSignal} [signal] @returns {Promise<CourseImprovementDto>} */
  suggestCourseImprovements: (courseTitle = "Java Backend", signal) =>
    apiClient(`/ai/course-improvements?courseTitle=${encodeURIComponent(courseTitle)}`, { signal }),

  /** @param {ChatRequestDto} dto @returns {Promise<ChatResponseDto>} */
  providerChatbot: (dto) =>
    apiClient("/ai/provider-chatbot", { method: "POST", body: dto }),

  /** @param {AbortSignal} [signal] @returns {Promise<string[]>} */
  listMarketResearchDocs: (signal) =>
    apiClient("/ai/market-research/documents", { signal }),

  /** @param {string} fileName @param {AbortSignal} [signal] @returns {Promise<string>} */
  readMarketResearchDoc: (fileName, signal) =>
    apiClient(`/ai/market-research/documents/${encodeURIComponent(fileName)}`, { signal }),
};
