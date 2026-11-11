import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Shield, Layers, UserCheck, ArrowRight, Mail, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Field, Input } from "../components/ui/Field";
import { Tabs, TabsList, TabsTab } from "../components/ui/Tabs";

export default function Login() {
  const { login, switchPersona } = useAuth();
  const navigate = useNavigate();

  const defaultAdminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@skilltrack.com";
  const [activeRole, setActiveRole] = useState("ADMIN");
  const [email, setEmail] = useState(defaultAdminEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRoleTabChange = (newRole) => {
    setActiveRole(newRole);
    setError(null);
    if (newRole === "ADMIN") setEmail(defaultAdminEmail);
    else if (newRole === "COURSE_PROVIDER") setEmail("partners@apexacademy.edu");
    else setEmail("aarav.sharma@example.com");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login({ email, role: activeRole });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = (role) => {
    switchPersona(role);
    navigate("/dashboard");
  };

  return (
    <div className="max-w-md mx-auto my-10">
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Sign in to SkillTrack</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Unified portal for Admins, Course Providers, and Trainees
            </p>
          </div>

          <Tabs value={activeRole} onValueChange={handleRoleTabChange}>
            <TabsList className="w-full grid grid-cols-3 mb-5">
              <TabsTab value="ADMIN" className="text-xs">
                <Shield size={13} className="mr-1.5" /> Admin
              </TabsTab>
              <TabsTab value="COURSE_PROVIDER" className="text-xs">
                <Layers size={13} className="mr-1.5" /> Provider
              </TabsTab>
              <TabsTab value="TRAINEE" className="text-xs">
                <UserCheck size={13} className="mr-1.5" /> Trainee
              </TabsTab>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-xs text-red-700 dark:bg-red-950/60 dark:border-red-900 dark:text-red-300">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Field label="Email Address" required id="login-email">
                <div className="relative">
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email..."
                    required
                    className="pl-9"
                  />
                  <Mail size={15} className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" />
                </div>
              </Field>

              <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
                {activeRole === "ADMIN" &&
                  `Verifies against configured VITE_ADMIN_EMAIL (${defaultAdminEmail}). UI-level access control only.`}
                {activeRole === "COURSE_PROVIDER" &&
                  "Looks up existing course providers by contact email."}
                {activeRole === "TRAINEE" && "Looks up registered trainee profiles by email."}
              </p>

              <Button type="submit" variant="primary" loading={loading} className="w-full">
                <span>
                  Sign In as{" "}
                  {activeRole === "ADMIN"
                    ? "Admin"
                    : activeRole === "COURSE_PROVIDER"
                    ? "Provider"
                    : "Trainee"}
                </span>
                <ArrowRight size={15} />
              </Button>
            </form>
          </Tabs>

          {import.meta.env.DEV && (
            <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-800">
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center mb-2.5">
                Dev-Only Role Switcher
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPersona("ADMIN")}
                  className="w-full"
                >
                  Admin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPersona("COURSE_PROVIDER")}
                  className="w-full"
                >
                  Provider
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPersona("TRAINEE")}
                  className="w-full"
                >
                  Trainee
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
            New to SkillTrack?{" "}
            <Link to="/register" className="font-medium text-gray-900 underline hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300">
              Register as Trainee or Provider
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
