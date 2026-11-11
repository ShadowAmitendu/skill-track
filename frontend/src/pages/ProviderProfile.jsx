import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { providerApi, courseApi, traineeApi } from "../api/endpoints";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ui/useToast";
import { ArrowLeft, Building2, Mail, ExternalLink, GraduationCap, CheckCircle2 } from "lucide-react";
import { Divider, EntityTitle, H2, H3, NonIdealState } from "@blueprintjs/core";
import { Card, Section, SectionCard } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/QueryState";
import { deriveCourseCategory } from "../utils/domain";

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const { addToast } = useToast();

  const isProviderRole = role === "COURSE_PROVIDER";
  const myProviderId = user?.id || 1;
  const isRestricted = isProviderRole && Boolean(id) && Number(id) !== myProviderId;

  const {
    data: provider,
    isLoading: providerLoading,
    isError: providerError,
    error: providerErrObj,
    refetch: refetchProvider,
  } = useQuery({
    queryKey: ["provider", id],
    queryFn: ({ signal }) => providerApi.getById(id, signal),
    enabled: Boolean(id) && !isRestricted,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["providerCourses", id],
    queryFn: ({ signal }) => courseApi.getByProvider(id, signal),
    enabled: Boolean(id) && !isRestricted,
  });

  const { data: selfProfile } = useQuery({
    queryKey: ["trainee", user?.id],
    queryFn: ({ signal }) => traineeApi.getById(user.id, signal),
    enabled: role === "TRAINEE" && Boolean(user?.id),
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId) => traineeApi.enroll(user?.id || 1, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      addToast({ title: "Enrolled", description: "Added to your active course enrollments." });
    },
    onError: (err) => addToast({ title: "Enrollment Failed", description: err.message, variant: "danger" }),
  });

  if (isRestricted) {
    return (
      <div className="max-w-md mx-auto my-12">
        <Card>
          <NonIdealState
            icon="lock"
            title="Access Restricted"
            description="Course providers can view only their own organization profile and cannot inspect other providers."
            action={
              <Button variant="primary" onClick={() => navigate(`/providers/${myProviderId}`)}>
                View My Profile
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  if (providerLoading) {
    return <LoadingState label="Loading provider details..." rows={3} />;
  }

  if (providerError || !provider) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate(isProviderRole ? "/courses" : "/courses?tab=providers")}
        >
          {isProviderRole ? "Back to My Courses" : "Back to Providers"}
        </Button>
        <ErrorState
          title="Unable to load provider profile"
          error={providerErrObj || new Error("Course provider not found.")}
          onRetry={refetchProvider}
        />
      </div>
    );
  }

  const enrolledSet = new Set(selfProfile?.enrolledCourses || []);
  const completedSet = new Set(selfProfile?.completedCourses || []);

  return (
    <div className="space-y-5">
      <Button
        variant="ghost"
        icon={<ArrowLeft size={14} />}
        onClick={() => navigate(isProviderRole ? "/courses" : "/courses?tab=providers")}
      >
        {isProviderRole ? "Back to My Courses" : "Back to Courses & Providers"}
      </Button>

      <Card>
        <EntityTitle
          icon={<Building2 size={20} className="bp6-text-muted" />}
          heading={H2}
          title={provider.name}
          subtitle={
            <div className="flex items-center gap-4 text-xs mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={13} /> {provider.contactEmail}
              </span>
              {provider.website && (
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium underline"
                >
                  <ExternalLink size={12} /> {provider.website}
                </a>
              )}
            </div>
          }
        />
        {provider.description && (
          <>
            <Divider className="!my-4" />
            <p className="bp6-text-muted text-xs leading-relaxed">
              {provider.description}
            </p>
          </>
        )}
      </Card>

      <div className="space-y-4">
        <H3 className="!mb-0 flex items-center gap-2">
          <GraduationCap size={18} /> Offered Courses ({courses.length})
        </H3>

        {coursesLoading ? (
          <LoadingState label="Loading offered courses..." rows={2} />
        ) : courses.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={28} />}
            title="No courses published"
            description="This provider has not published any courses yet."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => {
              const isEnrolled = enrolledSet.has(course.title);
              const isCompleted = completedSet.has(course.title);
              const category = deriveCourseCategory(course.skillsTaught, course.category);

              return (
                <Section
                  key={course.id}
                  title={course.title}
                  rightElement={<Badge variant="neutral">{category}</Badge>}
                  className="flex flex-col"
                >
                  <SectionCard className="space-y-3 flex-1">
                    <p className="text-xs bp6-text-muted leading-relaxed">{course.description}</p>
                    <div>
                      <p className="text-[11px] font-semibold bp6-text-muted uppercase tracking-wider mb-1.5">
                        Skills Taught
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(course.skillsTaught || []).map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </SectionCard>
                  {role === "TRAINEE" && (
                    <SectionCard compact className="flex justify-end">
                      {isCompleted ? (
                        <Badge variant="success" icon={<CheckCircle2 size={12} />}>
                          Completed
                        </Badge>
                      ) : isEnrolled ? (
                        <Badge variant="secondary">Enrolled</Badge>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          loading={enrollMutation.isPending}
                          onClick={() => enrollMutation.mutate(course.id)}
                        >
                          Enroll
                        </Button>
                      )}
                    </SectionCard>
                  )}
                </Section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
