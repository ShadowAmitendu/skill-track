import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Callout,
  Card,
  Elevation,
  FormGroup,
  H2,
  HTMLSelect,
  InputGroup,
  Intent,
  Switch,
  Tab,
  Tabs,
  TextArea,
} from "@blueprintjs/core";
import { useAuth } from "../context/AuthContext";
import { showSuccess } from "../lib/toaster";

export default function RegisterPage() {
  const { registerTrainee, registerProvider } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"trainee" | "cp">("trainee");
  const [error, setError] = useState<string | null>(null);
  const [pendingMsg, setPendingMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Trainee fields
  const [fullName, setFullName] = useState("");
  const [tEmail, setTEmail] = useState("");
  const [tPassword, setTPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [roleCategory, setRoleCategory] = useState<"IT" | "Non-IT">("IT");
  const [consentGiven, setConsentGiven] = useState(true);

  // Course provider fields
  const [orgName, setOrgName] = useState("");
  const [cpEmail, setCpEmail] = useState("");
  const [cpPassword, setCpPassword] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  const handleTraineeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPendingMsg(null);
    setSubmitting(true);
    try {
      const user = await registerTrainee({
        fullName,
        email: tEmail,
        password: tPassword,
        phone,
        location,
        roleCategory,
        consentGiven,
      });
      void showSuccess(`Account created for ${user.name}`);
      navigate("/me", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPendingMsg(null);
    setSubmitting(true);
    try {
      const res = await registerProvider({
        name: orgName,
        email: cpEmail,
        password: cpPassword,
        contactEmail: contactEmail || cpEmail,
        website,
        description,
      });
      setPendingMsg(res.message);
      void showSuccess("Registration submitted for admin review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Provider registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "24px auto" }}>
      <Card elevation={Elevation.TWO}>
        <div className="st-stack">
          <div>
            <H2 style={{ margin: "0 0 4px 0" }}>Register Account</H2>
            <p className="bp5-text-muted" style={{ margin: 0, fontSize: 13 }}>
              Admin accounts cannot be registered via UI and are seeded directly in the database.
            </p>
          </div>

          {error && <Callout intent={Intent.DANGER}>{error}</Callout>}
          {pendingMsg && (
            <Callout intent={Intent.WARNING} title="Pending Administrator Approval">
              {pendingMsg}
            </Callout>
          )}

          <Tabs
            id="register-tabs"
            selectedTabId={tab}
            onChange={(next) => {
              setTab(next as "trainee" | "cp");
              setError(null);
            }}
          >
            <Tab
              id="trainee"
              title="Trainee Registration"
              panel={
                <form onSubmit={handleTraineeSubmit} className="st-stack" style={{ marginTop: 12 }}>
                  <FormGroup label="Full Name" labelFor="reg-t-name" labelInfo="(required)">
                    <InputGroup
                      id="reg-t-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </FormGroup>
                  <div className="st-grid-2">
                    <FormGroup label="Email" labelFor="reg-t-email" labelInfo="(required)">
                      <InputGroup
                        id="reg-t-email"
                        type="email"
                        value={tEmail}
                        onChange={(e) => setTEmail(e.target.value)}
                        required
                      />
                    </FormGroup>
                    <FormGroup label="Password (min 6 chars)" labelFor="reg-t-pwd" labelInfo="(required)">
                      <InputGroup
                        id="reg-t-pwd"
                        type="password"
                        value={tPassword}
                        onChange={(e) => setTPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </FormGroup>
                  </div>
                  <div className="st-grid-2">
                    <FormGroup label="Phone" labelFor="reg-t-phone">
                      <InputGroup
                        id="reg-t-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </FormGroup>
                    <FormGroup label="Location" labelFor="reg-t-loc">
                      <InputGroup
                        id="reg-t-loc"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </FormGroup>
                  </div>
                  <FormGroup
                    label="Career Track Category"
                    labelFor="reg-t-cat"
                    helperText="AI career analysis tools are enabled for trainees in the IT category."
                  >
                    <HTMLSelect
                      id="reg-t-cat"
                      fill
                      value={roleCategory}
                      onChange={(e) => setRoleCategory(e.target.value as "IT" | "Non-IT")}
                      options={[
                        { label: "IT (Software, DevOps, Cloud, Data)", value: "IT" },
                        { label: "Non-IT", value: "Non-IT" },
                      ]}
                    />
                  </FormGroup>
                  <Switch
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.currentTarget.checked)}
                    label="Consent to employment tracking, quarterly email reminders, and CP directory visibility"
                  />
                  <Button
                    type="submit"
                    intent={Intent.PRIMARY}
                    fill
                    loading={submitting}
                    text="Create Trainee Account"
                  />
                </form>
              }
            />
            <Tab
              id="cp"
              title="Course Provider Registration"
              panel={
                <form onSubmit={handleCpSubmit} className="st-stack" style={{ marginTop: 12 }}>
                  <Callout intent={Intent.PRIMARY} icon="endorsed">
                    Course Provider accounts start as <strong>pending</strong> until approved by an administrator.
                  </Callout>
                  <FormGroup label="Organization Name" labelFor="reg-cp-name" labelInfo="(required)">
                    <InputGroup
                      id="reg-cp-name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                    />
                  </FormGroup>
                  <div className="st-grid-2">
                    <FormGroup label="Login Email" labelFor="reg-cp-email" labelInfo="(required)">
                      <InputGroup
                        id="reg-cp-email"
                        type="email"
                        value={cpEmail}
                        onChange={(e) => setCpEmail(e.target.value)}
                        required
                      />
                    </FormGroup>
                    <FormGroup label="Password (min 6 chars)" labelFor="reg-cp-pwd" labelInfo="(required)">
                      <InputGroup
                        id="reg-cp-pwd"
                        type="password"
                        value={cpPassword}
                        onChange={(e) => setCpPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </FormGroup>
                  </div>
                  <div className="st-grid-2">
                    <FormGroup label="Public Contact Email" labelFor="reg-cp-contact">
                      <InputGroup
                        id="reg-cp-contact"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </FormGroup>
                    <FormGroup label="Website URL" labelFor="reg-cp-site">
                      <InputGroup
                        id="reg-cp-site"
                        type="url"
                        placeholder="https://..."
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </FormGroup>
                  </div>
                  <FormGroup label="Program Description" labelFor="reg-cp-desc">
                    <TextArea
                      id="reg-cp-desc"
                      fill
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </FormGroup>
                  <Button
                    type="submit"
                    intent={Intent.PRIMARY}
                    fill
                    loading={submitting}
                    text="Submit Provider Application"
                  />
                </form>
              }
            />
          </Tabs>

          <div style={{ fontSize: 13, textAlign: "center" }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
