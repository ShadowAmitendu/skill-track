import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "../lib/api";
import type { AuthUser, UserRole } from "../types/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  registerTrainee: (payload: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    location?: string;
    roleCategory: "IT" | "Non-IT";
    consentGiven: boolean;
  }) => Promise<AuthUser>;
  registerProvider: (payload: {
    name: string;
    email: string;
    password: string;
    contactEmail?: string;
    website?: string;
    description?: string;
  }) => Promise<{ pendingApproval: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function getHomeRouteForRole(role: UserRole): string {
  if (role === "admin") return "/admin";
  if (role === "cp") return "/courses";
  return "/me";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiRequest<{ user: AuthUser }>("/api/auth/me");
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(res.user);
    return res.user;
  };

  const registerTrainee = async (payload: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    location?: string;
    roleCategory: "IT" | "Non-IT";
    consentGiven: boolean;
  }) => {
    const res = await apiRequest<{ user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ accountType: "trainee", ...payload }),
    });
    setUser(res.user);
    return res.user;
  };

  const registerProvider = async (payload: {
    name: string;
    email: string;
    password: string;
    contactEmail?: string;
    website?: string;
    description?: string;
  }) => {
    return apiRequest<{ pendingApproval: boolean; message: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ accountType: "cp", ...payload }),
    });
  };

  const logout = async () => {
    await apiRequest("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, registerTrainee, registerProvider, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
