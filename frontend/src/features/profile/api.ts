import type { User } from "../../domain/types";
import type { PublicProfile } from "../types";
import { apiClient } from "../../shared/http/client";

export interface ProfileServerPatch {
  name?: string;
  avatar?: string | null;
  favorite_fandoms?: string[];
  display_preferences?: Record<string, unknown>;
}

export const profileApi = {
  current: (signal?: AbortSignal) =>
    apiClient.get<{ user: User | null }>("/users/me", { signal }),

  update: (patch: ProfileServerPatch, signal?: AbortSignal) =>
    apiClient.put<{ message?: string; user: User }>("/users/me", patch, {
      signal,
    }),

  publicProfile: (id: string, signal?: AbortSignal) =>
    apiClient.get<PublicProfile>(`/users/${encodeURIComponent(id)}`, {
      signal,
    }),
};
