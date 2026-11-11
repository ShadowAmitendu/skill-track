import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { courseApi, providerApi, adminApi, traineeApi } from "../api/endpoints";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ui/useToast";
import {
  GraduationCap,
  Search,
  Plus,
  Sparkles,
  Users,
  Building2,
  ExternalLink,
  UserX,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/Card";
import { Tabs, TabsList, TabsTab, TabsPanel } from "../components/ui/Tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../components/ui/Dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "../components/ui/AlertDialog";
import { Tooltip } from "../components/ui/Tooltip";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionPanel,
} from "../components/ui/Accordion";
import { Field, Input, Textarea } from "../components/ui/Field";
import { Select } from "../components/ui/Select";
import { Combobox } from "../components/ui/Combobox";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/QueryState";

const courseSchema = z.object({
  title: z.string().min(2, "Course title is required"),
  description: z.string().min(5, "Description is required"),
  skillsTaught: z.string().min(1, "Enter at least one skill comma-separated"),
});

const providerSchema = z.object({
  name: z.string().min(2, "Provider name is required"),
  contactEmail: z.string().email("Valid email required"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
});

export default function CoursesAndProviders() {
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "providers" ? "providers" : "courses";

  const defaultSort = role === "TRAINEE" ? "recommended" : "default";
  const search = searchParams.get("q") || "";
  const selectedSkill = searchParams.get("skill") || "";
  const selectedProvider = searchParams.get("provider") || "ALL";
  const sortBy = searchParams.get("sort") || defaultSort;
  const providerSearch = searchParams.get("pSearch") || "";

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deleteCourseTarget, setDeleteCourseTarget] = useState(null);

  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);

  const [kickModalTarget, setKickModalTarget] = useState(null);
  const [kickReason, setKickReason] = useState("");
  const [kickTraineeId, setKickTraineeId] = useState("");

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (
        !val ||
        (key === "provider" && val === "ALL") ||
        (key === "sort" && val === defaultSort)
      ) {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    setSearchParams(next, { replace: true });
  };

  const handleTabChange = (nextTab) => {
    const next = new URLSearchParams(searchParams);
    if (nextTab === "courses") next.delete("tab");
    else next.set("tab", nextTab);
    setSearchParams(next, { replace: true });
  };

  const {
    data: courses = [],
    isLoading: coursesLoading,
    isError: coursesError,
    error: coursesErrObj,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: ({ signal }) => courseApi.getAll(signal),
    staleTime: 60000,
  });

  const {
    data: providers = [],
    isLoading: providersLoading,
    isError: providersError,
    error: providersErrObj,
    refetch: refetchProviders,
  } = useQuery({
    queryKey: ["providers"],
    queryFn: ({ signal }) => providerApi.getAll(signal),
    staleTime: 60000,
  });

  const { data: trainees = [] } = useQuery({
    queryKey: ["trainees"],
    queryFn: ({ signal }) => traineeApi.getAll(signal),
    staleTime: 60000,
  });

  const { data: selfProfile } = useQuery({
    queryKey: ["trainee", user?.id],
    queryFn: ({ signal }) => traineeApi.getById(user.id, signal),
    enabled: role === "TRAINEE" && Boolean(user?.id),
    staleTime: 60000,
  });

  const coursePopularityMap = useMemo(() => {
    const map = {};
    trainees.forEach((t) => {
      (t.enrolledCourses || []).forEach((title) => {
        map[title] = (map[title] || 0) + 1;
      });
      (t.completedCourses || []).forEach((title) => {
        map[title] = (map[title] || 0) + 1;
      });
    });
    return map;
  }, [trainees]);

  const currentTraineeSkills = useMemo(() => {
    if (role !== "TRAINEE") return new Set();
    const record = selfProfile || trainees.find((t) => t.id === user?.id);
    return new Set(record?.skills || []);
  }, [role, selfProfile, trainees, user]);

  const currentTraineeCourses = useMemo(() => {
    if (role !== "TRAINEE") return { enrolled: new Set(), completed: new Set() };
    const record = selfProfile || trainees.find((t) => t.id === user?.id);
    return {
      enrolled: new Set(record?.enrolledCourses || []),
      completed: new Set(record?.completedCourses || []),
    };
  }, [role, selfProfile, trainees, user]);

  const allUniqueSkills = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      (c.skillsTaught || []).forEach((s) => set.add(s));
    });
    return Array.from(set).sort();
  }, [courses]);

  const scoredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = courses.filter((course) => {
      const matchSearch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.providerName?.toLowerCase().includes(q);

      const matchSkill =
        !selectedSkill ||
        (course.skillsTaught || []).some(
          (s) => s.toLowerCase() === selectedSkill.toLowerCase()
        );

      const matchProvider =
        selectedProvider === "ALL" || String(course.providerId) === selectedProvider;

      return matchSearch && matchSkill && matchProvider;
    });

    const withMeta = filtered.map((course) => {
      const popularity = coursePopularityMap[course.title] || 0;
      const missingSkillsCount = (course.skillsTaught || []).filter(
        (s) => !currentTraineeSkills.has(s)
      ).length;
      const alreadyTaken =
        currentTraineeCourses.enrolled.has(course.title) ||
        currentTraineeCourses.completed.has(course.title);
      const recommendationScore =
        role === "TRAINEE" && !alreadyTaken ? missingSkillsCount * 10 + popularity : 0;

      return {
        ...course,
        popularity,
        missingSkillsCount,
        recommendationScore,
        isRecommended: role === "TRAINEE" && !alreadyTaken && missingSkillsCount > 0,
      };
    });

    if (sortBy === "popularity") {
      return [...withMeta].sort((a, b) => b.popularity - a.popularity);
    }
    if (sortBy === "recommended") {
      return [...withMeta].sort((a, b) => b.recommendationScore - a.recommendationScore);
    }
    return withMeta;
  }, [
    courses,
    search,
    selectedSkill,
    selectedProvider,
    sortBy,
    coursePopularityMap,
    currentTraineeSkills,
    currentTraineeCourses,
    role,
  ]);

  const coursesByProvider = useMemo(() => {
    const map = {};
    courses.forEach((course) => {
      if (!course.providerId) return;
      if (!map[course.providerId]) map[course.providerId] = [];
      map[course.providerId].push(course);
    });
    return map;
  }, [courses]);

  const filteredProviders = useMemo(() => {
    const q = providerSearch.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter(
      (provider) =>
        provider.name?.toLowerCase().includes(q) ||
        provider.contactEmail?.toLowerCase().includes(q) ||
        provider.description?.toLowerCase().includes(q)
    );
  }, [providers, providerSearch]);

  const {
    register: registerCourse,
    handleSubmit: handleCourseSubmit,
    reset: resetCourseForm,
    formState: { errors: courseErrors, isSubmitting: isCourseSubmitting },
  } = useForm({
    resolver: zodResolver(courseSchema),
  });

  const openAddCourse = () => {
    setEditingCourse(null);
    resetCourseForm({ title: "", description: "", skillsTaught: "" });
    setCourseModalOpen(true);
  };

  const openEditCourse = (course) => {
    setEditingCourse(course);
    resetCourseForm({
      title: course.title || "",
      description: course.description || "",
      skillsTaught: (course.skillsTaught || []).join(", "),
    });
    setCourseModalOpen(true);
  };

  const onSubmitCourse = async (data) => {
    const providerId = editingCourse?.providerId || (role === "COURSE_PROVIDER" ? user?.id || 1 : 1);
    const skillsArray = data.skillsTaught
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingCourse) {
        await providerApi.updateCourse(editingCourse.id, {
          title: data.title,
          description: data.description,
          skillsTaught: skillsArray,
        });
        addToast({ title: "Course Updated", description: `${data.title} changes saved.` });
      } else {
        await providerApi.addCourse(providerId, {
          title: data.title,
          description: data.description,
          skillsTaught: skillsArray,
        });
        addToast({ title: "Course Published", description: `${data.title} has been added.` });
      }
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["providerCourses"] });
      queryClient.invalidateQueries({ queryKey: ["skillsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      setCourseModalOpen(false);
    } catch (err) {
      addToast({ title: "Save Failed", description: err.message, variant: "danger" });
    }
  };

  const deleteCourseMutation = useMutation({
    mutationFn: (courseId) => providerApi.removeCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["providerCourses"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      addToast({ title: "Course Removed", description: "Course removed from catalog." });
      setDeleteCourseTarget(null);
    },
    onError: (err) => {
      addToast({ title: "Delete Failed", description: err.message, variant: "danger" });
    },
  });

  const {
    register: registerProvider,
    handleSubmit: handleProviderSubmit,
    reset: resetProviderForm,
    formState: { errors: providerErrors, isSubmitting: isProviderSubmitting },
  } = useForm({
    resolver: zodResolver(providerSchema),
  });

  const openAddProvider = () => {
    setEditingProvider(null);
    resetProviderForm({ name: "", contactEmail: "", website: "", description: "" });
    setProviderModalOpen(true);
  };

  const openEditProvider = (provider) => {
    setEditingProvider(provider);
    resetProviderForm({
      name: provider.name || "",
      contactEmail: provider.contactEmail || "",
      website: provider.website || "",
      description: provider.description || "",
    });
    setProviderModalOpen(true);
  };

  const onSubmitProvider = async (data) => {
    try {
      if (editingProvider) {
        await adminApi.updateCourseProvider(editingProvider.id, data);
        addToast({ title: "Provider Updated", description: `${data.name} updated.` });
      } else {
        await adminApi.addCourseProvider(data);
        addToast({ title: "Provider Added", description: `${data.name} added.` });
      }
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      setProviderModalOpen(false);
    } catch (err) {
      addToast({ title: "Failed to Save", description: err.message, variant: "danger" });
    }
  };

  const enrollMutation = useMutation({
    mutationFn: (courseId) => traineeApi.enroll(user?.id || 1, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      addToast({ title: "Enrolled", description: "Added to your active course enrollments." });
    },
    onError: (err) => {
      addToast({ title: "Enrollment Failed", description: err.message, variant: "danger" });
    },
  });

  const kickMutation = useMutation({
    mutationFn: ({ courseId, traineeId, reason }) =>
      providerApi.kickTrainee(courseId, traineeId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      addToast({
        title: "Trainee Removed",
        description: "The trainee has been removed from this course.",
      });
      setKickModalTarget(null);
      setKickReason("");
      setKickTraineeId("");
    },
    onError: (err) => {
      addToast({ title: "Action Failed", description: err.message, variant: "danger" });
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Courses & Training Providers</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Explore accredited courses, filter by skill tags, and inspect provider directories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role === "COURSE_PROVIDER" && (
            <Button variant="primary" size="md" onClick={openAddCourse}>
              <Plus size={15} /> Publish Course
            </Button>
          )}
          {role === "ADMIN" && (
            <Button variant="primary" size="md" onClick={openAddProvider}>
              <Plus size={15} /> Add Provider
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTab value="courses">
            <GraduationCap size={14} className="mr-1.5" /> Courses ({courses.length})
          </TabsTab>
          <TabsTab value="providers">
            <Building2 size={14} className="mr-1.5" /> Providers ({providers.length})
          </TabsTab>
        </TabsList>

        <TabsPanel value="courses" className="space-y-5">
          <Card>
            <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Input
                  value={search}
                  onChange={(e) => updateParams({ q: e.target.value })}
                  placeholder="Search courses..."
                  className="pl-9"
                />
                <Search size={15} className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" />
              </div>

              <Combobox
                items={allUniqueSkills}
                value={selectedSkill}
                onChange={(val) => updateParams({ skill: val || "" })}
                placeholder="Filter by skill tag..."
              />

              <Select
                value={selectedProvider}
                onValueChange={(val) => updateParams({ provider: val })}
                options={[
                  { value: "ALL", label: "All Providers" },
                  ...providers.map((p) => ({ value: String(p.id), label: p.name })),
                ]}
              />

              <Select
                value={sortBy}
                onValueChange={(val) => updateParams({ sort: val })}
                options={[
                  ...(role === "TRAINEE"
                    ? [{ value: "recommended", label: "Sort: Suggested for You" }]
                    : []),
                  { value: "default", label: "Sort: Default Order" },
                  { value: "popularity", label: "Sort: Most Enrolled" },
                ]}
              />
            </div>
          </Card>

          {coursesLoading ? (
            <LoadingState label="Loading courses catalog..." rows={4} />
          ) : coursesError ? (
            <ErrorState title="Failed to load courses" error={coursesErrObj} onRetry={refetchCourses} />
          ) : scoredCourses.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No matching courses"
              description="Try adjusting your search keyword, skill tag, or provider filter."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {scoredCourses.map((course) => {
                const isEnrolled = currentTraineeCourses.enrolled.has(course.title);
                const isCompleted = currentTraineeCourses.completed.has(course.title);
                const isOwner = role === "COURSE_PROVIDER" && course.providerId === (user?.id || 1);

                return (
                  <Card key={course.id} className="flex flex-col justify-between">
                    <CardHeader className="flex-col items-start gap-2">
                      <div className="flex items-center justify-between w-full gap-2">
                        <Link
                          to={`/providers/${course.providerId}`}
                          className="text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:underline inline-flex items-center gap-1 truncate"
                        >
                          <Building2 size={13} className="shrink-0" />
                          <span className="truncate">{course.providerName}</span>
                        </Link>
                        {course.popularity > 0 && (
                          <Badge variant="outline" className="shrink-0">
                            <Users size={11} className="mr-1" /> {course.popularity} Enrolled
                          </Badge>
                        )}
                      </div>

                      <CardTitle className="text-base leading-snug">{course.title}</CardTitle>

                      {course.isRecommended && (
                        <Badge variant="dark" className="gap-1">
                          <Sparkles size={11} /> Suggested for you
                        </Badge>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                        {course.description}
                      </p>

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

                    <CardFooter className="flex items-center justify-between gap-2 flex-wrap">
                      <Link to={`/providers/${course.providerId}`}>
                        <Button variant="ghost" size="sm">
                          Provider <ExternalLink size={12} />
                        </Button>
                      </Link>

                      {role === "TRAINEE" && (
                        <div>
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
                        </div>
                      )}

                      {isOwner && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditCourse(course)}
                            aria-label={`Edit ${course.title}`}
                          >
                            <Pencil size={12} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setKickModalTarget(course)}
                          >
                            <UserX size={12} /> Kick
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
                            onClick={() => setDeleteCourseTarget(course)}
                            aria-label={`Delete ${course.title}`}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsPanel>

        <TabsPanel value="providers" className="space-y-5">
          {!providersLoading && !providersError && providers.length > 0 && (
            <Card>
              <div className="p-3.5 max-w-md">
                <div className="relative">
                  <Input
                    value={providerSearch}
                    onChange={(e) => updateParams({ pSearch: e.target.value })}
                    placeholder="Search providers by name, email, or description..."
                    className="pl-9"
                  />
                  <Search
                    size={15}
                    className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500"
                  />
                </div>
              </div>
            </Card>
          )}

          {providersLoading ? (
            <LoadingState label="Loading training providers..." rows={3} />
          ) : providersError ? (
            <ErrorState
              title="Failed to load providers"
              error={providersErrObj}
              onRetry={refetchProviders}
            />
          ) : providers.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No training providers"
              description="No accredited course providers have been added yet."
            />
          ) : filteredProviders.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No matching providers"
              description="Try adjusting your search query to find a training provider."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProviders.map((provider) => {
                const providerCourses = coursesByProvider[provider.id] || [];
                return (
                  <Card key={provider.id} className="flex flex-col justify-between">
                    <CardHeader>
                      <div className="min-w-0">
                        <CardTitle className="truncate">{provider.name}</CardTitle>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {provider.contactEmail}
                        </p>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {provider.description || "Accredited skilling partner."}
                      </p>
                      {provider.website && (
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-gray-900 underline hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300 inline-flex items-center gap-1"
                        >
                          Visit Website <ExternalLink size={12} />
                        </a>
                      )}

                      <Accordion>
                        <AccordionItem value="courses">
                          <AccordionHeader>
                            <AccordionTrigger className="px-3 py-2 text-xs">
                              Courses Offered ({providerCourses.length})
                            </AccordionTrigger>
                          </AccordionHeader>
                          <AccordionPanel className="text-xs">
                            {providerCourses.length > 0 ? (
                              <ul className="space-y-1.5">
                                {providerCourses.map((course) => (
                                  <li
                                    key={course.id}
                                    className="flex items-center justify-between gap-2 text-xs"
                                  >
                                    <span className="truncate font-medium text-gray-900 dark:text-gray-100">
                                      {course.title}
                                    </span>
                                    {(course.skillsTaught?.length || 0) > 0 && (
                                      <Badge variant="outline" className="shrink-0">
                                        {course.skillsTaught[0]}
                                        {course.skillsTaught.length > 1
                                          ? ` +${course.skillsTaught.length - 1}`
                                          : ""}
                                      </Badge>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                No courses listed yet.
                              </p>
                            )}
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>

                    <CardFooter className="flex items-center justify-between gap-2">
                      <Link to={`/providers/${provider.id}`}>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </Link>

                      {role === "ADMIN" && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditProvider(provider)}
                          >
                            <Pencil size={12} /> Edit
                          </Button>
                          <Tooltip content="The backend exposes no provider deletion endpoint.">
                            <Button variant="ghost" size="sm" disabled>
                              Remove
                            </Button>
                          </Tooltip>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsPanel>
      </Tabs>

      {/* Add / Edit Course Dialog */}
      <Dialog open={courseModalOpen} onOpenChange={setCourseModalOpen}>
        <DialogContent maxWidth="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Publish New Course"}</DialogTitle>
            <DialogDescription>
              {editingCourse
                ? "Update course title, description, or associated skill tags."
                : "Create an accredited course with curriculum details and skill tags."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCourseSubmit(onSubmitCourse)} className="space-y-3.5">
            <Field label="Course Title" required error={courseErrors.title?.message} id="course-title">
              <Input
                id="course-title"
                {...registerCourse("title")}
                placeholder="e.g. Docker & Kubernetes"
                hasError={Boolean(courseErrors.title)}
              />
            </Field>

            <Field
              label="Course Description"
              required
              error={courseErrors.description?.message}
              id="course-desc"
            >
              <Textarea
                id="course-desc"
                {...registerCourse("description")}
                rows={3}
                placeholder="Curriculum summary..."
                hasError={Boolean(courseErrors.description)}
              />
            </Field>

            <Field
              label="Skills Taught (comma-separated)"
              required
              description="e.g. Docker, Kubernetes, Linux"
              error={courseErrors.skillsTaught?.message}
              id="course-skills"
            >
              <Input
                id="course-skills"
                {...registerCourse("skillsTaught")}
                placeholder="Java, Spring Boot, SQL"
                hasError={Boolean(courseErrors.skillsTaught)}
              />
            </Field>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
              <Button type="submit" variant="primary" size="sm" loading={isCourseSubmitting}>
                {editingCourse ? "Save Changes" : "Publish Course"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Course AlertDialog */}
      <AlertDialog
        open={Boolean(deleteCourseTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteCourseTarget(null);
        }}
      >
        <AlertDialogContent variant="danger">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{deleteCourseTarget?.title}</strong> from the
              catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
            <Button
              variant="danger"
              size="sm"
              loading={deleteCourseMutation.isPending}
              onClick={() => deleteCourseTarget && deleteCourseMutation.mutate(deleteCourseTarget.id)}
            >
              Delete Course
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add / Edit Provider Dialog */}
      <Dialog open={providerModalOpen} onOpenChange={setProviderModalOpen}>
        <DialogContent maxWidth="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? "Edit Course Provider" : "Add Course Provider"}
            </DialogTitle>
            <DialogDescription>
              {editingProvider
                ? "Update provider metadata and contact details."
                : "Register an accredited organization on SkillTrack."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProviderSubmit(onSubmitProvider)} className="space-y-3.5">
            <Field label="Organization Name" required error={providerErrors.name?.message} id="prov-name">
              <Input
                id="prov-name"
                {...registerProvider("name")}
                placeholder="e.g. Apex Skill Academy"
                hasError={Boolean(providerErrors.name)}
              />
            </Field>

            <Field
              label="Contact Email"
              required
              error={providerErrors.contactEmail?.message}
              id="prov-email"
            >
              <Input
                id="prov-email"
                type="email"
                {...registerProvider("contactEmail")}
                placeholder="e.g. contact@apex.edu"
                hasError={Boolean(providerErrors.contactEmail)}
              />
            </Field>

            <Field label="Website URL" error={providerErrors.website?.message} id="prov-website">
              <Input
                id="prov-website"
                {...registerProvider("website")}
                placeholder="https://apex.example.com"
                hasError={Boolean(providerErrors.website)}
              />
            </Field>

            <Field label="Description" id="prov-desc">
              <Textarea
                id="prov-desc"
                {...registerProvider("description")}
                rows={3}
                placeholder="Training focus..."
              />
            </Field>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
              <Button type="submit" variant="primary" size="sm" loading={isProviderSubmitting}>
                {editingProvider ? "Save Changes" : "Add Provider"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Kick Trainee AlertDialog */}
      <AlertDialog
        open={Boolean(kickModalTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setKickModalTarget(null);
            setKickReason("");
            setKickTraineeId("");
          }
        }}
      >
        <AlertDialogContent variant="warning">
          <AlertDialogHeader>
            <AlertDialogTitle>Kick Trainee from Course?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing a trainee from <strong>{kickModalTarget?.title}</strong> requires a written
              reason.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 my-3">
            <Field label="Enrolled Trainee" required>
              <Select
                value={kickTraineeId}
                onValueChange={setKickTraineeId}
                placeholder="Choose enrolled trainee..."
                options={trainees
                  .filter((t) => t.enrolledCourses?.includes(kickModalTarget?.title))
                  .map((t) => ({ value: String(t.id), label: `${t.fullName} (${t.email})` }))}
              />
            </Field>

            <Field label="Reason for Removal" required id="kick-reason">
              <Input
                id="kick-reason"
                value={kickReason}
                onChange={(e) => setKickReason(e.target.value)}
                placeholder="e.g. Attendance below threshold..."
              />
            </Field>
          </div>

          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
            <Button
              variant="danger"
              size="sm"
              disabled={!kickTraineeId || !kickReason.trim()}
              loading={kickMutation.isPending}
              onClick={() =>
                kickModalTarget &&
                kickMutation.mutate({
                  courseId: kickModalTarget.id,
                  traineeId: Number(kickTraineeId),
                  reason: kickReason.trim(),
                })
              }
            >
              Confirm Kick
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
