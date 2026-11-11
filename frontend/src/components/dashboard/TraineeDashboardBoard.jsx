import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { traineeApi, courseApi } from "../../api/endpoints";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../ui/useToast";
import {
  GraduationCap,
  CheckCircle2,
  Award,
  BriefcaseBusiness,
  Sparkles,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Progress } from "../ui/Progress";
import { LoadingState, ErrorState } from "../ui/QueryState";

export function TraineeDashboardBoard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const traineeId = user?.id || 1;

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErrObj,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["trainee", traineeId],
    queryFn: ({ signal }) => traineeApi.getById(traineeId, signal),
    enabled: Boolean(traineeId),
    staleTime: 60000,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: ({ signal }) => courseApi.getAll(signal),
    staleTime: 60000,
  });

  const { data: allTrainees = [] } = useQuery({
    queryKey: ["trainees"],
    queryFn: ({ signal }) => traineeApi.getAll(signal),
    staleTime: 60000,
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId) => traineeApi.enroll(traineeId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      addToast({ title: "Enrolled", description: "Course added to your active enrollments." });
    },
    onError: (err) => {
      addToast({ title: "Enrollment Failed", description: err.message, variant: "danger" });
    },
  });

  const { completionPct, recommendedCourses } = useMemo(() => {
    const enrolledList = profile?.enrolledCourses || [];
    const completedList = profile?.completedCourses || [];
    const totalCourses = enrolledList.length + completedList.length;
    const pct = totalCourses > 0 ? Math.round((completedList.length / totalCourses) * 100) : 0;

    const popularityMap = {};
    allTrainees.forEach((t) => {
      (t.enrolledCourses || []).forEach((title) => {
        popularityMap[title] = (popularityMap[title] || 0) + 1;
      });
      (t.completedCourses || []).forEach((title) => {
        popularityMap[title] = (popularityMap[title] || 0) + 1;
      });
    });

    const ownedSkills = new Set(profile?.skills || []);
    const takenSet = new Set([...enrolledList, ...completedList]);

    const ranked = courses
      .filter((c) => !takenSet.has(c.title))
      .map((c) => {
        const newSkills = (c.skillsTaught || []).filter((s) => !ownedSkills.has(s));
        const popularity = popularityMap[c.title] || 0;
        return {
          ...c,
          newSkills,
          popularity,
          score: newSkills.length * 10 + popularity,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    return { completionPct: pct, recommendedCourses: ranked };
  }, [profile, courses, allTrainees]);

  if (profileLoading || coursesLoading) {
    return <LoadingState label="Loading your trainee dashboard..." rows={4} />;
  }

  if (profileError || !profile) {
    return (
      <ErrorState
        title="Failed to load your dashboard"
        error={profileErrObj || new Error("Trainee profile unavailable.")}
        onRetry={refetchProfile}
      />
    );
  }

  const enrolledCourses = profile.enrolledCourses || [];
  const completedCourses = profile.completedCourses || [];
  const skills = profile.skills || [];
  const certifications = profile.certifications || [];

  const statusBadge =
    profile.employmentStatus === "EMPLOYED"
      ? { label: "Employed", variant: "emerald" }
      : profile.employmentStatus === "UNEMPLOYED"
      ? { label: "Unemployed", variant: "rose" }
      : { label: "Seeking", variant: "amber" };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Trainee Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Welcome back, {profile.fullName}. Track courses, earned skills, and career outcomes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/me">
            <Button variant="outline" size="sm">
              <UserCheck size={14} /> Edit My Profile
            </Button>
          </Link>
          <Link to="/courses">
            <Button variant="primary" size="sm">
              <GraduationCap size={14} /> Explore Courses
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/me?tab=courses" className="group block">
          <Card className="group-hover:border-gray-400 dark:group-hover:border-gray-600 h-full">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Active Enrollments
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-1 tabular-nums">
                  {enrolledCourses.length}
                </p>
                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:underline mt-1 inline-block">
                  Manage enrollments &rarr;
                </span>
              </div>
              <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                <GraduationCap size={18} />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/me?tab=courses" className="group block">
          <Card className="group-hover:border-gray-400 dark:group-hover:border-gray-600 h-full">
            <CardContent className="p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Courses Completed
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-1 tabular-nums">
                    {completedCourses.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <Progress value={completionPct} />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {completionPct}% of enrolled journey complete
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/me?tab=skills" className="group block">
          <Card className="group-hover:border-gray-400 dark:group-hover:border-gray-600 h-full">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Earned Skills
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-1 tabular-nums">
                  {skills.length}
                </p>
                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:underline mt-1 inline-block">
                  {certifications.length} certifications &rarr;
                </span>
              </div>
              <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                <Award size={18} />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/me?tab=employment" className="group block">
          <Card className="group-hover:border-gray-400 dark:group-hover:border-gray-600 h-full">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Employment Status
                </p>
                <div className="mt-1.5">
                  <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:underline mt-2 inline-block truncate max-w-full">
                  {profile.currentRole || profile.companyName || "Update details"} &rarr;
                </span>
              </div>
              <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                <BriefcaseBusiness size={18} />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Two-Column Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Learning & Career Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap size={16} /> My Learning & Career Snapshot
            </CardTitle>
            <Link
              to="/me?tab=courses"
              className="text-xs font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50 inline-flex items-center gap-1"
            >
              Open Full Record <ArrowRight size={13} />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                In Progress ({enrolledCourses.length})
              </p>
              {enrolledCourses.length > 0 ? (
                <ul className="space-y-2">
                  {enrolledCourses.map((title) => (
                    <li
                      key={title}
                      className="p-2.5 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-between gap-2 text-xs dark:bg-gray-950/70 dark:border-gray-800"
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {title}
                      </span>
                      <Badge variant="neutral">In Progress</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No active enrollments. Pick a suggested course on the right to begin.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Verified Skills ({skills.length})
              </p>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Complete enrolled courses to earn skills automatically.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <ShieldCheck size={14} className="shrink-0" />
                <span>
                  Consent:{" "}
                  <strong className="font-medium text-gray-900 dark:text-gray-100">
                    {profile.consentGiven ? "Granted" : "Pending"}
                  </strong>
                </span>
              </div>
              <Link
                to="/me?tab=employment"
                className="font-medium text-gray-900 underline hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300"
              >
                Update Employment &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Client-side Course Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles size={16} /> Suggested Courses for You
            </CardTitle>
            <Link
              to="/courses"
              className="text-xs font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50 inline-flex items-center gap-1"
            >
              Browse Catalog <ArrowRight size={13} />
            </Link>
          </CardHeader>
          <CardContent>
            {recommendedCourses.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 py-6 text-center">
                You are already enrolled in or have completed all catalog courses.
              </p>
            ) : (
              <div className="space-y-3">
                {recommendedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-md flex items-start justify-between gap-3 dark:bg-gray-950/70 dark:border-gray-800"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                          {course.title}
                        </p>
                        {course.newSkills.length > 0 && (
                          <Badge variant="dark" className="text-[10px]">
                            Suggested for you
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {course.providerName}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(course.skillsTaught || []).map((skill) => (
                          <Badge
                            key={skill}
                            variant={course.newSkills.includes(skill) ? "neutral" : "outline"}
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      className="shrink-0"
                      loading={enrollMutation.isPending}
                      onClick={() => enrollMutation.mutate(course.id)}
                    >
                      <Plus size={13} /> Enroll
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
