import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import AppRouter from "./router";
import QueryProvider from "./providers/QueryProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <ThemeProvider defaultTheme="light" storageKey="stravo-theme">
        <AppRouter />
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </QueryProvider>
  </React.StrictMode>,
);
