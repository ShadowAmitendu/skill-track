import { AlertTriangle, Inbox, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";
import { useAuth } from "../../context/useAuth";

export function LoadingState({ label = "Loading data...", rows = 3 }) {
  return (
    <Card aria-busy="true" aria-label={label}>
      <CardContent className="space-y-3">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 rounded-md bg-gray-100 dark:bg-gray-800" />
        ))}
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title = "No records found",
  description = "Nothing matched the current filters or criteria.",
  action = null,
}) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
          <Icon size={18} />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{title}</h3>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">{description}</p>
        )}
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  title = "Failed to load data",
  error,
  onRetry,
}) {
  const { demoMode, setDemoMode } = useAuth();
  const message =
    error?.message || "An unexpected network error occurred while contacting the API.";

  return (
    <Card className="border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/30">
      <CardContent className="py-10 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-400">
          <AlertTriangle size={18} />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{title}</h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-red-700 dark:text-red-300 leading-relaxed">
          {message}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw size={14} /> Retry
            </Button>
          )}
          {import.meta.env.DEV && !demoMode && (
            <Button variant="primary" size="sm" onClick={() => setDemoMode(true)}>
              <Sparkles size={14} /> Enable Dev Demo Mode
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
