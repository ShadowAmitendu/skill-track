import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
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

const editProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  phoneNumber: z.string().optional(),
  employmentStatus: z.enum(["EMPLOYED", "UNEMPLOYED", "SEEKING"]),
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

export default function TraineeProfile({ customId, isSelfView = false }) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { role, logout, switchPersona } = useAuth();
  const { addToast } = useToast();

  const traineeId = customId || routeId;
  const canManage = isSelfView || role === "ADMIN";
  const tabParam = searchParams.get("tab");
  const validTabs = new Set(["overview", "skills", "courses", "employment"]);
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
  const [editStatus, setEditStatus] = useState("SEEKING");
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
    const status = profile.employmentStatus || "SEEKING";
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
      const payload = {
        ...formData,
        currentSalary: formData.currentSalary ? Number(formData.currentSalary) : null,
      };
      const updated = await traineeApi.update(traineeId, payload);
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
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
    mutationFn: (consentGiven) => traineeApi.updateConsent(traineeId, consentGiven),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      addToast({ title: "Consent Updated", description: "Tracking consent preference saved." });
    },
    onError: (err) => addToast({ title: "Update Failed", description: err.message, variant: "danger" }),
  });

  const emailPrefMutation = useMutation({
    mutationFn: (allowEmails) => traineeApi.updateEmailPreference(traineeId, allowEmails),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
      addToast({ title: "Email Preference Updated", description: "Notification preference saved." });
    },
    onError: (err) => addToast({ title: "Update Failed", description: err.message, variant: "danger" }),
  });

  const adminEmailStopMutation = useMutation({
    mutationFn: (stop) => adminApi.stopEmails(traineeId, stop),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
      addToast({ title: "Admin Override Updated", description: "Email service block updated." });
    },
    onError: (err) => addToast({ title: "Update Failed", description: err.message, variant: "danger" }),
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId) => traineeApi.enroll(traineeId, courseId),
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
    mutationFn: ({ courseId, reason }) => traineeApi.drop(traineeId, courseId, reason),
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
    mutationFn: (courseId) => traineeApi.complete(traineeId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
      queryClient.invalidateQueries({ queryKey: ["trainees"] });
      queryClient.invalidateQueries({ queryKey: ["skillsSummary"] });
      addToast({ title: "Course Completed", description: "Completed course and earned skills updated." });
    },
    onError: (err) => addToast({ title: "Action Failed", description: err.message, variant: "danger" }),
  });

  const removeEmpMutation = useMutation({
    mutationFn: (forbidEmails) => traineeApi.removeEmploymentInfo(traineeId, forbidEmails),
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

  const statusBadgeVariant =
    profile.employmentStatus === "EMPLOYED"
      ? "emerald"
      : profile.employmentStatus === "UNEMPLOYED"
      ? "rose"
      : "amber";

  return (
    <div className="space-y-5">
      {!isSelfView && (
        <button
          type="button"
          onClick={() => navigate("/trainees")}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Trainees Directory
        </button>
      )}

      {/* Profile Header */}
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar fallback={profile.fullName} size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50 truncate">{profile.fullName}</h1>
                <Badge variant={statusBadgeVariant}>{profile.employmentStatus}</Badge>
                {profile.consentGiven ? (
                  <Badge variant="emerald">Consent Granted</Badge>
                ) : (
                  <Badge variant="outline">Consent Pending</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
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
              <Button variant="outline" size="sm" onClick={openEditDialog}>
                <Pencil size={13} /> Edit Profile
              </Button>
            )}
            {canManage && (
              <Button variant="primary" size="sm" onClick={() => setEnrollModalOpen(true)}>
                <Plus size={14} /> Enroll in Course
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTab value="overview">Profile & Contact</TabsTab>
          <TabsTab value="skills">Skills & Certifications</TabsTab>
          <TabsTab value="courses">Courses & Enrollments</TabsTab>
          <TabsTab value="employment">Employment</TabsTab>
        </TabsList>

        {/* Overview */}
        <TabsPanel value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Full Name</p>
                  <p className="font-medium text-gray-900 dark:text-gray-50 mt-0.5">{profile.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email Address</p>
                  <p className="font-medium text-gray-900 dark:text-gray-50 mt-0.5">{profile.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone Number</p>
                  <p className="font-medium text-gray-900 dark:text-gray-50 mt-0.5">
                    {profile.phoneNumber || "Not provided"}
                  </p>
                </div>
                {profile.projectsSummary && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Projects Summary</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                      {profile.projectsSummary}
                    </p>
                    {profile.projectRepoUrl && (
                      <a
                        href={profile.projectRepoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-gray-900 underline hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300 mt-1 inline-block"
                      >
                        View Repository
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consent & Email Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
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
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <Switch
                      label="Admin Email Stop Override"
                      description="Administrative lock preventing outbound follow-up emails."
                      checked={Boolean(profile.adminStoppedEmail)}
                      disabled={adminEmailStopMutation.isPending}
                      onCheckedChange={(checked) => adminEmailStopMutation.mutate(checked)}
                    />
                  </div>
                )}

                {isSelfView && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Delete Trainee Account</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Permanently remove your profile from SkillTrack.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-700 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950/60"
                      onClick={() => setDeleteSelfModalOpen(true)}
                    >
                      <Trash2 size={13} /> Delete Account
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Follow-up Notes */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare size={15} /> Follow-Up Notes ({profile.followUpNotes?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.followUpNotes?.length > 0 ? (
                  <ul className="space-y-2">
                    {profile.followUpNotes.map((note, idx) => (
                      <li
                        key={idx}
                        className="p-3 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-700 dark:bg-gray-950/70 dark:border-gray-800 dark:text-gray-300"
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No follow-up notes recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsPanel>

        {/* Skills & Certifications */}
        <TabsPanel value="skills">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Verified Skills ({profile.skills?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="neutral" className="px-2.5 py-1">
                        <Award size={12} className="mr-1" /> {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No skills earned yet. Complete courses to automatically record verified skills.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Certifications ({profile.certifications?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.certifications?.length > 0 ? (
                  <ul className="space-y-2">
                    {profile.certifications.map((cert, idx) => (
                      <li
                        key={idx}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center gap-2 text-xs font-medium text-gray-900 dark:bg-gray-950/70 dark:border-gray-800 dark:text-gray-100"
                      >
                        <CheckCircle2 size={14} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No certifications recorded.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsPanel>

        {/* Courses & Enrollments */}
        <TabsPanel value="courses">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Active Enrollments ({profile.enrolledCourses?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.enrolledCourses?.length > 0 ? (
                  <ul className="space-y-3">
                    {profile.enrolledCourses.map((title) => {
                      const courseObj = findCourseByTitle(title);
                      return (
                        <li
                          key={title}
                          className="p-3.5 bg-gray-50 border border-gray-200 rounded-md flex flex-col gap-2 dark:bg-gray-950/70 dark:border-gray-800"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm text-gray-900 dark:text-gray-50">{title}</p>
                              {courseObj?.providerName && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {courseObj.providerName}
                                </p>
                              )}
                            </div>
                            <Badge variant="neutral">In Progress</Badge>
                          </div>

                        {canManage && (
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
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
                              className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
                              onClick={() =>
                                setDropCourseTarget(courseObj || { id: 0, title })
                              }
                            >
                              Drop
                            </Button>
                          </div>
                        )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-center py-6 text-xs text-gray-500 dark:text-gray-400">
                    {canManage
                      ? 'No active course enrollments. Click "Enroll in Course" above.'
                      : "No active course enrollments."}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completed Courses ({profile.completedCourses?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.completedCourses?.length > 0 ? (
                  <ul className="space-y-2">
                    {profile.completedCourses.map((title) => (
                      <li
                        key={title}
                        className="p-3 bg-white border border-gray-200 rounded-md flex items-center justify-between gap-2 dark:bg-gray-950/70 dark:border-gray-800"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                          <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{title}</span>
                        </div>
                        <Badge variant="emerald">Completed</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center py-6 text-xs text-gray-500 dark:text-gray-400">
                    No completed courses recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsPanel>

        {/* Employment */}
        <TabsPanel value="employment">
          <Card>
            <CardHeader>
              <CardTitle>Employment & Career Details</CardTitle>
              {canManage && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={openEditDialog}>
                    <Pencil size={13} /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-700 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950/60"
                    onClick={() => setRemoveEmpModalOpen(true)}
                  >
                    <Trash2 size={13} /> Clear Employment Info
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Employment Status</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-1">
                  {profile.employmentStatus}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Current Role</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-1">
                  {profile.currentRole || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-1">
                  {profile.companyName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Current Salary</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 mt-1">
                  {profile.currentSalary
                    ? `₹${profile.currentSalary.toLocaleString("en-IN")}`
                    : "N/A"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Salary Progression</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                  {profile.salaryProgression || "Not recorded"}
                </p>
              </div>
              {profile.unemployedReason && (
                <div className="sm:col-span-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 dark:bg-amber-950/50 dark:border-amber-900 dark:text-amber-200">
                  <strong className="font-medium">Stated Reason / Context:</strong>{" "}
                  {profile.unemployedReason}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsPanel>
      </Tabs>

      {/* Edit Profile & Employment Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent maxWidth="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Profile & Employment</DialogTitle>
            <DialogDescription>
              Update trainee contact details, project links, and current employment outcomes.
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone Number" id="edit-phone">
                <Input id="edit-phone" {...registerEdit("phoneNumber")} />
              </Field>
              <Field label="Employment Status" required>
                <Select
                  value={editStatus}
                  onValueChange={(val) => {
                    setEditStatus(val);
                    setEditValue("employmentStatus", val);
                  }}
                  options={[
                    { value: "EMPLOYED", label: "Employed" },
                    { value: "SEEKING", label: "Seeking" },
                    { value: "UNEMPLOYED", label: "Unemployed" },
                  ]}
                />
              </Field>
            </div>

            {editStatus === "EMPLOYED" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Company Name" id="edit-company">
                  <Input id="edit-company" {...registerEdit("companyName")} />
                </Field>
                <Field label="Current Role" id="edit-role">
                  <Input id="edit-role" {...registerEdit("currentRole")} />
                </Field>
                <Field label="Current Salary (INR)" id="edit-salary">
                  <Input id="edit-salary" type="number" {...registerEdit("currentSalary")} />
                </Field>
              </div>
            ) : (
              <Field label="Unemployed / Seeking Context" id="edit-reason">
                <Input
                  id="edit-reason"
                  {...registerEdit("unemployedReason")}
                  placeholder="Optional reason or job-search note..."
                />
              </Field>
            )}

            <Field label="Salary Progression" id="edit-prog">
              <Input
                id="edit-prog"
                {...registerEdit("salaryProgression")}
                placeholder="e.g. 3.5LPA -> 6.5LPA"
              />
            </Field>

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
                label: `${c.title} (${c.providerName})`,
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
      <AlertDialog open={removeEmpModalOpen} onOpenChange={setRemoveEmpModalOpen}>
        <AlertDialogContent variant="warning">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Employment Information?</AlertDialogTitle>
            <AlertDialogDescription>
              Clears company, role, salary, and progression details on this profile.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-3">
            <Switch
              label="Also forbid future quarterly follow-up emails"
              checked={forbidEmailsOnRemove}
              onCheckedChange={setForbidEmailsOnRemove}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
            <Button
              variant="danger"
              size="sm"
              loading={removeEmpMutation.isPending}
              onClick={() => removeEmpMutation.mutate(forbidEmailsOnRemove)}
            >
              Confirm Clear
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
