import "nfse-ds/theme-fonts.css";
import "nfse-ds/theme.css";
import "nfse-ds/componentes.css";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
