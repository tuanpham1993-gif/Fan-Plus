// Shared HTTP boundary for Flask-backed frontend feature.
declare global {
  interface Window {
    FANHUB_RUNTIME?: { api: boolean };
  }
}

export const API_BASE_URL = "/api";
export const serverMode =
  typeof window !== "undefined" && window.FANHUB_RUNTIME?.api === true;

const DEFAULT_TIMEOUT_MS = 45_000;

const ACCESS_TOKEN_KEY = "fanhub_access_token";
const REFRESH_TOKEN_KEY = "fanhub_refresh_token";

export function getAccessToken(): string | null {
  return typeof localStorage !== "undefined"
    ? localStorage.getItem(ACCESS_TOKEN_KEY)
    : null;
}

export function getRefreshToken(): string | null {
  return typeof localStorage !== "undefined"
    ? localStorage.getItem(REFRESH_TOKEN_KEY)
    : null;
}

export function setTokens(access: string, refresh?: string) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    }
  }
}

export function clearTokens() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function clearCsrf() {
  // Legacy stub for CSRF clear
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiError extends Error {
  readonly status: number;
  readonly requestId?: string;

  constructor(message: string, status = 0, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
  }
}

function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    throw new ApiError("Absolute API URLs are not allowed by the shared client.");
  }
  return API_BASE_URL + (path.startsWith("/") ? path : `/${path}`);
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const sourceSignal = init.signal;
  let timedOut = false;

  const abortFromSource = () => controller.abort();
  if (sourceSignal?.aborted) controller.abort();
  else sourceSignal?.addEventListener("abort", abortFromSource, { once: true });

  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (sourceSignal?.aborted) throw new ApiError("Request cancelled.");
    if (timedOut) throw new ApiError("The Flask service timed out.");
    throw new ApiError(
      "The Flask service is unreachable. Ensure the backend is running.",
    );
  } finally {
    window.clearTimeout(timer);
    sourceSignal?.removeEventListener("abort", abortFromSource);
  }
}

async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(
      "The server returned an unreadable JSON response.",
      response.status,
    );
  }
}

function failureFrom(payload: any, status: number) {
  const msg =
    payload?.message ||
    payload?.error?.message ||
    payload?.error ||
    `Request failed (${status}).`;
  return new ApiError(msg, status, payload?.error?.requestId);
}

export async function api<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...requestInit } = options;
  const method = (requestInit.method || "GET").toUpperCase();
  const headers = new Headers(requestInit.headers);

  headers.set("Accept", "application/json");
  if (
    requestInit.body &&
    typeof requestInit.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetchWithTimeout(
    apiUrl(path),
    {
      ...requestInit,
      method,
      headers,
    },
    timeoutMs,
  );

  // If 401 Unauthorized and refresh token is available, attempt token refresh once
  if (response.status === 401 && getRefreshToken() && path !== "/auth/refresh") {
    try {
      const refreshRes = await fetchWithTimeout(
        apiUrl("/auth/refresh"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ refresh_token: getRefreshToken() }),
        },
        10_000,
      );
      if (refreshRes.ok) {
        const refreshData: any = await readJson(refreshRes);
        const newAccessToken = refreshData?.access_token;
        if (newAccessToken) {
          setTokens(newAccessToken);
          headers.set("Authorization", `Bearer ${newAccessToken}`);
          response = await fetchWithTimeout(
            apiUrl(path),
            {
              ...requestInit,
              method,
              headers,
            },
            timeoutMs,
          );
        }
      } else {
        clearTokens();
      }
    } catch {
      clearTokens();
    }
  }

  const payload: any = await readJson(response);

  if (!response.ok) {
    throw failureFrom(payload, response.status);
  }
  if (response.status === 204) return undefined as T;

  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, options: Omit<ApiRequestOptions, "method"> = {}) =>
    api<T>(path, { ...options, method: "GET" }),
  post: <T>(
    path: string,
    body?: unknown,
    options: Omit<ApiRequestOptions, "method" | "body"> = {},
  ) =>
    api<T>(path, {
      ...options,
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(
    path: string,
    body?: unknown,
    options: Omit<ApiRequestOptions, "method" | "body"> = {},
  ) =>
    api<T>(path, {
      ...options,
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(
    path: string,
    body?: unknown,
    options: Omit<ApiRequestOptions, "method" | "body"> = {},
  ) =>
    api<T>(path, {
      ...options,
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string, options: Omit<ApiRequestOptions, "method"> = {}) =>
    api<T>(path, { ...options, method: "DELETE" }),
};

export const json = (method: string, body: unknown): ApiRequestOptions => ({
  method,
  body: JSON.stringify(body),
});
