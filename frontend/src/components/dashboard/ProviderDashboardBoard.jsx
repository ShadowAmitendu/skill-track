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
  Sparkles,
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
import { ButtonGroup, EntityTitle, H2 } from "@blueprintjs/core";
import { Card, Section, SectionCard, CardList } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Progress } from "../ui/Progress";
import { LoadingState, ErrorState, EmptyState } from "../ui/QueryState";
import { EMPLOYMENT_STATUS_OPTIONS, normalizeEmploymentStatus } from "../../utils/domain";

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

    const statusCounts = {
      FULL_TIME: 0,
      PART_TIME: 0,
      INTERNSHIP: 0,
      SELF_EMPLOYED: 0,
      UNEMPLOYED: 0,
    };
    cohortTrainees.forEach((t) => {
      const normalized = normalizeEmploymentStatus(t.employmentStatus);
      statusCounts[normalized] = (statusCounts[normalized] || 0) + 1;
    });

    const colors = {
      FULL_TIME: isDark ? "#32a467" : "#238551",
      PART_TIME: isDark ? "#4c90f0" : "#2d72d2",
      INTERNSHIP: isDark ? "#ec9a3c" : "#c87619",
      SELF_EMPLOYED: isDark ? "#2ee6d6" : "#008075",
      UNEMPLOYED: isDark ? "#e76a6e" : "#cd4246",
    };

    return {
      uniqueSkillsCount: uniqueSkills.size,
      totalActive,
      totalCompleted,
      completionRate,
      cohortCount: cohortTrainees.length,
      perCourse,
      employmentData: EMPLOYMENT_STATUS_OPTIONS.map((opt) => ({
        name: opt.label,
        count: statusCounts[opt.value] || 0,
        color: colors[opt.value],
      })),
      statusCounts,
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
          <H2 className="!mb-0">Course Provider Dashboard</H2>
          <p className="bp6-text-muted text-xs mt-1">
            {provider?.name || user?.name} — course activity, trainee completions, and cohort outcomes.
          </p>
        </div>

        <ButtonGroup>
          <Link to={`/providers/${providerId}`}>
            <Button variant="outline" icon={<Building2 size={14} />}>
              Provider Profile
            </Button>
          </Link>
          <Link to="/provider-ai">
            <Button variant="outline" icon={<Sparkles size={14} />}>
              Course AI Studio
            </Button>
          </Link>
          <Link to={`/courses?provider=${providerId}`}>
            <Button variant="primary" icon={<GraduationCap size={14} />}>
              Manage My Courses
            </Button>
          </Link>
        </ButtonGroup>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to={`/courses?provider=${providerId}`} className="block">
          <Card interactive className="h-full">
            <EntityTitle
              icon={<GraduationCap size={18} className="bp6-text-muted" />}
              title="Published Courses"
              subtitle="Open catalog →"
            />
            <H2 className="!mb-0 !mt-3 tabular-nums">{myCourses.length}</H2>
          </Card>
        </Link>

        <Link to="/trainees" className="block">
          <Card interactive className="h-full">
            <EntityTitle
              icon={<Users size={18} className="bp6-text-muted" />}
              title="Cohort Trainees"
              subtitle={`${analytics.totalActive} active seats →`}
            />
            <H2 className="!mb-0 !mt-3 tabular-nums">{analytics.cohortCount}</H2>
          </Card>
        </Link>

        <Card className="h-full">
          <EntityTitle
            icon={<CheckCircle2 size={18} className="bp6-text-muted" />}
            title="Completion Rate"
            subtitle={`${analytics.totalCompleted} completed outcomes`}
          />
          <div className="mt-3 space-y-2">
            <H2 className="!mb-0 tabular-nums">{analytics.completionRate}%</H2>
            <Progress value={analytics.completionRate} variant="success" />
          </div>
        </Card>

        <Link to="/skills" className="block">
          <Card interactive className="h-full">
            <EntityTitle
              icon={<Award size={18} className="bp6-text-muted" />}
              title="Skills Covered"
              subtitle="Inspect skills →"
            />
            <H2 className="!mb-0 !mt-3 tabular-nums">{analytics.uniqueSkillsCount}</H2>
          </Card>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Enrollments by Course" icon={<GraduationCap size={16} />}>
          <SectionCard>
            {analytics.perCourse.length === 0 ? (
              <EmptyState
                icon={<GraduationCap size={28} />}
                title="No courses published yet"
                description="Publish a course from My Courses to track trainee enrollments."
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
                      tick={{ fontSize: 11, fill: isDark ? "#abb3bf" : "#5f6b7c" }}
                      stroke={isDark ? "#404854" : "#dce0e5"}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: isDark ? "#abb3bf" : "#5f6b7c" }}
                      stroke={isDark ? "#404854" : "#dce0e5"}
                    />
                    <RechartsTooltip
                      cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                      contentStyle={{
                        backgroundColor: isDark ? "#252a31" : "#ffffff",
                        borderColor: isDark ? "#404854" : "#dce0e5",
                        color: isDark ? "#f6f7f9" : "#1c2127",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="enrolled"
                      name="Active Enrolled"
                      fill={isDark ? "#abb3bf" : "#5f6b7c"}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="completed"
                      name="Completed"
                      fill={isDark ? "#4c90f0" : "#2d72d2"}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </Section>

        <Section title="Cohort Employment Outcomes" icon={<BriefcaseBusiness size={16} />}>
          <SectionCard>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.employmentData}
                  margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: isDark ? "#abb3bf" : "#5f6b7c" }}
                    stroke={isDark ? "#404854" : "#dce0e5"}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: isDark ? "#abb3bf" : "#5f6b7c" }}
                    stroke={isDark ? "#404854" : "#dce0e5"}
                  />
                  <RechartsTooltip
                    cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
                    contentStyle={{
                      backgroundColor: isDark ? "#252a31" : "#ffffff",
                      borderColor: isDark ? "#404854" : "#dce0e5",
                      color: isDark ? "#f6f7f9" : "#1c2127",
                      borderRadius: "4px",
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
          </SectionCard>
          <SectionCard compact className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
              <Link key={opt.value} to={`/employment?status=${opt.value}`} className="block">
                <span className="bp6-text-muted block truncate">{opt.label}</span>
                <span className="font-semibold tabular-nums text-sm">
                  {analytics.statusCounts[opt.value] || 0}
                </span>
              </Link>
            ))}
          </SectionCard>
        </Section>
      </div>

      {/* Published Courses List */}
      <Section
        title={`My Published Courses (${myCourses.length})`}
        icon={<GraduationCap size={16} />}
        rightElement={
          <Link to="/trainees">
            <Button variant="minimal" size="sm" endIcon={<ArrowRight size={13} />}>
              Read-only Trainee Directory
            </Button>
          </Link>
        }
      >
        {analytics.perCourse.length === 0 ? (
          <SectionCard>
            <p className="text-xs bp6-text-muted py-4 text-center">
              No courses associated with this provider account yet.
            </p>
          </SectionCard>
        ) : (
          <SectionCard padded={false}>
            <CardList bordered={false}>
              {analytics.perCourse.map((course) => (
                <Card
                  key={course.id}
                  compact
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{course.title}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {course.skillsTaught.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    <Badge variant="outline">{course.enrolled} enrolled</Badge>
                    <Badge variant="success">{course.completed} completed</Badge>
                  </div>
                </Card>
              ))}
            </CardList>
          </SectionCard>
        )}
      </Section>
    </div>
  );
}
