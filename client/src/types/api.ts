export type UserRole = "admin" | "trainee" | "cp";

export type EmploymentStatus =
  | "full_time"
  | "part_time"
  | "internship"
  | "self_employed"
  | "unemployed";

export interface AuthUser {
  userId: number;
  email: string;
  role: UserRole;
  name: string;
  status: string;
  traineeId: number | null;
  roleCategory: string | null;
  providerId: number | null;
  approvalStatus: string | null;
}

export interface SkillItem {
  id: number;
  name: string;
  categoryId: number;
  categoryName?: string;
}

export interface TraineeSkillDTO {
  id: number;
  skillId: number;
  name: string;
  categoryName: string;
  source: "verified" | "detected";
}

export interface EnrollmentDTO {
  id: number;
  traineeId?: number;
  courseId: number;
  courseTitle: string;
  courseCategory?: string;
  providerName?: string;
  providerId?: number;
  status: "enrolled" | "completed" | "dropped" | "kicked";
  dropReason?: string | null;
  kickReason?: string | null;
  enrolledAt: string;
  completedAt?: string | null;
}

export interface CertificationDTO {
  id: number;
  title: string;
  issuer: string;
  issuedAt?: string | null;
  credentialUrl?: string | null;
}

export interface ProjectDTO {
  id: number;
  title: string;
  description?: string | null;
  repoUrl: string;
}

export interface EmploymentDTO {
  id?: number;
  status: EmploymentStatus;
  role?: string | null;
  company?: string | null;
  salary?: number | null;
  reason?: string | null;
  updatedAt?: string;
}

export interface SalaryHistoryDTO {
  id: number;
  amount: number;
  role: string;
  company: string;
  recordedAt: string;
}

export interface FollowUpDTO {
  id: number;
  sentAt: string;
  respondedAt?: string | null;
  note?: string | null;
  channel: string;
}

export interface TraineeDTO {
  id: number;
  userId?: number;
  fullName: string;
  email?: string;
  phone?: string | null;
  location?: string | null;
  roleCategory: string;
  bio?: string | null;
  lastProfileUpdate: string;
  consentGiven: boolean;
  emailsStopped?: boolean;
  consentUpdatedAt?: string | null;
  skills: TraineeSkillDTO[];
  certifications: CertificationDTO[];
  projects: ProjectDTO[];
  enrollments: EnrollmentDTO[];
  employment: EmploymentDTO | null;
  salaryHistory?: SalaryHistoryDTO[];
  followUps?: FollowUpDTO[];
  resumes?: Array<{
    id: number;
    fileName: string;
    extractedTokens: string[];
    uploadedAt: string;
  }>;
}

export interface CourseProviderDTO {
  id: number;
  userId?: number;
  name: string;
  contactEmail: string;
  website?: string | null;
  description?: string | null;
  approvalStatus: "pending" | "approved" | "rejected";
  courseCount?: number;
  courses?: CourseDTO[];
}

export interface CourseDTO {
  id: number;
  title: string;
  description: string;
  category: string;
  providerId: number;
  providerName: string;
  popularity: number;
  durationWeeks: number;
  skills: SkillItem[];
  recommendedReason?: string;
  recommendationScore?: number;
  activeTrainees?: Array<{
    enrollmentId: number;
    traineeId: number;
    fullName: string;
    status: string;
  }>;
}

export interface SkillCategoryGroupDTO {
  id: number;
  name: string;
  description?: string | null;
  skills: Array<{
    id: number;
    name: string;
    traineeCount: number;
    trainees?: Array<{ id: number; fullName: string; roleCategory: string }>;
  }>;
}

export interface MarketDocDTO {
  id: number;
  title: string;
  slug: string;
  path: string;
  sourceUrl?: string | null;
  summary?: string | null;
  updatedAt: string;
}
