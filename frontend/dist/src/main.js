import React from "react";
import { createRoot } from "react-dom/client";
import App, { ErrorBoundary } from "./App.js";
import { AuthProvider } from "./features/auth/AuthProvider.js";
import { BookmarksProvider } from "./features/bookmarks/BookmarksProvider.js";
import { AppProvider } from "./lib/store.js";
const element = document.getElementById("root");
if (!element)
    throw new Error("Root element missing.");
createRoot(element).render(React.createElement(React.StrictMode, null,
    React.createElement(ErrorBoundary, null,
        React.createElement(AuthProvider, null,
            React.createElement(AppProvider, null,
                React.createElement(BookmarksProvider, null,
                    React.createElement(App, null)))))));
