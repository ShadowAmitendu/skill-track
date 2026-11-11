import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { traineeApi, adminApi } from "../api/endpoints";
import { useAuth } from "../context/useAuth";
import { useToast } from "../components/ui/useToast";
import { UserCheck, Layers, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Field, Input, Textarea } from "../components/ui/Field";
import { Tabs, TabsList, TabsTab, TabsPanel } from "../components/ui/Tabs";
import { Select } from "../components/ui/Select";

const traineeSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(8, "Phone number must be at least 8 digits").optional().or(z.literal("")),
  employmentStatus: z.enum(["EMPLOYED", "UNEMPLOYED", "SEEKING"]),
  companyName: z.string().optional(),
  currentRole: z.string().optional(),
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
  const [traineeStatus, setTraineeStatus] = useState("SEEKING");
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
      employmentStatus: "SEEKING",
      companyName: "",
      currentRole: "",
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
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Create your SkillTrack Account</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Register as a Trainee to manage outcomes, or as a Course Provider to publish courses.
            </p>
          </div>

          <div className="mb-5 p-3 bg-gray-50 border border-gray-200 rounded-md flex items-start gap-2.5 text-xs text-gray-600 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-400">
            <ShieldAlert size={15} className="text-gray-700 dark:text-gray-300 shrink-0 mt-0.5" />
            <div>
              <strong className="font-medium text-gray-900 dark:text-gray-100">Administrator Notice:</strong> Admin
              accounts do not have public registration and are configured directly in the database.
            </div>
          </div>

          {serverError && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 dark:bg-red-950/60 dark:border-red-900 dark:text-red-300">
              {serverError}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2 mb-5">
              <TabsTab value="trainee" className="text-xs">
                <UserCheck size={14} className="mr-1.5" /> Trainee
              </TabsTab>
              <TabsTab value="provider" className="text-xs">
                <Layers size={14} className="mr-1.5" /> Course Provider
              </TabsTab>
            </TabsList>

            <TabsPanel value="trainee">
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
                    options={[
                      { value: "SEEKING", label: "Seeking Employment" },
                      { value: "EMPLOYED", label: "Employed" },
                      { value: "UNEMPLOYED", label: "Unemployed" },
                    ]}
                  />
                </Field>

                {traineeStatus === "EMPLOYED" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Company Name" id="reg-company">
                      <Input id="reg-company" {...registerTrainee("companyName")} placeholder="e.g. TCS" />
                    </Field>
                    <Field label="Current Role" id="reg-role">
                      <Input id="reg-role" {...registerTrainee("currentRole")} placeholder="e.g. Backend Engineer" />
                    </Field>
                  </div>
                )}

                <Button type="submit" variant="primary" loading={submitting} className="w-full">
                  <span>Complete Trainee Registration</span>
                  <ArrowRight size={15} />
                </Button>
              </form>
            </TabsPanel>

            <TabsPanel value="provider">
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

                <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
                  Course provider accounts may require administrator review before onboarding courses.
                </p>

                <Button type="submit" variant="primary" loading={submitting} className="w-full">
                  <span>Register Course Provider</span>
                  <ArrowRight size={15} />
                </Button>
              </form>
            </TabsPanel>
          </Tabs>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-gray-900 underline hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300">
              Sign in to your account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
