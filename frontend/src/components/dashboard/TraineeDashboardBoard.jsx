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
import { ButtonGroup, EntityTitle, H2 } from "@blueprintjs/core";
import { Card, Section, SectionCard, CardList } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Progress } from "../ui/Progress";
import { LoadingState, ErrorState } from "../ui/QueryState";
import { getEmploymentMeta } from "../../utils/domain";

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

  const statusBadge = getEmploymentMeta(profile.employmentStatus);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <H2 className="!mb-0">Trainee Dashboard</H2>
          <p className="bp6-text-muted text-xs mt-1">
            Welcome back, {profile.fullName}. Track courses, earned skills, and career outcomes.
          </p>
        </div>

        <ButtonGroup>
          <Link to="/me">
            <Button variant="outline" icon={<UserCheck size={14} />}>
              Edit My Profile
            </Button>
          </Link>
          <Link to="/courses">
            <Button variant="primary" icon={<GraduationCap size={14} />}>
              Explore Courses
            </Button>
          </Link>
        </ButtonGroup>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/me?tab=courses" className="block">
          <Card interactive className="h-full">
            <EntityTitle
              icon={<GraduationCap size={18} className="bp6-text-muted" />}
              title="Active Enrollments"
              subtitle="Manage enrollments →"
            />
            <H2 className="!mb-0 !mt-3 tabular-nums">{enrolledCourses.length}</H2>
          </Card>
        </Link>

        <Link to="/me?tab=courses" className="block">
          <Card interactive className="h-full">
            <EntityTitle
              icon={<CheckCircle2 size={18} className="bp6-text-muted" />}
              title="Courses Completed"
              subtitle={`${completionPct}% of enrolled journey`}
            />
            <div className="mt-3 space-y-2">
              <H2 className="!mb-0 tabular-nums">{completedCourses.length}</H2>
              <Progress value={completionPct} variant="success" />
            </div>
          </Card>
        </Link>

        <Link to="/me?tab=skills" className="block">
          <Card interactive className="h-full">
            <EntityTitle
              icon={<Award size={18} className="bp6-text-muted" />}
              title="Earned Skills"
              subtitle={`${certifications.length} certifications →`}
            />
            <H2 className="!mb-0 !mt-3 tabular-nums">{skills.length}</H2>
          </Card>
        </Link>

        <Link to="/my-employment" className="block">
          <Card interactive className="h-full">
            <EntityTitle
              icon={<BriefcaseBusiness size={18} className="bp6-text-muted" />}
              title="Employment Status"
              subtitle={profile.currentRole || profile.companyName || "Update details →"}
            />
            <div className="mt-3">
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Two-Column Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section
          title="My Learning & Career Snapshot"
          icon={<GraduationCap size={16} />}
          rightElement={
            <Link to="/me?tab=courses">
              <Button variant="minimal" size="sm" endIcon={<ArrowRight size={13} />}>
                Open Full Record
              </Button>
            </Link>
          }
        >
          <SectionCard>
            <p className="text-[11px] font-semibold bp6-text-muted uppercase tracking-wider mb-2.5">
              In Progress ({enrolledCourses.length})
            </p>
            {enrolledCourses.length > 0 ? (
              <CardList bordered>
                {enrolledCourses.map((title) => (
                  <Card key={title} compact className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate">{title}</span>
                    <Badge variant="primary">In Progress</Badge>
                  </Card>
                ))}
              </CardList>
            ) : (
              <p className="text-xs bp6-text-muted">
                No active enrollments. Pick a suggested course on the right to begin.
              </p>
            )}
          </SectionCard>

          <SectionCard>
            <p className="text-[11px] font-semibold bp6-text-muted uppercase tracking-wider mb-2.5">
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
              <p className="text-xs bp6-text-muted">
                Complete enrolled courses to earn skills automatically.
              </p>
            )}
          </SectionCard>

          <SectionCard compact className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 bp6-text-muted">
              <ShieldCheck size={14} className="shrink-0" />
              <span>
                Consent: <strong className="font-medium">{profile.consentGiven ? "Granted" : "Pending"}</strong>
              </span>
            </div>
            <Link to="/my-employment">
              <Button variant="minimal" size="sm" endIcon={<ArrowRight size={12} />}>
                Update Employment
              </Button>
            </Link>
          </SectionCard>
        </Section>

        <Section
          title="Suggested Courses for You"
          icon={<Sparkles size={16} />}
          rightElement={
            <Link to="/courses">
              <Button variant="minimal" size="sm" endIcon={<ArrowRight size={13} />}>
                Browse Catalog
              </Button>
            </Link>
          }
        >
          {recommendedCourses.length === 0 ? (
            <SectionCard>
              <p className="text-xs bp6-text-muted py-6 text-center">
                You are already enrolled in or have completed all catalog courses.
              </p>
            </SectionCard>
          ) : (
            <SectionCard padded={false}>
              <CardList bordered={false}>
                {recommendedCourses.map((course) => (
                  <Card
                    key={course.id}
                    compact
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{course.title}</span>
                        {course.newSkills.length > 0 && (
                          <Badge variant="default">Suggested</Badge>
                        )}
                      </div>
                      <div className="text-xs bp6-text-muted">{course.providerName}</div>
                      <div className="flex flex-wrap gap-1">
                        {(course.skillsTaught || []).map((skill) => (
                          <Badge
                            key={skill}
                            variant={course.newSkills.includes(skill) ? "secondary" : "outline"}
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus size={13} />}
                      className="shrink-0"
                      loading={enrollMutation.isPending}
                      onClick={() => enrollMutation.mutate(course.id)}
                    >
                      Enroll
                    </Button>
                  </Card>
                ))}
              </CardList>
            </SectionCard>
          )}
        </Section>
      </div>
    </div>
  );
}
