import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Button, Card, NonIdealState, Spinner } from "@blueprintjs/core";
import { getHomeRouteForRole, useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/api";

export function ProtectedRoute({
  roles,
  requireItCategory = false,
  children,
}: {
  roles: UserRole[];
  requireItCategory?: boolean;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Card>
        <div className="st-row" style={{ justifyContent: "center", padding: 36 }}>
          <Spinner size={28} />
        </div>
      </Card>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return (
      <Card>
        <NonIdealState
          icon="lock"
          title="Access Restricted"
          description="Your account role does not have permission to view this page."
          action={
            <a href={getHomeRouteForRole(user.role)}>
              <Button intent="primary" text="Go to Home" />
            </a>
          }
        />
      </Card>
    );
  }

  if (requireItCategory && user.role === "trainee" && user.roleCategory !== "IT") {
    return (
      <Card>
        <NonIdealState
          icon="predictive-analysis"
          title="IT Role Category Required"
          description="AI Skill Gap, Role Match, and Future Career insights are limited to trainees in the IT category."
        />
      </Card>
    );
  }

  return <>{children}</>;
}
