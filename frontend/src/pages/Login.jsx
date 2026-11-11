import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { ArrowRight, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Callout } from "../components/ui/Callout";
import { Field, Input } from "../components/ui/Field";
import { CaptchaChallenge } from "../components/CaptchaChallenge";
import { generateCaptchaCode } from "../components/captcha-utils";
import { H2 } from "@blueprintjs/core";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaCode, setCaptchaCode] = useState(() => generateCaptchaCode());
  const [captchaInput, setCaptchaInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const regenerateCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());
    setCaptchaInput("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your Mail ID.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }
    if (!captchaInput.trim()) {
      setError("Please enter the captcha code.");
      return;
    }
    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setError("Invalid captcha code. Please try again.");
      regenerateCaptcha();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login({ email, password });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
      regenerateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <Card>
        <div className="text-center mb-6">
          <H2 className="!mb-1">Sign in to SkillTrack</H2>
          <p className="bp6-text-muted text-xs">
            One sign-in for Admins, Course Providers, and Trainees
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && <Callout variant="danger">{error}</Callout>}

          <Field
            label="Mail ID or User ID"
            required
            id="login-email"
            description="Enter your registered Mail ID or User ID (e.g. T-1, P-1, admin)."
          >
            <Input
              id="login-email"
              type="text"
              leftIcon="envelope"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com or T-1"
              autoComplete="username"
              required
            />
          </Field>

          <Field label="Password" required id="login-password">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              leftIcon="lock"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              rightElement={
                <Button
                  variant="minimal"
                  size="sm"
                  icon={showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                />
              }
            />
          </Field>

          <Field
            label="Captcha"
            required
            id="login-captcha"
            description="Enter the 6 characters displayed above (case-insensitive)."
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CaptchaChallenge code={captchaCode} />
                <Button
                  variant="outlined"
                  icon={<RefreshCw size={14} />}
                  onClick={regenerateCaptcha}
                  aria-label="Refresh captcha"
                  title="Generate a new captcha"
                  className="shrink-0"
                >
                  Refresh
                </Button>
              </div>
              <Input
                id="login-captcha"
                type="text"
                leftIcon="shield"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter captcha code"
                autoComplete="off"
                spellCheck={false}
                maxLength={6}
                required
              />
            </div>
          </Field>

          <Button
            type="submit"
            variant="primary"
            fill
            loading={loading}
            endIcon={<ArrowRight size={14} />}
          >
            Sign In
          </Button>
        </form>

        <p className="bp6-text-muted text-center text-xs mt-5">
          New to SkillTrack?{" "}
          <Link to="/register" className="font-medium underline">
            Register as Trainee or Provider
          </Link>
        </p>
      </Card>
    </div>
  );
}
