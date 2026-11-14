import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Divider, EntityTitle, H2, Icon } from "@blueprintjs/core";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  IndianRupee,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { traineeApi } from "../api/endpoints";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ui/useToast";
import { Card, Section, SectionCard } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Callout } from "../components/ui/Callout";
import { Switch } from "../components/ui/Switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/Dialog";
import { LoadingState, ErrorState } from "../components/ui/QueryState";
import {
  ClearEmploymentAlertDialog,
  EmploymentDetailsSection,
  EmploymentFormFields,
} from "../components/trainee/EmploymentSection";
import {
  getEmploymentMeta,
  isEmployedStatus,
  normalizeEmploymentStatus,
  toApiEmploymentStatus,
} from "../utils/domain";

const employmentSchema = z.object({
  employmentStatus: z.enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "SELF_EMPLOYED", "UNEMPLOYED"]),
  companyName: z.string().optional(),
  currentRole: z.string().optional(),
  currentSalary: z.string().optional(),
  salaryProgression: z.string().optional(),
  unemployedReason: z.string().optional(),
});

export default function MyEmployment() {
  const { user, switchPersona } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const traineeId = user?.id || 1;

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState("UNEMPLOYED");
  const [removeEmpModalOpen, setRemoveEmpModalOpen] = useState(false);
  const [forbidEmailsOnRemove, setForbidEmailsOnRemove] = useState(false);

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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(employmentSchema),
  });

  const openEditDialog = () => {
    if (!profile) return;
    const status = normalizeEmploymentStatus(profile.employmentStatus);
    setEditStatus(status);
    reset({
      employmentStatus: status,
      companyName: profile.companyName || "",
      currentRole: profile.currentRole || "",
      currentSalary: profile.currentSalary ? String(profile.currentSalary) : "",
      salaryProgression: profile.salaryProgression || "",
      unemployedReason: profile.unemployedReason || "",
    });
    setEditModalOpen(true);
  };

  const invalidateTraineeQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["trainee", traineeId] });
    queryClient.invalidateQueries({ queryKey: ["trainees"] });
    queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
  };

  const onSaveEmployment = async (formData) => {
    if (!profile) return;
    try {
      const employed = isEmployedStatus(formData.employmentStatus);
      const payload = {
        fullName: profile.fullName,
        email: profile.email,
        phoneNumber: profile.phoneNumber || "",
        projectsSummary: profile.projectsSummary || "",
        projectRepoUrl: profile.projectRepoUrl || "",
        employmentStatus: toApiEmploymentStatus(formData.employmentStatus),
        companyName: employed ? formData.companyName || "" : "",
        currentRole: employed ? formData.currentRole || "" : "",
        currentSalary:
          employed && formData.currentSalary ? Number(formData.currentSalary) : null,
        salaryProgression: formData.salaryProgression || "",
        unemployedReason: employed ? "" : formData.unemployedReason || "",
      };

      const updated = await traineeApi.update(traineeId, payload);
      invalidateTraineeQueries();
      if (updated) {
        switchPersona("TRAINEE", {
          id: updated.id,
          name: updated.fullName,
          email: updated.email,
          details: updated,
        });
      }
      addToast({ title: "Employment Updated", description: "Your employment details were saved." });
      setEditModalOpen(false);
    } catch (err) {
      addToast({ title: "Update Failed", description: err.message, variant: "danger" });
    }
  };

  const consentMutation = useMutation({
    mutationFn: /** @param {boolean} consentGiven */ (consentGiven) =>
      traineeApi.updateConsent(traineeId, consentGiven),
    onSuccess: () => {
      invalidateTraineeQueries();
      addToast({ title: "Consent Updated", description: "Tracking consent preference saved." });
    },
    onError: (err) =>
      addToast({ title: "Update Failed", description: err.message, variant: "danger" }),
  });

  const emailPrefMutation = useMutation({
    mutationFn: /** @param {boolean} allowEmails */ (allowEmails) =>
      traineeApi.updateEmailPreference(traineeId, allowEmails),
    onSuccess: () => {
      invalidateTraineeQueries();
      addToast({
        title: "Email Preference Updated",
        description: "Follow-up reminder preference saved.",
      });
    },
    onError: (err) =>
      addToast({ title: "Update Failed", description: err.message, variant: "danger" }),
  });

  const removeEmpMutation = useMutation({
    mutationFn: /** @param {boolean} forbidEmails */ (forbidEmails) =>
      traineeApi.removeEmploymentInfo(traineeId, forbidEmails),
    onSuccess: () => {
      invalidateTraineeQueries();
      addToast({
        title: "Employment Info Cleared",
        description: "Employer, role, and compensation details have been removed.",
      });
      setRemoveEmpModalOpen(false);
    },
    onError: (err) =>
      addToast({ title: "Removal Failed", description: err.message, variant: "danger" }),
  });

  if (isLoading) {
    return <LoadingState label="Loading your employment details..." rows={4} />;
  }

  if (isError || !profile) {
    return (
      <ErrorState
        title="Unable to load employment record"
        error={error || new Error("Trainee record not found.")}
        onRetry={refetch}
      />
    );
  }

  const statusMeta = getEmploymentMeta(profile.employmentStatus);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <EntityTitle
            icon={<Icon icon="briefcase" size={20} />}
            heading={H2}
            title="My Employment"
            subtitle="Manage your employment status, role, compensation progression, and outcome tracking preferences."
          />

          <Button
            variant="primary"
            icon={<Pencil size={14} />}
            className="shrink-0"
            onClick={openEditDialog}
          >
            Update Employment
          </Button>
        </div>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <EntityTitle
            icon={<BriefcaseBusiness size={18} className="bp6-text-muted" />}
            title="Current Status"
            subtitle={statusMeta.note}
          />
          <div className="mt-3">
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          </div>
        </Card>

        <Card>
          <EntityTitle
            icon={<Building2 size={18} className="bp6-text-muted" />}
            title="Role & Organization"
            subtitle={profile.companyName || "No organization recorded"}
          />
          <p className="text-base font-semibold mt-3 truncate">
            {profile.currentRole || "Not specified"}
          </p>
        </Card>

        <Card>
          <EntityTitle
            icon={<IndianRupee size={18} className="bp6-text-muted" />}
            title="Current Compensation"
            subtitle={profile.salaryProgression || "No progression recorded"}
          />
          <p className="text-base font-semibold mt-3 tabular-nums">
            {profile.currentSalary ? `₹${profile.currentSalary.toLocaleString("en-IN")}` : "Not disclosed"}
          </p>
        </Card>
      </div>

      {/* Main Employment & Career Details */}
      <EmploymentDetailsSection
        profile={profile}
        statusMeta={statusMeta}
        canManage={true}
        editLabel="Edit Details"
        onEdit={openEditDialog}
        onClear={() => setRemoveEmpModalOpen(true)}
        emptyReasonHint="You are marked as Unemployed with no stated reason. Click Update Employment to add context such as a break or active job search."
      />

      {/* Tracking & Email Preferences */}
      <Section
        title="Outcome Tracking & Follow-Up Preferences"
        icon={<ShieldCheck size={15} />}
        rightElement={
          <Link to="/me">
            <Button variant="minimal" size="sm" endIcon={<ArrowRight size={13} />}>
              Go to My Profile
            </Button>
          </Link>
        }
      >
        <SectionCard className="space-y-4">
          <Switch
            label="Tracking Consent"
            description="Permits tracking employment outcomes beyond graduation."
            checked={Boolean(profile.consentGiven)}
            disabled={consentMutation.isPending}
            onCheckedChange={(checked) => consentMutation.mutate(checked)}
          />

          <Divider />

          <Switch
            label="Quarterly Follow-Up Reminders"
            description="Receive quarterly reminders to refresh your employment status."
            checked={Boolean(profile.allowEmails)}
            disabled={Boolean(profile.adminStoppedEmail) || emailPrefMutation.isPending}
            onCheckedChange={(checked) => emailPrefMutation.mutate(checked)}
          />

          {profile.adminStoppedEmail && (
            <Callout variant="warning" title="Admin Email Stop Active">
              An administrator has paused outbound follow-up emails for your account.
            </Callout>
          )}
        </SectionCard>
      </Section>

      {/* Update Employment Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent maxWidth="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Employment Details</DialogTitle>
            <DialogDescription>
              Keep your current role, employer, salary progression, or job-search status up to date.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSaveEmployment)} className="space-y-3.5">
            <EmploymentFormFields
              status={editStatus}
              onStatusChange={(val) => {
                setEditStatus(val);
                setValue("employmentStatus", val);
              }}
              register={register}
              onSelectPresetReason={(val) => setValue("unemployedReason", val)}
            />

            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
              <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
                Save Employment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Clear Employment Info AlertDialog */}
      <ClearEmploymentAlertDialog
        open={removeEmpModalOpen}
        onOpenChange={setRemoveEmpModalOpen}
        forbidEmails={forbidEmailsOnRemove}
        onForbidEmailsChange={setForbidEmailsOnRemove}
        isPending={removeEmpMutation.isPending}
        onConfirm={() => removeEmpMutation.mutate(forbidEmailsOnRemove)}
      />
    </div>
  );
}
