import type { Content, Filter, Page, User, Category } from "../domain/types";
import { AppError } from "./repository";
/** Proposed integration client; the delivered UI still uses the mock repository.
 * Do not enable an API mode until all resource adapters and backend ownership checks exist.
 * Backend must issue Secure/HttpOnly/SameSite cookies and validate CSRF for state changes.
 */
export async function request<T>(
  path: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  try {
    const csrf = document.cookie
      .split("; ")
      .find((x) => x.startsWith("csrftoken="))
      ?.slice(10);
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    if (options.body) headers.set("Content-Type", "application/json");
    if (csrf) headers.set("X-CSRFToken", decodeURIComponent(csrf));
    const response = await fetch("/api/v1" + path, {
      ...options,
      headers,
      credentials: "include",
      signal: controller.signal,
    });
    if (response.status === 204) return undefined as T;
    const data = await response
      .json()
      .catch(() => ({
        message: "The server returned an unreadable response.",
      }));
    if (!response.ok)
      throw new AppError(
        data.message || data.detail || "Request failed.",
        response.status,
      );
    return data as T; // Add runtime DTO validation before connecting an untrusted API.
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
export const http = {
  contents: (filter: Filter, signal?: AbortSignal) =>
    request<Page<Content>>(
      "/contents?" +
        new URLSearchParams(
          Object.entries(filter).filter(([, v]) => !!v) as [string, string][],
        ),
      {},
      signal,
    ),
  content: (id: string, signal?: AbortSignal) =>
    request<Content>("/contents/" + encodeURIComponent(id), {}, signal),
  categories: (signal?: AbortSignal) =>
    request<Category[]>("/categories", {}, signal),
  me: (signal?: AbortSignal) => request<User>("/auth/me", {}, signal),
  login: (email: string, password: string) =>
    request<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  addBookmark: (contentId: string) =>
    request("/bookmarks", {
      method: "POST",
      body: JSON.stringify({ contentId }),
    }),
  deleteBookmark: (id: string) =>
    request<void>("/bookmarks/" + encodeURIComponent(id), { method: "DELETE" }),
};
