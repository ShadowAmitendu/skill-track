import { useCallback, useEffect, useMemo, useRef } from "react";
import { Intent, OverlayToaster, Position } from "@blueprintjs/core";
import { ToastContext } from "./toast-context";

const intentMap = {
  success: Intent.SUCCESS,
  error: Intent.DANGER,
  danger: Intent.DANGER,
  warning: Intent.WARNING,
  info: Intent.PRIMARY,
};

const iconMap = {
  success: "tick-circle",
  error: "error",
  danger: "error",
  warning: "warning-sign",
  info: "info-sign",
};

export function ToastProvider({ children }) {
  const toasterRef = useRef(null);

  useEffect(() => {
    let active = true;
    OverlayToaster.createAsync({ position: Position.TOP_RIGHT }).then((instance) => {
      if (active) {
        toasterRef.current = instance;
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const addToast = useCallback(
    ({ title, description, variant = "success", duration = 4000 }) => {
      const intent = intentMap[variant] || Intent.SUCCESS;
      const icon = iconMap[variant] || "info-sign";
      const message = (
        <div>
          {title && <div className="font-semibold text-sm">{title}</div>}
          {description && <div className="text-xs mt-0.5">{description}</div>}
        </div>
      );

      toasterRef.current?.show({
        message,
        intent,
        icon,
        timeout: duration,
      });
    },
    []
  );

  const dismissToast = useCallback((key) => {
    if (key) toasterRef.current?.dismiss(key);
    else toasterRef.current?.clear();
  }, []);

  const contextValue = useMemo(
    () => ({ addToast, dismissToast }),
    [addToast, dismissToast]
  );

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
}
