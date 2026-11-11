import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { providerApi, courseApi, traineeApi } from "../api/endpoints";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ui/useToast";
import { ArrowLeft, Building2, Mail, ExternalLink, GraduationCap, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/QueryState";

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const { addToast } = useToast();

  const {
    data: provider,
    isLoading: providerLoading,
    isError: providerError,
    error: providerErrObj,
    refetch: refetchProvider,
  } = useQuery({
    queryKey: ["provider", id],
    queryFn: ({ signal }) => providerApi.getById(id, signal),
    enabled: Boolean(id),
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["providerCourses", id],
    queryFn: ({ signal }) => courseApi.getByProvider(id, signal),
    enabled: Boolean(id),
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

  if (providerLoading) {
    return <LoadingState label="Loading provider details..." rows={3} />;
  }

  if (providerError || !provider) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/courses?tab=providers")}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Providers
        </button>
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
      <button
        type="button"
        onClick={() => navigate("/courses?tab=providers")}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 cursor-pointer"
      >
        <ArrowLeft size={14} /> Back to Courses & Providers
      </button>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 shrink-0">
              <Building2 size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{provider.name}</h1>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={13} /> {provider.contactEmail}
                </span>
                {provider.website && (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-gray-900 font-medium underline hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300"
                  >
                    <ExternalLink size={12} /> {provider.website}
                  </a>
                )}
              </div>
              {provider.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                  {provider.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <GraduationCap size={18} /> Offered Courses ({courses.length})
        </h2>

        {coursesLoading ? (
          <LoadingState label="Loading offered courses..." rows={2} />
        ) : courses.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No courses published"
            description="This provider has not published any courses yet."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => {
              const isEnrolled = enrolledSet.has(course.title);
              const isCompleted = completedSet.has(course.title);

              return (
                <Card key={course.id} className="flex flex-col justify-between">
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{course.description}</p>
                    <div>
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Skills Taught
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(course.skillsTaught || []).map((skill) => (
                          <Badge key={skill} variant="neutral">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  {role === "TRAINEE" && (
                    <CardFooter className="flex justify-end">
                      {isCompleted ? (
                        <Badge variant="emerald" className="gap-1">
                          <CheckCircle2 size={12} /> Completed
                        </Badge>
                      ) : isEnrolled ? (
                        <Badge variant="neutral">Enrolled</Badge>
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
                    </CardFooter>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
