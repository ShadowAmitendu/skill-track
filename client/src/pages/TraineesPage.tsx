import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Callout,
  Card,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  H2,
  HTMLSelect,
  HTMLTable,
  InputGroup,
  Intent,
  NonIdealState,
  Spinner,
  Switch,
  Tag,
} from "@blueprintjs/core";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { showError, showSuccess } from "../lib/toaster";
import type { TraineeDTO } from "../types/api";

const STATUS_LABEL: Record<string, { text: string; intent: Intent }> = {
  full_time: { text: "Full-Time", intent: Intent.SUCCESS },
  part_time: { text: "Part-Time", intent: Intent.PRIMARY },
  internship: { text: "Internship", intent: Intent.WARNING },
  self_employed: { text: "Self-Employed", intent: Intent.NONE },
  unemployed: { text: "Unemployed", intent: Intent.DANGER },
};

export default function TraineesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [trainees, setTrainees] = useState<TraineeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Trainee@123!");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [roleCategory, setRoleCategory] = useState<"IT" | "Non-IT">("IT");
  const [consentGiven, setConsentGiven] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TraineeDTO | null>(null);

  const fetchTrainees = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const qs = query.trim() ? `?search=${encodeURIComponent(query.trim())}` : "";
      const res = await apiRequest<{ trainees: TraineeDTO[] }>(`/api/trainees${qs}`);
      setTrainees(res.trainees);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trainees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchTrainees(search);
    }, 150);
    return () => clearTimeout(t);
  }, [search, fetchTrainees]);

  const handleAddTrainee = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("/api/admin/trainees", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          email,
          password,
          phone,
          location,
          roleCategory,
          consentGiven,
        }),
      });
      void showSuccess(`Added trainee ${fullName}`);
      setAddOpen(false);
      setFullName("");
      setEmail("");
      setPhone("");
      setLocation("");
      await fetchTrainees(search);
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to add trainee");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTrainee = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiRequest(`/api/admin/trainees/${deleteTarget.id}`, { method: "DELETE" });
      void showSuccess(`Removed ${deleteTarget.fullName} and deleted associated resumes`);
      setDeleteTarget(null);
      await fetchTrainees(search);
    } catch (err) {
      void showError(err instanceof Error ? err.message : "Failed to remove trainee");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="st-stack">
      <Card>
        <div className="st-between">
          <div>
            <H2 style={{ margin: 0 }}>Trainees Directory</H2>
            <p className="bp5-text-muted" style={{ margin: "4px 0 0 0", fontSize: 13 }}>
              {isAdmin
                ? "All trainee accounts (read-only profile inspection with Admin add/remove controls)."
                : "Consented trainees visible to Course Providers (salary and contact info redacted)."}
            </p>
          </div>
          {isAdmin && (
            <Button intent={Intent.PRIMARY} icon="plus" text="Add Trainee" onClick={() => setAddOpen(true)} />
          )}
        </div>
      </Card>

      {user?.role === "cp" && (
        <Callout intent={Intent.PRIMARY} icon="shield">
          Trainees who revoked tracking consent are hidden from Course Provider views, and salaries/contact details are redacted on the server.
        </Callout>
      )}

      <Card>
        <div className="st-stack">
          <div style={{ maxWidth: 420 }}>
            <InputGroup
              leftIcon="search"
              placeholder="Search by trainee name, #ID, role, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="st-row" style={{ justifyContent: "center", padding: 32 }}>
              <Spinner size={28} />
            </div>
          ) : error ? (
            <Callout intent={Intent.DANGER}>{error}</Callout>
          ) : trainees.length === 0 ? (
            <NonIdealState
              icon="people"
              title="No matching trainees"
              description="Adjust your search query or add a new trainee record."
            />
          ) : (
            <HTMLTable striped interactive style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Trainee</th>
                  <th>Track</th>
                  <th>Employment</th>
                  <th>Skills</th>
                  <th>Consent</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trainees.map((t) => {
                  const empMeta = t.employment
                    ? STATUS_LABEL[t.employment.status] || { text: t.employment.status, intent: Intent.NONE }
                    : { text: "No Record", intent: Intent.NONE };
                  return (
                    <tr key={t.id}>
                      <td>#{t.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.fullName}</div>
                        <div className="bp5-text-muted" style={{ fontSize: 12 }}>
                          {isAdmin && t.email ? t.email : t.location || "Consented Profile"}
                        </div>
                      </td>
                      <td>
                        <Tag minimal intent={t.roleCategory === "IT" ? Intent.PRIMARY : Intent.NONE}>
                          {t.roleCategory}
                        </Tag>
                      </td>
                      <td>
                        <Tag minimal intent={empMeta.intent}>
                          {empMeta.text}
                        </Tag>
                        {t.employment?.role && (
                          <div className="bp5-text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                            {t.employment.role}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="st-row" style={{ gap: 4 }}>
                          {t.skills.slice(0, 3).map((s) => (
                            <Tag key={`${s.skillId}-${s.source}`} minimal>
                              {s.name}
                            </Tag>
                          ))}
                          {t.skills.length > 3 && <Tag minimal>+{t.skills.length - 3}</Tag>}
                        </div>
                      </td>
                      <td>
                        <Tag minimal intent={t.consentGiven ? Intent.SUCCESS : Intent.WARNING}>
                          {t.consentGiven ? "Granted" : "Revoked"}
                        </Tag>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="st-row" style={{ justifyContent: "flex-end", gap: 6 }}>
                          <Button
                            small
                            icon="eye-open"
                            text="View profile"
                            onClick={() => navigate(`/trainees/${t.id}`)}
                          />
                          {isAdmin && (
                            <Button
                              small
                              minimal
                              intent={Intent.DANGER}
                              icon="trash"
                              aria-label={`Remove ${t.fullName}`}
                              onClick={() => setDeleteTarget(t)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </HTMLTable>
          )}
        </div>
      </Card>

      <Dialog isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Trainee">
        <form onSubmit={handleAddTrainee}>
          <DialogBody className="st-stack">
            <FormGroup label="Full Name" labelInfo="(required)">
              <InputGroup value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </FormGroup>
            <div className="st-grid-2">
              <FormGroup label="Email" labelInfo="(required)">
                <InputGroup type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </FormGroup>
              <FormGroup label="Initial Password">
                <InputGroup
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </FormGroup>
            </div>
            <div className="st-grid-2">
              <FormGroup label="Phone">
                <InputGroup value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FormGroup>
              <FormGroup label="Location">
                <InputGroup value={location} onChange={(e) => setLocation(e.target.value)} />
              </FormGroup>
            </div>
            <FormGroup label="Career Track">
              <HTMLSelect
                fill
                value={roleCategory}
                onChange={(e) => setRoleCategory(e.target.value as "IT" | "Non-IT")}
                options={[
                  { label: "IT", value: "IT" },
                  { label: "Non-IT", value: "Non-IT" },
                ]}
              />
            </FormGroup>
            <Switch
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.currentTarget.checked)}
              label="Tracking consent enabled"
            />
          </DialogBody>
          <DialogFooter
            actions={
              <>
                <Button text="Cancel" onClick={() => setAddOpen(false)} />
                <Button type="submit" intent={Intent.PRIMARY} loading={saving} text="Create Trainee" />
              </>
            }
          />
        </form>
      </Dialog>

      <Dialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Remove Trainee"
      >
        <DialogBody>
          Permanently remove <strong>{deleteTarget?.fullName}</strong>, all enrollments, and any uploaded resumes on disk?
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button text="Cancel" onClick={() => setDeleteTarget(null)} />
              <Button
                intent={Intent.DANGER}
                loading={saving}
                text="Remove Trainee"
                onClick={() => void handleRemoveTrainee()}
              />
            </>
          }
        />
      </Dialog>
    </div>
  );
}
