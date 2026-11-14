import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

export async function enableMocking() {
  if (import.meta.env.DEV) {
    return worker.start({
      onUnhandledFrame: "bypass",
    });
  }
}
