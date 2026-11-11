import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Callout,
  Card,
  H2,
  H4,
  HTMLTable,
  Intent,
  NonIdealState,
  Spinner,
  Tag,
} from "@blueprintjs/core";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { showError, showSuccess } from "../lib/toaster";
import type { TraineeDTO } from "../types/api";

export default function TraineeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isCp = user?.role === "cp";

  const [trainee, setTrainee] = useState<TraineeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingEmail, setTogglingEmail] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ trainee: TraineeDTO }>(`/api/trainees/${id}`);
      setTrainee(res.trainee);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleEmails = async (stop: boolean) => {
    if (!trainee) return;
    setTogglingEmail(true);
    try {
      await apiRequest(`/api/admin/trainees/${trainee.id}/emails`, {
        method: "PATCH",
        body: JSON.stringify({ emailsStopped: stop }),
      });
      void showSuccess(stop ? "Follow-up emails stopped for this trainee" : "Follow-up emails re-enabled");
      await load();
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to update email preference");
    } finally {
      setTogglingEmail(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="st-row" style={{ justifyContent: "center", padding: 36 }}>
          <Spinner size={28} />
        </div>
      </Card>
    );
  }

  if (error || !trainee) {
    return (
      <Card>
        <NonIdealState
          icon="error"
          title="Unable to display trainee"
          description={error || "Trainee record not available"}
          action={<Button icon="arrow-left" text="Back to Trainees" onClick={() => navigate("/trainees")} />}
        />
      </Card>
    );
  }

  const verifiedSkills = trainee.skills.filter((s) => s.source === "verified");
  const detectedSkills = trainee.skills.filter((s) => s.source === "detected");

  return (
    <div className="st-stack">
      <div className="st-between">
        <Button minimal icon="arrow-left" text="Back to Trainees" onClick={() => navigate("/trainees")} />
        <Tag minimal intent={Intent.NONE}>
          Read-Only Inspection
        </Tag>
      </div>

      <Card>
        <div className="st-between">
          <div>
            <H2 style={{ margin: 0 }}>{trainee.fullName}</H2>
            <p className="bp5-text-muted" style={{ margin: "4px 0 0 0", fontSize: 13 }}>
              ID #{trainee.id} · {trainee.roleCategory} Track
              {trainee.location ? ` · ${trainee.location}` : ""}
            </p>
          </div>
          <div className="st-row">
            <Tag intent={trainee.consentGiven ? Intent.SUCCESS : Intent.WARNING}>
              {trainee.consentGiven ? "Consent Given" : "Consent Revoked"}
            </Tag>
            {isAdmin && (
              <Button
                small
                intent={trainee.emailsStopped ? Intent.SUCCESS : Intent.WARNING}
                loading={togglingEmail}
                icon={trainee.emailsStopped ? "envelope" : "disable"}
                text={trainee.emailsStopped ? "Resume Emails" : "Stop Emails"}
                onClick={() => void handleToggleEmails(!trainee.emailsStopped)}
              />
            )}
          </div>
        </div>
      </Card>

      {isCp && (
        <Callout intent={Intent.PRIMARY} icon="lock">
          Course Provider view: Contact info, salary amounts, salary history, and follow-up logs are hidden on the server.
        </Callout>
      )}

      <div className="st-grid-2">
        <Card>
          <H4>Personal Details & Consent</H4>
          <p><strong>Email:</strong> {isCp ? "Hidden for Course Providers" : trainee.email || "N/A"}</p>
          <p><strong>Phone:</strong> {isCp ? "Hidden for Course Providers" : trainee.phone || "Not provided"}</p>
          <p><strong>Location:</strong> {trainee.location || "Not provided"}</p>
          <p><strong>Bio:</strong> {trainee.bio || "No summary recorded."}</p>
          <p>
            <strong>Consent:</strong> {trainee.consentGiven ? "Granted" : "Revoked"}
            {trainee.consentUpdatedAt
              ? ` (updated ${new Date(trainee.consentUpdatedAt).toLocaleDateString()})`
              : ""}
          </p>
        </Card>

        <Card>
          <H4>Employment & Salary Progression</H4>
          {trainee.employment ? (
            <div className="st-stack" style={{ gap: 8 }}>
              <div>
                <strong>Status:</strong> <Tag minimal>{trainee.employment.status.replace("_", " ")}</Tag>
              </div>
              <div><strong>Role:</strong> {trainee.employment.role || "N/A"}</div>
              <div><strong>Company:</strong> {trainee.employment.company || "N/A"}</div>
              <div>
                <strong>Current Salary:</strong>{" "}
                {isCp
                  ? "Hidden for Course Providers"
                  : trainee.employment.salary != null
                    ? `₹${trainee.employment.salary.toLocaleString("en-IN")}`
                    : "N/A"}
              </div>
              {trainee.employment.reason && (
                <div><strong>Unemployed Reason:</strong> {trainee.employment.reason}</div>
              )}
            </div>
          ) : (
            <p className="bp5-text-muted">Employment info removed or not recorded.</p>
          )}

          {!isCp && trainee.salaryHistory && trainee.salaryHistory.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <strong>Salary History</strong>
              <HTMLTable compact striped style={{ width: "100%", marginTop: 6 }}>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Company</th>
                    <th>Salary</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {trainee.salaryHistory.map((sh) => (
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

        <Card>
          <H4>Verified Skills & Resume ATS Detected Skills</H4>
          <p className="bp5-text-muted" style={{ fontSize: 12 }}>
            Verified skills (earned automatically on course completion):
          </p>
          <div className="st-row" style={{ marginBottom: 10 }}>
            {verifiedSkills.length > 0 ? (
              verifiedSkills.map((s) => (
                <Tag key={s.id} intent={Intent.SUCCESS}>
                  {s.name}
                </Tag>
              ))
            ) : (
              <span className="bp5-text-muted">None yet</span>
            )}
          </div>

          <p className="bp5-text-muted" style={{ fontSize: 12 }}>
            Detected skills (from ATS resume parser):
          </p>
          <div className="st-row" style={{ marginBottom: 12 }}>
            {detectedSkills.length > 0 ? (
              detectedSkills.map((s) => (
                <Tag key={s.id} intent={Intent.PRIMARY} minimal>
                  {s.name} (ATS)
                </Tag>
              ))
            ) : (
              <span className="bp5-text-muted">None detected</span>
            )}
          </div>

          <H4 style={{ marginTop: 12 }}>Certifications</H4>
          {trainee.certifications.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {trainee.certifications.map((c) => (
                <li key={c.id}>
                  <strong>{c.title}</strong> — {c.issuer}
                </li>
              ))}
            </ul>
          ) : (
            <p className="bp5-text-muted">No certifications recorded.</p>
          )}
        </Card>

        <Card>
          <H4>Projects & Courses</H4>
          <strong>Projects ({trainee.projects.length})</strong>
          {trainee.projects.length > 0 ? (
            <ul style={{ margin: "6px 0 12px 0", paddingLeft: 18 }}>
              {trainee.projects.map((p) => (
                <li key={p.id}>
                  <strong>{p.title}</strong> —{" "}
                  <a href={p.repoUrl} target="_blank" rel="noreferrer">
                    Repository
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="bp5-text-muted">No projects added.</p>
          )}

          <strong>Course Enrollments ({trainee.enrollments.length})</strong>
          <HTMLTable compact striped style={{ width: "100%", marginTop: 6 }}>
            <thead>
              <tr>
                <th>Course</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {trainee.enrollments.map((en) => (
                <tr key={en.id}>
                  <td>{en.courseTitle}</td>
                  <td>
                    <Tag
                      minimal
                      intent={
                        en.status === "completed"
                          ? Intent.SUCCESS
                          : en.status === "kicked" || en.status === "dropped"
                            ? Intent.DANGER
                            : Intent.PRIMARY
                      }
                    >
                      {en.status}
                    </Tag>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {en.dropReason || en.kickReason || en.providerName || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </Card>
      </div>

      {isAdmin && (
        <Card>
          <H4>Follow-Up Email History ({trainee.followUps?.length || 0})</H4>
          {trainee.followUps && trainee.followUps.length > 0 ? (
            <HTMLTable compact striped style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Sent At</th>
                  <th>Responded At</th>
                  <th>Channel</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {trainee.followUps.map((f) => (
                  <tr key={f.id}>
                    <td>{new Date(f.sentAt).toLocaleDateString()}</td>
                    <td>{f.respondedAt ? new Date(f.respondedAt).toLocaleDateString() : "Pending"}</td>
                    <td>{f.channel}</td>
                    <td>{f.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </HTMLTable>
          ) : (
            <p className="bp5-text-muted">No quarterly follow-up logs recorded yet.</p>
          )}
        </Card>
      )}
    </div>
  );
}
