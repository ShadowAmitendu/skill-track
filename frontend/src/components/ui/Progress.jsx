import { Progress as BaseProgress } from "@base-ui/react/progress";

export function Progress({
  value = 0,
  max = 100,
  label,
  showValue = false,
  variant = "neutral",
  className = "",
  ...props
}) {
  const safeMax = max > 0 ? max : 100;
  const percentage = Math.min(Math.max(0, Math.round((value / safeMax) * 100)), 100);

  const colors = {
    neutral: "bg-gray-900 dark:bg-gray-100",
    blue: "bg-gray-900 dark:bg-gray-100",
    indigo: "bg-gray-900 dark:bg-gray-100",
    emerald: "bg-emerald-700 dark:bg-emerald-400",
    amber: "bg-amber-600 dark:bg-amber-400",
    rose: "bg-red-700 dark:bg-red-400",
  };

  return (
    <BaseProgress.Root
      value={percentage}
      max={100}
      className={`grid w-full gap-y-1.5 ${className}`}
      {...props}
    >
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-medium text-gray-900 dark:text-gray-100">
          {label ? <BaseProgress.Label>{label}</BaseProgress.Label> : <span />}
          {showValue && (
            <BaseProgress.Value className="text-gray-600 dark:text-gray-400 tabular-nums">
              {() => `${percentage}%`}
            </BaseProgress.Value>
          )}
        </div>
      )}
      <BaseProgress.Track className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-none">
        <BaseProgress.Indicator
          className={`block h-full rounded-full ${colors[variant] || colors.neutral}`}
        />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}
