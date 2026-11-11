import { forwardRef } from "react";
import { Button as BaseButton } from "@base-ui/react/button";

const variants = {
  primary:
    "bg-gray-900 text-gray-50 hover:bg-gray-800 active:bg-gray-950 border border-gray-900 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-white dark:active:bg-gray-200 dark:border-gray-100",
  secondary:
    "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-200 border border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-700 dark:border-gray-700",
  outline:
    "border border-gray-200 bg-white text-gray-900 hover:bg-gray-100 active:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-800",
  danger:
    "bg-red-700 text-white hover:bg-red-800 active:bg-red-900 border border-red-700 dark:bg-red-600 dark:hover:bg-red-700 dark:active:bg-red-800 dark:border-red-600",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 border border-transparent dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:active:bg-gray-800",
  success:
    "bg-gray-900 text-gray-50 hover:bg-gray-800 active:bg-gray-950 border border-gray-900 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-white dark:active:bg-gray-200 dark:border-gray-100",
};

const sizes = {
  sm: "h-8 px-2.5 text-xs rounded-md gap-1.5",
  md: "h-9 px-3.5 text-sm rounded-md gap-2",
  lg: "h-10 px-4 text-sm rounded-md gap-2",
  icon: "h-9 w-9 p-0 rounded-md",
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    className = "",
    disabled = false,
    loading = false,
    type = "button",
    ...props
  },
  ref
) {
  return (
    <BaseButton
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium select-none cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:focus-visible:outline-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
        variants[variant] || variants.primary
      } ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
      {loading && <span className="ml-1 text-xs opacity-80">...</span>}
    </BaseButton>
  );
});
