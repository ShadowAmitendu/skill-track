import { createRoot } from "react-dom/client";
import { Intent, OverlayToaster, Position, type Toaster } from "@blueprintjs/core";

let toasterPromise: Promise<Toaster> | null = null;

function getToaster(): Promise<Toaster> {
  if (!toasterPromise) {
    toasterPromise = OverlayToaster.createAsync(
      { position: Position.TOP_RIGHT },
      {
        domRenderer: (element, container) => {
          createRoot(container).render(element);
        },
      }
    );
  }
  return toasterPromise;
}

export async function showSuccess(message: string) {
  const toaster = await getToaster();
  toaster.show({ message, intent: Intent.SUCCESS, icon: "tick-circle", timeout: 3500 });
}

export async function showError(message: string) {
  const toaster = await getToaster();
  toaster.show({ message, intent: Intent.DANGER, icon: "error", timeout: 4500 });
}

export async function showInfo(message: string) {
  const toaster = await getToaster();
  toaster.show({ message, intent: Intent.PRIMARY, icon: "info-sign", timeout: 3500 });
}
