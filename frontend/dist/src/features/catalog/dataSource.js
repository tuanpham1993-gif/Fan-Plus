import { filterContents } from "../../domain/logic.js";
import { repository } from "../../services/repository.js";
import { ApiError, serverMode } from "../../shared/http/client.js";
import { canonicalizeCategories, } from "../../shared/catalog/taxonomy.js";
import { catalogApi, } from "./api.js";
function requireDemoDb(db) {
    if (!db)
        throw new Error("Demo catalog is still loading.");
    return db;
}
function demoPage(db, query) {
    const page = filterContents(db.contents, {
        q: query.q,
        category: query.category,
        fandom: query.fandom,
        type: query.type,
        genre: query.genre,
        year: query.year,
        popular: query.popular ? "true" : undefined,
        sort: query.sortBy,
        page: query.page ? String(query.page) : undefined,
    }, query.pageSize || 9);
    const published = db.contents.filter((content) => content.status === "published");
    return {
        ...page,
        facets: {
            fandoms: [...new Set(published.map((content) => content.fandom))].sort(),
            genres: [...new Set(published.map((content) => content.genre))].sort(),
            years: [...new Set(published.map((content) => content.year))].sort((a, b) => b - a),
        },
    };
}
function ratingSummary(db, contentId, userId) {
    const ratings = db.ratings.filter((rating) => rating.contentId === contentId);
    const userRating = userId
        ? ratings.find((rating) => rating.userId === userId)?.value || 0
        : 0;
    const average = ratings.length
        ? ratings.reduce((sum, rating) => sum + rating.value, 0) / ratings.length
        : 0;
    return {
        userRating,
        average,
        count: ratings.length,
    };
}
export function demoContentDetail(db, id, user) {
    const content = db.contents.find((candidate) => candidate.id === id &&
        (candidate.status === "published" || user?.role === "admin"));
    if (!content) {
        throw new ApiError("Content not found.", 404);
    }
    return {
        content,
        related: db.contents
            .filter((candidate) => candidate.id !== content.id &&
            candidate.categoryId === content.categoryId &&
            candidate.status === "published")
            .slice(0, 3),
        rating: ratingSummary(db, content.id, user?.id),
    };
}
async function contents(db, query, signal) {
    if (serverMode)
        return catalogApi.contents(query, signal);
    return demoPage(requireDemoDb(db), query);
}
export const catalogDataSource = {
    async categories(db, signal) {
        if (serverMode)
            return canonicalizeCategories(await catalogApi.categories(signal));
        return canonicalizeCategories(requireDemoDb(db).categories);
    },
    contents,
    favoriteCategoryContents(db, category, signal) {
        return contents(db, { category, sortBy: "popular", page: 1, pageSize: 4 }, signal);
    },
    detail(db, id, user, signal) {
        if (serverMode)
            return catalogApi.detail(id, signal);
        return Promise.resolve(demoContentDetail(requireDemoDb(db), id, user));
    },
    async rate(db, contentId, value, user, signal) {
        if (!Number.isInteger(value) || value < 1 || value > 5) {
            throw new Error("Choose a rating from 1 to 5.");
        }
        if (serverMode) {
            return {
                rating: await catalogApi.rate(contentId, value, signal),
                legacyDb: null,
            };
        }
        // Demo compatibility path only. repository.rate persists the demo record;
        // connected mode never uses this browser-backed rating source of truth.
        requireDemoDb(db);
        const nextDb = await repository.rate(contentId, value);
        return {
            rating: ratingSummary(nextDb, contentId, user.id),
            legacyDb: nextDb,
        };
    },
    async recordView(contentId) {
        // Activity is still a later refactor chunk. Preserve the existing demo
        // behavior without inventing a connected-mode endpoint here.
        if (serverMode)
            return null;
        return repository.recordView(contentId);
    },
};
