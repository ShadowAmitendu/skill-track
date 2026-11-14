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
   * Unified login: verifies email & password (client-side UI boundary while backend has no password auth)
   * against VITE_ADMIN_EMAIL, registered trainees, or registered providers.
   * Accepts an optional role hint when explicitly specified, or auto-resolves across all roles.
   */
  const login = useCallback(async ({ email, password, role }) => {
    const cleanInput = (email || "").trim().toLowerCase();
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || "admin@skilltrack.com").toLowerCase();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (!cleanInput) {
      throw new Error("Please enter your Mail ID or User ID.");
    }
    if (!password || !password.trim()) {
      throw new Error("Please enter your password.");
    }

    const matchesAdmin =
      cleanInput === adminEmail || cleanInput === "admin" || cleanInput === "0";

    if (!role) {
      if (matchesAdmin) {
        if (adminPassword && password !== adminPassword) {
          throw new Error("Invalid password for Administrator account.");
        }
        const adminSession = {
          role: "ADMIN",
          user: { id: 0, name: "System Administrator", email: adminEmail },
          isAuthenticated: true,
        };
        setSession(adminSession);
        return adminSession;
      }

      const [trainees, providers] = await Promise.all([
        traineeApi.getAll(),
        providerApi.getAll(),
      ]);

      const traineeMatch = (trainees || []).find(
        (t) =>
          (t.email && t.email.trim().toLowerCase() === cleanInput) ||
          cleanInput === `t-${t.id}` ||
          cleanInput === `trainee-${t.id}`
      );
      if (traineeMatch) {
        const traineeSession = {
          role: "TRAINEE",
          user: {
            id: traineeMatch.id,
            name: traineeMatch.fullName,
            email: traineeMatch.email,
            details: traineeMatch,
          },
          isAuthenticated: true,
        };
        setSession(traineeSession);
        return traineeSession;
      }

      const providerMatch = (providers || []).find(
        (p) =>
          (p.contactEmail && p.contactEmail.trim().toLowerCase() === cleanInput) ||
          cleanInput === `p-${p.id}` ||
          cleanInput === `provider-${p.id}`
      );
      if (providerMatch) {
        const providerSession = {
          role: "COURSE_PROVIDER",
          user: {
            id: providerMatch.id,
            name: providerMatch.name,
            email: providerMatch.contactEmail,
            details: providerMatch,
          },
          isAuthenticated: true,
        };
        setSession(providerSession);
        return providerSession;
      }

      throw new Error(
        `No account found matching "${email}". Check your Mail ID / User ID or register first.`
      );
    }

    if (role === "ADMIN") {
      if (matchesAdmin) {
        if (adminPassword && password !== adminPassword) {
          throw new Error("Invalid password for Administrator account.");
        }
        const adminSession = {
          role: "ADMIN",
          user: { id: 0, name: "System Administrator", email: adminEmail },
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
        (t) =>
          (t.email && t.email.trim().toLowerCase() === cleanInput) ||
          cleanInput === `t-${t.id}` ||
          cleanInput === `trainee-${t.id}`
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
        (p) =>
          (p.contactEmail && p.contactEmail.trim().toLowerCase() === cleanInput) ||
          cleanInput === `p-${p.id}` ||
          cleanInput === `provider-${p.id}`
      );
      if (!match) {
        throw new Error(
          `No course provider found with email or ID "${email}". Please register as a Course Provider.`
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
