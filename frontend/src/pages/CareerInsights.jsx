import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { H2 } from "@blueprintjs/core";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  FileText,
  GraduationCap,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";
import { aiApi, courseApi, traineeApi } from "../api/endpoints";
import { useAuth } from "../context/useAuth";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Callout } from "../components/ui/Callout";
import { Card, Section, SectionCard } from "../components/ui/Card";
import { Field, Input, Textarea } from "../components/ui/Field";
import { Progress } from "../components/ui/Progress";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/QueryState";
import { Select } from "../components/ui/Select";
import { Switch } from "../components/ui/Switch";
import { Tabs, TabsList, TabsPanel, TabsTab } from "../components/ui/Tabs";
import { useToast } from "../components/ui/useToast";
import { deriveCourseCategory } from "../utils/domain";

const IT_ROLE_OPTIONS = [
  { value: "Backend Developer", label: "Backend Developer" },
  { value: "Full-Stack Engineer", label: "Full-Stack Engineer" },
  { value: "DevOps Engineer", label: "DevOps Engineer" },
  { value: "Cloud Architect", label: "Cloud Architect" },
  { value: "Data & AI Engineer", label: "Data & AI Engineer" },
  { value: "Site Reliability Engineer", label: "Site Reliability Engineer" },
  { value: "Frontend Engineer", label: "Frontend Engineer" },
];

const SAMPLE_RESUME_TEXT = [
  "Software Engineer experienced in building microservices with Java 21, Spring Boot, REST APIs, and PostgreSQL.",
  "Built CI/CD pipelines using Docker and GitHub Actions. Familiar with React, TypeScript, Unit Testing (JUnit 5), and Redis caching.",
  "Interested in transitioning toward Cloud Native Kubernetes architecture, Terraform infrastructure as code, and distributed observability.",
].join("\n");

const DEFAULT_FALLBACK_SKILLS = ["Java", "Spring Boot", "PostgreSQL", "Docker", "REST APIs"];

/**
 * Normalizes a list of skill strings while preserving first-seen casing.
 * @param {string[]} items
 * @returns {string[]}
 */
function uniqueSkills(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const trimmed = String(item || "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export default function CareerInsights() {
  const { role, user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const isTrainee = role === "TRAINEE" && Number(user?.id) > 0;
  const traineeId = isTrainee ? Number(user.id) : 0;

  const [itTrackEnabled, setItTrackEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("skill-gap");
  const [includeAtsInMatchmaking, setIncludeAtsInMatchmaking] = useState(true);

  const [draftResumeText, setDraftResumeText] = useState(SAMPLE_RESUME_TEXT);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [draftTargetRole, setDraftTargetRole] = useState(/** @type {string | null} */ (null));
  const [manualSkillInput, setManualSkillInput] = useState("");
  const [customSkills, setCustomSkills] = useState(/** @type {string[]} */ ([]));

  const [submittedGapParams, setSubmittedGapParams] = useState(
    /** @type {{ targetRole: string | null, resumeText: string }} */ ({
      targetRole: null,
      resumeText: SAMPLE_RESUME_TEXT,
    })
  );
  const [trendsRole, setTrendsRole] = useState("Backend Developer");

  const {
    data: trainee,
    isLoading: isTraineeLoading,
    error: traineeError,
    refetch: refetchTrainee,
  } = useQuery({
    queryKey: ["trainees", traineeId],
    queryFn: ({ signal }) => traineeApi.getById(traineeId, signal),
    enabled: isTrainee,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: ({ signal }) => courseApi.getAll(signal),
  });

  const defaultRoleFromProfile = useMemo(() => {
    const profileRole = trainee?.currentRole?.trim();
    if (profileRole) return profileRole;
    return "Backend Developer";
  }, [trainee?.currentRole]);

  const effectiveDraftTargetRole = draftTargetRole ?? defaultRoleFromProfile;
  const activeGapTargetRole = submittedGapParams.targetRole ?? defaultRoleFromProfile;

  const verifiedSkills = useMemo(() => {
    const base = isTrainee ? trainee?.skills || [] : DEFAULT_FALLBACK_SKILLS;
    return uniqueSkills([...base, ...customSkills]);
  }, [isTrainee, trainee?.skills, customSkills]);

  const atsMutation = useMutation({
    mutationFn: (/** @type {string} */ text) => aiApi.atsExtract(text),
    onSuccess: (data) => {
      addToast({
        title: "ATS extraction complete",
        description: `Detected ${data.extractedSkillTokens?.length || 0} skill tokens across ${data.totalTokens || 0} tokens.`,
        variant: "success",
      });
    },
    onError: (err) => {
      addToast({
        title: "ATS extraction failed",
        description: err?.message || "Unable to analyze resume text.",
        variant: "error",
      });
    },
  });

  const atsResult = atsMutation.data;
  const detectedSkills = useMemo(
    () => uniqueSkills([...(atsResult?.extractedSkillTokens || []), ...(atsResult?.detectedTechnologies || [])]),
    [atsResult]
  );

  const verifiedLower = useMemo(
    () => new Set(verifiedSkills.map((s) => s.toLowerCase())),
    [verifiedSkills]
  );

  const detectedOnlySkills = useMemo(
    () => detectedSkills.filter((s) => !verifiedLower.has(s.toLowerCase())),
    [detectedSkills, verifiedLower]
  );

  const combinedSkills = useMemo(
    () => uniqueSkills([...verifiedSkills, ...(includeAtsInMatchmaking ? detectedOnlySkills : [])]),
    [verifiedSkills, detectedOnlySkills, includeAtsInMatchmaking]
  );

  const skillGapQuery = useQuery({
    queryKey: [
      "ai",
      "skill-gap",
      activeGapTargetRole,
      submittedGapParams.resumeText,
      verifiedSkills.join("|"),
    ],
    queryFn: () =>
      aiApi.analyzeSkillGap({
        targetRole: activeGapTargetRole,
        resumeText: submittedGapParams.resumeText,
        currentSkills: verifiedSkills,
      }),
    enabled: itTrackEnabled && (!isTrainee || !isTraineeLoading),
  });

  const matchmakingQuery = useQuery({
    queryKey: ["ai", "matchmaking", combinedSkills.join("|")],
    queryFn: () => aiApi.matchRoles(combinedSkills),
    enabled: itTrackEnabled && combinedSkills.length > 0 && (!isTrainee || !isTraineeLoading),
  });

  const trendsQuery = useQuery({
    queryKey: ["ai", "career-trends", trendsRole],
    queryFn: ({ signal }) => aiApi.getCareerTrends(trendsRole, signal),
    enabled: itTrackEnabled && Boolean(trendsRole.trim()),
  });

  const enrollMutation = useMutation({
    mutationFn: (/** @type {number} */ courseId) => traineeApi.enroll(traineeId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainees", traineeId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      addToast({
        title: "Enrolled in course",
        description: "Course added to your learning plan.",
        variant: "success",
      });
    },
    onError: (err) => {
      addToast({
        title: "Enrollment failed",
        description: err?.message || "Could not enroll in the selected course.",
        variant: "error",
      });
    },
  });

  const matchingCourses = useMemo(() => {
    const missing = skillGapQuery.data?.missingSkills || [];
    const topics = skillGapQuery.data?.recommendedTopics || [];
    const needTerms = uniqueSkills([...missing, ...topics]).map((s) => s.toLowerCase());
    const enrolledSet = new Set((trainee?.enrolledCourses || []).map((t) => t.toLowerCase()));
    const completedSet = new Set((trainee?.completedCourses || []).map((t) => t.toLowerCase()));

    return [...courses]
      .map((course) => {
        const courseText = `${course.title} ${course.description} ${(course.skillsTaught || []).join(" ")}`.toLowerCase();
        const coveredNeeds = (course.skillsTaught || []).filter((skill) =>
          needTerms.some((need) => need.includes(skill.toLowerCase()) || skill.toLowerCase().includes(need))
        );
        const textHits = needTerms.filter((need) => courseText.includes(need)).length;
        return {
          course,
          relevanceScore: coveredNeeds.length * 3 + textHits,
          coveredNeeds,
          isEnrolled: enrolledSet.has(course.title.toLowerCase()),
          isCompleted: completedSet.has(course.title.toLowerCase()),
        };
      })
      .filter((entry) => entry.relevanceScore > 0 || needTerms.length === 0)
      .sort(
        (a, b) =>
          b.relevanceScore - a.relevanceScore ||
          (b.course.enrolledCount ?? 0) - (a.course.enrolledCount ?? 0)
      )
      .slice(0, 4);
  }, [courses, skillGapQuery.data, trainee?.completedCourses, trainee?.enrolledCourses]);

  const handleResumeFileChange = async (/** @type {import("react").ChangeEvent<HTMLInputElement>} */ event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const lower = file.name.toLowerCase();
    const isPlainText =
      lower.endsWith(".txt") ||
      lower.endsWith(".md") ||
      lower.endsWith(".csv") ||
      lower.endsWith(".json") ||
      file.type.startsWith("text/");

    if (!isPlainText) {
      addToast({
        title: "Plain-text or Markdown recommended",
        description:
          "Browser upload reads .txt / .md files directly. For PDF/DOCX resumes, copy and paste your resume text into the editor below.",
        variant: "warning",
      });
      return;
    }

    try {
      const content = await file.text();
      setUploadedFileName(file.name);
      setDraftResumeText(content);
      setSubmittedGapParams({
        targetRole: effectiveDraftTargetRole,
        resumeText: content,
      });
      atsMutation.mutate(content);
    } catch {
      addToast({
        title: "Could not read file",
        description: "Try pasting your resume text directly into the editor.",
        variant: "error",
      });
    }
  };

  const handleRunGapAnalysis = () => {
    if (!draftResumeText.trim() && verifiedSkills.length === 0) {
      addToast({
        title: "Input needed",
        description: "Add at least one skill or paste resume text before running analysis.",
        variant: "warning",
      });
      return;
    }
    setSubmittedGapParams({
      targetRole: effectiveDraftTargetRole,
      resumeText: draftResumeText,
    });
    if (draftResumeText.trim()) {
      atsMutation.mutate(draftResumeText);
    }
  };

  const handleAddManualSkill = (/** @type {import("react").FormEvent} */ e) => {
    e.preventDefault();
    const clean = manualSkillInput.trim();
    if (!clean) return;
    setCustomSkills((prev) => uniqueSkills([...prev, clean]));
    setManualSkillInput("");
  };

  if (isTrainee && isTraineeLoading) {
    return <LoadingState message="Loading your profile and AI career workspace..." rows={5} />;
  }

  if (isTrainee && traineeError) {
    return (
      <ErrorState
        title="Unable to load trainee profile"
        error={traineeError}
        onRetry={() => refetchTrainee()}
      />
    );
  }

  const gapData = skillGapQuery.data;
  const matchPercentage = gapData?.matchPercentage ?? 0;
  const matchVariant =
    matchPercentage >= 75 ? "success" : matchPercentage >= 45 ? "primary" : "warning";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles size={18} className="text-blue-500 shrink-0" />
              <H2 className="!mb-0">IT Career Insights &amp; Skill Gap AI</H2>
              <Badge variant="primary">IT Roles Only</Badge>
              {role === "ADMIN" && <Badge variant="outline">Admin Preview</Badge>}
            </div>
            <p className="text-sm bp6-text-muted">
              Separate verified course credentials from ATS-detected resume tokens, score your target
              IT role readiness, discover matching roles, and inspect emerging market trends.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Switch
              id="it-track-toggle"
              checked={itTrackEnabled}
              onCheckedChange={setItTrackEnabled}
              label="IT Career Track"
              description="Required for AI career analysis"
            />
            {isTrainee && (
              <Link to="/me">
                <Button variant="outline" icon={<GraduationCap size={14} />}>
                  My Profile
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {!itTrackEnabled ? (
        <Callout
          variant="warning"
          icon={<AlertTriangle size={16} />}
          title="IT Career Track Required for AI Features"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
            <p className="mb-0">
              Per platform policy, Skill Gap ATS scanning, IT Role Matchmaking, and Market Trends
              are enabled exclusively for Information Technology (IT) career tracks.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setItTrackEnabled(true)}
              icon={<Sparkles size={14} />}
            >
              Enable IT Career Track
            </Button>
          </div>
        </Callout>
      ) : (
        <>
          {/* Verified vs ATS Detected Skill Inventory + Resume Input */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 space-y-4">
              <Section
                title="Skill Inventory"
                subtitle="Verified profile skills are stored separately from ATS resume tokens"
                icon={<CheckCircle2 size={15} />}
              >
                <SectionCard className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide bp6-text-muted">
                        Verified Profile &amp; Course Skills ({verifiedSkills.length})
                      </span>
                      <Badge variant="success">Verified</Badge>
                    </div>
                    {verifiedSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {verifiedSkills.map((skill) => (
                          <Badge key={skill} variant="emerald" icon={<CheckCircle2 size={12} />}>
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs bp6-text-muted mb-0">
                        Complete a course or add temporary skills below to seed your analysis.
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide bp6-text-muted">
                        ATS-Detected Resume Tokens ({detectedOnlySkills.length} new)
                      </span>
                      <Badge variant="primary">Detected</Badge>
                    </div>
                    {detectedSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {detectedSkills.map((token) => (
                          <Badge
                            key={token}
                            variant={verifiedLower.has(token.toLowerCase()) ? "secondary" : "primary"}
                          >
                            {token}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs bp6-text-muted mb-0">
                        Click <strong>Scan Resume &amp; Analyze Gap</strong> to extract ATS skill tokens.
                      </p>
                    )}
                  </div>

                  <form onSubmit={handleAddManualSkill} className="pt-2 border-t border-black/10 dark:border-white/10">
                    <Field
                      label="Add Exploratory Skill for Simulation"
                      id="manual-skill-input"
                      className="!mb-0"
                    >
                      <div className="flex gap-2">
                        <Input
                          id="manual-skill-input"
                          value={manualSkillInput}
                          onChange={(/** @type {any} */ e) => setManualSkillInput(e.target.value)}
                          placeholder="e.g., Terraform, Kafka, GraphQL"
                        />
                        <Button type="submit" variant="outline">
                          Add
                        </Button>
                      </div>
                    </Field>
                  </form>
                </SectionCard>
              </Section>
            </div>

            <div className="lg:col-span-7">
              <Section
                title="Resume ATS Scanner"
                subtitle={
                  uploadedFileName
                    ? `Loaded file: ${uploadedFileName}`
                    : "Upload a .txt / .md resume or paste text for ATS skill extraction"
                }
                icon={<FileText size={15} />}
                rightElement={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.csv,.json,text/plain,text/markdown"
                      className="hidden"
                      onChange={handleResumeFileChange}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Upload size={14} />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload Resume
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedFileName("sample-it-resume.txt");
                        setDraftResumeText(SAMPLE_RESUME_TEXT);
                      }}
                    >
                      Reset Sample
                    </Button>
                  </div>
                }
              >
                <SectionCard className="space-y-4">
                  <Field
                    label="Resume Content"
                    id="ats-resume-textarea"
                    description={
                      atsResult
                        ? `Last ATS scan: ${atsResult.totalTokens} tokens scanned, ${atsResult.extractedSkillTokens.length} skill tokens detected.`
                        : "Supports plain text / Markdown resumes. Backend analyzes text directly via /api/v1/ai/ats-extract."
                    }
                    className="!mb-0"
                  >
                    <Textarea
                      id="ats-resume-textarea"
                      rows={5}
                      value={draftResumeText}
                      onChange={(/** @type {any} */ e) => setDraftResumeText(e.target.value)}
                      placeholder="Paste your IT resume text, tech stack summary, or project experience..."
                    />
                  </Field>

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div className="flex-1">
                      <Field label="Target IT Role" id="target-it-role" className="!mb-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Select
                            value={
                              IT_ROLE_OPTIONS.some((opt) => opt.value === effectiveDraftTargetRole)
                                ? effectiveDraftTargetRole
                                : ""
                            }
                            onValueChange={(val) => setDraftTargetRole(String(val))}
                            options={IT_ROLE_OPTIONS}
                            placeholder="Preset IT role..."
                          />
                          <Input
                            id="target-it-role"
                            value={effectiveDraftTargetRole}
                            onChange={(/** @type {any} */ e) => setDraftTargetRole(e.target.value)}
                            placeholder="Or enter custom IT role..."
                          />
                        </div>
                      </Field>
                    </div>

                    <Button
                      variant="primary"
                      icon={<Sparkles size={14} />}
                      loading={atsMutation.isPending || skillGapQuery.isFetching}
                      onClick={handleRunGapAnalysis}
                    >
                      Scan Resume &amp; Analyze Gap
                    </Button>
                  </div>
                </SectionCard>
              </Section>
            </div>
          </div>

          {/* AI Workspace Tabs */}
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab} large>
              <TabsList>
                <TabsTab value="skill-gap">
                  <span className="inline-flex items-center gap-1.5">
                    <Target size={14} />
                    <span>Skill Gap &amp; Courses</span>
                  </span>
                </TabsTab>
                <TabsTab value="role-match">
                  <span className="inline-flex items-center gap-1.5">
                    <Compass size={14} />
                    <span>IT Role Matchmaking</span>
                  </span>
                </TabsTab>
                <TabsTab value="career-trends">
                  <span className="inline-flex items-center gap-1.5">
                    <TrendingUp size={14} />
                    <span>Future Careers &amp; Trends</span>
                  </span>
                </TabsTab>
              </TabsList>

              {/* TAB 1: Skill Gap */}
              <TabsPanel value="skill-gap" className="pt-4 space-y-5">
                {skillGapQuery.isLoading ? (
                  <LoadingState message={`Scoring readiness for ${activeGapTargetRole}...`} rows={3} />
                ) : skillGapQuery.error ? (
                  <ErrorState
                    title="Skill gap analysis failed"
                    error={skillGapQuery.error}
                    onRetry={() => skillGapQuery.refetch()}
                  />
                ) : gapData ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card compact className="md:col-span-2 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs uppercase tracking-wide bp6-text-muted font-semibold">
                              Target IT Role
                            </div>
                            <div className="text-base font-semibold mt-0.5">{gapData.targetRole}</div>
                          </div>
                          <Badge variant={matchVariant} round>
                            {Math.round(matchPercentage)}% Match
                          </Badge>
                        </div>
                        <Progress
                          value={matchPercentage}
                          variant={matchVariant}
                          label="Role Readiness Score"
                          showValue
                        />
                      </Card>

                      <Card compact className="space-y-1">
                        <div className="text-xs uppercase tracking-wide bp6-text-muted font-semibold">
                          Coverage Breakdown
                        </div>
                        <div className="text-2xl font-bold tabular-nums">
                          {gapData.matchedSkills.length} /{" "}
                          {gapData.matchedSkills.length + gapData.missingSkills.length}
                        </div>
                        <p className="text-xs bp6-text-muted mb-0">
                          Matched core competencies vs {gapData.missingSkills.length} gap area(s)
                        </p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Section
                        title={`Matched Skills (${gapData.matchedSkills.length})`}
                        icon={<CheckCircle2 size={14} />}
                      >
                        <SectionCard>
                          {gapData.matchedSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {gapData.matchedSkills.map((skill) => (
                                <Badge key={skill} variant="emerald">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs bp6-text-muted mb-0">
                              No direct role skill overlaps yet. Scan your resume or add skills above.
                            </p>
                          )}
                        </SectionCard>
                      </Section>

                      <Section
                        title={`Skill Gaps to Close (${gapData.missingSkills.length})`}
                        icon={<AlertTriangle size={14} />}
                      >
                        <SectionCard>
                          {gapData.missingSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {gapData.missingSkills.map((skill) => (
                                <Badge key={skill} variant="rose">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Callout variant="success" compact>
                              You match every key requirement benchmarked for this role.
                            </Callout>
                          )}
                        </SectionCard>
                      </Section>
                    </div>

                    <Section
                      title="Recommended Learning Topics"
                      subtitle="Grounded against SkillTrack market research benchmarks"
                      icon={<BookOpen size={14} />}
                    >
                      <SectionCard>
                        {gapData.recommendedTopics?.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1.5 text-sm mb-0">
                            {gapData.recommendedTopics.map((topic) => (
                              <li key={topic}>{topic}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs bp6-text-muted mb-0">No extra topics required.</p>
                        )}
                      </SectionCard>
                    </Section>

                    <Section
                      title="Recommended SkillTrack Courses"
                      subtitle="Courses that close your highest-priority missing skills"
                      icon={<GraduationCap size={14} />}
                      rightElement={
                        <Link to="/courses">
                          <Button variant="ghost" size="sm" endIcon={<ArrowRight size={14} />}>
                            Browse All Courses
                          </Button>
                        </Link>
                      }
                    >
                      <SectionCard>
                        {matchingCourses.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {matchingCourses.map(
                              ({ course, coveredNeeds, isEnrolled, isCompleted }) => (
                                <Card key={course.id} compact className="space-y-2.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="font-semibold text-sm">{course.title}</div>
                                      <div className="text-xs bp6-text-muted">
                                        {course.providerName} &bull;{" "}
                                        {deriveCourseCategory(course.skillsTaught, course.category)}
                                      </div>
                                    </div>
                                    <Badge variant="outline">
                                      {course.enrolledCount ?? 0} enrolled
                                    </Badge>
                                  </div>

                                  <div className="flex flex-wrap gap-1">
                                    {(course.skillsTaught || []).map((skill) => {
                                      const closesGap = coveredNeeds.includes(skill);
                                      return (
                                        <Badge
                                          key={skill}
                                          variant={closesGap ? "primary" : "secondary"}
                                        >
                                          {skill}
                                        </Badge>
                                      );
                                    })}
                                  </div>

                                  <div className="flex items-center justify-between pt-1">
                                    <Link to={`/providers/${course.providerId}`}>
                                      <Button variant="ghost" size="sm">
                                        Provider Profile
                                      </Button>
                                    </Link>
                                    {isTrainee &&
                                      (isCompleted ? (
                                        <Badge variant="success">Completed</Badge>
                                      ) : isEnrolled ? (
                                        <Badge variant="primary">Enrolled</Badge>
                                      ) : (
                                        <Button
                                          variant="primary"
                                          size="sm"
                                          loading={
                                            enrollMutation.isPending &&
                                            enrollMutation.variables === course.id
                                          }
                                          onClick={() => enrollMutation.mutate(course.id)}
                                        >
                                          Enroll Now
                                        </Button>
                                      ))}
                                  </div>
                                </Card>
                              )
                            )}
                          </div>
                        ) : (
                          <EmptyState
                            icon="learning"
                            title="No matching courses found"
                            description="Explore the full catalog to add new verified skills."
                          />
                        )}
                      </SectionCard>
                    </Section>
                  </>
                ) : null}
              </TabsPanel>

              {/* TAB 2: IT Role Matchmaking */}
              <TabsPanel value="role-match" className="pt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <Switch
                    id="include-ats-switch"
                    checked={includeAtsInMatchmaking}
                    onCheckedChange={setIncludeAtsInMatchmaking}
                    label="Include ATS-detected resume tokens in role matching"
                    description={`Active matching pool: ${combinedSkills.length} unique skill(s)`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<RefreshCw size={14} />}
                    loading={matchmakingQuery.isFetching}
                    onClick={() => matchmakingQuery.refetch()}
                  >
                    Recalculate Fit
                  </Button>
                </div>

                {matchmakingQuery.isLoading ? (
                  <LoadingState message="Matching your skills against IT career roles..." rows={3} />
                ) : matchmakingQuery.error ? (
                  <ErrorState
                    title="Role matchmaking failed"
                    error={matchmakingQuery.error}
                    onRetry={() => matchmakingQuery.refetch()}
                  />
                ) : (matchmakingQuery.data || []).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(matchmakingQuery.data || []).map((match) => {
                      const fitVariant =
                        match.fitScore >= 75
                          ? "success"
                          : match.fitScore >= 50
                            ? "primary"
                            : "warning";

                      return (
                        <Card key={match.roleTitle} className="flex flex-col justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <BriefcaseBusiness size={16} className="text-blue-500 shrink-0" />
                                <div className="font-semibold text-sm">{match.roleTitle}</div>
                              </div>
                              <Badge variant={fitVariant} round>
                                {Math.round(match.fitScore)}% fit
                              </Badge>
                            </div>

                            <Progress value={match.fitScore} variant={fitVariant} />

                            <div>
                              <div className="text-xs font-medium bp6-text-muted mb-1.5">
                                Matching Skills
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {(match.matchingSkills || []).length > 0 ? (
                                  match.matchingSkills.map((s) => (
                                    <Badge key={s} variant="emerald">
                                      {s}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs bp6-text-muted">Foundational match</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs font-medium bp6-text-muted mb-1.5">
                                Growth Areas
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {(match.growthAreas || []).map((g) => (
                                  <Badge key={g} variant="amber">
                                    {g}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            fill
                            endIcon={<ArrowRight size={14} />}
                            onClick={() => {
                              setDraftTargetRole(match.roleTitle);
                              setSubmittedGapParams((prev) => ({
                                ...prev,
                                targetRole: match.roleTitle,
                              }));
                              setActiveTab("skill-gap");
                            }}
                          >
                            Analyze Gap for This Role
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon="compass"
                    title="No role matches available"
                    description="Add verified or detected IT skills above to generate role recommendations."
                  />
                )}
              </TabsPanel>

              {/* TAB 3: Future Career Trends */}
              <TabsPanel value="career-trends" className="pt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div className="w-full sm:w-80">
                    <Field label="Inspect IT Role Outlook" id="trends-role-select" className="!mb-0">
                      <Select
                        value={trendsRole}
                        onValueChange={(val) => setTrendsRole(String(val))}
                        options={IT_ROLE_OPTIONS}
                      />
                    </Field>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<RefreshCw size={14} />}
                    loading={trendsQuery.isFetching}
                    onClick={() => trendsQuery.refetch()}
                  >
                    Refresh Outlook
                  </Button>
                </div>

                {trendsQuery.isLoading ? (
                  <LoadingState message={`Synthesizing 2026 trends for ${trendsRole}...`} rows={3} />
                ) : trendsQuery.error ? (
                  <ErrorState
                    title="Unable to fetch career trends"
                    error={trendsQuery.error}
                    onRetry={() => trendsQuery.refetch()}
                  />
                ) : trendsQuery.data ? (
                  <div className="space-y-4">
                    <Callout
                      variant="info"
                      icon={<TrendingUp size={16} />}
                      title={`Future Outlook — ${trendsQuery.data.itRole}`}
                    >
                      {trendsQuery.data.futureCareerProspect}
                    </Callout>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Section title="Current Market Trends" icon={<TrendingUp size={14} />}>
                        <SectionCard>
                          <ul className="list-disc pl-5 space-y-1.5 text-sm mb-0">
                            {(trendsQuery.data.currentMarketTrends || []).map((trend) => (
                              <li key={trend}>{trend}</li>
                            ))}
                          </ul>
                        </SectionCard>
                      </Section>

                      <Section title="Emerging Future Roles" icon={<Sparkles size={14} />}>
                        <SectionCard>
                          <div className="flex flex-wrap gap-2">
                            {(trendsQuery.data.emergingFutureRoles || []).map((futureRole) => (
                              <Badge key={futureRole} variant="primary" round>
                                {futureRole}
                              </Badge>
                            ))}
                          </div>
                        </SectionCard>
                      </Section>
                    </div>

                    <Section
                      title="Evolving Skill Demands"
                      subtitle="Green badges indicate skills you already have verified on SkillTrack"
                      icon={<Target size={14} />}
                    >
                      <SectionCard>
                        <div className="flex flex-wrap gap-1.5">
                          {(trendsQuery.data.evolvingSkillDemands || []).map((skill) => {
                            const owned = verifiedLower.has(skill.toLowerCase());
                            return (
                              <Badge
                                key={skill}
                                variant={owned ? "emerald" : "outline"}
                                icon={owned ? <CheckCircle2 size={12} /> : undefined}
                              >
                                {skill}
                              </Badge>
                            );
                          })}
                        </div>
                      </SectionCard>
                    </Section>
                  </div>
                ) : null}
              </TabsPanel>
            </Tabs>
          </Card>
        </>
      )}
    </div>
  );
}
