import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { AlertTriangle, Info } from "lucide-react";

export function AlertDialog({ children, open, onOpenChange, ...props }) {
  return (
    <BaseAlertDialog.Root open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </BaseAlertDialog.Root>
  );
}

export const AlertDialogTrigger = BaseAlertDialog.Trigger;
export const AlertDialogClose = BaseAlertDialog.Close;

export function AlertDialogContent({
  children,
  className = "",
  maxWidth = "max-w-md",
  variant = "danger",
  icon: CustomIcon,
  ...props
}) {
  const iconConfig = {
    danger: {
      icon: AlertTriangle,
      color: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/60 dark:border-red-900",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/60 dark:border-amber-900",
    },
    info: {
      icon: Info,
      color: "text-gray-700 bg-gray-100 border-gray-200 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-700",
    },
  };

  const currentIcon = iconConfig[variant] || iconConfig.danger;
  const IconComponent = CustomIcon || currentIcon.icon;

  return (
    <BaseAlertDialog.Portal>
      <BaseAlertDialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 dark:opacity-60 z-50" />
      <BaseAlertDialog.Popup
        className={`fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] ${maxWidth} max-h-[calc(100dvh-2rem)] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gray-50 p-6 text-gray-900 outline-1 outline-gray-200 shadow-lg dark:bg-gray-900 dark:text-gray-50 dark:outline-gray-800 dark:shadow-black/50 ${className}`}
        {...props}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-9 h-9 rounded-md border flex items-center justify-center shrink-0 ${currentIcon.color}`}
          >
            <IconComponent size={18} />
          </div>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </BaseAlertDialog.Popup>
    </BaseAlertDialog.Portal>
  );
}

export function AlertDialogHeader({ children, className = "", ...props }) {
  return (
    <div className={`mb-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AlertDialogTitle({ children, className = "", ...props }) {
  return (
    <BaseAlertDialog.Title
      className={`text-base font-semibold text-gray-900 dark:text-gray-50 leading-6 ${className}`}
      {...props}
    >
      {children}
    </BaseAlertDialog.Title>
  );
}

export function AlertDialogDescription({ children, className = "", ...props }) {
  return (
    <BaseAlertDialog.Description
      className={`text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </BaseAlertDialog.Description>
  );
}

export function AlertDialogFooter({ children, className = "", ...props }) {
  return (
    <div
      className={`mt-5 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
