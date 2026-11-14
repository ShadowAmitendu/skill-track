import { Navigate, Route, Routes } from "react-router-dom";
import { Card, NonIdealState } from "@blueprintjs/core";
import { AuthProvider, getHomeRouteForRole, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TraineesPage from "./pages/TraineesPage";
import TraineeProfilePage from "./pages/TraineeProfilePage";
import CoursesProvidersPage from "./pages/CoursesProvidersPage";
import ProviderProfilePage from "./pages/ProviderProfilePage";
import SkillsPage from "./pages/SkillsPage";
import MyProfilePage from "./pages/MyProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import EmploymentPage from "./pages/EmploymentPage";
import AiSkillGapPage from "./pages/AiSkillGapPage";
import AiRoleMatchPage from "./pages/AiRoleMatchPage";
import AiFutureCareersPage from "./pages/AiFutureCareersPage";
import AiProviderAssistantPage from "./pages/AiProviderAssistantPage";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getHomeRouteForRole(user.role)} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainees"
              element={
                <ProtectedRoute roles={["admin", "cp"]}>
                  <TraineesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainees/:id"
              element={
                <ProtectedRoute roles={["admin", "cp"]}>
                  <TraineeProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute roles={["admin", "trainee", "cp"]}>
                  <CoursesProvidersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/providers/:id"
              element={
                <ProtectedRoute roles={["admin", "trainee", "cp"]}>
                  <ProviderProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/skills" element={<SkillsPage />} />
            <Route
              path="/employment"
              element={
                <ProtectedRoute roles={["admin", "cp"]}>
                  <EmploymentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/me"
              element={
                <ProtectedRoute roles={["trainee"]}>
                  <MyProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai/skill-gap"
              element={
                <ProtectedRoute roles={["trainee"]} requireItCategory>
                  <AiSkillGapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai/role-match"
              element={
                <ProtectedRoute roles={["trainee"]} requireItCategory>
                  <AiRoleMatchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai/future-careers"
              element={
                <ProtectedRoute roles={["trainee"]} requireItCategory>
                  <AiFutureCareersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai/provider"
              element={
                <ProtectedRoute roles={["cp"]}>
                  <AiProviderAssistantPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={
                <Card>
                  <NonIdealState
                    icon="search"
                    title="404 — Page Not Found"
                    description="The requested route does not exist."
                  />
                </Card>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
}
