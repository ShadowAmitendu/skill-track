import { useState, useEffect, useCallback } from "react";
import { traineeApi, providerApi } from "../api/endpoints";
import { AuthContext } from "./auth-context";

/**
 * NOTE: The Spring Boot backend currently implements no server-side authentication
 * (such as JWT tokens or session cookies). This AuthContext provides UI-level access control
 * and role-based views on the client side only, not cryptographic or backend security.
 */

const STORAGE_KEY = "skilltrack_user_session";
const DEMO_MODE_KEY = "skilltrack_demo_mode";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore invalid storage
    }
    return {
      role: "ADMIN",
      user: {
        id: 0,
        name: "SkillTrack Administrator",
        email: import.meta.env.VITE_ADMIN_EMAIL || "admin@skilltrack.com",
      },
      isAuthenticated: true,
    };
  });

  const [demoMode, setDemoModeState] = useState(() => {
    return import.meta.env.DEV && localStorage.getItem(DEMO_MODE_KEY) !== "false";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore storage errors
    }
  }, [session]);

  const setDemoMode = useCallback((enabled) => {
    if (!import.meta.env.DEV) return;
    setDemoModeState(enabled);
    localStorage.setItem(DEMO_MODE_KEY, String(enabled));
    window.location.reload();
  }, []);

  /**
   * Login by verifying email against existing backend records (or VITE_ADMIN_EMAIL for Admin).
   */
  const login = useCallback(async ({ email, role }) => {
    const cleanEmail = email.trim().toLowerCase();
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || "admin@skilltrack.com").toLowerCase();

    if (role === "ADMIN") {
      if (cleanEmail === adminEmail) {
        const adminSession = {
          role: "ADMIN",
          user: { id: 0, name: "System Administrator", email: cleanEmail },
          isAuthenticated: true,
        };
        setSession(adminSession);
        return adminSession;
      }
      throw new Error(`Admin email must match the configured VITE_ADMIN_EMAIL (${adminEmail}).`);
    }

    if (role === "TRAINEE") {
      const trainees = await traineeApi.getAll();
      const match = (trainees || []).find(
        (t) => t.email && t.email.trim().toLowerCase() === cleanEmail
      );
      if (!match) {
        throw new Error(`No trainee found registered with email "${email}". Please register first.`);
      }
      const traineeSession = {
        role: "TRAINEE",
        user: { id: match.id, name: match.fullName, email: match.email, details: match },
        isAuthenticated: true,
      };
      setSession(traineeSession);
      return traineeSession;
    }

    if (role === "COURSE_PROVIDER") {
      const providers = await providerApi.getAll();
      const match = (providers || []).find(
        (p) => p.contactEmail && p.contactEmail.trim().toLowerCase() === cleanEmail
      );
      if (!match) {
        throw new Error(
          `No course provider found with email "${email}". Please register as a Course Provider.`
        );
      }
      const providerSession = {
        role: "COURSE_PROVIDER",
        user: { id: match.id, name: match.name, email: match.contactEmail, details: match },
        isAuthenticated: true,
      };
      setSession(providerSession);
      return providerSession;
    }

    throw new Error("Invalid role specified.");
  }, []);

  const logout = useCallback(() => {
    const emptySession = { role: null, user: null, isAuthenticated: false };
    setSession(emptySession);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const switchPersona = useCallback((role, customUser) => {
    let newUser = customUser;
    if (!newUser) {
      if (role === "ADMIN") {
        newUser = {
          id: 0,
          name: "System Administrator",
          email: import.meta.env.VITE_ADMIN_EMAIL || "admin@skilltrack.com",
        };
      } else if (role === "COURSE_PROVIDER") {
        newUser = {
          id: 1,
          name: "Apex Skill Academy",
          email: "partners@apexacademy.edu",
        };
      } else {
        newUser = {
          id: 1,
          name: "Aarav Sharma",
          email: "aarav.sharma@example.com",
        };
      }
    }
    setSession({ role, user: newUser, isAuthenticated: true });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        role: session?.role,
        user: session?.user,
        isAuthenticated: session?.isAuthenticated ?? false,
        login,
        logout,
        switchPersona,
        demoMode,
        setDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
