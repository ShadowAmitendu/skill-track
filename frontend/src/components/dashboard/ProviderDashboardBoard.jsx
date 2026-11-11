import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { providerApi, courseApi } from "../../api/endpoints";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/useTheme";
import {
  GraduationCap,
  Users,
  CheckCircle2,
  Award,
  Building2,
  BriefcaseBusiness,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Progress } from "../ui/Progress";
import { LoadingState, ErrorState, EmptyState } from "../ui/QueryState";

export function ProviderDashboardBoard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const providerId = user?.id || 1;

  const {
    data: provider,
    isLoading: providerLoading,
  } = useQuery({
    queryKey: ["provider", providerId],
    queryFn: ({ signal }) => providerApi.getById(providerId, signal),
    enabled: Boolean(providerId),
    staleTime: 60000,
  });

  const {
    data: myCourses = [],
    isLoading: coursesLoading,
    isError: coursesError,
    error: coursesErrObj,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["providerCourses", providerId],
    queryFn: ({ signal }) => courseApi.getByProvider(providerId, signal),
    enabled: Boolean(providerId),
    staleTime: 60000,
  });

  const {
    data: trainees = [],
    isLoading: traineesLoading,
    isError: traineesError,
    error: traineesErrObj,
    refetch: refetchTrainees,
  } = useQuery({
    queryKey: ["providerTrainees"],
    queryFn: ({ signal }) => providerApi.getAllTraineesReadOnly(signal),
    staleTime: 60000,
  });

  const analytics = useMemo(() => {
    const courseTitles = new Set(myCourses.map((c) => c.title));
    const uniqueSkills = new Set();
    const perCourse = myCourses.map((course) => {
      (course.skillsTaught || []).forEach((s) => uniqueSkills.add(s));
      const enrolledCount = trainees.filter((t) =>
        (t.enrolledCourses || []).includes(course.title)
      ).length;
      const completedCount = trainees.filter((t) =>
        (t.completedCourses || []).includes(course.title)
      ).length;
      return {
        id: course.id,
        title: course.title,
        shortTitle:
          course.title.length > 22 ? `${course.title.slice(0, 20)}...` : course.title,
        skillsTaught: course.skillsTaught || [],
        enrolled: enrolledCount,
        completed: completedCount,
      };
    });

    const totalActive = perCourse.reduce((sum, c) => sum + c.enrolled, 0);
    const totalCompleted = perCourse.reduce((sum, c) => sum + c.completed, 0);

    const cohortTrainees = trainees.filter(
      (t) =>
        (t.enrolledCourses || []).some((title) => courseTitles.has(title)) ||
        (t.completedCourses || []).some((title) => courseTitles.has(title))
    );

    const totalSeats = totalActive + totalCompleted;
    const completionRate = totalSeats > 0 ? Math.round((totalCompleted / totalSeats) * 100) : 0;

    const employedCount = cohortTrainees.filter((t) => t.employmentStatus === "EMPLOYED").length;
    const seekingCount = cohortTrainees.filter((t) => t.employmentStatus === "SEEKING").length;
    const unemployedCount = cohortTrainees.filter(
      (t) => t.employmentStatus === "UNEMPLOYED"
    ).length;

    return {
      uniqueSkillsCount: uniqueSkills.size,
      totalActive,
      totalCompleted,
      completionRate,
      cohortCount: cohortTrainees.length,
      perCourse,
      employmentData: [
        { name: "Employed", count: employedCount, color: isDark ? "#F9FAFB" : "#111827" },
        { name: "Seeking", count: seekingCount, color: isDark ? "#9CA3AF" : "#4B5563" },
        { name: "Unemployed", count: unemployedCount, color: isDark ? "#6B7280" : "#9CA3AF" },
      ],
      employedCount,
      seekingCount,
      unemployedCount,
    };
  }, [myCourses, trainees, isDark]);

  if (providerLoading || coursesLoading || traineesLoading) {
    return <LoadingState label="Loading provider dashboard..." rows={4} />;
  }

  if (coursesError || traineesError) {
    return (
      <ErrorState
        title="Failed to load provider dashboard"
        error={coursesErrObj || traineesErrObj}
        onRetry={() => {
          refetchCourses();
          refetchTrainees();
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Course Provider Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {provider?.name || user?.name} — course activity, trainee completions, and cohort outcomes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/providers/${providerId}`}>
            <Button variant="outline" size="sm">
              <Building2 size={14} /> Provider Profile
            </Button>
          </Link>
          <Link to={`/courses?provider=${providerId}`}>
            <Button variant="primary" size="sm">
              <GraduationCap size={14} /> Manage My Courses
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to={`/courses?provider=${providerId}`} className="group block">
          <Card className="group-hover:border-gray-400 dark:group-hover:border-gray-600 h-full">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Published Courses
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-1 tabular-nums">
                  {myCourses.length}
                </p>
                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:underline mt-1 inline-block">
                  Open catalog &rarr;
                </span>
              </div>
              <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                <GraduationCap size={18} />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/trainees" className="group block">
          <Card className="group-hover:border-gray-400 dark:group-hover:border-gray-600 h-full">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Cohort Trainees
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-1 tabular-nums">
                  {analytics.cohortCount}
                </p>
                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:underline mt-1 inline-block">
                  {analytics.totalActive} active seats &rarr;
                </span>
              </div>
              <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full">
          <CardContent className="p-5 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Completion Rate
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-1 tabular-nums">
                  {analytics.completionRate}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <Progress value={analytics.completionRate} />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {analytics.totalCompleted} completed course outcomes
            </p>
          </CardContent>
        </Card>

        <Link to="/skills" className="group block">
          <Card className="group-hover:border-gray-400 dark:group-hover:border-gray-600 h-full">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Skills Covered
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-1 tabular-nums">
                  {analytics.uniqueSkillsCount}
                </p>
                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:underline mt-1 inline-block">
                  Inspect skills &rarr;
                </span>
              </div>
              <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0">
                <Award size={18} />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap size={16} /> Enrollments by Course
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.perCourse.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No courses published yet"
                description="Publish a course from Courses & Providers to track trainee enrollments."
              />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.perCourse}
                    margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="shortTitle"
                      tick={{ fontSize: 11, fill: isDark ? "#9CA3AF" : "#4B5563" }}
                      stroke={isDark ? "#374151" : "#E5E7EB"}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: isDark ? "#9CA3AF" : "#4B5563" }}
                      stroke={isDark ? "#374151" : "#E5E7EB"}
                    />
                    <RechartsTooltip
                      cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                      contentStyle={{
                        backgroundColor: isDark ? "#111827" : "#FFFFFF",
                        borderColor: isDark ? "#1F2937" : "#E5E7EB",
                        color: isDark ? "#F9FAFB" : "#111827",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="enrolled"
                      name="Active Enrolled"
                      fill={isDark ? "#9CA3AF" : "#6B7280"}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="completed"
                      name="Completed"
                      fill={isDark ? "#F9FAFB" : "#111827"}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BriefcaseBusiness size={16} /> Cohort Employment Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.employmentData}
                  margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: isDark ? "#9CA3AF" : "#4B5563" }}
                    stroke={isDark ? "#374151" : "#E5E7EB"}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: isDark ? "#9CA3AF" : "#4B5563" }}
                    stroke={isDark ? "#374151" : "#E5E7EB"}
                  />
                  <RechartsTooltip
                    cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                    contentStyle={{
                      backgroundColor: isDark ? "#111827" : "#FFFFFF",
                      borderColor: isDark ? "#1F2937" : "#E5E7EB",
                      color: isDark ? "#F9FAFB" : "#111827",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {analytics.employmentData.map((entry, idx) => (
                      <Cell key={`cp-emp-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-800 text-center text-xs">
              <Link
                to="/employment?status=EMPLOYED"
                className="hover:bg-gray-50 dark:hover:bg-gray-800/70 rounded-md py-1"
              >
                <span className="text-gray-500 dark:text-gray-400 block">Employed</span>
                <span className="font-semibold text-gray-900 dark:text-gray-50 tabular-nums">
                  {analytics.employedCount}
                </span>
              </Link>
              <Link
                to="/employment?status=SEEKING"
                className="hover:bg-gray-50 dark:hover:bg-gray-800/70 rounded-md py-1"
              >
                <span className="text-gray-500 dark:text-gray-400 block">Seeking</span>
                <span className="font-semibold text-gray-900 dark:text-gray-50 tabular-nums">
                  {analytics.seekingCount}
                </span>
              </Link>
              <Link
                to="/employment?status=UNEMPLOYED"
                className="hover:bg-gray-50 dark:hover:bg-gray-800/70 rounded-md py-1"
              >
                <span className="text-gray-500 dark:text-gray-400 block">Unemployed</span>
                <span className="font-semibold text-gray-900 dark:text-gray-50 tabular-nums">
                  {analytics.unemployedCount}
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Published Courses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap size={16} /> My Published Courses ({myCourses.length})
          </CardTitle>
          <Link
            to="/trainees"
            className="text-xs font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50 inline-flex items-center gap-1"
          >
            Read-only Trainee Directory <ArrowRight size={13} />
          </Link>
        </CardHeader>
        <CardContent>
          {analytics.perCourse.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
              No courses associated with this provider account yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {analytics.perCourse.map((course) => (
                <div
                  key={course.id}
                  className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                      {course.title}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {course.skillsTaught.map((skill) => (
                        <Badge key={skill} variant="neutral">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    <Badge variant="outline">{course.enrolled} enrolled</Badge>
                    <Badge variant="emerald">{course.completed} completed</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
