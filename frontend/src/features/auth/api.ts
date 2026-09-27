import type { User } from "../../domain/types";
import {
  apiClient,
  setTokens,
  getRefreshToken,
  clearTokens,
} from "../../shared/http/client";

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  favoriteCategories?: string[];
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
  async me(signal?: AbortSignal): Promise<{ user: User | null }> {
    const res = await apiClient.get<any>("/auth/me", { signal });
    return { user: res?.user || res || null };
  },

  async login(email: string, password: string) {
    const result = await apiClient.post<any>("/auth/login", {
      email,
      password,
    });
    if (result?.access_token) {
      setTokens(result.access_token, result.refresh_token);
    }
    return { user: result.user };
  },

  async register(input: RegisterRequest): Promise<RegisterResponse> {
    const result = await apiClient.post<any>("/auth/register", {
      name: input.name,
      email: input.email,
      password: input.password,
    });
    return {
      user: result.user,
      verification: "demo-auto-verified",
      emailSent: false,
    };
  },

  verify: (email: string, code: string) =>
    apiClient.post<VerificationResponse>("/auth/verify", { email, code }),

  resendVerification: (email: string) =>
    apiClient.post<ResendVerificationResponse>("/auth/verify/resend", { email }),

  async logout() {
    try {
      const refreshToken = getRefreshToken();
      await apiClient.post<{ message: string }>("/auth/logout", {
        refresh_token: refreshToken,
      });
    } catch {
      // Ignore logout request error
    } finally {
      clearTokens();
    }
    return { ok: true };
  },
};
