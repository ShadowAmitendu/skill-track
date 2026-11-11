import { forwardRef } from "react";
import { Field as BaseField } from "@base-ui/react/field";

export function Field({
  label,
  description,
  error,
  required = false,
  children,
  className = "",
  id,
}) {
  return (
    <BaseField.Root
      invalid={Boolean(error)}
      className={`w-full flex flex-col items-start gap-1.5 ${className}`}
    >
      {label && (
        <BaseField.Label
          htmlFor={id}
          className="text-xs font-medium text-gray-900 dark:text-gray-100 select-none"
        >
          {label}
          {required && <span className="text-red-700 dark:text-red-400 ml-0.5">*</span>}
        </BaseField.Label>
      )}

      <div className="relative w-full">{children}</div>

      {description && !error && (
        <BaseField.Description className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
          {description}
        </BaseField.Description>
      )}

      {error && (
        <BaseField.Error match={true} className="text-xs text-red-700 dark:text-red-400 leading-normal">
          {error}
        </BaseField.Error>
      )}
    </BaseField.Root>
  );
}

export const Input = forwardRef(function Input(
  { className = "", error, hasError, type = "text", ...props },
  ref
) {
  const isInvalid = Boolean(error || hasError);
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={isInvalid || undefined}
      className={`h-9 w-full rounded-md border px-3 text-sm text-gray-900 bg-white placeholder:text-gray-400 outline-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-gray-900 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:text-gray-50 dark:bg-gray-950 dark:placeholder:text-gray-500 dark:focus-visible:outline-gray-100 dark:disabled:bg-gray-900 dark:disabled:text-gray-500 ${
        isInvalid
          ? "border-red-300 focus-visible:outline-red-700 dark:border-red-800 dark:focus-visible:outline-red-400"
          : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
      } ${className}`}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea(
  { className = "", error, hasError, rows = 3, ...props },
  ref
) {
  const isInvalid = Boolean(error || hasError);
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={isInvalid || undefined}
      className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 bg-white placeholder:text-gray-400 outline-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-gray-900 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed resize-y dark:text-gray-50 dark:bg-gray-950 dark:placeholder:text-gray-500 dark:focus-visible:outline-gray-100 dark:disabled:bg-gray-900 dark:disabled:text-gray-500 ${
        isInvalid
          ? "border-red-300 focus-visible:outline-red-700 dark:border-red-800 dark:focus-visible:outline-red-400"
          : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
      } ${className}`}
      {...props}
    />
  );
});
