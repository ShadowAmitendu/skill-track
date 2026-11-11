import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Callout,
  Card,
  Dialog,
  DialogBody,
  DialogFooter,
  FileInput,
  FormGroup,
  H2,
  H4,
  HTMLSelect,
  HTMLTable,
  InputGroup,
  Intent,
  NonIdealState,
  ProgressBar,
  Spinner,
  Switch,
  Tag,
  TextArea,
} from "@blueprintjs/core";
import { apiRequest } from "../lib/api";
import { showError, showSuccess } from "../lib/toaster";
import { useAuth } from "../context/AuthContext";
import type { EmploymentStatus, TraineeDTO } from "../types/api";

export default function MyProfilePage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<TraineeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Personal fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [roleCategory, setRoleCategory] = useState<"IT" | "Non-IT">("IT");
  const [bio, setBio] = useState("");

  // Project form
  const [projTitle, setProjTitle] = useState("");
  const [projRepo, setProjRepo] = useState("");
  const [projDesc, setProjDesc] = useState("");

  // Certification form
  const [certTitle, setCertTitle] = useState("");
  const [certIssuer, setCertIssuer] = useState("");

  // Resume upload
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Drop course mandatory dialog
  const [dropCourse, setDropCourse] = useState<{ courseId: number; title: string } | null>(null);
  const [dropReason, setDropReason] = useState("");

  // Employment fields & dialog
  const [empStatus, setEmpStatus] = useState<EmploymentStatus>("unemployed");
  const [empRole, setEmpRole] = useState("");
  const [empCompany, setEmpCompany] = useState("");
  const [empSalary, setEmpSalary] = useState("");
  const [empReason, setEmpReason] = useState<"break" | "actively_looking">("actively_looking");
  const [confirmRemoveEmp, setConfirmRemoveEmp] = useState(false);

  // Consent, Follow-Up & Account deletion
  const [followUpNote, setFollowUpNote] = useState("");
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ trainee: TraineeDTO }>("/api/trainees/me");
      setProfile(res.trainee);
      setFullName(res.trainee.fullName);
      setPhone(res.trainee.phone || "");
      setLocation(res.trainee.location || "");
      setRoleCategory((res.trainee.roleCategory as "IT" | "Non-IT") || "IT");
      setBio(res.trainee.bio || "");

      if (res.trainee.employment) {
        setEmpStatus(res.trainee.employment.status);
        setEmpRole(res.trainee.employment.role || "");
        setEmpCompany(res.trainee.employment.company || "");
        setEmpSalary(
          res.trainee.employment.salary !== null && res.trainee.employment.salary !== undefined
            ? String(res.trainee.employment.salary)
            : ""
        );
        setEmpReason((res.trainee.employment.reason as "break" | "actively_looking") || "actively_looking");
      } else {
        setEmpStatus("unemployed");
        setEmpRole("");
        setEmpCompany("");
        setEmpSalary("");
        setEmpReason("actively_looking");
      }
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("/api/trainees/me", {
        method: "PUT",
        body: JSON.stringify({ fullName, phone, location, roleCategory, bio }),
      });
      await refreshUser();
      void showSuccess("Profile updated");
      await load();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadResume = async () => {
    if (!resumeFile) return;
    setUploadingResume(true);
    try {
      const fd = new FormData();
      fd.append("resume", resumeFile);
      const res = await apiRequest<{ resume: { extractedTokens: string[] } }>(
        "/api/trainees/me/resume",
        { method: "POST", body: fd }
      );
      void showSuccess(
        `Resume parsed! Detected tokens: ${
          res.resume.extractedTokens.length > 0
            ? res.resume.extractedTokens.join(", ")
            : "None matched catalog"
        }`
      );
      setResumeFile(null);
      await load();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Resume upload failed");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleAddProject = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("/api/trainees/me/projects", {
        method: "POST",
        body: JSON.stringify({ title: projTitle, repoUrl: projRepo, description: projDesc }),
      });
      setProjTitle("");
      setProjRepo("");
      setProjDesc("");
      void showSuccess("Project added");
      await load();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to add project");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCert = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("/api/trainees/me/certifications", {
        method: "POST",
        body: JSON.stringify({ title: certTitle, issuer: certIssuer }),
      });
      setCertTitle("");
      setCertIssuer("");
      void showSuccess("Certification added");
      await load();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to add certification");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteCourse = async (courseId: number) => {
    setSaving(true);
    try {
      const res = await apiRequest<{ grantedVerifiedSkills: string[] }>(
        `/api/enrollments/${courseId}/complete`,
        { method: "POST" }
      );
      void showSuccess(`Completed! Verified skills granted: ${res.grantedVerifiedSkills.join(", ")}`);
      await load();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDropCourse = async () => {
    if (!dropCourse || !dropReason.trim()) return;
    setSaving(true);
    try {
      await apiRequest(`/api/enrollments/${dropCourse.courseId}/drop`, {
        method: "POST",
        body: JSON.stringify({ reason: dropReason.trim() }),
      });
      void showSuccess(`Dropped ${dropCourse.title}`);
      setDropCourse(null);
      setDropReason("");
      await load();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Drop failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmployment = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isUnemployed = empStatus === "unemployed";
      const parsedSalary = empSalary.trim() ? Number(empSalary) : null;
      await apiRequest("/api/employment/me", {
        method: "PUT",
        body: JSON.stringify({
          status: empStatus,
          role: isUnemployed ? "" : empRole.trim(),
          company: isUnemployed ? "" : empCompany.trim(),
          salary: isUnemployed ? null : Number.isFinite(parsedSalary) ? parsedSalary : null,
          reason: isUnemployed ? empReason : null,
        }),
      });
      void showSuccess("Employment details saved");
      await load();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to save employment");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveEmployment = async () => {
    setSaving(true);
    try {
      await apiRequest("/api/employment/me", { method: "DELETE" });
      void showSuccess("Employment information removed from your profile and platform statistics");
      setConfirmRemoveEmp(false);
      await load();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to remove employment");
    } finally {
      setSaving(false);
    }
  };

  const handleConsentPatch = async (patch: { status?: boolean; emailsStopped?: boolean }) => {
    setSaving(true);
    try {
      await apiRequest("/api/consent/me", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      void showSuccess("Privacy & reminder preferences updated");
      await load();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleFollowUpResponse = async (e: FormEvent) => {
    e.preventDefault();
    if (followUpNote.trim().length < 2) return;
    setSaving(true);
    try {
      await apiRequest("/api/consent/me/followup-response", {
        method: "POST",
        body: JSON.stringify({ note: followUpNote.trim() }),
      });
      setFollowUpNote("");
      void showSuccess("Quarterly follow-up response recorded");
      await load();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to submit response");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await apiRequest("/api/trainees/me", { method: "DELETE" });
      await refreshUser();
      void showSuccess("Your account and resumes have been deleted");
      navigate("/login");
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to delete account");
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <Card>
        <div className="st-row" style={{ justifyContent: "center", padding: 36 }}>
          <Spinner size={28} />
        </div>
      </Card>
    );
  }

  const verifiedSkills = profile.skills.filter((s) => s.source === "verified");
  const detectedSkills = profile.skills.filter((s) => s.source === "detected");
  const activeOrCompleted = profile.enrollments.filter(
    (en) => en.status === "enrolled" || en.status === "completed"
  );
  const completedCount = activeOrCompleted.filter((en) => en.status === "completed").length;
  const completionRatio =
    activeOrCompleted.length > 0 ? completedCount / activeOrCompleted.length : 0;

  return (
    <div className="st-stack">
      <Card className="st-stack">
        <div className="st-between">
          <div>
            <H2 style={{ margin: 0 }}>{profile.fullName} — My Profile</H2>
            <p className="bp5-text-muted" style={{ margin: "4px 0 0 0", fontSize: 13 }}>
              Manage personal info, resume ATS extraction, verified & detected skills, projects, employment, and consent.
            </p>
          </div>
          <div className="st-row">
            <Tag intent={profile.roleCategory === "IT" ? Intent.PRIMARY : Intent.NONE}>
              Track: {profile.roleCategory}
            </Tag>
            <Tag intent={profile.consentGiven ? Intent.SUCCESS : Intent.WARNING}>
              Consent: {profile.consentGiven ? "Active" : "Revoked"}
            </Tag>
          </div>
        </div>
        <div>
          <div className="st-between" style={{ fontSize: 12, marginBottom: 4 }}>
            <span className="bp5-text-muted">Course Completion Progress</span>
            <strong>
              {completedCount} / {activeOrCompleted.length} completed ({Math.round(completionRatio * 100)}%)
            </strong>
          </div>
          <ProgressBar
            intent={completionRatio === 1 && activeOrCompleted.length > 0 ? Intent.SUCCESS : Intent.PRIMARY}
            value={completionRatio}
            stripes={false}
          />
        </div>
      </Card>

      <div className="st-grid-2">
        <Card>
          <H4>Personal Profile</H4>
          <form onSubmit={handleSaveProfile} className="st-stack">
            <FormGroup label="Full Name" labelInfo="(required)">
              <InputGroup value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </FormGroup>
            <div className="st-grid-2">
              <FormGroup label="Phone">
                <InputGroup value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FormGroup>
              <FormGroup label="Location">
                <InputGroup value={location} onChange={(e) => setLocation(e.target.value)} />
              </FormGroup>
            </div>
            <FormGroup label="Role Category">
              <HTMLSelect
                fill
                value={roleCategory}
                onChange={(e) => setRoleCategory(e.target.value as "IT" | "Non-IT")}
                options={["IT", "Non-IT"]}
              />
            </FormGroup>
            <FormGroup label="Bio / Career Summary">
              <TextArea fill rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
            </FormGroup>
            <Button type="submit" intent={Intent.PRIMARY} loading={saving} text="Save Profile" />
          </form>
        </Card>

        <Card className="st-stack">
          <H4 style={{ margin: 0 }}>Skills & ATS Resume Parser</H4>
          <div>
            <strong style={{ fontSize: 12 }}>Verified Skills (earned from completed courses)</strong>
            <div className="st-row" style={{ marginTop: 6 }}>
              {verifiedSkills.length > 0 ? (
                verifiedSkills.map((s) => (
                  <Tag key={s.id} intent={Intent.SUCCESS}>
                    {s.name}
                  </Tag>
                ))
              ) : (
                <span className="bp5-text-muted" style={{ fontSize: 12 }}>
                  Complete a course to earn verified skills.
                </span>
              )}
            </div>
          </div>

          <div>
            <strong style={{ fontSize: 12 }}>Detected Skills (extracted by Resume ATS)</strong>
            <div className="st-row" style={{ marginTop: 6 }}>
              {detectedSkills.length > 0 ? (
                detectedSkills.map((s) => (
                  <Tag key={s.id} intent={Intent.PRIMARY} minimal>
                    {s.name} (ATS)
                  </Tag>
                ))
              ) : (
                <span className="bp5-text-muted" style={{ fontSize: 12 }}>
                  Upload a resume (.pdf, .txt, .md) below to detect skills.
                </span>
              )}
            </div>
          </div>

          <FormGroup label="Upload Resume (.pdf, .txt, .md)">
            <div className="st-row">
              <FileInput
                text={resumeFile ? resumeFile.name : "Choose resume file..."}
                onInputChange={(e) => {
                  const file = e.currentTarget.files?.[0] || null;
                  setResumeFile(file);
                }}
              />
              <Button
                intent={Intent.PRIMARY}
                disabled={!resumeFile}
                loading={uploadingResume}
                text="Upload & Extract"
                onClick={() => void handleUploadResume()}
              />
            </div>
          </FormGroup>

          {profile.resumes && profile.resumes.length > 0 && (
            <HTMLTable compact striped style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Tokens</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {profile.resumes.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fileName}</td>
                    <td>{r.extractedTokens.join(", ") || "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      <a href={`/api/trainees/resumes/${r.id}/download`}>Download</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </HTMLTable>
          )}
        </Card>

        <Card className="st-stack">
          <H4 style={{ margin: 0 }}>Projects</H4>
          {profile.projects.length === 0 ? (
            <Callout intent={Intent.NONE}>Add a project with your Git repository URL.</Callout>
          ) : (
            <HTMLTable compact striped style={{ width: "100%" }}>
              <tbody>
                {profile.projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.title}</strong> —{" "}
                      <a href={p.repoUrl} target="_blank" rel="noreferrer">
                        {p.repoUrl}
                      </a>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Button
                        small
                        minimal
                        intent={Intent.DANGER}
                        icon="trash"
                        onClick={async () => {
                          await apiRequest(`/api/trainees/me/projects/${p.id}`, { method: "DELETE" });
                          await load();
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </HTMLTable>
          )}
          <form onSubmit={handleAddProject} className="st-stack">
            <div className="st-grid-2">
              <InputGroup
                placeholder="Project Title"
                value={projTitle}
                onChange={(e) => setProjTitle(e.target.value)}
                required
              />
              <InputGroup
                type="url"
                placeholder="https://github.com/..."
                value={projRepo}
                onChange={(e) => setProjRepo(e.target.value)}
                required
              />
            </div>
            <InputGroup
              placeholder="Short description (optional)"
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
            />
            <Button type="submit" small icon="plus" text="Add Project" loading={saving} />
          </form>
        </Card>

        <Card className="st-stack">
          <H4 style={{ margin: 0 }}>Certifications</H4>
          {profile.certifications.length === 0 ? (
            <Callout intent={Intent.NONE}>No certifications added yet.</Callout>
          ) : (
            <HTMLTable compact striped style={{ width: "100%" }}>
              <tbody>
                {profile.certifications.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.title}</strong> — {c.issuer}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Button
                        small
                        minimal
                        intent={Intent.DANGER}
                        icon="trash"
                        onClick={async () => {
                          await apiRequest(`/api/trainees/me/certifications/${c.id}`, { method: "DELETE" });
                          await load();
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </HTMLTable>
          )}
          <form onSubmit={handleAddCert} className="st-row">
            <InputGroup
              placeholder="Certification Title"
              value={certTitle}
              onChange={(e) => setCertTitle(e.target.value)}
              required
            />
            <InputGroup
              placeholder="Issuer"
              value={certIssuer}
              onChange={(e) => setCertIssuer(e.target.value)}
              required
            />
            <Button type="submit" small icon="plus" text="Add" loading={saving} />
          </form>
        </Card>
      </div>

      <Card>
        <H4>My Enrollments</H4>
        {profile.enrollments.length === 0 ? (
          <NonIdealState
            icon="book"
            title="No enrollments yet"
            description="Browse the Courses page to enroll and unlock verified skills upon completion."
          />
        ) : (
          <HTMLTable striped style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Course</th>
                <th>Provider</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profile.enrollments.map((en) => (
                <tr key={en.id}>
                  <td>{en.courseTitle}</td>
                  <td>{en.providerName}</td>
                  <td>
                    <Tag
                      minimal
                      intent={
                        en.status === "completed"
                          ? Intent.SUCCESS
                          : en.status === "enrolled"
                            ? Intent.PRIMARY
                            : Intent.DANGER
                      }
                    >
                      {en.status}
                    </Tag>
                    {(en.dropReason || en.kickReason) && (
                      <div className="bp5-text-muted" style={{ fontSize: 11 }}>
                        Reason: {en.dropReason || en.kickReason}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {en.status === "enrolled" && (
                      <div className="st-row" style={{ justifyContent: "flex-end", gap: 6 }}>
                        <Button
                          small
                          intent={Intent.SUCCESS}
                          text="Complete"
                          loading={saving}
                          onClick={() => void handleCompleteCourse(en.courseId)}
                        />
                        <Button
                          small
                          intent={Intent.DANGER}
                          minimal
                          text="Drop"
                          onClick={() => setDropCourse({ courseId: en.courseId, title: en.courseTitle })}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        )}
      </Card>

      <div className="st-grid-2">
        <Card className="st-stack">
          <div className="st-between">
            <H4 style={{ margin: 0 }}>Employment & Career</H4>
            {profile.employment ? (
              <Tag intent={profile.employment.status === "unemployed" ? Intent.WARNING : Intent.SUCCESS}>
                {profile.employment.status.replace("_", " ")}
              </Tag>
            ) : (
              <Tag minimal>No employment record</Tag>
            )}
          </div>

          <form onSubmit={handleSaveEmployment} className="st-stack">
            <FormGroup label="Employment Status">
              <HTMLSelect
                fill
                value={empStatus}
                onChange={(e) => setEmpStatus(e.target.value as EmploymentStatus)}
                options={[
                  { value: "full_time", label: "Full Time" },
                  { value: "part_time", label: "Part Time" },
                  { value: "internship", label: "Internship" },
                  { value: "self_employed", label: "Self-Employed" },
                  { value: "unemployed", label: "Unemployed" },
                ]}
              />
            </FormGroup>

            {empStatus === "unemployed" ? (
              <FormGroup label="Unemployed Reason">
                <HTMLSelect
                  fill
                  value={empReason}
                  onChange={(e) => setEmpReason(e.target.value as "break" | "actively_looking")}
                  options={[
                    { value: "actively_looking", label: "Actively Looking" },
                    { value: "break", label: "Career Break / Study" },
                  ]}
                />
              </FormGroup>
            ) : (
              <>
                <div className="st-grid-2">
                  <FormGroup label="Role / Title">
                    <InputGroup
                      value={empRole}
                      onChange={(e) => setEmpRole(e.target.value)}
                      placeholder="e.g. DevOps Engineer"
                    />
                  </FormGroup>
                  <FormGroup label="Company">
                    <InputGroup
                      value={empCompany}
                      onChange={(e) => setEmpCompany(e.target.value)}
                      placeholder="e.g. CloudNova Systems"
                    />
                  </FormGroup>
                </div>
                <FormGroup label="Annual Salary" helperText="Visible only to you and administrators">
                  <InputGroup
                    type="number"
                    min={0}
                    value={empSalary}
                    onChange={(e) => setEmpSalary(e.target.value)}
                    placeholder="e.g. 920000"
                  />
                </FormGroup>
              </>
            )}

            <div className="st-row" style={{ flexWrap: "wrap", gap: 8 }}>
              <Button type="submit" intent={Intent.PRIMARY} loading={saving} text="Save Employment" />
              <Button
                intent={Intent.WARNING}
                minimal
                disabled={saving || Boolean(profile.emailsStopped)}
                text={profile.emailsStopped ? "Emails Stopped" : "Keep Info, Stop Emails Only"}
                onClick={() => void handleConsentPatch({ emailsStopped: true })}
              />
              {profile.employment && (
                <Button
                  intent={Intent.DANGER}
                  minimal
                  icon="trash"
                  text="Remove Employment Info"
                  onClick={() => setConfirmRemoveEmp(true)}
                />
              )}
            </div>
          </form>

          {profile.salaryHistory && profile.salaryHistory.length > 0 && (
            <div>
              <strong style={{ fontSize: 12 }}>Salary Progression</strong>
              <HTMLTable compact striped style={{ width: "100%", marginTop: 6 }}>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Company</th>
                    <th>Salary</th>
                    <th>Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.salaryHistory.map((sh) => (
                    <tr key={sh.id}>
                      <td>{sh.role}</td>
                      <td>{sh.company}</td>
                      <td>₹{sh.amount.toLocaleString("en-IN")}</td>
                      <td>{new Date(sh.recordedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </HTMLTable>
            </div>
          )}
        </Card>

        <Card className="st-stack">
          <div className="st-between">
            <H4 style={{ margin: 0 }}>Consent & Quarterly Follow-Ups</H4>
            <Tag minimal>
              Last update: {new Date(profile.lastProfileUpdate).toLocaleDateString()}
            </Tag>
          </div>

          <Switch
            checked={profile.consentGiven}
            label="Consent to profile tracking & Course Provider visibility"
            onChange={(e) => void handleConsentPatch({ status: e.currentTarget.checked })}
          />
          <Switch
            checked={Boolean(profile.emailsStopped)}
            label="Stop quarterly follow-up reminder emails"
            onChange={(e) => void handleConsentPatch({ emailsStopped: e.currentTarget.checked })}
          />

          {!profile.consentGiven && (
            <Callout intent={Intent.WARNING}>
              Consent is off. Course Providers cannot view your profile, and quarterly reminder emails are paused.
            </Callout>
          )}

          <form onSubmit={handleFollowUpResponse} className="st-stack">
            <FormGroup label="Submit Quarterly Status Check-In">
              <div className="st-row">
                <InputGroup
                  fill
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Share an update (e.g. role change, certification, or current status)..."
                />
                <Button
                  type="submit"
                  intent={Intent.PRIMARY}
                  disabled={followUpNote.trim().length < 2}
                  loading={saving}
                  text="Submit"
                />
              </div>
            </FormGroup>
          </form>

          {!profile.followUps || profile.followUps.length === 0 ? (
            <Callout intent={Intent.NONE}>No quarterly follow-up reminders logged yet.</Callout>
          ) : (
            <HTMLTable compact striped style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Sent</th>
                  <th>Responded</th>
                  <th>Channel</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {profile.followUps.map((f) => (
                  <tr key={f.id}>
                    <td>{new Date(f.sentAt).toLocaleDateString()}</td>
                    <td>
                      {f.respondedAt ? (
                        <Tag intent={Intent.SUCCESS} minimal>
                          {new Date(f.respondedAt).toLocaleDateString()}
                        </Tag>
                      ) : (
                        <Tag intent={Intent.WARNING} minimal>
                          Pending
                        </Tag>
                      )}
                    </td>
                    <td>{f.channel}</td>
                    <td>{f.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </HTMLTable>
          )}

          <div style={{ borderTop: "1px solid rgba(138,155,168,0.2)", paddingTop: 12 }}>
            <Button
              intent={Intent.DANGER}
              minimal
              icon="warning-sign"
              text="Delete My Account & Resumes"
              onClick={() => setConfirmDeleteAccount(true)}
            />
          </div>
        </Card>
      </div>

      <Dialog
        isOpen={Boolean(dropCourse)}
        onClose={() => {
          setDropCourse(null);
          setDropReason("");
        }}
        title="Drop Course"
      >
        <DialogBody className="st-stack">
          <p style={{ margin: 0 }}>Provide a mandatory reason to drop <strong>{dropCourse?.title}</strong>:</p>
          <FormGroup label="Drop Reason" labelInfo="(mandatory)">
            <TextArea
              fill
              rows={3}
              value={dropReason}
              onChange={(e) => setDropReason(e.target.value)}
              placeholder="Explain why you are dropping this course..."
            />
          </FormGroup>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button
                text="Cancel"
                onClick={() => {
                  setDropCourse(null);
                  setDropReason("");
                }}
              />
              <Button
                intent={Intent.DANGER}
                disabled={dropReason.trim().length < 3}
                loading={saving}
                text="Confirm Drop"
                onClick={() => void handleDropCourse()}
              />
            </>
          }
        />
      </Dialog>

      <Dialog
        isOpen={confirmRemoveEmp}
        onClose={() => setConfirmRemoveEmp(false)}
        title="Remove Employment Information"
      >
        <DialogBody>
          Removing your employment record permanently deletes your current employment entry and excludes it from
          platform dashboard statistics. Your profile and courses remain intact.
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button text="Cancel" onClick={() => setConfirmRemoveEmp(false)} />
              <Button
                intent={Intent.DANGER}
                loading={saving}
                text="Remove Employment Info"
                onClick={() => void handleRemoveEmployment()}
              />
            </>
          }
        />
      </Dialog>

      <Dialog
        isOpen={confirmDeleteAccount}
        onClose={() => setConfirmDeleteAccount(false)}
        title="Delete Trainee Account"
      >
        <DialogBody>
          Are you sure you want to permanently delete your trainee profile and uploaded resumes? This cannot be
          undone.
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button text="Cancel" onClick={() => setConfirmDeleteAccount(false)} />
              <Button
                intent={Intent.DANGER}
                loading={saving}
                text="Delete Account"
                onClick={() => void handleDeleteAccount()}
              />
            </>
          }
        />
      </Dialog>
    </div>
  );
}
