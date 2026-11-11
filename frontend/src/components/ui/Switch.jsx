import { useId } from "react";
import { Switch as BaseSwitch } from "@base-ui/react/switch";

export function Switch({
  checked,
  onCheckedChange,
  defaultChecked,
  disabled = false,
  label,
  description,
  className = "",
  id,
  ...props
}) {
  const generatedId = useId();
  const switchId = id || generatedId;

  const control = (
    <BaseSwitch.Root
      id={switchId}
      checked={checked}
      onCheckedChange={onCheckedChange}
      defaultChecked={defaultChecked}
      disabled={disabled}
      className={`relative flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-50 bg-gray-200 border border-gray-300 data-[checked]:bg-gray-900 data-[checked]:border-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:data-[checked]:bg-gray-100 dark:data-[checked]:border-gray-100 dark:focus-visible:outline-gray-100 ${className}`}
      {...props}
    >
      <BaseSwitch.Thumb className="aspect-square h-full rounded-full bg-white shadow-sm data-[checked]:translate-x-4 dark:bg-gray-300 dark:data-[checked]:bg-gray-950" />
    </BaseSwitch.Root>
  );

  if (!label && !description) {
    return control;
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col">
        {label && (
          <label
            htmlFor={switchId}
            className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal mt-0.5">
            {description}
          </p>
        )}
      </div>
      {control}
    </div>
  );
}
