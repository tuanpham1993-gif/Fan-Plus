import { AppError } from "./repository.js";
/** Proposed integration client; the delivered UI still uses the mock repository.
 * Do not enable an API mode until all resource adapters and backend ownership checks exist.
 * Backend must issue Secure/HttpOnly/SameSite cookies and validate CSRF for state changes.
 */
export async function request(path, options = {}, signal) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted)
        controller.abort();
    try {
        const csrf = document.cookie
            .split("; ")
            .find((x) => x.startsWith("csrftoken="))
            ?.slice(10);
        const headers = new Headers(options.headers);
        headers.set("Accept", "application/json");
        if (options.body)
            headers.set("Content-Type", "application/json");
        if (csrf)
            headers.set("X-CSRFToken", decodeURIComponent(csrf));
        const response = await fetch("/api/v1" + path, {
            ...options,
            headers,
            credentials: "include",
            signal: controller.signal,
        });
        if (response.status === 204)
            return undefined;
        const data = await response
            .json()
            .catch(() => ({
            message: "The server returned an unreadable response.",
        }));
        if (!response.ok)
            throw new AppError(data.message || data.detail || "Request failed.", response.status);
        return data; // Add runtime DTO validation before connecting an untrusted API.
    }
    finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
    }
}
export const http = {
    contents: (filter, signal) => request("/contents?" +
        new URLSearchParams(Object.entries(filter).filter(([, v]) => !!v)), {}, signal),
    content: (id, signal) => request("/contents/" + encodeURIComponent(id), {}, signal),
    categories: (signal) => request("/categories", {}, signal),
    me: (signal) => request("/auth/me", {}, signal),
    login: (email, password) => request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    }),
    logout: () => request("/auth/logout", { method: "POST" }),
    addBookmark: (contentId) => request("/bookmarks", {
        method: "POST",
        body: JSON.stringify({ contentId }),
    }),
    deleteBookmark: (id) => request("/bookmarks/" + encodeURIComponent(id), { method: "DELETE" }),
};
