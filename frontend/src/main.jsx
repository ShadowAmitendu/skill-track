import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OverlaysProvider } from "@blueprintjs/core";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/ui/Toast";
import App from "./App";
import "@fontsource-variable/inter";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

async function prepareApp() {
  if (import.meta.env.DEV) {
    const demoMode = localStorage.getItem("skilltrack_demo_mode") !== "false";
    if (demoMode) {
      const { worker } = await import("./mocks/browser");
      return worker.start({
        onUnhandledFrame: "bypass",
      });
    }
  }
  return Promise.resolve();
}

prepareApp().then(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <OverlaysProvider>
            <AuthProvider>
              <ToastProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </ToastProvider>
            </AuthProvider>
          </OverlaysProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  );
});
