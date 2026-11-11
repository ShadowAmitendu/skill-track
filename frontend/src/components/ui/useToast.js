import { useCallback } from "react";
import { Toast as BaseToast } from "@base-ui/react/toast";

export function useToast() {
  const { add, close } = BaseToast.useToastManager();

  const addToast = useCallback(
    ({ title, description, variant = "success", duration = 4000 }) => {
      return add({
        title,
        description,
        type: variant,
        timeout: duration,
      });
    },
    [add]
  );

  return { addToast, closeToast: close };
}
