import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

export function Dialog({ children, open, onOpenChange, ...props }) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </BaseDialog.Root>
  );
}

export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export function DialogContent({
  children,
  className = "",
  showClose = true,
  maxWidth = "max-w-lg",
  ...props
}) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 dark:opacity-60 z-50" />
      <BaseDialog.Popup
        className={`fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] ${maxWidth} max-h-[calc(100dvh-2rem)] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gray-50 p-6 text-gray-900 outline-1 outline-gray-200 shadow-lg dark:bg-gray-900 dark:text-gray-50 dark:outline-gray-800 dark:shadow-black/50 ${className}`}
        {...props}
      >
        {children}
        {showClose && (
          <BaseDialog.Close
            className="absolute top-4 right-4 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200/70 hover:text-gray-900 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:outline-gray-100"
            aria-label="Close dialog"
          >
            <X size={16} />
          </BaseDialog.Close>
        )}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DialogHeader({ children, className = "", ...props }) {
  return (
    <div className={`mb-4 pr-8 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = "", ...props }) {
  return (
    <BaseDialog.Title
      className={`text-base font-semibold text-gray-900 dark:text-gray-50 leading-6 ${className}`}
      {...props}
    >
      {children}
    </BaseDialog.Title>
  );
}

export function DialogDescription({ children, className = "", ...props }) {
  return (
    <BaseDialog.Description
      className={`text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </BaseDialog.Description>
  );
}

export function DialogFooter({ children, className = "", ...props }) {
  return (
    <div
      className={`mt-5 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
