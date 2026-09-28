import type { User } from "../../domain/types";
import type { PublicProfile } from "../types";
import { ApiError, api, apiClient } from "../../shared/http/client";

export interface ProfileServerPatch {
  name?: string;
  avatar?: string | null;
  favorite_fandoms?: string[];
  display_preferences?: Record<string, unknown>;
  phone?: string | null;
  birthday?: string | null;
  gender?: string | null;
  city?: string | null;
  bio?: string | null;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export const profileApi = {
  current: (signal?: AbortSignal) =>
    apiClient.get<{ user: User | null }>("/users/me", { signal }),

  update: (patch: ProfileServerPatch, signal?: AbortSignal) =>
    apiClient.put<{ message?: string; user: User }>("/users/me", patch, {
      signal,
    }),

  async updatePersonalInfo(
    patch: Pick<
      ProfileServerPatch,
      "phone" | "birthday" | "gender" | "city" | "bio"
    >,
  ): Promise<User> {
    const response = await apiClient.put<{ message?: string; user: User }>(
      "/users/me",
      patch,
    );
    return response.user;
  },

  changePassword: (input: PasswordChangeRequest) =>
    apiClient.put<{ message?: string; user: User }>(
      "/users/me/password",
      input,
    ),

  async uploadAvatar(file: File): Promise<User> {
    const form = new FormData();
    form.append("avatar", file);
    try {
      const response = await api<{ message?: string; user: User }>(
        "/users/me/avatar",
        { method: "POST", body: form },
      );
      return response.user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 413) {
        throw new ApiError("Ảnh quá lớn, tối đa 2MB", 413);
      }
      throw error;
    }
  },

  async removeAvatar(): Promise<User> {
    const response = await apiClient.delete<{ message?: string; user: User }>(
      "/users/me/avatar",
    );
    return response.user;
  },

  publicProfile: (id: string, signal?: AbortSignal) =>
    apiClient.get<PublicProfile>(`/users/${encodeURIComponent(id)}`, {
      signal,
    }),
};
