import { useState } from "react";
import { Navigate, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { traineeApi, courseApi, adminApi } from "../api/endpoints";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ui/useToast";
import {
  ArrowLeft,
  Mail,
  Phone,
  Award,
  CheckCircle2,
  Trash2,
  Plus,
  Pencil,
  MessageSquare,
} from "lucide-react";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Switch } from "../components/ui/Switch";
import { ButtonGroup, Divider, H2, Intent } from "@blueprintjs/core";
import { Card, Section, SectionCard, CardList } from "../components/ui/Card";
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
import { Field, Input, Textarea } from "../components/ui/Field";
import { Select } from "../components/ui/Select";
import { LoadingState, ErrorState } from "../components/ui/QueryState";
import {
  ClearEmploymentAlertDialog,
  EmploymentDetailsSection,
  EmploymentFormFields,
} from "../components/trainee/EmploymentSection";
import {
  getEmploymentMeta,
  hasTraineeRespondedFollowUp,
  normalizeEmploymentStatus,
  toApiEmploymentStatus,
} from "../utils/domain";

const editProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  phoneNumber: z.string().optional(),
  employmentStatus: z.enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "SELF_EMPLOYED", "UNEMPLOYED"]),
  companyName: z.string().optional(),
  currentRole: z.string().optional(),
  currentSalary: z.string().optional(),
  salaryProgression: z.string().optional(),
  unemployedReason: z.string().optional(),
  projectsSummary: z.string().optional(),
  projectRepoUrl: z
    .string()
    .url("Must be a valid URL starting with http:// or https://")
    .optional()
    .or(z.literal("")),
});

/** @param {{ customId?: any, isSelfView?: boolean }} props */
export default function TraineeProfile({ customId, isSelfView = false } = {}) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { role, user, logout, switchPersona } = useAuth();
  const { addToast } = useToast();

  const traineeId = customId || routeId;
  const canManage = isSelfView || role === "ADMIN";
  const tabParam = searchParams.get("tab");
  const validTabs = isSelfView
    ? new Set(["overview", "skills", "courses"])
    : new Set(["overview", "skills", "courses", "employment"]);
  const activeTab = validTabs.has(tabParam) ? tabParam : "overview";
  const handleTabChange = (nextTab) => {
    const next = new URLSearchParams(searchParams);
    if (!nextTab || nextTab === "overview") next.delete("tab");
    else next.set("tab", nextTab);
    setSearchParams(next, { replace: true });
  };

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [dropCourseTarget, setDropCourseTarget] = useState(null);
  const [dropReason, setDropReason] = useState("");
  const [removeEmpModalOpen, setRemoveEmpModalOpen] = useState(false);
  const [forbidEmailsOnRemove, setForbidEmailsOnRemove] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState("UNEMPLOYED");
  const [deleteSelfModalOpen, setDeleteSelfModalOpen] = useState(false);

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["trainee", traineeId],
    queryFn: ({ signal }) => traineeApi.getById(traineeId, signal),
    enabled: Boolean(traineeId),
  });

  const { data: allCourses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: ({ signal }) => courseApi.getAll(signal),
    staleTime: 60000,
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
    setValue: setEditValue,
    formState: { errors: editErrors, isSubmitting: isEditSubmitting },
  } = useForm({
    resolver: zodResolver(editProfileSchema),
  });

  const openEditDialog = () => {
    if (!profile) return;
    const status = normalizeEmploymentStatus(profile.employmentStatus);
    setEditStatus(status);
    resetEditForm({
      fullName: profile.fullName || "",
      email: profile.email || "",
      phoneNumber: profile.phoneNumber || "",
      employmentStatus: status,
      companyName: profile.companyName || "",
      currentRole: profile.currentRole || "",
      currentSalary: profile.currentSalary ? String(profile.currentSalary) : "",
      salaryProgression: profile.salaryProgression || "",
      unemployedReason: profile.unemployedReason || "",
      projectsSummary: profile.projectsSummary || "",
      projectRepoUrl: profile.projectRepoUrl || "",
    });
    setEditModalOpen(true);
  };

  const onSaveEdit = async (formData) => {
    try {
      const payload = isSelfView && profile
        ? {
            ...formData,
            employmentStatus: profile.employmentStatus,
            companyName: profile.companyName || "",
            currentRole: profile.currentRole || "",
            currentSalary: profile.currentSalary ?? null,
            salaryProgression: profile.salaryProgression || "",
            unemployedReason: profile.unemployedReason || "",
          }
        : {
            ...formData,
            employmentStatus: toApiEmploymentStatus(formData.employmentStatus),
            currentSalary: formData.currentSalary ? Number(formData.currentSalary) : null,
          };
      const updated = await traineeApi.update(traineeId, payload);
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["skillsSummary"] });
      if (isSelfView && updated) {
        switchPersona("TRAINEE", {
          id: updated.id,
          name: updated.fullName,
          email: updated.email,
          details: updated,
        });
      }
      addToast({ title: "Profile Updated", description: "Changes have been saved." });
      setEditModalOpen(false);
    } catch (err) {
      addToast({ title: "Update Failed", description: err.message, variant: "danger" });
    }
  };

  const consentMutation = useMutation({
    mutationFn: /** @param {boolean} consentGiven */ (consentGiven) =>
      traineeApi.updateConsent(traineeId, consentGiven),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      addToast({ title: "Consent Updated", description: "Tracking consent preference saved." });
    },
    onError: (err) => addToast({ title: "Update Failed", description: err.message, variant: "danger" }),
  });

  const emailPrefMutation = useMutation({
    mutationFn: /** @param {boolean} allowEmails */ (allowEmails) =>
      traineeApi.updateEmailPreference(traineeId, allowEmails),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
      addToast({ title: "Email Preference Updated", description: "Notification preference saved." });
    },
    onError: (err) => addToast({ title: "Update Failed", description: err.message, variant: "danger" }),
  });

  const adminEmailStopMutation = useMutation({
    mutationFn: /** @param {boolean} stop */ (stop) => adminApi.stopEmails(traineeId, stop),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
      addToast({ title: "Admin Override Updated", description: "Email service block updated." });
    },
    onError: (err) => addToast({ title: "Update Failed", description: err.message, variant: "danger" }),
  });

  const enrollMutation = useMutation({
    mutationFn: /** @param {number} courseId */ (courseId) =>
      traineeApi.enroll(traineeId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      addToast({ title: "Enrolled", description: "Successfully enrolled in course." });
      setEnrollModalOpen(false);
      setSelectedCourseId("");
    },
    onError: (err) => addToast({ title: "Enrollment Failed", description: err.message, variant: "danger" }),
  });

  const dropMutation = useMutation({
    mutationFn: /** @param {{ courseId: any, reason: string }} payload */ ({ courseId, reason }) =>
      traineeApi.drop(traineeId, courseId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      addToast({ title: "Course Dropped", description: "Enrollment dropped with stated reason." });
      setDropCourseTarget(null);
      setDropReason("");
    },
    onError: (err) => addToast({ title: "Drop Failed", description: err.message, variant: "danger" }),
  });

  const completeMutation = useMutation({
    mutationFn: /** @param {number} courseId */ (courseId) =>
      traineeApi.complete(traineeId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["skillsSummary"] });
      addToast({ title: "Course Completed", description: "Completed course and earned skills updated." });
    },
    onError: (err) => addToast({ title: "Action Failed", description: err.message, variant: "danger" }),
  });

  const removeEmpMutation = useMutation({
    mutationFn: /** @param {boolean} forbidEmails */ (forbidEmails) =>
      traineeApi.removeEmploymentInfo(traineeId, forbidEmails),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      addToast({ title: "Employment Info Cleared", description: "Employment details removed." });
      setRemoveEmpModalOpen(false);
    },
    onError: (err) => addToast({ title: "Removal Failed", description: err.message, variant: "danger" }),
  });

  const deleteSelfMutation = useMutation({
    mutationFn: () => traineeApi.delete(traineeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      addToast({ title: "Account Deleted", description: "Your trainee profile has been removed." });
      setDeleteSelfModalOpen(false);
      logout();
      navigate("/login");
    },
    onError: (err) => addToast({ title: "Deletion Failed", description: err.message, variant: "danger" }),
  });

  if (isSelfView && tabParam === "employment") {
    return <Navigate to="/my-employment" replace />;
  }

  if (isLoading) {
    return <LoadingState label="Loading trainee profile..." rows={4} />;
  }

  if (isError || !profile) {
    return (
      <ErrorState
        title="Unable to load trainee profile"
        error={error || new Error("Profile not found.")}
        onRetry={refetch}
      />
    );
  }

  const findCourseByTitle = (title) => allCourses.find((c) => c.title === title);

  const availableCourses = allCourses.filter(
    (c) =>
      !profile.enrolledCourses?.includes(c.title) &&
      !profile.completedCourses?.includes(c.title)
  );

  const statusMeta = getEmploymentMeta(profile.employmentStatus);
  const followUpResponded = hasTraineeRespondedFollowUp(profile);

  return (
    <div className="space-y-5">
      {!isSelfView && (
        <Button
          variant="ghost"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate("/trainees")}
        >
          Back to Trainees Directory
        </Button>
      )}

      {/* Profile Header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar fallback={profile.fullName} size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <H2 className="!mb-0 truncate">{profile.fullName}</H2>
                <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                {profile.consentGiven ? (
                  <Badge variant="success">Consent Granted</Badge>
                ) : (
                  <Badge variant="outline">Consent Pending</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs bp6-text-muted mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={13} /> {profile.email}
                </span>
                {profile.phoneNumber && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={13} /> {profile.phoneNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!canManage && <Badge variant="outline">Read-only</Badge>}
            {canManage && (
              <ButtonGroup>
                <Button variant="outline" icon={<Pencil size={13} />} onClick={openEditDialog}>
                  Edit Profile
                </Button>
                <Button
                  variant="primary"
                  icon={<Plus size={14} />}
                  onClick={() => setEnrollModalOpen(true)}
                >
                  Enroll in Course
                </Button>
              </ButtonGroup>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTab value="overview">Profile & Contact</TabsTab>
          <TabsTab value="skills">Skills & Certifications</TabsTab>
          <TabsTab value="courses">Courses & Enrollments</TabsTab>
          {!isSelfView && <TabsTab value="employment">Employment</TabsTab>}
        </TabsList>

        {/* Overview */}
        <TabsPanel value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Section title="Personal Details">
              <SectionCard className="space-y-4 text-sm">
                <div>
                  <p className="text-xs bp6-text-muted">Full Name</p>
                  <p className="font-medium mt-0.5">{profile.fullName}</p>
                </div>
                <div>
                  <p className="text-xs bp6-text-muted">Email Address</p>
                  <p className="font-medium mt-0.5">{profile.email}</p>
                </div>
                <div>
                  <p className="text-xs bp6-text-muted">Phone Number</p>
                  <p className="font-medium mt-0.5">
                    {profile.phoneNumber || "Not provided"}
                  </p>
                </div>
                {profile.projectsSummary && (
                  <div>
                    <p className="text-xs bp6-text-muted">Projects Summary</p>
                    <p className="text-xs leading-relaxed mt-1">
                      {profile.projectsSummary}
                    </p>
                    {profile.projectRepoUrl && (
                      <a
                        href={profile.projectRepoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium underline mt-1 inline-block"
                      >
                        View Repository
                      </a>
                    )}
                  </div>
                )}
              </SectionCard>
            </Section>

            <Section title="Consent & Email Preferences">
              <SectionCard className="space-y-4">
                <Switch
                  label="Tracking Consent"
                  description="Permits tracking employment outcomes beyond graduation."
                  checked={Boolean(profile.consentGiven)}
                  disabled={!canManage || consentMutation.isPending}
                  onCheckedChange={(checked) => consentMutation.mutate(checked)}
                />

                <Switch
                  label="Quarterly Follow-Up Reminders"
                  description="Receive quarterly reminders to refresh career details."
                  checked={Boolean(profile.allowEmails)}
                  disabled={!canManage || emailPrefMutation.isPending}
                  onCheckedChange={(checked) => emailPrefMutation.mutate(checked)}
                />

                {role === "ADMIN" && (
                  <>
                    <Divider />
                    <Switch
                      label="Admin Email Stop Override"
                      description="Administrative lock preventing outbound follow-up emails."
                      checked={Boolean(profile.adminStoppedEmail)}
                      disabled={adminEmailStopMutation.isPending}
                      onCheckedChange={(checked) => adminEmailStopMutation.mutate(checked)}
                    />
                  </>
                )}

                {isSelfView && (
                  <>
                    <Divider />
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium">Delete Trainee Account</p>
                        <p className="text-xs bp6-text-muted">
                          Permanently remove your profile from SkillTrack.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        intent={Intent.DANGER}
                        icon={<Trash2 size={13} />}
                        onClick={() => setDeleteSelfModalOpen(true)}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </>
                )}
              </SectionCard>
            </Section>

            {/* Follow-up Status & Notes */}
            <Section
              title={`Follow-Up Status & Notes (${profile.followUpNotes?.length || 0})`}
              icon={<MessageSquare size={15} />}
              className="md:col-span-2"
              rightElement={
                <Badge variant={followUpResponded ? "emerald" : "amber"}>
                  {followUpResponded ? "Responded" : "Not Responded"}
                </Badge>
              }
            >
              <SectionCard className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="bp6-text-muted">
                    Quarterly Follow-Up Status:{" "}
                    <strong className="text-[#1c2127] dark:text-[#f6f7f9]">
                      {followUpResponded ? "Responded to check-in" : "Awaiting response"}
                    </strong>
                  </span>
                  <span className="bp6-text-muted">
                    Outbound Emails:{" "}
                    <strong className="text-[#1c2127] dark:text-[#f6f7f9]">
                      {profile.adminStoppedEmail
                        ? "Halted by Admin"
                        : profile.allowEmails
                        ? "Enabled"
                        : "Opted Out"}
                    </strong>
                  </span>
                </div>

                {profile.followUpNotes?.length > 0 ? (
                  <CardList bordered>
                    {profile.followUpNotes.map((note, idx) => (
                      <Card key={idx} compact className="text-xs">
                        {note}
                      </Card>
                    ))}
                  </CardList>
                ) : (
                  <p className="text-xs bp6-text-muted">No follow-up notes recorded yet.</p>
                )}
              </SectionCard>
            </Section>
          </div>
        </TabsPanel>

        {/* Skills & Certifications */}
        <TabsPanel value="skills">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Section title={`Verified Skills (${profile.skills?.length || 0})`}>
              <SectionCard>
                {profile.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" icon={<Award size={12} />}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs bp6-text-muted">
                    No skills earned yet. Complete courses to automatically record verified skills.
                  </p>
                )}
              </SectionCard>
            </Section>

            <Section title={`Certifications (${profile.certifications?.length || 0})`}>
              {profile.certifications?.length > 0 ? (
                <SectionCard padded={false}>
                  <CardList bordered={false}>
                    {profile.certifications.map((cert, idx) => (
                      <Card key={idx} compact className="flex items-center gap-2 text-xs font-medium">
                        <CheckCircle2
                          size={14}
                          className="text-[#238551] dark:text-[#72ca9b] shrink-0"
                        />
                        <span>{cert}</span>
                      </Card>
                    ))}
                  </CardList>
                </SectionCard>
              ) : (
                <SectionCard>
                  <p className="text-xs bp6-text-muted">No certifications recorded.</p>
                </SectionCard>
              )}
            </Section>
          </div>
        </TabsPanel>

        {/* Courses & Enrollments */}
        <TabsPanel value="courses">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Section title={`Active Enrollments (${profile.enrolledCourses?.length || 0})`}>
              {profile.enrolledCourses?.length > 0 ? (
                <SectionCard padded={false}>
                  <CardList bordered={false}>
                    {profile.enrolledCourses.map((title) => {
                      const courseObj = findCourseByTitle(title);
                      return (
                        <Card key={title} compact className="flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-medium text-sm">{title}</div>
                              {courseObj?.providerName &&
                                (role !== "COURSE_PROVIDER" ||
                                  courseObj.providerId === (user?.id || 1)) && (
                                  <div className="text-xs bp6-text-muted mt-0.5">
                                    {courseObj.providerName}
                                  </div>
                                )}
                            </div>
                            <Badge variant="primary">In Progress</Badge>
                          </div>

                          {canManage && (
                            <div className="flex items-center justify-end gap-2 pt-2">
                              {courseObj && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => completeMutation.mutate(courseObj.id)}
                                  loading={completeMutation.isPending}
                                >
                                  Mark Completed
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                intent={Intent.DANGER}
                                onClick={() =>
                                  setDropCourseTarget(courseObj || { id: 0, title })
                                }
                              >
                                Drop
                              </Button>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </CardList>
                </SectionCard>
              ) : (
                <SectionCard>
                  <p className="text-center py-4 text-xs bp6-text-muted">
                    {canManage
                      ? 'No active course enrollments. Click "Enroll in Course" above.'
                      : "No active course enrollments."}
                  </p>
                </SectionCard>
              )}
            </Section>

            <Section title={`Completed Courses (${profile.completedCourses?.length || 0})`}>
              {profile.completedCourses?.length > 0 ? (
                <SectionCard padded={false}>
                  <CardList bordered={false}>
                    {profile.completedCourses.map((title) => (
                      <Card key={title} compact className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            size={15}
                            className="text-[#238551] dark:text-[#72ca9b] shrink-0"
                          />
                          <span className="text-xs font-medium">{title}</span>
                        </div>
                        <Badge variant="success">Completed</Badge>
                      </Card>
                    ))}
                  </CardList>
                </SectionCard>
              ) : (
                <SectionCard>
                  <p className="text-center py-4 text-xs bp6-text-muted">
                    No completed courses recorded yet.
                  </p>
                </SectionCard>
              )}
            </Section>
          </div>
        </TabsPanel>

        {/* Employment (Admin & Course Provider trainee view) */}
        {!isSelfView && (
          <TabsPanel value="employment">
            <EmploymentDetailsSection
              profile={profile}
              statusMeta={statusMeta}
              canManage={canManage}
              onEdit={openEditDialog}
              onClear={() => setRemoveEmpModalOpen(true)}
            />
          </TabsPanel>
        )}
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent maxWidth="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {isSelfView ? "Edit Personal Profile" : "Edit Profile & Employment"}
            </DialogTitle>
            <DialogDescription>
              {isSelfView
                ? "Update your contact details and project links. Employment details are managed under My Employment."
                : "Update trainee contact details, project links, and current employment outcomes."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit(onSaveEdit)} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full Name" required error={editErrors.fullName?.message} id="edit-name">
                <Input
                  id="edit-name"
                  {...registerEdit("fullName")}
                  hasError={Boolean(editErrors.fullName)}
                />
              </Field>
              <Field label="Email Address" required error={editErrors.email?.message} id="edit-email">
                <Input
                  id="edit-email"
                  type="email"
                  {...registerEdit("email")}
                  hasError={Boolean(editErrors.email)}
                />
              </Field>
            </div>

            <Field label="Phone Number" id="edit-phone">
              <Input id="edit-phone" {...registerEdit("phoneNumber")} />
            </Field>

            {!isSelfView && (
              <EmploymentFormFields
                status={editStatus}
                onStatusChange={(val) => {
                  setEditStatus(val);
                  setEditValue("employmentStatus", val);
                }}
                register={registerEdit}
                onSelectPresetReason={(val) => setEditValue("unemployedReason", val)}
              />
            )}

            <Field label="Projects Summary" id="edit-projects">
              <Textarea id="edit-projects" rows={2} {...registerEdit("projectsSummary")} />
            </Field>

            <Field
              label="Project Repository URL"
              error={editErrors.projectRepoUrl?.message}
              id="edit-repo"
            >
              <Input
                id="edit-repo"
                {...registerEdit("projectRepoUrl")}
                placeholder="https://github.com/..."
                hasError={Boolean(editErrors.projectRepoUrl)}
              />
            </Field>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
              <Button type="submit" variant="primary" size="sm" loading={isEditSubmitting}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={enrollModalOpen} onOpenChange={setEnrollModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll in a Course</DialogTitle>
            <DialogDescription>
              Select an accredited course to add to {profile.fullName}&apos;s active enrollments.
            </DialogDescription>
          </DialogHeader>

          <Field label="Available Courses" required>
            <Select
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
              placeholder={
                availableCourses.length > 0
                  ? "Select a course..."
                  : "All available courses already enrolled/completed"
              }
              disabled={availableCourses.length === 0}
              options={availableCourses.map((c) => ({
                value: String(c.id),
                label:
                  role === "COURSE_PROVIDER" && c.providerId !== (user?.id || 1)
                    ? c.title
                    : `${c.title} (${c.providerName})`,
              }))}
            />
          </Field>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedCourseId}
              loading={enrollMutation.isPending}
              onClick={() => enrollMutation.mutate(Number(selectedCourseId))}
            >
              Confirm Enrollment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drop Course AlertDialog */}
      <AlertDialog
        open={Boolean(dropCourseTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDropCourseTarget(null);
            setDropReason("");
          }
        }}
      >
        <AlertDialogContent variant="warning">
          <AlertDialogHeader>
            <AlertDialogTitle>Drop Course Enrollment?</AlertDialogTitle>
            <AlertDialogDescription>
              A reason is required to drop <strong>{dropCourseTarget?.title}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-3">
            <Field label="Reason for Dropping" required id="drop-reason">
              <Input
                id="drop-reason"
                value={dropReason}
                onChange={(e) => setDropReason(e.target.value)}
                placeholder="e.g. Schedule conflict, role change..."
              />
            </Field>
          </div>

          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
            <Button
              variant="danger"
              size="sm"
              disabled={!dropReason.trim()}
              loading={dropMutation.isPending}
              onClick={() =>
                dropCourseTarget &&
                dropMutation.mutate({
                  courseId: dropCourseTarget.id,
                  reason: dropReason.trim(),
                })
              }
            >
              Confirm Drop
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Employment Info AlertDialog */}
      {!isSelfView && (
        <ClearEmploymentAlertDialog
          open={removeEmpModalOpen}
          onOpenChange={setRemoveEmpModalOpen}
          forbidEmails={forbidEmailsOnRemove}
          onForbidEmailsChange={setForbidEmailsOnRemove}
          isPending={removeEmpMutation.isPending}
          onConfirm={() => removeEmpMutation.mutate(forbidEmailsOnRemove)}
        />
      )}

      {/* Self Account Deletion AlertDialog */}
      {isSelfView && (
        <AlertDialog open={deleteSelfModalOpen} onOpenChange={setDeleteSelfModalOpen}>
          <AlertDialogContent variant="danger">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Your Trainee Account?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes your trainee profile and signs you out.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
              <Button
                variant="danger"
                size="sm"
                loading={deleteSelfMutation.isPending}
                onClick={() => deleteSelfMutation.mutate()}
              >
                Delete Permanently
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
