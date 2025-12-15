import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { InvoiceProvider } from "./contexts/InvoiceProvider.tsx";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#373b75",
    },
  },
});

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("New content available. Reload?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <InvoiceProvider>
          <App />
        </InvoiceProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
