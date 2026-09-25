// Only deployment configuration belongs in this public object. Never put an API key here.
declare global {
  interface Window {
    FANHUB_RUNTIME?: { api: boolean };
  }
}
export const serverMode =
  typeof window !== "undefined" && window.FANHUB_RUNTIME?.api === true;
let csrf: string | null = null;
export function clearCsrf() {
  csrf = null;
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  if (!["GET", "HEAD"].includes(method) && !csrf) {
    const res = await fetch("/api/v1/auth/csrf", {
      credentials: "same-origin",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error("Unable to establish a secure session.");
    csrf = (await res.json()).data.token;
  }
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (csrf && !["GET", "HEAD"].includes(method))
    headers.set("X-CSRFToken", csrf);
  let response: Response;
  try {
    response = await fetch("/api/v1" + path, {
      ...options,
      headers,
      credentials: "same-origin",
      signal: options.signal || AbortSignal.timeout(45000),
    });
  } catch (e) {
    throw new Error(
      e instanceof DOMException && e.name === "AbortError"
        ? "Request cancelled."
        : "The Flask service is unreachable or timed out. No simulated result was substituted.",
    );
  }
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      result?.error?.message || `Request failed (${response.status}).`,
    );
  return result.data as T;
}
export const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
