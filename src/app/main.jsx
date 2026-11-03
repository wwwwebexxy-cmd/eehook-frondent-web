import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import "./../index.css";
import AuthAwareApplication from "./AuthAwareApplication.jsx";

const clientQuery = new QueryClient();

const application = (
  <BrowserRouter>
    <AuthAwareApplication />
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={3000}
      toastOptions={{
        style: {
          background: "#FFF3E0",
          color: "#4B636D",
          border: "1px solid #FFE0B2",
          borderRadius: "16px",
          padding: "14px 18px",
          fontWeight: "700",
        },
      }}
    />
  </BrowserRouter>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={clientQuery}>
      {application}
    </QueryClientProvider>
  </StrictMode>
);
