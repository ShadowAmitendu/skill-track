import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Callout, Card, Elevation, FormGroup, H2, InputGroup, Intent } from "@blueprintjs/core";
import { getHomeRouteForRole, useAuth } from "../context/AuthContext";
import { showSuccess } from "../lib/toaster";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedIn = await login(email, password);
      void showSuccess(`Welcome back, ${loggedIn.name}`);
      navigate(getHomeRouteForRole(loggedIn.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: "32px auto" }}>
      <Card elevation={Elevation.TWO}>
        <div className="st-stack">
          <div>
            <H2 style={{ margin: "0 0 4px 0" }}>Sign in to Skill-Track</H2>
            <p className="bp5-text-muted" style={{ margin: 0, fontSize: 13 }}>
              Unified login for Admin, Trainee, and Course Provider accounts.
            </p>
          </div>

          {error && <Callout intent={Intent.DANGER}>{error}</Callout>}

          <form onSubmit={handleSubmit} className="st-stack">
            <FormGroup label="Email" labelFor="login-email" labelInfo="(required)">
              <InputGroup
                id="login-email"
                type="email"
                leftIcon="envelope"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormGroup>

            <FormGroup label="Password" labelFor="login-password" labelInfo="(required)">
              <InputGroup
                id="login-password"
                type={showPassword ? "text" : "password"}
                leftIcon="lock"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                rightElement={
                  <Button
                    minimal
                    icon={showPassword ? "eye-off" : "eye-open"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  />
                }
              />
            </FormGroup>

            <Button
              type="submit"
              intent={Intent.PRIMARY}
              fill
              loading={submitting}
              text="Sign In"
              rightIcon="arrow-right"
            />
          </form>

          <Callout intent={Intent.NONE} icon="info-sign">
            <div style={{ fontSize: 12 }}>
              Demo accounts: Admin (<code>admin@skilltrack.local</code> / <code>Admin@123!</code>),
              Provider (<code>cp@apexacademy.edu</code> / <code>Provider@123!</code>), Trainee (
              <code>aarav.sharma@example.com</code> / <code>Trainee@123!</code>).
            </div>
          </Callout>

          <div style={{ fontSize: 13, textAlign: "center" }}>
            New Trainee or Course Provider? <Link to="/register">Create an account</Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
