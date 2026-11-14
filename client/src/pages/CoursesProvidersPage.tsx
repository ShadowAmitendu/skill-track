import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Callout,
  Card,
  Dialog,
  DialogBody,
  DialogFooter,
  Drawer,
  FormGroup,
  H2,
  H4,
  HTMLSelect,
  HTMLTable,
  InputGroup,
  Intent,
  MenuItem,
  NonIdealState,
  Spinner,
  Switch,
  Tab,
  Tabs,
  Tag,
  TextArea,
} from "@blueprintjs/core";
import { MultiSelect, Suggest, type ItemRenderer } from "@blueprintjs/select";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { showError, showSuccess } from "../lib/toaster";
import type { CourseDTO, CourseProviderDTO, EnrollmentDTO, SkillItem, TraineeDTO } from "../types/api";

export default function CoursesProvidersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const isCp = user?.role === "cp";
  const isTrainee = user?.role === "trainee";

  const [tab, setTab] = useState<"courses" | "providers">("courses");
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [providers, setProviders] = useState<CourseProviderDTO[]>([]);
  const [allSkills, setAllSkills] = useState<SkillItem[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<EnrollmentDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Course filters
  const [courseSearch, setCourseSearch] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [recommendedOnly, setRecommendedOnly] = useState(false);

  // Provider search & admin CRUD
  const [providerSearch, setProviderSearch] = useState("");
  const [addProviderOpen, setAddProviderOpen] = useState(false);
  const [editProviderTarget, setEditProviderTarget] = useState<CourseProviderDTO | null>(null);
  const [removeProviderTarget, setRemoveProviderTarget] = useState<CourseProviderDTO | null>(null);
  const [pName, setPName] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [pPassword, setPPassword] = useState("Provider@123!");
  const [pContact, setPContact] = useState("");
  const [pWebsite, setPWebsite] = useState("");
  const [pDesc, setPDesc] = useState("");

  // CP course CRUD + Roster drawer + Kick mandatory reason dialog
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseDTO | null>(null);
  const [cTitle, setCTitle] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cCategory, setCCategory] = useState("Backend");
  const [cWeeks, setCWeeks] = useState(8);
  const [cSkills, setCSkills] = useState<SkillItem[]>([]);
  const [deleteCourseTarget, setDeleteCourseTarget] = useState<CourseDTO | null>(null);

  const [rosterCourse, setRosterCourse] = useState<CourseDTO | null>(null);
  const [kickTarget, setKickTarget] = useState<{ courseId: number; traineeId: number; fullName: string } | null>(
    null
  );
  const [kickReason, setKickReason] = useState("");

  // Trainee drop mandatory reason dialog
  const [dropTarget, setDropTarget] = useState<CourseDTO | null>(null);
  const [dropReason, setDropReason] = useState("");
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (courseSearch.trim()) qs.set("search", courseSearch.trim());
      if (categoryFilter !== "ALL") qs.set("category", categoryFilter);
      if (selectedSkill) qs.set("skillId", String(selectedSkill.id));
      qs.set("sort", sortBy);
      if (isTrainee && recommendedOnly) qs.set("recommended", "true");

      const pQs = providerSearch.trim() ? `?search=${encodeURIComponent(providerSearch.trim())}` : "";

      const [cRes, pRes, sRes, meRes] = await Promise.all([
        apiRequest<{ courses: CourseDTO[] }>(`/api/courses?${qs.toString()}`),
        apiRequest<{ providers: CourseProviderDTO[] }>(`/api/providers${pQs}`),
        apiRequest<{ skills: SkillItem[] }>("/api/skills/flat"),
        isTrainee
          ? apiRequest<{ trainee: TraineeDTO }>("/api/trainees/me")
          : Promise.resolve({ trainee: null }),
      ]);

      setCourses(cRes.courses);
      setProviders(pRes.providers);
      setAllSkills(sRes.skills);
      if (meRes.trainee) {
        setMyEnrollments(meRes.trainee.enrollments);
      }
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, [courseSearch, categoryFilter, selectedSkill, sortBy, recommendedOnly, providerSearch, isTrainee]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadData();
    }, 150);
    return () => clearTimeout(t);
  }, [loadData]);

  const categories = Array.from(new Set(allSkills.map((s) => s.categoryName).filter(Boolean) as string[]));

  const renderSkillItem: ItemRenderer<SkillItem> = (skill, { handleClick, handleFocus, modifiers }) => {
    if (!modifiers.matchesPredicate) return null;
    return (
      <MenuItem
        key={skill.id}
        active={modifiers.active}
        text={skill.name}
        label={skill.categoryName}
        onClick={handleClick}
        onFocus={handleFocus}
      />
    );
  };

  const renderMultiSkillItem: ItemRenderer<SkillItem> = (skill, { handleClick, handleFocus, modifiers }) => {
    if (!modifiers.matchesPredicate) return null;
    const isSelected = cSkills.some((s) => s.id === skill.id);
    return (
      <MenuItem
        key={skill.id}
        active={modifiers.active}
        icon={isSelected ? "tick" : "blank"}
        text={skill.name}
        label={skill.categoryName}
        onClick={handleClick}
        onFocus={handleFocus}
        shouldDismissPopover={false}
      />
    );
  };

  const openCourseModal = (course?: CourseDTO) => {
    if (course) {
      setEditingCourse(course);
      setCTitle(course.title);
      setCDesc(course.description);
      setCCategory(course.category);
      setCWeeks(course.durationWeeks);
      setCSkills(course.skills);
    } else {
      setEditingCourse(null);
      setCTitle("");
      setCDesc("");
      setCCategory("Backend");
      setCWeeks(8);
      setCSkills([]);
    }
    setCourseDialogOpen(true);
  };

  const handleSaveCourse = async (e: FormEvent) => {
    e.preventDefault();
    if (cSkills.length === 0) {
      void showError("Select at least one skill tag for this course");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: cTitle,
        description: cDesc,
        category: cCategory,
        durationWeeks: Number(cWeeks),
        skillIds: cSkills.map((s) => s.id),
      };
      if (editingCourse) {
        await apiRequest(`/api/courses/${editingCourse.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        void showSuccess("Course updated");
      } else {
        await apiRequest("/api/courses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        void showSuccess("Course published");
      }
      setCourseDialogOpen(false);
      await loadData();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to save course");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteCourseTarget) return;
    setBusy(true);
    try {
      await apiRequest(`/api/courses/${deleteCourseTarget.id}`, { method: "DELETE" });
      void showSuccess("Course deleted");
      setDeleteCourseTarget(null);
      await loadData();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to delete course");
    } finally {
      setBusy(false);
    }
  };

  const handleEnroll = async (courseId: number) => {
    setBusy(true);
    try {
      await apiRequest("/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });
      void showSuccess("Enrolled in course");
      await loadData();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteCourse = async (courseId: number) => {
    setBusy(true);
    try {
      const res = await apiRequest<{ grantedVerifiedSkills: string[] }>(
        `/api/enrollments/${courseId}/complete`,
        { method: "POST" }
      );
      void showSuccess(
        `Course completed! Verified skills added: ${res.grantedVerifiedSkills.join(", ")}`
      );
      await loadData();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to mark completed");
    } finally {
      setBusy(false);
    }
  };

  const handleDropCourse = async () => {
    if (!dropTarget || !dropReason.trim()) return;
    setBusy(true);
    try {
      await apiRequest(`/api/enrollments/${dropTarget.id}/drop`, {
        method: "POST",
        body: JSON.stringify({ reason: dropReason.trim() }),
      });
      void showSuccess(`Dropped ${dropTarget.title}`);
      setDropTarget(null);
      setDropReason("");
      await loadData();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Drop failed");
    } finally {
      setBusy(false);
    }
  };

  const handleKickTrainee = async () => {
    if (!kickTarget || !kickReason.trim()) return;
    setBusy(true);
    try {
      await apiRequest(`/api/courses/${kickTarget.courseId}/kick`, {
        method: "POST",
        body: JSON.stringify({ traineeId: kickTarget.traineeId, reason: kickReason.trim() }),
      });
      void showSuccess(`Removed ${kickTarget.fullName} from this course`);
      setKickTarget(null);
      setKickReason("");
      setRosterCourse(null);
      await loadData();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to remove trainee");
    } finally {
      setBusy(false);
    }
  };

  const openProviderModal = (provider?: CourseProviderDTO) => {
    if (provider) {
      setEditProviderTarget(provider);
      setPName(provider.name);
      setPEmail(provider.contactEmail);
      setPContact(provider.contactEmail);
      setPWebsite(provider.website || "");
      setPDesc(provider.description || "");
    } else {
      setEditProviderTarget(null);
      setPName("");
      setPEmail("");
      setPPassword("Provider@123!");
      setPContact("");
      setPWebsite("");
      setPDesc("");
      setAddProviderOpen(true);
    }
  };

  const handleSaveProvider = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editProviderTarget) {
        await apiRequest(`/api/admin/providers/${editProviderTarget.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: pName,
            contactEmail: pContact,
            website: pWebsite,
            description: pDesc,
          }),
        });
        void showSuccess("Provider updated");
        setEditProviderTarget(null);
      } else {
        await apiRequest("/api/admin/providers", {
          method: "POST",
          body: JSON.stringify({
            name: pName,
            email: pEmail,
            password: pPassword,
            contactEmail: pContact || pEmail,
            website: pWebsite,
            description: pDesc,
            approvalStatus: "approved",
          }),
        });
        void showSuccess("Course provider added");
        setAddProviderOpen(false);
      }
      await loadData();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to save provider");
    } finally {
      setBusy(false);
    }
  };

  const handleApprovalChange = async (providerId: number, approvalStatus: "approved" | "rejected") => {
    setBusy(true);
    try {
      await apiRequest(`/api/admin/providers/${providerId}`, {
        method: "PUT",
        body: JSON.stringify({ approvalStatus }),
      });
      void showSuccess(`Provider ${approvalStatus}`);
      await loadData();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to update approval status");
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveProvider = async () => {
    if (!removeProviderTarget) return;
    setBusy(true);
    try {
      await apiRequest(`/api/admin/providers/${removeProviderTarget.id}`, { method: "DELETE" });
      void showSuccess("Course provider removed");
      setRemoveProviderTarget(null);
      await loadData();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to remove provider");
    } finally {
      setBusy(false);
    }
  };

  const getEnrollmentForCourse = (courseId: number) =>
    myEnrollments.find((e) => e.courseId === courseId);

  return (
    <div className="st-stack">
      <Card>
        <div className="st-between">
          <div>
            <H2 style={{ margin: 0 }}>Courses & Course Providers</H2>
            <p className="bp5-text-muted" style={{ margin: "4px 0 0 0", fontSize: 13 }}>
              Explore courses ranked by popularity, skill tags, categories, and rule-based trainee recommendations.
            </p>
          </div>
          <div className="st-row">
            {isCp && (
              <Button intent={Intent.PRIMARY} icon="plus" text="Add Course" onClick={() => openCourseModal()} />
            )}
            {isAdmin && (
              <Button
                intent={Intent.PRIMARY}
                icon="office"
                text="Add Provider"
                onClick={() => openProviderModal()}
              />
            )}
          </div>
        </div>
      </Card>

      <Tabs
        id="courses-providers-tabs"
        selectedTabId={tab}
        onChange={(next) => setTab(next as "courses" | "providers")}
      >
        <Tab
          id="courses"
          title={`Courses (${courses.length})`}
          panel={
            <div className="st-stack" style={{ marginTop: 12 }}>
              <Card>
                <div className="st-row">
                  <div style={{ minWidth: 220, flex: 1 }}>
                    <InputGroup
                      leftIcon="search"
                      placeholder="Search courses or providers..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                    />
                  </div>
                  <Suggest<SkillItem>
                    items={allSkills}
                    selectedItem={selectedSkill}
                    itemPredicate={(query, item) =>
                      item.name.toLowerCase().includes(query.trim().toLowerCase())
                    }
                    itemRenderer={renderSkillItem}
                    inputValueRenderer={(item) => item.name}
                    onItemSelect={(item) => setSelectedSkill(item)}
                    noResults={<MenuItem disabled text="No matching skill" />}
                    inputProps={{
                      placeholder: "Filter by skill (Java, Docker, Git)...",
                      leftIcon: "filter",
                      rightElement: selectedSkill ? (
                        <Button
                          minimal
                          icon="cross"
                          aria-label="Clear skill filter"
                          onClick={() => setSelectedSkill(null)}
                        />
                      ) : undefined,
                    }}
                  />
                  <HTMLSelect
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    options={[
                      { label: "All Categories", value: "ALL" },
                      ...categories.map((c) => ({ label: c, value: c })),
                    ]}
                  />
                  <HTMLSelect
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    options={[
                      { label: "Sort: Popularity", value: "popularity" },
                      { label: "Sort: Title", value: "title" },
                    ]}
                  />
                  {isTrainee && (
                    <Switch
                      style={{ marginBottom: 0 }}
                      checked={recommendedOnly}
                      onChange={(e) => setRecommendedOnly(e.currentTarget.checked)}
                      label="Recommended for you"
                    />
                  )}
                </div>
              </Card>

              {loading ? (
                <Card>
                  <div className="st-row" style={{ justifyContent: "center", padding: 36 }}>
                    <Spinner size={28} />
                  </div>
                </Card>
              ) : courses.length === 0 ? (
                <Card>
                  <NonIdealState
                    icon="book"
                    title="No matching courses"
                    description="Adjust your skill, category, or search filters to view courses."
                  />
                </Card>
              ) : (
                <div className="st-grid-3">
                  {courses.map((course) => {
                    const enrollment = isTrainee ? getEnrollmentForCourse(course.id) : undefined;
                    const ownsCourse = isCp && user?.providerId === course.providerId;

                    return (
                      <Card key={course.id} className="st-stack" style={{ justifyContent: "space-between" }}>
                        <div className="st-stack" style={{ gap: 8 }}>
                          <div className="st-between">
                            <Tag intent={Intent.PRIMARY} minimal>
                              {course.category}
                            </Tag>
                            <Tag minimal icon="people">
                              {course.popularity} enrolled
                            </Tag>
                          </div>

                          <H4 style={{ margin: 0 }}>{course.title}</H4>

                          <div style={{ fontSize: 12 }}>
                            Provider:{" "}
                            <Button
                              minimal
                              small
                              text={course.providerName}
                              onClick={() => navigate(`/providers/${course.providerId}`)}
                            />
                          </div>

                          {course.recommendedReason && (
                            <Callout intent={Intent.PRIMARY} icon="lightbulb" style={{ padding: "8px 10px" }}>
                              <span style={{ fontSize: 12 }}>{course.recommendedReason}</span>
                            </Callout>
                          )}

                          <p className="bp5-text-muted" style={{ margin: 0, fontSize: 13 }}>
                            {course.description}
                          </p>

                          <div className="st-row" style={{ gap: 5 }}>
                            {course.skills.map((s) => (
                              <Tag key={s.id} minimal>
                                {s.name}
                              </Tag>
                            ))}
                          </div>
                        </div>

                        <div className="st-between" style={{ paddingTop: 10 }}>
                          {isTrainee && (
                            <div className="st-row" style={{ gap: 6 }}>
                              {enrollment?.status === "completed" ? (
                                <Tag intent={Intent.SUCCESS} icon="tick">
                                  Completed
                                </Tag>
                              ) : enrollment?.status === "enrolled" ? (
                                <>
                                  <Button
                                    small
                                    intent={Intent.SUCCESS}
                                    loading={busy}
                                    text="Complete Course"
                                    onClick={() => void handleCompleteCourse(course.id)}
                                  />
                                  <Button
                                    small
                                    intent={Intent.DANGER}
                                    minimal
                                    text="Drop"
                                    onClick={() => setDropTarget(course)}
                                  />
                                </>
                              ) : (
                                <>
                                  {enrollment?.status === "kicked" && (
                                    <Tag intent={Intent.DANGER} minimal>
                                      Removed ({enrollment.kickReason})
                                    </Tag>
                                  )}
                                  <Button
                                    small
                                    intent={Intent.PRIMARY}
                                    loading={busy}
                                    text="Enroll"
                                    onClick={() => void handleEnroll(course.id)}
                                  />
                                </>
                              )}
                            </div>
                          )}

                          {ownsCourse && (
                            <div className="st-row" style={{ gap: 6 }}>
                              <Button
                                small
                                icon="people"
                                text={`Roster (${course.activeTrainees?.length || 0})`}
                                onClick={() => setRosterCourse(course)}
                              />
                              <Button small icon="edit" onClick={() => openCourseModal(course)} />
                              <Button
                                small
                                minimal
                                intent={Intent.DANGER}
                                icon="trash"
                                onClick={() => setDeleteCourseTarget(course)}
                              />
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          }
        />

        <Tab
          id="providers"
          title={`Course Providers (${providers.length})`}
          panel={
            <div className="st-stack" style={{ marginTop: 12 }}>
              <Card>
                <div style={{ maxWidth: 400 }}>
                  <InputGroup
                    leftIcon="search"
                    placeholder="Search course providers..."
                    value={providerSearch}
                    onChange={(e) => setProviderSearch(e.target.value)}
                  />
                </div>
              </Card>

              <Card>
                {providers.length === 0 ? (
                  <NonIdealState
                    icon="office"
                    title="No course providers found"
                    description="Try clearing your provider search."
                  />
                ) : (
                  <HTMLTable striped interactive style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th>Provider</th>
                        <th>Contact Email</th>
                        <th>Courses</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providers.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.name}</strong>
                            {p.description && (
                              <div className="bp5-text-muted" style={{ fontSize: 12 }}>
                                {p.description}
                              </div>
                            )}
                          </td>
                          <td>{p.contactEmail}</td>
                          <td>{p.courseCount ?? 0}</td>
                          <td>
                            <Tag
                              minimal
                              intent={
                                p.approvalStatus === "approved"
                                  ? Intent.SUCCESS
                                  : p.approvalStatus === "pending"
                                    ? Intent.WARNING
                                    : Intent.DANGER
                              }
                            >
                              {p.approvalStatus}
                            </Tag>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="st-row" style={{ justifyContent: "flex-end", gap: 6 }}>
                              {isAdmin && p.approvalStatus === "pending" && (
                                <>
                                  <Button
                                    small
                                    intent={Intent.SUCCESS}
                                    text="Approve"
                                    onClick={() => void handleApprovalChange(p.id, "approved")}
                                  />
                                  <Button
                                    small
                                    intent={Intent.WARNING}
                                    text="Reject"
                                    onClick={() => void handleApprovalChange(p.id, "rejected")}
                                  />
                                </>
                              )}
                              <Button
                                small
                                icon="eye-open"
                                text="View profile"
                                onClick={() => navigate(`/providers/${p.id}`)}
                              />
                              {isAdmin && (
                                <>
                                  <Button
                                    small
                                    icon="edit"
                                    onClick={() => openProviderModal(p)}
                                  />
                                  <Button
                                    small
                                    minimal
                                    intent={Intent.DANGER}
                                    icon="trash"
                                    onClick={() => setRemoveProviderTarget(p)}
                                  />
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </HTMLTable>
                )}
              </Card>
            </div>
          }
        />
      </Tabs>

      {/* Course Create / Edit Dialog (CP own courses) */}
      <Dialog
        isOpen={courseDialogOpen}
        onClose={() => setCourseDialogOpen(false)}
        title={editingCourse ? "Edit Course" : "Create Course"}
      >
        <form onSubmit={handleSaveCourse}>
          <DialogBody className="st-stack">
            <FormGroup label="Course Title" labelInfo="(required)">
              <InputGroup value={cTitle} onChange={(e) => setCTitle(e.target.value)} required />
            </FormGroup>
            <div className="st-grid-2">
              <FormGroup label="Category">
                <HTMLSelect
                  fill
                  value={cCategory}
                  onChange={(e) => setCCategory(e.target.value)}
                  options={["Backend", "DevOps", "Cloud", "Database", "Frontend & Data"]}
                />
              </FormGroup>
              <FormGroup label="Duration (Weeks)">
                <InputGroup
                  type="number"
                  min={1}
                  max={104}
                  value={String(cWeeks)}
                  onChange={(e) => setCWeeks(Number(e.target.value))}
                />
              </FormGroup>
            </div>
            <FormGroup label="Description" labelInfo="(required)">
              <TextArea fill rows={3} value={cDesc} onChange={(e) => setCDesc(e.target.value)} required />
            </FormGroup>
            <FormGroup label="Skills Taught" labelInfo="(MultiSelect)">
              <MultiSelect<SkillItem>
                items={allSkills}
                selectedItems={cSkills}
                itemPredicate={(query, item) =>
                  item.name.toLowerCase().includes(query.trim().toLowerCase())
                }
                itemRenderer={renderMultiSkillItem}
                tagRenderer={(item) => item.name}
                onItemSelect={(item) =>
                  setCSkills((prev) =>
                    prev.some((s) => s.id === item.id)
                      ? prev.filter((s) => s.id !== item.id)
                      : [...prev, item]
                  )
                }
                onRemove={(item) => setCSkills((prev) => prev.filter((s) => s.id !== item.id))}
                placeholder="Pick skills..."
                fill
              />
            </FormGroup>
          </DialogBody>
          <DialogFooter
            actions={
              <>
                <Button text="Cancel" onClick={() => setCourseDialogOpen(false)} />
                <Button type="submit" intent={Intent.PRIMARY} loading={busy} text="Save Course" />
              </>
            }
          />
        </form>
      </Dialog>

      {/* Course Delete Confirmation */}
      <Dialog
        isOpen={Boolean(deleteCourseTarget)}
        onClose={() => setDeleteCourseTarget(null)}
        title="Delete Course"
      >
        <DialogBody>
          Delete <strong>{deleteCourseTarget?.title}</strong> and its enrollments?
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button text="Cancel" onClick={() => setDeleteCourseTarget(null)} />
              <Button intent={Intent.DANGER} loading={busy} text="Delete" onClick={() => void handleDeleteCourse()} />
            </>
          }
        />
      </Dialog>

      {/* Enrolled Roster Drawer for CP */}
      <Drawer
        isOpen={Boolean(rosterCourse)}
        onClose={() => setRosterCourse(null)}
        title={rosterCourse ? `${rosterCourse.title} — Enrolled Trainees` : ""}
        size="420px"
      >
        <div style={{ padding: 16 }}>
          {!rosterCourse?.activeTrainees || rosterCourse.activeTrainees.length === 0 ? (
            <NonIdealState
              icon="people"
              title="No active enrollments"
              description="No consented trainees are currently enrolled in this course."
            />
          ) : (
            <HTMLTable striped style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rosterCourse.activeTrainees.map((t) => (
                  <tr key={t.traineeId}>
                    <td>{t.fullName}</td>
                    <td style={{ textAlign: "right" }}>
                      <Button
                        small
                        intent={Intent.DANGER}
                        text="Kick"
                        onClick={() =>
                          setKickTarget({
                            courseId: rosterCourse.id,
                            traineeId: t.traineeId,
                            fullName: t.fullName,
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </HTMLTable>
          )}
        </div>
      </Drawer>

      {/* Mandatory Reason Dialog: Kick Trainee */}
      <Dialog
        isOpen={Boolean(kickTarget)}
        onClose={() => {
          setKickTarget(null);
          setKickReason("");
        }}
        title="Kick Trainee from Course"
      >
        <DialogBody className="st-stack">
          <Callout intent={Intent.WARNING}>
            This removes <strong>{kickTarget?.fullName}</strong> from this course only (not from Skill-Track).
          </Callout>
          <FormGroup label="Required Reason" labelInfo="(mandatory)">
            <TextArea
              fill
              rows={3}
              placeholder="Explain why the trainee is being removed from this course..."
              value={kickReason}
              onChange={(e) => setKickReason(e.target.value)}
            />
          </FormGroup>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button
                text="Cancel"
                onClick={() => {
                  setKickTarget(null);
                  setKickReason("");
                }}
              />
              <Button
                intent={Intent.DANGER}
                disabled={kickReason.trim().length < 3}
                loading={busy}
                text="Confirm Kick"
                onClick={() => void handleKickTrainee()}
              />
            </>
          }
        />
      </Dialog>

      {/* Mandatory Reason Dialog: Drop Course */}
      <Dialog
        isOpen={Boolean(dropTarget)}
        onClose={() => {
          setDropTarget(null);
          setDropReason("");
        }}
        title="Drop Course"
      >
        <DialogBody className="st-stack">
          <p style={{ margin: 0 }}>
            Dropping <strong>{dropTarget?.title}</strong> requires a brief reason:
          </p>
          <FormGroup label="Drop Reason" labelInfo="(mandatory)">
            <TextArea
              fill
              rows={3}
              placeholder="Enter reason for dropping this course..."
              value={dropReason}
              onChange={(e) => setDropReason(e.target.value)}
            />
          </FormGroup>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button
                text="Cancel"
                onClick={() => {
                  setDropTarget(null);
                  setDropReason("");
                }}
              />
              <Button
                intent={Intent.DANGER}
                disabled={dropReason.trim().length < 3}
                loading={busy}
                text="Confirm Drop"
                onClick={() => void handleDropCourse()}
              />
            </>
          }
        />
      </Dialog>

      {/* Admin Add / Edit Provider Dialog */}
      <Dialog
        isOpen={addProviderOpen || Boolean(editProviderTarget)}
        onClose={() => {
          setAddProviderOpen(false);
          setEditProviderTarget(null);
        }}
        title={editProviderTarget ? "Edit Course Provider" : "Add Course Provider"}
      >
        <form onSubmit={handleSaveProvider}>
          <DialogBody className="st-stack">
            <FormGroup label="Organization Name" labelInfo="(required)">
              <InputGroup value={pName} onChange={(e) => setPName(e.target.value)} required />
            </FormGroup>
            {!editProviderTarget && (
              <div className="st-grid-2">
                <FormGroup label="Login Email" labelInfo="(required)">
                  <InputGroup type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} required />
                </FormGroup>
                <FormGroup label="Initial Password">
                  <InputGroup
                    type="password"
                    value={pPassword}
                    onChange={(e) => setPPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </FormGroup>
              </div>
            )}
            <div className="st-grid-2">
              <FormGroup label="Contact Email">
                <InputGroup type="email" value={pContact} onChange={(e) => setPContact(e.target.value)} />
              </FormGroup>
              <FormGroup label="Website">
                <InputGroup type="url" value={pWebsite} onChange={(e) => setPWebsite(e.target.value)} />
              </FormGroup>
            </div>
            <FormGroup label="Description">
              <TextArea fill rows={3} value={pDesc} onChange={(e) => setPDesc(e.target.value)} />
            </FormGroup>
          </DialogBody>
          <DialogFooter
            actions={
              <>
                <Button
                  text="Cancel"
                  onClick={() => {
                    setAddProviderOpen(false);
                    setEditProviderTarget(null);
                  }}
                />
                <Button type="submit" intent={Intent.PRIMARY} loading={busy} text="Save Provider" />
              </>
            }
          />
        </form>
      </Dialog>

      {/* Admin Remove Provider Confirmation */}
      <Dialog
        isOpen={Boolean(removeProviderTarget)}
        onClose={() => setRemoveProviderTarget(null)}
        title="Remove Course Provider"
      >
        <DialogBody>
          Remove <strong>{removeProviderTarget?.name}</strong> and all of its courses?
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button text="Cancel" onClick={() => setRemoveProviderTarget(null)} />
              <Button intent={Intent.DANGER} loading={busy} text="Remove" onClick={() => void handleRemoveProvider()} />
            </>
          }
        />
      </Dialog>
    </div>
  );
}
