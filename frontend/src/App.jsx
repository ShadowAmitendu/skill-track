import { Routes, Route, Navigate, Link } from "react-router-dom";
import { NonIdealState } from "@blueprintjs/core";
import { useAuth } from "./context/useAuth";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { RequireRole } from "./components/RequireRole";
import { Card } from "./components/ui/Card";
import { Button } from "./components/ui/Button";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Trainees from "./pages/Trainees";
import TraineeProfile from "./pages/TraineeProfile";
import TraineeMe from "./pages/TraineeMe";
import MyEmployment from "./pages/MyEmployment";
import CoursesAndProviders from "./pages/CoursesAndProviders";
import ProviderProfile from "./pages/ProviderProfile";
import Skills from "./pages/Skills";
import Employment from "./pages/Employment";
import CareerInsights from "./pages/CareerInsights";
import ProviderAiStudio from "./pages/ProviderAiStudio";

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f7f9] text-[#1c2127] dark:bg-[#1c2127] dark:text-[#f6f7f9]">
      <Navbar />

      <main className="min-w-0 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Role-Specific Dashboard (All Authenticated Roles) */}
          <Route
            path="/dashboard"
            element={
              <RequireRole roles={["ADMIN", "COURSE_PROVIDER", "TRAINEE"]}>
                <Dashboard />
              </RequireRole>
            }
          />

          {/* Admin & Course Provider */}
          <Route
            path="/trainees"
            element={
              <RequireRole roles={["ADMIN", "COURSE_PROVIDER"]}>
                <Trainees />
              </RequireRole>
            }
          />
          <Route
            path="/trainees/:id"
            element={
              <RequireRole roles={["ADMIN", "COURSE_PROVIDER"]}>
                <TraineeProfile />
              </RequireRole>
            }
          />
          <Route
            path="/employment"
            element={
              <RequireRole roles={["ADMIN", "COURSE_PROVIDER"]}>
                <Employment />
              </RequireRole>
            }
          />

          {/* Trainee Only */}
          <Route
            path="/me"
            element={
              <RequireRole roles={["TRAINEE"]}>
                <TraineeMe />
              </RequireRole>
            }
          />
          <Route
            path="/my-employment"
            element={
              <RequireRole roles={["TRAINEE"]}>
                <MyEmployment />
              </RequireRole>
            }
          />
          <Route
            path="/career-insights"
            element={
              <RequireRole roles={["TRAINEE", "ADMIN"]}>
                <CareerInsights />
              </RequireRole>
            }
          />

          {/* Course Provider + Admin AI Studio */}
          <Route
            path="/provider-ai"
            element={
              <RequireRole roles={["COURSE_PROVIDER", "ADMIN"]}>
                <ProviderAiStudio />
              </RequireRole>
            }
          />

          {/* Open to All Roles */}
          <Route path="/courses" element={<CoursesAndProviders />} />
          <Route path="/providers/:id" element={<ProviderProfile />} />
          <Route path="/skills" element={<Skills />} />

          <Route
            path="*"
            element={
              <div className="max-w-md mx-auto my-14">
                <Card>
                  <NonIdealState
                    icon="search"
                    title="404 — Page Not Found"
                    description="The page you requested does not exist or has been moved."
                    action={
                      <Link to="/">
                        <Button variant="primary">
                          Return Home
                        </Button>
                      </Link>
                    }
                  />
                </Card>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}
