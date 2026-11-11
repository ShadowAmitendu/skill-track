import { Menu as BaseMenu } from "@base-ui/react/menu";

export function Menu({ children, open, onOpenChange, ...props }) {
  return (
    <BaseMenu.Root open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </BaseMenu.Root>
  );
}

export const MenuTrigger = BaseMenu.Trigger;

export function MenuContent({ children, className = "", side = "bottom", align = "end", ...props }) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner side={side} align={align} sideOffset={6} className="z-50 outline-none select-none">
        <BaseMenu.Popup
          className={`min-w-48 rounded-md bg-white p-1 text-gray-900 shadow-lg shadow-gray-200/70 outline-1 outline-gray-200 dark:bg-gray-900 dark:text-gray-50 dark:shadow-black/50 dark:outline-gray-800 ${className}`}
          {...props}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export function MenuItem({ children, className = "", onClick, disabled, ...props }) {
  return (
    <BaseMenu.Item
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none select-none cursor-default data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 dark:data-[highlighted]:bg-gray-800 dark:data-[highlighted]:text-gray-50 ${className}`}
      {...props}
    >
      {children}
    </BaseMenu.Item>
  );
}

export function MenuSeparator({ className = "", ...props }) {
  return (
    <BaseMenu.Separator
      className={`my-1 h-px bg-gray-200 dark:bg-gray-800 ${className}`}
      {...props}
    />
  );
}
