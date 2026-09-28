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
  captcha_token: string;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  captcha_token: string;
}

export const authApi = {
  async me(signal?: AbortSignal): Promise<{ user: User | null }> {
    const res = await apiClient.get<any>("/auth/me", { signal });
    return { user: res?.user || res || null };
  },

  async login(
    email: string,
    password: string,
    // Temporary: use a fixed test token while the captcha UI is hidden.
    // Remove the default and require a real widget token when captcha is implemented.
    captchaToken: string = "PASSED_TEST_TOKEN",
  ) {
    const result = await apiClient.post<any>("/auth/login", {
      email,
      password,
      captcha_token: captchaToken,
    });
    if (result?.access_token) {
      // Save both tokens — refresh_token uses Rotation, must always save new value
      setTokens(result.access_token, result.refresh_token);
    }
    return { user: result.user as User };
  },

  // These endpoints are not implemented by the current backend and return 404.
  async verify(email: string, code: string) {
    const result = await apiClient.post<{ user?: User; message?: string }>(
      "/auth/verify",
      {
        email,
        code,
      },
    );
    return {
      user: result.user as User | undefined,
      message: result.message ?? "",
    };
  },

  // These endpoints are not implemented by the current backend and return 404.
  async resendVerification(email: string) {
    const result = await apiClient.post<{
      emailSent: boolean;
      devOtp?: string;
    }>("/auth/resend-verification", {
      email,
    });
    return {
      emailSent: Boolean(result.emailSent),
      devOtp: result.devOtp ?? null,
    };
  },

  async register(input: RegisterRequest): Promise<RegisterResponse> {
    const result = await apiClient.post<any>("/auth/register", {
      name: input.name,
      email: input.email,
      password: input.password,
      captcha_token: input.captcha_token,
    });
    return {
      user: result.user as User,
      message: result.message ?? "",
    };
  },

  async logout() {
    try {
      const refreshToken = getRefreshToken();
      await apiClient.post<{ message: string }>("/auth/logout", {
        refresh_token: refreshToken,
      });
    } catch {
      // Ignore logout request error — always clear local tokens
    } finally {
      clearTokens();
    }
    return { ok: true };
  },
};
