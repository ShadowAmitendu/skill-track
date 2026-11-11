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
 * @property {string} category
 * @property {number} providerId
 * @property {string} providerName
 * @property {string[]} skillsTaught
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
