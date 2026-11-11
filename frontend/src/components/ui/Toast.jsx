import { Toast as BaseToast } from "@base-ui/react/toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

function ToastViewportList() {
  const { toasts } = BaseToast.useToastManager();

  const icons = {
    success: <CheckCircle2 size={16} className="text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />,
    danger: <AlertCircle size={16} className="text-red-700 dark:text-red-400 shrink-0 mt-0.5" />,
    info: <Info size={16} className="text-gray-700 dark:text-gray-300 shrink-0 mt-0.5" />,
  };

  return (
    <BaseToast.Portal>
      <BaseToast.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[22rem] max-w-[calc(100vw-2rem)] outline-none">
        {toasts.map((toast) => (
          <BaseToast.Root
            key={toast.id}
            toast={toast}
            className="relative flex items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50 p-3.5 shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/50 select-none"
          >
            {icons[toast.type] || icons.info}
            <BaseToast.Content className="flex-1 min-w-0 pr-5">
              {toast.title && (
                <BaseToast.Title className="text-sm font-medium text-gray-900 dark:text-gray-50 leading-5">
                  {toast.title}
                </BaseToast.Title>
              )}
              {toast.description && (
                <BaseToast.Description className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-normal">
                  {toast.description}
                </BaseToast.Description>
              )}
            </BaseToast.Content>
            <BaseToast.Close
              aria-label="Close notification"
              className="absolute top-2.5 right-2.5 inline-flex h-6 w-6 items-center justify-center rounded-sm text-gray-400 hover:bg-gray-200/70 hover:text-gray-900 cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus-visible:outline-gray-100"
            >
              <X size={14} />
            </BaseToast.Close>
          </BaseToast.Root>
        ))}
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
}

export function ToastProvider({ children, timeout = 4000, limit = 4 }) {
  return (
    <BaseToast.Provider timeout={timeout} limit={limit}>
      {children}
      <ToastViewportList />
    </BaseToast.Provider>
  );
}
