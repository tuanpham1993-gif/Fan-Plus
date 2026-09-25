export const serverMode = typeof window !== "undefined" && window.FANHUB_RUNTIME?.api === true;
let csrf = null;
export function clearCsrf() {
    csrf = null;
}
export async function api(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    if (!["GET", "HEAD"].includes(method) && !csrf) {
        const res = await fetch("/api/v1/auth/csrf", {
            credentials: "same-origin",
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok)
            throw new Error("Unable to establish a secure session.");
        csrf = (await res.json()).data.token;
    }
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    if (options.body)
        headers.set("Content-Type", "application/json");
    if (csrf && !["GET", "HEAD"].includes(method))
        headers.set("X-CSRFToken", csrf);
    let response;
    try {
        response = await fetch("/api/v1" + path, {
            ...options,
            headers,
            credentials: "same-origin",
            signal: options.signal || AbortSignal.timeout(45000),
        });
    }
    catch (e) {
        throw new Error(e instanceof DOMException && e.name === "AbortError"
            ? "Request cancelled."
            : "The Flask service is unreachable or timed out. No simulated result was substituted.");
    }
    const result = await response.json().catch(() => null);
    if (!response.ok)
        throw new Error(result?.error?.message || `Request failed (${response.status}).`);
    return result.data;
}
export const json = (method, body) => ({
    method,
    body: JSON.stringify(body),
});
