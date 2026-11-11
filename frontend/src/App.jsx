import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import { Navbar } from "./components/Navbar";
import { RequireRole } from "./components/RequireRole";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Trainees from "./pages/Trainees";
import TraineeProfile from "./pages/TraineeProfile";
import TraineeMe from "./pages/TraineeMe";
import CoursesAndProviders from "./pages/CoursesAndProviders";
import ProviderProfile from "./pages/ProviderProfile";
import Skills from "./pages/Skills";
import Employment from "./pages/Employment";

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

          {/* Open to All Roles */}
          <Route path="/courses" element={<CoursesAndProviders />} />
          <Route path="/providers/:id" element={<ProviderProfile />} />
          <Route path="/skills" element={<Skills />} />

          <Route
            path="*"
            element={
              <div className="max-w-md mx-auto my-14 p-6 bg-white border border-gray-200 rounded-lg text-center dark:bg-gray-900 dark:border-gray-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">404</p>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mt-1">Page Not Found</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  The page you requested does not exist or has been moved.
                </p>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
