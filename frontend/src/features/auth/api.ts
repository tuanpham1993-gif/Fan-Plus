import type { User } from "../../domain/types";
import { apiClient, clearCsrf } from "../../shared/http/client";

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  favoriteCategories: string[];
}

export interface RegisterResponse {
  user: User;
  verification: "demo-auto-verified" | "code-sent";
  emailSent: boolean;
  devOtp?: string;
}

export interface VerificationResponse {
  user: User;
}

export interface ResendVerificationResponse {
  emailSent: boolean;
  devOtp?: string;
}

export const authApi = {
  me: (signal?: AbortSignal) =>
    apiClient.get<{ user: User | null }>("/auth/me", { signal }),

  async login(email: string, password: string) {
    const result = await apiClient.post<{ user: User }>("/auth/login", {
      email,
      password,
    });
    // Flask clears/rotates the session during login, so the pre-login CSRF token
    // must never be reused for the authenticated session.
    clearCsrf();
    return result;
  },

  register: (input: RegisterRequest) =>
    apiClient.post<RegisterResponse>("/auth/register", input),

  verify: (email: string, code: string) =>
    apiClient.post<VerificationResponse>("/auth/verify", { email, code }),

  resendVerification: (email: string) =>
    apiClient.post<ResendVerificationResponse>("/auth/verify/resend", { email }),

  async logout() {
    try {
      return await apiClient.post<{ ok: boolean }>("/auth/logout");
    } finally {
      // Logout clears the Flask session even though this request itself needs
      // the old session-bound CSRF token.
      clearCsrf();
    }
  },
};
