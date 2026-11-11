import { ButtonGroup, Intent } from "@blueprintjs/core";
import { Pencil, Trash2 } from "lucide-react";
import { Section, SectionCard } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Callout } from "../ui/Callout";
import { Field, Input } from "../ui/Field";
import { Select } from "../ui/Select";
import { Switch } from "../ui/Switch";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/AlertDialog";
import { EMPLOYMENT_STATUS_OPTIONS, isEmployedStatus } from "../../utils/domain";

const UNEMPLOYED_REASON_PRESETS = [
  { label: "Break / Study", value: "Taking a career break / studying" },
  { label: "Actively Looking", value: "Actively looking for full-time opportunities" },
];

export function EmploymentDetailsSection({
  profile,
  statusMeta,
  canManage = false,
  onEdit,
  onClear,
  editLabel = "Edit",
  emptyReasonHint = "",
}) {
  const isUnemployed = !isEmployedStatus(profile?.employmentStatus);

  return (
    <Section
      title="Employment & Career Details"
      rightElement={
        canManage ? (
          <ButtonGroup>
            <Button variant="outline" size="sm" icon={<Pencil size={13} />} onClick={onEdit}>
              {editLabel}
            </Button>
            <Button
              variant="outline"
              size="sm"
              intent={Intent.DANGER}
              icon={<Trash2 size={13} />}
              onClick={onClear}
            >
              Clear Employment Info
            </Button>
          </ButtonGroup>
        ) : undefined
      }
    >
      <SectionCard className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        <div>
          <p className="text-xs bp6-text-muted">Employment Status</p>
          <div className="mt-1">
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          </div>
        </div>
        <div>
          <p className="text-xs bp6-text-muted">Current Role</p>
          <p className="text-sm font-semibold mt-1">{profile?.currentRole || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs bp6-text-muted">Company</p>
          <p className="text-sm font-semibold mt-1">{profile?.companyName || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs bp6-text-muted">Current Salary</p>
          <p className="text-sm font-semibold mt-1 tabular-nums">
            {profile?.currentSalary
              ? `₹${profile.currentSalary.toLocaleString("en-IN")}`
              : "N/A"}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs bp6-text-muted">Salary Progression</p>
          <p className="text-sm font-medium mt-1">
            {profile?.salaryProgression || "Not recorded"}
          </p>
        </div>
        {(profile?.unemployedReason || (isUnemployed && emptyReasonHint)) && (
          <div className="sm:col-span-3">
            <Callout variant="warning" title="Stated Reason / Context">
              {profile?.unemployedReason || emptyReasonHint}
            </Callout>
          </div>
        )}
      </SectionCard>
    </Section>
  );
}

export function EmploymentFormFields({
  status,
  onStatusChange,
  register,
  onSelectPresetReason,
}) {
  return (
    <>
      <Field label="Employment Status" required>
        <Select
          value={status}
          onValueChange={onStatusChange}
          options={EMPLOYMENT_STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
      </Field>

      {isEmployedStatus(status) ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Company Name" id="emp-company">
            <Input id="emp-company" {...register("companyName")} placeholder="e.g. Acme Tech" />
          </Field>
          <Field label="Current Role" id="emp-role">
            <Input
              id="emp-role"
              {...register("currentRole")}
              placeholder="e.g. Backend Engineer"
            />
          </Field>
          <Field label="Current Salary (INR)" id="emp-salary">
            <Input id="emp-salary" type="number" {...register("currentSalary")} placeholder="850000" />
          </Field>
        </div>
      ) : (
        <div className="space-y-2">
          <Field label="Unemployed Reason" id="emp-reason">
            <Input
              id="emp-reason"
              {...register("unemployedReason")}
              placeholder="e.g. Career break / studying, or actively looking..."
            />
          </Field>
          {onSelectPresetReason && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] bp6-text-muted">Quick fill:</span>
              {UNEMPLOYED_REASON_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectPresetReason(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      <Field label="Salary Progression" id="emp-prog">
        <Input
          id="emp-prog"
          {...register("salaryProgression")}
          placeholder="e.g. 3.5LPA -> 6.5LPA"
        />
      </Field>
    </>
  );
}

export function ClearEmploymentAlertDialog({
  open,
  onOpenChange,
  forbidEmails,
  onForbidEmailsChange,
  isPending,
  onConfirm,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
            checked={forbidEmails}
            onCheckedChange={onForbidEmailsChange}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
          <Button variant="danger" size="sm" loading={isPending} onClick={onConfirm}>
            Confirm Clear
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
