import React from "react";
import { createRoot } from "react-dom/client";
import App, { ErrorBoundary } from "./App";
import { AuthProvider } from "./features/auth/AuthProvider";
import { BookmarksProvider } from "./features/bookmarks/BookmarksProvider";
import { AppProvider } from "./lib/store";
import "./styles.css";
const element = document.getElementById("root");
if (!element) throw new Error("Root element missing.");
createRoot(element).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <BookmarksProvider>
            <App />
          </BookmarksProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
