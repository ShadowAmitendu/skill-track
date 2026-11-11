import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "./ui/Button";

export function RequireRole({ roles = [], children }) {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(role)) {
    const defaultHome = "/dashboard";

    return (
      <div className="max-w-md mx-auto my-14 p-6 bg-white border border-gray-200 rounded-lg text-center dark:bg-gray-900 dark:border-gray-800">
        <div className="w-10 h-10 mx-auto rounded-md bg-red-50 border border-red-200 flex items-center justify-center text-red-700 mb-3 dark:bg-red-950/60 dark:border-red-900 dark:text-red-400">
          <ShieldAlert size={18} />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Access Restricted</h2>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
          This route is limited to{" "}
          <strong className="font-medium text-gray-900 dark:text-gray-100">{roles.join(", ")}</strong>. Your active
          role is <strong className="font-medium text-gray-900 dark:text-gray-100">{role || "None"}</strong>.
        </p>
        <div className="mt-5 flex justify-center">
          <Link to={defaultHome}>
            <Button variant="outline" size="sm">
              <ArrowLeft size={14} /> Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
