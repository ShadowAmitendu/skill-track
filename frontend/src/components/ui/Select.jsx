import { Select as BaseSelect } from "@base-ui/react/select";
import { ChevronDown, Check } from "lucide-react";

export function Select({
  value,
  onValueChange,
  defaultValue,
  options = [],
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  triggerClassName = "",
  children,
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      <BaseSelect.Root
        value={value}
        onValueChange={onValueChange}
        defaultValue={defaultValue}
        disabled={disabled}
        {...props}
      >
        <BaseSelect.Trigger
          className={`flex h-9 w-full items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 hover:bg-gray-50 outline-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-gray-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50 dark:hover:bg-gray-900 dark:focus-visible:outline-gray-100 ${triggerClassName}`}
        >
          <BaseSelect.Value placeholder={placeholder} className="truncate" />
          <BaseSelect.Icon className="flex shrink-0 text-gray-500 dark:text-gray-400">
            <ChevronDown size={15} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>

        <BaseSelect.Portal>
          <BaseSelect.Positioner side="bottom" align="start" sideOffset={6} className="z-50 outline-none select-none">
            <BaseSelect.Popup className="min-w-[var(--anchor-width)] max-h-60 overflow-y-auto rounded-md bg-white p-1 text-gray-900 shadow-lg shadow-gray-200/70 outline-1 outline-gray-200 dark:bg-gray-900 dark:text-gray-50 dark:shadow-black/50 dark:outline-gray-800">
              {children
                ? children
                : options.map((opt) => {
                    const optValue = typeof opt === "object" ? opt.value : opt;
                    const optLabel = typeof opt === "object" ? opt.label : opt;
                    return (
                      <SelectItem key={optValue} value={optValue}>
                        {optLabel}
                      </SelectItem>
                    );
                  })}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
}

export function SelectItem({ children, value, className = "", ...props }) {
  return (
    <BaseSelect.Item
      value={value}
      className={`grid grid-cols-[1rem_1fr] items-center gap-2 rounded-sm py-1.5 pr-3 pl-2 text-sm text-gray-900 outline-none select-none cursor-default data-[highlighted]:bg-gray-100 data-[selected]:font-medium dark:text-gray-100 dark:data-[highlighted]:bg-gray-800 ${className}`}
      {...props}
    >
      <BaseSelect.ItemIndicator className="col-start-1 flex items-center justify-center">
        <Check size={14} className="text-gray-900 dark:text-gray-100" />
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText className="col-start-2">{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}
