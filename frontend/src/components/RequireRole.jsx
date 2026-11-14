import { Navigate, Link } from "react-router-dom";
import { Icon, Intent, NonIdealState } from "@blueprintjs/core";
import { useAuth } from "../context/useAuth";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

export function RequireRole({ roles = [], children }) {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(role)) {
    const defaultHome = "/dashboard";

    return (
      <div className="max-w-md mx-auto my-14">
        <Card>
          <NonIdealState
            icon={<Icon icon="shield" size={36} intent={Intent.DANGER} />}
            iconMuted={false}
            title="Access Restricted"
            description={
              <span>
                This route is limited to{" "}
                <strong className="font-semibold">{roles.join(", ")}</strong>. Your active role is{" "}
                <strong className="font-semibold">{role || "None"}</strong>.
              </span>
            }
            action={
              <Link to={defaultHome}>
                <Button variant="outline" icon="arrow-left">
                  Return to Dashboard
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return children;
}
