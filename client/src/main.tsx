import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import "@blueprintjs/table/lib/css/table.css";
import "@blueprintjs/datetime2/lib/css/blueprint-datetime2.css";
import "./styles/app.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { FocusStyleManager, OverlaysProvider } from "@blueprintjs/core";
import App from "./App";

FocusStyleManager.onlyShowFocusOnTabs();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OverlaysProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </OverlaysProvider>
  </React.StrictMode>
);
