import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { traineeApi, adminApi } from "../api/endpoints";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ui/useToast";
import { UserCheck, Layers, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Callout } from "../components/ui/Callout";
import { Field, Input, Textarea } from "../components/ui/Field";
import { Select } from "../components/ui/Select";
import { H2, Intent, SegmentedControl } from "@blueprintjs/core";
import {
  EMPLOYMENT_STATUS_OPTIONS,
  isEmployedStatus,
  toApiEmploymentStatus,
} from "../utils/domain";

const traineeSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(8, "Phone number must be at least 8 digits").optional().or(z.literal("")),
  employmentStatus: z.enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "SELF_EMPLOYED", "UNEMPLOYED"]),
  companyName: z.string().optional(),
  currentRole: z.string().optional(),
  unemployedReason: z.string().optional(),
});

const providerSchema = z.object({
  name: z.string().min(2, "Provider name must be at least 2 characters"),
  contactEmail: z.string().email("Invalid contact email"),
  website: z.string().url("Must be a valid URL starting with http:// or https://").optional().or(z.literal("")),
  description: z.string().optional(),
});

export default function Register() {
  const navigate = useNavigate();
  const { switchPersona } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("trainee");
  const [traineeStatus, setTraineeStatus] = useState("UNEMPLOYED");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register: registerTrainee,
    handleSubmit: handleTraineeSubmit,
    formState: { errors: traineeErrors },
    setValue: setTraineeValue,
  } = useForm({
    resolver: zodResolver(traineeSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      employmentStatus: "UNEMPLOYED",
      companyName: "",
      currentRole: "",
      unemployedReason: "",
    },
  });

  const {
    register: registerProvider,
    handleSubmit: handleProviderSubmit,
    formState: { errors: providerErrors },
  } = useForm({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      name: "",
      contactEmail: "",
      website: "",
      description: "",
    },
  });

  const onTraineeRegister = async (data) => {
    try {
      setSubmitting(true);
      setServerError(null);
      const created = await traineeApi.create({
        ...data,
        employmentStatus: toApiEmploymentStatus(data.employmentStatus),
        consentGiven: true,
        allowEmails: true,
      });
      addToast({
        title: "Registration Successful",
        description: `Welcome ${created.fullName}. Your trainee profile has been registered.`,
      });
      switchPersona("TRAINEE", {
        id: created.id,
        name: created.fullName,
        email: created.email,
        details: created,
      });
      navigate("/dashboard");
    } catch (err) {
      setServerError(err.message || "Failed to create trainee account.");
    } finally {
      setSubmitting(false);
    }
  };

  const onProviderRegister = async (data) => {
    try {
      setSubmitting(true);
      setServerError(null);
      const created = await adminApi.addCourseProvider(data);
      addToast({
        title: "Provider Registered",
        description: `${created.name} submitted. Provider accounts may require admin review.`,
      });
      switchPersona("COURSE_PROVIDER", {
        id: created.id,
        name: created.name,
        email: created.contactEmail,
        details: created,
      });
      navigate("/dashboard");
    } catch (err) {
      setServerError(err.message || "Failed to register course provider.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8">
      <Card>
        <div className="text-center mb-6">
          <H2 className="!mb-1">Create your SkillTrack Account</H2>
          <p className="bp6-text-muted text-xs">
            Register as a Trainee to manage outcomes, or as a Course Provider to publish courses.
          </p>
        </div>

          <Callout variant="info" title="Administrator Notice" className="mb-5">
            Admin accounts have no public registration and are created directly in the database by
            the database owner.
          </Callout>

          {serverError && (
            <Callout variant="danger" className="mb-5">
              {serverError}
            </Callout>
          )}

          <SegmentedControl
            fill
            intent={Intent.PRIMARY}
            value={activeTab}
            onValueChange={setActiveTab}
            options={[
              { label: "Trainee", value: "trainee", icon: <UserCheck size={14} /> },
              { label: "Course Provider", value: "provider", icon: <Layers size={14} /> },
            ]}
            className="mb-5"
          />

          {activeTab === "trainee" ? (
            <form onSubmit={handleTraineeSubmit(onTraineeRegister)} className="space-y-4">
              <Field label="Full Name" required error={traineeErrors.fullName?.message} id="reg-name">
                <Input
                  id="reg-name"
                  {...registerTrainee("fullName")}
                  placeholder="e.g. Aarav Sharma"
                  hasError={Boolean(traineeErrors.fullName)}
                />
              </Field>

              <Field label="Email Address" required error={traineeErrors.email?.message} id="reg-email">
                <Input
                  id="reg-email"
                  type="email"
                  {...registerTrainee("email")}
                  placeholder="e.g. aarav@example.com"
                  hasError={Boolean(traineeErrors.email)}
                />
              </Field>

              <Field label="Phone Number" error={traineeErrors.phoneNumber?.message} id="reg-phone">
                <Input
                  id="reg-phone"
                  {...registerTrainee("phoneNumber")}
                  placeholder="e.g. +91 98765 43210"
                />
              </Field>

              <Field label="Employment Status" required>
                <Select
                  value={traineeStatus}
                  onValueChange={(val) => {
                    setTraineeStatus(val);
                    setTraineeValue("employmentStatus", val);
                  }}
                  options={EMPLOYMENT_STATUS_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                />
              </Field>

              {isEmployedStatus(traineeStatus) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Company Name" id="reg-company">
                    <Input id="reg-company" {...registerTrainee("companyName")} placeholder="e.g. TCS" />
                  </Field>
                  <Field label="Current Role" id="reg-role">
                    <Input id="reg-role" {...registerTrainee("currentRole")} placeholder="e.g. Backend Engineer" />
                  </Field>
                </div>
              ) : (
                <Field label="Unemployed Reason" id="reg-reason">
                  <Input
                    id="reg-reason"
                    {...registerTrainee("unemployedReason")}
                    placeholder="e.g. Actively looking or Career break"
                  />
                </Field>
              )}

              <Button
                type="submit"
                variant="primary"
                fill
                loading={submitting}
                endIcon={<ArrowRight size={14} />}
              >
                Complete Trainee Registration
              </Button>
            </form>
          ) : (
            <form onSubmit={handleProviderSubmit(onProviderRegister)} className="space-y-4">
              <Field label="Organization Name" required error={providerErrors.name?.message} id="reg-org">
                <Input
                  id="reg-org"
                  {...registerProvider("name")}
                  placeholder="e.g. Apex Skill Academy"
                  hasError={Boolean(providerErrors.name)}
                />
              </Field>

              <Field
                label="Official Contact Email"
                required
                error={providerErrors.contactEmail?.message}
                id="reg-org-email"
              >
                <Input
                  id="reg-org-email"
                  type="email"
                  {...registerProvider("contactEmail")}
                  placeholder="e.g. contact@apexacademy.edu"
                  hasError={Boolean(providerErrors.contactEmail)}
                />
              </Field>

              <Field label="Website URL" error={providerErrors.website?.message} id="reg-website">
                <Input
                  id="reg-website"
                  {...registerProvider("website")}
                  placeholder="https://apexacademy.example.com"
                  hasError={Boolean(providerErrors.website)}
                />
              </Field>

              <Field label="Organization Focus" id="reg-desc">
                <Textarea
                  id="reg-desc"
                  {...registerProvider("description")}
                  rows={3}
                  placeholder="Describe curriculum areas and certifications..."
                />
              </Field>

              <p className="bp6-text-muted text-xs leading-normal">
                Course provider accounts may require administrator review before onboarding courses.
              </p>

              <Button
                type="submit"
                variant="primary"
                fill
                loading={submitting}
                endIcon={<ArrowRight size={14} />}
              >
                Register Course Provider
              </Button>
            </form>
          )}

          <p className="bp6-text-muted text-center text-xs mt-5">
            Already registered?{" "}
            <Link to="/login" className="font-medium underline">
              Sign in to your account
            </Link>
          </p>
        </Card>
    </div>
  );
}
