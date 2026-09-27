export const API_BASE_URL = "/api/v1";
export const serverMode = typeof window !== "undefined" && window.FANHUB_RUNTIME?.api === true;
const DEFAULT_TIMEOUT_MS = 45_000;
const CSRF_TIMEOUT_MS = 10_000;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
export class ApiError extends Error {
    status;
    requestId;
    constructor(message, status = 0, requestId) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.requestId = requestId;
    }
}
let csrfToken = null;
let csrfRequest = null;
export function clearCsrf() {
    csrfToken = null;
    csrfRequest = null;
}
function apiUrl(path) {
    if (/^https?:\/\//i.test(path)) {
        throw new ApiError("Absolute API URLs are not allowed by the shared client.");
    }
    return API_BASE_URL + (path.startsWith("/") ? path : `/${path}`);
}
async function fetchWithTimeout(input, init, timeoutMs) {
    const controller = new AbortController();
    const sourceSignal = init.signal;
    let timedOut = false;
    const abortFromSource = () => controller.abort();
    if (sourceSignal?.aborted)
        controller.abort();
    else
        sourceSignal?.addEventListener("abort", abortFromSource, { once: true });
    const timer = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);
    try {
        return await fetch(input, { ...init, signal: controller.signal });
    }
    catch (error) {
        if (sourceSignal?.aborted)
            throw new ApiError("Request cancelled.");
        if (timedOut)
            throw new ApiError("The Flask service timed out.");
        throw new ApiError("The Flask service is unreachable. No simulated result was substituted.");
    }
    finally {
        window.clearTimeout(timer);
        sourceSignal?.removeEventListener("abort", abortFromSource);
    }
}
async function readJson(response) {
    if (response.status === 204)
        return null;
    const text = await response.text();
    if (!text)
        return null;
    try {
        return JSON.parse(text);
    }
    catch {
        throw new ApiError("The server returned an unreadable JSON response.", response.status);
    }
}
function failureFrom(payload, status) {
    const failure = payload;
    return new ApiError(failure?.error?.message || `Request failed (${status}).`, status, failure?.error?.requestId);
}
async function csrf(signal) {
    if (csrfToken)
        return csrfToken;
    if (csrfRequest)
        return csrfRequest;
    csrfRequest = (async () => {
        const response = await fetchWithTimeout(apiUrl("/auth/csrf"), {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: "same-origin",
            signal,
        }, CSRF_TIMEOUT_MS);
        const payload = await readJson(response);
        if (!response.ok)
            throw failureFrom(payload, response.status);
        const token = payload
            ?.data?.token;
        if (typeof token !== "string" || !token) {
            throw new ApiError("The server did not return a valid CSRF token.", response.status);
        }
        csrfToken = token;
        return token;
    })();
    try {
        return await csrfRequest;
    }
    finally {
        csrfRequest = null;
    }
}
export async function api(path, options = {}) {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, ...requestInit } = options;
    const method = (requestInit.method || "GET").toUpperCase();
    const headers = new Headers(requestInit.headers);
    headers.set("Accept", "application/json");
    if (requestInit.body &&
        typeof requestInit.body === "string" &&
        !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    if (!SAFE_METHODS.has(method)) {
        headers.set("X-CSRFToken", await csrf(requestInit.signal || undefined));
    }
    const response = await fetchWithTimeout(apiUrl(path), {
        ...requestInit,
        method,
        headers,
        credentials: "same-origin",
    }, timeoutMs);
    const payload = await readJson(response);
    if (!response.ok) {
        const error = failureFrom(payload, response.status);
        if (response.status === 403 &&
            error.message.toLowerCase().includes("security token")) {
            clearCsrf();
        }
        throw error;
    }
    if (response.status === 204)
        return undefined;
    if (!payload || typeof payload !== "object" || !("data" in payload)) {
        throw new ApiError("The server returned an invalid API response envelope.", response.status);
    }
    return payload.data;
}
export const apiClient = {
    get: (path, options = {}) => api(path, { ...options, method: "GET" }),
    post: (path, body, options = {}) => api(path, {
        ...options,
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
    }),
    put: (path, body, options = {}) => api(path, {
        ...options,
        method: "PUT",
        body: body === undefined ? undefined : JSON.stringify(body),
    }),
    patch: (path, body, options = {}) => api(path, {
        ...options,
        method: "PATCH",
        body: body === undefined ? undefined : JSON.stringify(body),
    }),
    delete: (path, options = {}) => api(path, { ...options, method: "DELETE" }),
};
// Temporary compatibility helper for repository/data-source call sites that already
// build RequestInit manually. New feature code should prefer apiClient methods.
export const json = (method, body) => ({
    method,
    body: JSON.stringify(body),
});
