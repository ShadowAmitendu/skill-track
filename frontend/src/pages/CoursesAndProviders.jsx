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
import { ButtonGroup, Divider, H2, Intent } from "@blueprintjs/core";
import { Card, Section, SectionCard } from "../components/ui/Card";
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
import { deriveCourseCategory } from "../utils/domain";

const courseSchema = z.object({
  title: z.string().min(2, "Course title is required"),
  description: z.string().min(5, "Description is required"),
  category: z.string().optional(),
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

  const isAdmin = role === "ADMIN";
  const isProvider = role === "COURSE_PROVIDER";
  const myProviderId = user?.id || 1;
  const tabParam = searchParams.get("tab");
  const activeTab = isAdmin && tabParam === "providers" ? "providers" : "courses";

  const defaultSort = role === "TRAINEE" ? "recommended" : "default";
  const search = searchParams.get("q") || "";
  const selectedSkill = searchParams.get("skill") || "";
  const selectedCategory = searchParams.get("category") || "ALL";
  const selectedProvider = isAdmin ? searchParams.get("provider") || "ALL" : "ALL";
  const courseScope = isProvider ? searchParams.get("scope") || "all" : "all";
  const sortBy = searchParams.get("sort") || defaultSort;
  const providerSearch = searchParams.get("pSearch") || "";

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deleteCourseTarget, setDeleteCourseTarget] = useState(null);

  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [deleteProviderTarget, setDeleteProviderTarget] = useState(null);

  const [kickModalTarget, setKickModalTarget] = useState(null);
  const [kickReason, setKickReason] = useState("");
  const [kickTraineeId, setKickTraineeId] = useState("");

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (
        !val ||
        (key === "provider" && val === "ALL") ||
        (key === "category" && val === "ALL") ||
        (key === "scope" && val === "all") ||
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
    if (!isAdmin && nextTab === "providers") return;
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
    enabled: isAdmin,
    staleTime: 60000,
  });

  const { data: trainees = [] } = useQuery({
    queryKey: ["trainees", role],
    queryFn: ({ signal }) =>
      isProvider ? providerApi.getAllTraineesReadOnly(signal) : traineeApi.getAll(signal),
    enabled: isAdmin || isProvider,
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

  const allCategories = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      set.add(deriveCourseCategory(c.skillsTaught, c.category));
    });
    return Array.from(set).sort();
  }, [courses]);

  const scoredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = courses.filter((course) => {
      const courseCategory = deriveCourseCategory(course.skillsTaught, course.category);
      const isOwnCourse = isProvider && Number(course.providerId) === Number(myProviderId);

      const matchSearch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        courseCategory.toLowerCase().includes(q) ||
        (course.skillsTaught || []).some((s) => s.toLowerCase().includes(q)) ||
        ((!isProvider || isOwnCourse) && course.providerName?.toLowerCase().includes(q));

      const matchSkill =
        !selectedSkill ||
        (course.skillsTaught || []).some(
          (s) => s.toLowerCase() === selectedSkill.toLowerCase()
        );

      const matchCategory = selectedCategory === "ALL" || courseCategory === selectedCategory;

      const matchProvider = isAdmin
        ? selectedProvider === "ALL" || String(course.providerId) === selectedProvider
        : isProvider
        ? courseScope === "all" || isOwnCourse
        : true;

      return matchSearch && matchSkill && matchCategory && matchProvider;
    });

    const withMeta = filtered.map((course) => {
      const category = deriveCourseCategory(course.skillsTaught, course.category);
      const popularity = (course.enrolledCount ?? 0) || coursePopularityMap[course.title] || 0;
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
        category,
        popularity,
        missingSkillsCount,
        recommendationScore,
        isRecommended: role === "TRAINEE" && !alreadyTaken && missingSkillsCount > 0,
      };
    });

    if (role === "TRAINEE" && sortBy === "recommended-only") {
      return withMeta
        .filter((c) => c.isRecommended)
        .sort((a, b) => b.recommendationScore - a.recommendationScore);
    }
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
    selectedCategory,
    selectedProvider,
    courseScope,
    sortBy,
    coursePopularityMap,
    currentTraineeSkills,
    currentTraineeCourses,
    role,
    isAdmin,
    isProvider,
    myProviderId,
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
    resetCourseForm({ title: "", description: "", category: "", skillsTaught: "" });
    setCourseModalOpen(true);
  };

  const openEditCourse = (course) => {
    setEditingCourse(course);
    resetCourseForm({
      title: course.title || "",
      description: course.description || "",
      category: course.category || "",
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
    const category = data.category?.trim() || deriveCourseCategory(skillsArray);

    try {
      if (editingCourse) {
        await providerApi.updateCourse(editingCourse.id, {
          title: data.title,
          description: data.description,
          category,
          skillsTaught: skillsArray,
        });
        addToast({ title: "Course Updated", description: `${data.title} changes saved.` });
      } else {
        await providerApi.addCourse(providerId, {
          title: data.title,
          description: data.description,
          category,
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

  const removeProviderMutation = useMutation({
    mutationFn: (providerId) => adminApi.removeCourseProvider(providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      addToast({ title: "Provider Removed", description: "Course provider removed from directory." });
      setDeleteProviderTarget(null);
    },
    onError: (err) => {
      addToast({ title: "Removal Failed", description: err.message, variant: "danger" });
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
    mutationFn: /** @param {{ courseId: any, traineeId: number, reason: string }} payload */ ({ courseId, traineeId, reason }) =>
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
          <H2 className="!mb-0">
            {isAdmin ? "Courses & Training Providers" : "Courses Catalog"}
          </H2>
          <p className="bp6-text-muted text-xs mt-1">
            {isProvider
              ? "Browse all accredited courses, filter by skill or category, and publish or manage your own courses."
              : isAdmin
              ? "Explore accredited courses, filter by skill tags or categories, and manage provider directories."
              : "Explore accredited courses, filter by skill tags, category, or popularity, and find courses recommended for you."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role === "COURSE_PROVIDER" && (
            <>
              <Link to={`/providers/${myProviderId}`}>
                <Button variant="outline" icon={<Building2 size={14} />}>
                  My Profile
                </Button>
              </Link>
              <Button variant="primary" icon={<Plus size={14} />} onClick={openAddCourse}>
                Publish Course
              </Button>
            </>
          )}
          {role === "ADMIN" && (
            <Button variant="primary" icon={<Plus size={14} />} onClick={openAddProvider}>
              Add Provider
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTab value="courses">
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap size={14} /> Courses ({courses.length})
            </span>
          </TabsTab>
          {isAdmin && (
            <TabsTab value="providers">
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={14} /> Providers ({providers.length})
              </span>
            </TabsTab>
          )}
        </TabsList>

        <TabsPanel value="courses" className="space-y-5">
          <Card compact>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <Input
                leftIcon="search"
                value={search}
                onChange={(e) => updateParams({ q: e.target.value })}
                placeholder="Search courses..."
              />

              <Combobox
                items={allUniqueSkills}
                value={selectedSkill}
                onChange={(val) => updateParams({ skill: val || "" })}
                placeholder="Filter by skill (Java, Cloud, Git)..."
              />

              <Select
                value={selectedCategory}
                onValueChange={(val) => updateParams({ category: val })}
                options={[
                  { value: "ALL", label: "All Categories" },
                  ...allCategories.map((cat) => ({ value: cat, label: cat })),
                ]}
              />

              {isAdmin ? (
                <Select
                  value={selectedProvider}
                  onValueChange={(val) => updateParams({ provider: val })}
                  options={[
                    { value: "ALL", label: "All Providers" },
                    ...providers.map((p) => ({ value: String(p.id), label: p.name })),
                  ]}
                />
              ) : isProvider ? (
                <Select
                  value={courseScope}
                  onValueChange={(val) => updateParams({ scope: val })}
                  options={[
                    { value: "all", label: "All Catalog Courses" },
                    { value: "mine", label: "My Published Courses" },
                  ]}
                />
              ) : (
                <div className="hidden lg:block" />
              )}

              <Select
                value={sortBy}
                onValueChange={(val) => updateParams({ sort: val })}
                options={[
                  ...(role === "TRAINEE"
                    ? [
                        { value: "recommended", label: "Recommended for You" },
                        { value: "recommended-only", label: "Only Recommended Courses" },
                      ]
                    : []),
                  { value: "default", label: "Sort: Default Order" },
                  { value: "popularity", label: "Popularity (Most Enrolled)" },
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
              icon={<GraduationCap size={28} />}
              title="No matching courses"
              description="Try adjusting your search keyword, skill tag, or provider filter."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {scoredCourses.map((course) => {
                const isEnrolled = currentTraineeCourses.enrolled.has(course.title);
                const isCompleted = currentTraineeCourses.completed.has(course.title);
                const isOwner = isProvider && Number(course.providerId) === Number(myProviderId);

                return (
                  <Section
                    key={course.id}
                    title={course.title}
                    subtitle={
                      !isProvider ? (
                        <Link
                          to={`/providers/${course.providerId}`}
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          <Building2 size={12} /> {course.providerName}
                        </Link>
                      ) : isOwner ? (
                        <Link
                          to={`/providers/${myProviderId}`}
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          <Building2 size={12} /> {course.providerName} (You)
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 bp6-text-muted">
                          <Building2 size={12} /> Accredited Catalog Course
                        </span>
                      )
                    }
                    rightElement={
                      <div className="flex items-center gap-1.5">
                        <Badge variant="neutral">{course.category}</Badge>
                        {course.popularity > 0 && (
                          <Badge variant="outline" icon={<Users size={11} />}>
                            {course.popularity}
                          </Badge>
                        )}
                      </div>
                    }
                    className="flex flex-col"
                  >
                    <SectionCard className="space-y-4 flex-1">
                      {course.isRecommended && (
                        <div>
                          <Badge variant="primary" icon={<Sparkles size={11} />}>
                            Suggested for you
                          </Badge>
                        </div>
                      )}

                      <p className="text-xs bp6-text-muted leading-relaxed line-clamp-3">
                        {course.description}
                      </p>

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

                    <SectionCard compact className="flex items-center justify-between gap-2 flex-wrap">
                      {!isProvider ? (
                        <Link to={`/providers/${course.providerId}`}>
                          <Button variant="ghost" size="sm" endIcon={<ExternalLink size={12} />}>
                            Provider
                          </Button>
                        </Link>
                      ) : isOwner ? (
                        <Link to={`/providers/${myProviderId}`}>
                          <Button variant="ghost" size="sm" endIcon={<ExternalLink size={12} />}>
                            My Profile
                          </Button>
                        </Link>
                      ) : (
                        <Badge variant="outline">Catalog Course</Badge>
                      )}

                      {role === "TRAINEE" && (
                        <div>
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
                        </div>
                      )}

                      {isOwner && (
                        <ButtonGroup>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Pencil size={12} />}
                            onClick={() => openEditCourse(course)}
                            aria-label={`Edit ${course.title}`}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<UserX size={12} />}
                            onClick={() => setKickModalTarget(course)}
                          >
                            Kick
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            intent={Intent.DANGER}
                            icon={<Trash2 size={13} />}
                            onClick={() => setDeleteCourseTarget(course)}
                            aria-label={`Delete ${course.title}`}
                          />
                        </ButtonGroup>
                      )}
                    </SectionCard>
                  </Section>
                );
              })}
            </div>
          )}
        </TabsPanel>

        {isAdmin && (
          <TabsPanel value="providers" className="space-y-5">
          {!providersLoading && !providersError && providers.length > 0 && (
            <Card compact>
              <div className="max-w-md">
                <Input
                  leftIcon="search"
                  value={providerSearch}
                  onChange={(e) => updateParams({ pSearch: e.target.value })}
                  placeholder="Search providers by name, email, or description..."
                />
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
              icon={<Building2 size={28} />}
              title="No training providers"
              description="No accredited course providers have been added yet."
            />
          ) : filteredProviders.length === 0 ? (
            <EmptyState
              icon={<Building2 size={28} />}
              title="No matching providers"
              description="Try adjusting your search query to find a training provider."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProviders.map((provider) => {
                const providerCourses = coursesByProvider[provider.id] || [];
                return (
                  <Section
                    key={provider.id}
                    title={provider.name}
                    subtitle={provider.contactEmail}
                    className="flex flex-col"
                  >
                    <SectionCard className="space-y-3 flex-1">
                      <p className="text-xs bp6-text-muted leading-relaxed">
                        {provider.description || "Accredited skilling partner."}
                      </p>
                      {provider.website && (
                        <div>
                          <a
                            href={provider.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium underline inline-flex items-center gap-1"
                          >
                            Visit Website <ExternalLink size={12} />
                          </a>
                        </div>
                      )}

                      <Divider className="!my-2" />

                      <Accordion>
                        <AccordionItem value="courses">
                          <AccordionHeader>
                            <AccordionTrigger>
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
                                    <span className="truncate font-medium">
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
                              <p className="text-xs bp6-text-muted">
                                No courses listed yet.
                              </p>
                            )}
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                    </SectionCard>

                    <SectionCard compact className="flex items-center justify-between gap-2">
                      <Link to={`/providers/${provider.id}`}>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </Link>

                      {role === "ADMIN" && (
                        <ButtonGroup>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Pencil size={12} />}
                            onClick={() => openEditProvider(provider)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            intent={Intent.DANGER}
                            icon={<Trash2 size={12} />}
                            onClick={() => setDeleteProviderTarget(provider)}
                          >
                            Remove
                          </Button>
                        </ButtonGroup>
                      )}
                    </SectionCard>
                  </Section>
                );
              })}
            </div>
          )}
        </TabsPanel>
        )}
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
              label="Course Category"
              description="Leave blank to auto-detect from skills (e.g. Backend, DevOps, Cloud)"
              id="course-category"
            >
              <Input
                id="course-category"
                {...registerCourse("category")}
                placeholder="e.g. DevOps"
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

      {/* Delete Provider AlertDialog */}
      <AlertDialog
        open={Boolean(deleteProviderTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteProviderTarget(null);
        }}
      >
        <AlertDialogContent variant="danger">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Course Provider?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes <strong>{deleteProviderTarget?.name}</strong> and its courses from
              SkillTrack. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
            <Button
              variant="danger"
              size="sm"
              loading={removeProviderMutation.isPending}
              onClick={() =>
                deleteProviderTarget && removeProviderMutation.mutate(deleteProviderTarget.id)
              }
            >
              Remove Provider
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
                  .map((t) => ({
                    value: String(t.id),
                    label:
                      t.email && !isProvider
                        ? `${t.fullName} (${t.email})`
                        : `${t.fullName} (ID #${t.id})`,
                  }))}
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
