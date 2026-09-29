import { repository } from "../../services/repository.js";
import { serverMode } from "../../shared/http/client.js";
import { isFandomCategoryId } from "../../shared/catalog/taxonomy.js";
import { demo } from "../demo.js";
import { profileApi } from "./api.js";
function canonicalFavoriteCategories(values) {
    return values.filter(isFandomCategoryId);
}
export const profileDataSource = {
    async current(fallback, signal) {
        if (serverMode) {
            const response = await profileApi.current(signal);
            if (!response.user)
                throw new Error("Your authenticated profile is unavailable.");
            return response.user;
        }
        const local = fallback || repository.currentSessionUser();
        if (!local)
            throw new Error("Please sign in to edit your profile.");
        return local;
    },
    async update(current, input) {
        const favoriteFandoms = input.favoriteFandoms.map((value) => value.trim()).filter(Boolean);
        if (!input.name.trim() || input.name.trim().length > 60) {
            throw new Error("Display name must contain 1-60 characters.");
        }
        if (input.bio.length > 500) {
            throw new Error("Bio must contain at most 500 characters.");
        }
        if (favoriteFandoms.length > 20 || favoriteFandoms.some((value) => value.length > 80)) {
            throw new Error("Use at most 20 fandom names, each no longer than 80 characters.");
        }
        const normalized = {
            name: input.name.trim(),
            bio: input.bio,
            favoriteCategories: canonicalFavoriteCategories(input.favoriteCategories),
            favoriteFandoms,
            avatar: input.avatar,
        };
        if (serverMode) {
            const unsupportedFields = [];
            if (normalized.name !== current.name)
                unsupportedFields.push("name");
            if ((normalized.avatar || "") !== (current.avatar || ""))
                unsupportedFields.push("avatar");
            const response = await profileApi.update({
                bio: normalized.bio,
                favoriteCategories: normalized.favoriteCategories,
                favoriteFandoms: normalized.favoriteFandoms,
            });
            return { user: response.user, unsupportedFields };
        }
        const legacyDb = await repository.updateProfile(normalized);
        const user = repository.currentUser(legacyDb);
        if (!user)
            throw new Error("The updated demo profile could not be loaded.");
        return { user, legacyDb, unsupportedFields: [] };
    },
    publicProfile(id, signal) {
        return serverMode ? profileApi.publicProfile(id, signal) : demo.publicProfile(id);
    },
};
