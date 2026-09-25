import React from "react";
import { createRoot } from "react-dom/client";
import App, { ErrorBoundary } from "./App.js";
import { AppProvider } from "./lib/store.js";
const element = document.getElementById("root");
if (!element)
    throw new Error("Root element missing.");
createRoot(element).render(React.createElement(React.StrictMode, null,
    React.createElement(ErrorBoundary, null,
        React.createElement(AppProvider, null,
            React.createElement(App, null)))));
