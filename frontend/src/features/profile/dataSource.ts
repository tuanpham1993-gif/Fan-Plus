import type { Database, User } from "../../domain/types";
import { repository } from "../../services/repository";
import { serverMode } from "../../shared/http/client";
import {
  isFandomCategoryId,
  type FandomCategoryId,
} from "../../shared/catalog/taxonomy";
import { demo } from "../demo";
import type { PublicProfile } from "../types";
import { profileApi } from "./api";

export interface EditableProfile {
  name: string;
  avatar?: string | null;
  favorite_fandoms: string[];
  display_preferences?: Record<string, unknown>;
  phone?: string | null;
  birthday?: string | null;
  gender?: string | null;
  city?: string | null;
  bio?: string | null;
}

export interface ProfileUpdateResult {
  user: User;
  legacyDb?: Database;
  unsupportedFields: Array<"name" | "avatar">;
}

function canonicalFavoriteCategories(values: string[]): FandomCategoryId[] {
  return values.filter(isFandomCategoryId);
}

export const profileDataSource = {
  async current(fallback: User | null, signal?: AbortSignal): Promise<User> {
    if (serverMode) {
      const response = await profileApi.current(signal);
      if (!response.user)
        throw new Error("Your authenticated profile is unavailable.");
      return response.user;
    }

    const local = fallback || repository.currentSessionUser();
    if (!local) throw new Error("Please sign in to edit your profile.");
    return local;
  },

  async update(
    current: User,
    input: EditableProfile,
  ): Promise<ProfileUpdateResult> {
    const favoriteFandoms = input.favorite_fandoms
      .map((value) => value.trim())
      .filter(Boolean);
    if (!input.name.trim() || input.name.trim().length > 60) {
      throw new Error("Display name must contain 1-60 characters.");
    }
    if (
      favoriteFandoms.length > 20 ||
      favoriteFandoms.some((value) => value.length > 80)
    ) {
      throw new Error(
        "Use at most 20 fandom names, each no longer than 80 characters.",
      );
    }

    const normalized: EditableProfile = {
      name: input.name.trim(),
      avatar: input.avatar,
      favorite_fandoms: favoriteFandoms,
      display_preferences: input.display_preferences,
      phone: input.phone,
      birthday: input.birthday,
      gender: input.gender,
      city: input.city,
      bio: input.bio,
    };

    if (serverMode) {
      const payload = {
        ...(normalized.name !== undefined ? { name: normalized.name } : {}),
        ...(normalized.avatar !== undefined
          ? { avatar: normalized.avatar }
          : {}),
        ...(favoriteFandoms !== undefined
          ? { favorite_fandoms: favoriteFandoms }
          : {}),
        ...(normalized.display_preferences !== undefined
          ? { display_preferences: normalized.display_preferences }
          : {}),
        ...(normalized.phone !== undefined ? { phone: normalized.phone } : {}),
        ...(normalized.birthday !== undefined
          ? { birthday: normalized.birthday }
          : {}),
        ...(normalized.gender !== undefined
          ? { gender: normalized.gender }
          : {}),
        ...(normalized.city !== undefined ? { city: normalized.city } : {}),
        ...(normalized.bio !== undefined ? { bio: normalized.bio } : {}),
      };

      const response = await profileApi.update(payload);
      return { user: response.user, unsupportedFields: [] };
    }

    const legacyDb = await repository.updateProfile(normalized);
    const user = repository.currentUser(legacyDb);
    if (!user) throw new Error("The updated demo profile could not be loaded.");
    return { user, legacyDb, unsupportedFields: [] };
  },

  publicProfile(id: string, signal?: AbortSignal): Promise<PublicProfile> {
    return serverMode
      ? profileApi.publicProfile(id, signal)
      : demo.publicProfile(id);
  },
};
