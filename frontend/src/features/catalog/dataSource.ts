import type { Database, User } from "../../domain/types";
import { filterContents } from "../../domain/logic";
import { repository } from "../../services/repository";
import { ApiError, serverMode } from "../../shared/http/client";
import {
  canonicalizeCategories,
  type FandomCategoryId,
} from "../../shared/catalog/taxonomy";
import {
  catalogApi,
  type CatalogPage,
  type CatalogQuery,
  type ContentDetailPayload,
  type ContentRatingSummary,
} from "./api";

function requireDemoDb(db: Database | null) {
  if (!db) throw new Error("Demo catalog is still loading.");
  return db;
}

function demoPage(db: Database, query: CatalogQuery): CatalogPage {
  const page = filterContents(
    db.contents,
    {
      q: query.q,
      category: query.category,
      type: query.type,
      sort: query.sortBy,
      page: query.page ? String(query.page) : undefined,
    },
    query.pageSize || 9,
  );
  return {
    ...page,
    facets: {
      fandoms: [],
      genres: [],
      years: [],
    },
  };
}

function ratingSummary(
  db: Database,
  contentId: string,
  userId?: string,
): ContentRatingSummary {
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

export function demoContentDetail(
  db: Database,
  id: string,
  user: User | null,
): ContentDetailPayload {
  const content = db.contents.find(
    (candidate) =>
      candidate.id === id &&
      (candidate.status === "published" || user?.role === "admin"),
  );

  if (!content) {
    throw new ApiError("Content not found.", 404);
  }

  return {
    content,
    event: null,
    rating: ratingSummary(db, content.id, user?.id),
  };
}

async function contents(
  db: Database | null,
  query: CatalogQuery,
  signal?: AbortSignal,
): Promise<CatalogPage> {
  if (serverMode) return catalogApi.contents(query, signal);
  return demoPage(requireDemoDb(db), query);
}

export interface RatingMutationResult {
  rating: ContentRatingSummary;
  legacyDb: Database | null;
}

export const catalogDataSource = {
  async categories(db: Database | null, signal?: AbortSignal) {
    if (serverMode)
      return canonicalizeCategories(await catalogApi.categories(signal));
    return canonicalizeCategories(requireDemoDb(db).categories);
  },

  contents,

  favoriteCategoryContents(
    db: Database | null,
    category: FandomCategoryId,
    signal?: AbortSignal,
  ) {
    return contents(
      db,
      { category, sortBy: "popular", page: 1, pageSize: 4 },
      signal,
    );
  },

  detail(
    db: Database | null,
    id: string,
    user: User | null,
    signal?: AbortSignal,
  ) {
    if (serverMode) return catalogApi.detail(id, signal);
    return Promise.resolve(demoContentDetail(requireDemoDb(db), id, user));
  },

  async rate(
    db: Database | null,
    contentId: string,
    value: number,
    user: User,
    signal?: AbortSignal,
  ): Promise<RatingMutationResult> {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error("Choose a rating from 1 to 5.");
    }

    if (serverMode) {
      return {
        rating: await catalogApi.rate(contentId, value, signal),
        legacyDb: null,
      };
    }

    requireDemoDb(db);
    const nextDb = await repository.rate(contentId, value);
    return {
      rating: ratingSummary(nextDb, contentId, user.id),
      legacyDb: nextDb,
    };
  },

  async recordView(contentId: string) {
    if (serverMode) return null;
    return repository.recordView(contentId);
  },
};
