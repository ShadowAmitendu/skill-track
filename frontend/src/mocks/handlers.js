import { http, HttpResponse } from "msw";
import {
  mockTrainees,
  mockProviders,
  mockCourses,
  mockSkillCatalog,
} from "./mockData";
import { deriveCourseCategory, hasTraineeRespondedFollowUp, isEmployedStatus } from "../utils/domain";

// In-memory clones for stateful interactions during Demo Mode
let trainees = JSON.parse(JSON.stringify(mockTrainees));
let providers = JSON.parse(JSON.stringify(mockProviders));
let courses = JSON.parse(JSON.stringify(mockCourses));

function envelope(data, message = "Success") {
  return HttpResponse.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

function buildDynamicSkillsSummary() {
  const knownMap = new Map(
    mockSkillCatalog.map((s) => [s.skillName.toLowerCase(), { ...s }])
  );
  courses.forEach((c) => {
    (c.skillsTaught || []).forEach((sName) => {
      const key = sName.toLowerCase();
      if (!knownMap.has(key)) {
        knownMap.set(key, {
          skillId: knownMap.size + 1,
          skillName: sName,
          category: c.category || deriveCourseCategory([sName]),
        });
      }
    });
  });

  return Array.from(knownMap.values()).map((skill) => {
    const holders = trainees.filter((t) =>
      (t.skills || []).some((s) => s.toLowerCase() === skill.skillName.toLowerCase())
    );
    return {
      ...skill,
      enrolledTraineesCount: holders.length,
      traineeNames: holders.map((h) => h.fullName),
    };
  });
}

export const handlers = [
  // --- Admin ---
  http.get("/api/v1/admin/dashboard", () => {
    const employed = trainees.filter((t) => isEmployedStatus(t.employmentStatus)).length;
    const unemployed = trainees.filter((t) => !isEmployedStatus(t.employmentStatus)).length;
    const seeking = trainees.filter(
      (t) =>
        !isEmployedStatus(t.employmentStatus) &&
        t.unemployedReason?.toLowerCase().includes("looking")
    ).length;

    const consented = trainees.filter((t) => Boolean(t.consentGiven)).length;
    const responded = trainees.filter((t) => hasTraineeRespondedFollowUp(t)).length;

    const reasons = {};
    trainees.forEach((t) => {
      if (!isEmployedStatus(t.employmentStatus) && t.unemployedReason) {
        reasons[t.unemployedReason] = (reasons[t.unemployedReason] || 0) + 1;
      }
    });

    return envelope({
      totalTrainees: trainees.length,
      totalCourseProviders: providers.length,
      totalCourses: courses.length,
      totalConsents: consented,
      followUpRespondedCount: responded,
      followUpNotRespondedCount: Math.max(0, trainees.length - responded),
      employedStudentsCount: employed,
      unemployedStudentsCount: unemployed,
      jobSeekingStudentsCount: seeking,
      unemployedReasonsBreakdown: reasons,
    });
  }),

  http.get("/api/v1/admin/trainees", () => {
    return envelope(trainees);
  }),

  http.post("/api/v1/admin/trainees", async ({ request }) => {
    const body = /** @type {Record<string, any>} */ (await request.json());
    const newTrainee = {
      id: Date.now(),
      fullName: body.fullName || "New Trainee",
      email: body.email,
      phoneNumber: body.phoneNumber || "",
      consentGiven: body.consentGiven ?? true,
      allowEmails: body.allowEmails ?? true,
      adminStoppedEmail: false,
      employmentStatus: body.employmentStatus || "UNEMPLOYED",
      companyName: body.companyName || "",
      currentRole: body.currentRole || "",
      currentSalary: body.currentSalary || null,
      salaryProgression: body.salaryProgression || "",
      unemployedReason: body.unemployedReason || "",
      projectsSummary: body.projectsSummary || "",
      projectRepoUrl: body.projectRepoUrl || "",
      skills: [],
      certifications: [],
      enrolledCourses: [],
      completedCourses: [],
      followUpResponded: body.followUpResponded ?? false,
      followUpNotes: [],
    };
    trainees.unshift(newTrainee);
    return envelope(newTrainee, "Trainee created successfully");
  }),

  http.delete("/api/v1/admin/trainees/:id", ({ params }) => {
    const id = Number(params.id);
    trainees = trainees.filter((t) => t.id !== id);
    return envelope(null, "Trainee removed successfully");
  }),

  http.patch("/api/v1/admin/trainees/:id/stop-emails", ({ params, request }) => {
    const id = Number(params.id);
    const url = new URL(request.url);
    const stop = url.searchParams.get("stop") === "true";
    const found = trainees.find((t) => t.id === id);
    if (found) found.adminStoppedEmail = stop;
    return envelope(null, stop ? "Email service stopped" : "Email service unblocked");
  }),

  http.get("/api/v1/admin/providers", () => {
    return envelope(providers);
  }),

  http.post("/api/v1/admin/providers", async ({ request }) => {
    const body = /** @type {Record<string, any>} */ (await request.json());
    const newProvider = {
      id: Date.now(),
      name: body.name,
      contactEmail: body.contactEmail,
      description: body.description || "",
      website: body.website || "",
    };
    providers.push(newProvider);
    return envelope(newProvider, "Course provider created");
  }),

  http.put("/api/v1/admin/providers/:id", async ({ params, request }) => {
    const id = Number(params.id);
    const body = /** @type {Record<string, any>} */ (await request.json());
    const idx = providers.findIndex((p) => p.id === id);
    if (idx !== -1) {
      providers[idx] = { ...providers[idx], ...body, id };
      return envelope(providers[idx], "Course provider updated");
    }
    return HttpResponse.json({ success: false, message: "Provider not found" }, { status: 404 });
  }),

  http.delete("/api/v1/admin/providers/:id", ({ params }) => {
    const id = Number(params.id);
    providers = providers.filter((p) => p.id !== id);
    courses = courses.filter((c) => c.providerId !== id);
    return envelope(null, "Course provider removed successfully");
  }),

  // --- Trainees ---
  http.get("/api/v1/trainees", () => {
    return envelope(trainees);
  }),

  http.get("/api/v1/trainees/:id", ({ params }) => {
    const id = Number(params.id);
    const found = trainees.find((t) => t.id === id);
    if (found) return envelope(found);
    return HttpResponse.json({ success: false, message: "Trainee not found" }, { status: 404 });
  }),

  http.post("/api/v1/trainees", async ({ request }) => {
    const body = /** @type {Record<string, any>} */ (await request.json());
    const newTrainee = {
      id: Date.now(),
      fullName: body.fullName,
      email: body.email,
      phoneNumber: body.phoneNumber || "",
      consentGiven: body.consentGiven ?? true,
      allowEmails: body.allowEmails ?? true,
      adminStoppedEmail: false,
      employmentStatus: body.employmentStatus || "UNEMPLOYED",
      companyName: body.companyName || "",
      currentRole: body.currentRole || "",
      currentSalary: body.currentSalary || null,
      salaryProgression: body.salaryProgression || "",
      unemployedReason: body.unemployedReason || "",
      projectsSummary: body.projectsSummary || "",
      projectRepoUrl: body.projectRepoUrl || "",
      skills: [],
      certifications: [],
      enrolledCourses: [],
      completedCourses: [],
      followUpResponded: body.followUpResponded ?? false,
      followUpNotes: [],
    };
    trainees.unshift(newTrainee);
    return envelope(newTrainee, "Trainee account created");
  }),

  http.put("/api/v1/trainees/:id", async ({ params, request }) => {
    const id = Number(params.id);
    const body = /** @type {Record<string, any>} */ (await request.json());
    const idx = trainees.findIndex((t) => t.id === id);
    if (idx !== -1) {
      trainees[idx] = { ...trainees[idx], ...body, id };
      return envelope(trainees[idx], "Trainee profile updated");
    }
    return HttpResponse.json({ success: false, message: "Trainee not found" }, { status: 404 });
  }),

  http.delete("/api/v1/trainees/:id", ({ params }) => {
    const id = Number(params.id);
    trainees = trainees.filter((t) => t.id !== id);
    return envelope(null, "Trainee deleted");
  }),

  http.patch("/api/v1/trainees/:id/consent", ({ params, request }) => {
    const id = Number(params.id);
    const url = new URL(request.url);
    const consent = url.searchParams.get("consentGiven") === "true";
    const found = trainees.find((t) => t.id === id);
    if (found) found.consentGiven = consent;
    return envelope(null, "Consent status updated");
  }),

  http.patch("/api/v1/trainees/:id/email-preference", ({ params, request }) => {
    const id = Number(params.id);
    const url = new URL(request.url);
    const allow = url.searchParams.get("allowEmails") === "true";
    const found = trainees.find((t) => t.id === id);
    if (found) found.allowEmails = allow;
    return envelope(null, "Email preference updated");
  }),

  http.delete("/api/v1/trainees/:id/employment-info", ({ params, request }) => {
    const id = Number(params.id);
    const url = new URL(request.url);
    const forbid = url.searchParams.get("forbidEmails") === "true";
    const found = trainees.find((t) => t.id === id);
    if (found) {
      found.companyName = "";
      found.currentRole = "";
      found.currentSalary = null;
      found.salaryProgression = "";
      found.unemployedReason = "";
      if (forbid) found.allowEmails = false;
    }
    return envelope(null, "Employment info removed");
  }),

  http.post("/api/v1/trainees/:id/enroll/:courseId", ({ params }) => {
    const id = Number(params.id);
    const courseId = Number(params.courseId);
    const trainee = trainees.find((t) => t.id === id);
    const course = courses.find((c) => c.id === courseId);
    if (trainee && course) {
      if (!trainee.enrolledCourses.includes(course.title)) {
        trainee.enrolledCourses.push(course.title);
      }
    }
    return envelope(null, "Enrolled in course successfully");
  }),

  http.post("/api/v1/trainees/:id/drop/:courseId", async ({ params }) => {
    const id = Number(params.id);
    const courseId = Number(params.courseId);
    const trainee = trainees.find((t) => t.id === id);
    const course = courses.find((c) => c.id === courseId);
    if (trainee && course) {
      trainee.enrolledCourses = trainee.enrolledCourses.filter((title) => title !== course.title);
    }
    return envelope(null, "Course dropped successfully");
  }),

  http.post("/api/v1/trainees/:id/complete/:courseId", ({ params }) => {
    const id = Number(params.id);
    const courseId = Number(params.courseId);
    const trainee = trainees.find((t) => t.id === id);
    const course = courses.find((c) => c.id === courseId);
    if (trainee && course) {
      trainee.enrolledCourses = trainee.enrolledCourses.filter((title) => title !== course.title);
      if (!trainee.completedCourses.includes(course.title)) {
        trainee.completedCourses.push(course.title);
      }
      course.skillsTaught.forEach((s) => {
        if (!trainee.skills.includes(s)) trainee.skills.push(s);
      });
    }
    return envelope(null, "Course marked as completed and skills updated");
  }),

  // --- Courses ---
  http.get("/api/v1/courses", () => {
    return envelope(courses);
  }),

  http.get("/api/v1/courses/provider/:providerId", ({ params }) => {
    const providerId = Number(params.providerId);
    const filtered = courses.filter((c) => c.providerId === providerId);
    return envelope(filtered);
  }),

  http.get("/api/v1/courses/skills-summary", () => {
    return envelope(buildDynamicSkillsSummary());
  }),

  // --- Providers ---
  http.get("/api/v1/providers", () => {
    return envelope(providers);
  }),

  http.get("/api/v1/providers/trainees", () => {
    return envelope(trainees);
  }),

  http.get("/api/v1/providers/:id", ({ params }) => {
    const id = Number(params.id);
    const found = providers.find((p) => p.id === id);
    if (found) return envelope(found);
    return HttpResponse.json({ success: false, message: "Provider not found" }, { status: 404 });
  }),

  http.post("/api/v1/providers/:providerId/courses", async ({ params, request }) => {
    const providerId = Number(params.providerId);
    const body = /** @type {Record<string, any>} */ (await request.json());
    const provider = providers.find((p) => p.id === providerId);
    const newCourse = {
      id: Date.now(),
      title: body.title,
      description: body.description || "",
      category: body.category || deriveCourseCategory(body.skillsTaught),
      providerId,
      providerName: provider ? provider.name : "Provider",
      skillsTaught: body.skillsTaught || [],
    };
    courses.push(newCourse);
    return envelope(newCourse, "Course added successfully");
  }),

  http.put("/api/v1/providers/courses/:courseId", async ({ params, request }) => {
    const courseId = Number(params.courseId);
    const body = /** @type {Record<string, any>} */ (await request.json());
    const idx = courses.findIndex((c) => c.id === courseId);
    if (idx !== -1) {
      courses[idx] = {
        ...courses[idx],
        ...body,
        id: courseId,
        category: body.category || courses[idx].category || deriveCourseCategory(body.skillsTaught),
      };
      return envelope(courses[idx], "Course updated successfully");
    }
    return HttpResponse.json({ success: false, message: "Course not found" }, { status: 404 });
  }),

  http.delete("/api/v1/providers/courses/:courseId", ({ params }) => {
    const courseId = Number(params.courseId);
    courses = courses.filter((c) => c.id !== courseId);
    return envelope(null, "Course deleted successfully");
  }),

  http.post("/api/v1/providers/courses/:courseId/kick/:traineeId", async ({ params }) => {
    const courseId = Number(params.courseId);
    const traineeId = Number(params.traineeId);
    const course = courses.find((c) => c.id === courseId);
    const trainee = trainees.find((t) => t.id === traineeId);
    if (trainee && course) {
      trainee.enrolledCourses = trainee.enrolledCourses.filter((title) => title !== course.title);
    }
    return envelope(null, "Trainee kicked from course");
  }),

  // --- Email ---
  http.post("/api/v1/email/trigger-quarterly-reminders", () => {
    const eligible = trainees.filter((t) => t.consentGiven && t.allowEmails && !t.adminStoppedEmail).length;
    return envelope(
      `Quarterly update reminders sent: ${eligible} emails queued.`,
      "Quarterly reminders triggered"
    );
  }),
];
