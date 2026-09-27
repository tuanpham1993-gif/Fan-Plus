import type { User } from "../../domain/types";
import type { PublicProfile } from "../types";
import { apiClient } from "../../shared/http/client";
import type { FandomCategoryId } from "../../shared/catalog/taxonomy";

export interface ProfileServerPatch {
  bio: string;
  favoriteCategories: FandomCategoryId[];
  favoriteFandoms: string[];
}

export const profileApi = {
  current: (signal?: AbortSignal) =>
    apiClient.get<{ user: User | null }>("/auth/me", { signal }),

  update: (patch: ProfileServerPatch, signal?: AbortSignal) =>
    apiClient.patch<{ user: User }>("/auth/profile", patch, { signal }),

  publicProfile: (id: string, signal?: AbortSignal) =>
    apiClient.get<PublicProfile>(`/users/${encodeURIComponent(id)}`, { signal }),
};
