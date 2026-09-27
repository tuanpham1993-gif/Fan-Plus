import type { Category, Content, Page } from "../../domain/types";
import { apiClient } from "../../shared/http/client";
import type { FandomCategoryId } from "../../shared/catalog/taxonomy";

export type CatalogSort = "latest" | "popular" | "az";

export interface CatalogQuery {
  q?: string;
  category?: FandomCategoryId;
  fandom?: string;
  type?: string;
  genre?: string;
  year?: string;
  popular?: boolean;
  sortBy?: CatalogSort;
  page?: number;
  pageSize?: number;
}

export interface CatalogFacets {
  fandoms?: string[];
  genres?: string[];
  years?: number[];
}

export interface CatalogPage extends Page<Content> {
  facets?: CatalogFacets;
}

export interface ContentRatingSummary {
  /** Current authenticated member's rating; 0 means not rated. */
  userRating: number;
  average: number;
  count: number;
}

export interface ContentDetailPayload {
  content: Content;
  related: Content[];
  rating: ContentRatingSummary;
}

/**
 * Required backend catalog contract. The current Flask backend does not yet
 * expose these routes; they remain explicit integration gaps until Backend
 * implements/agrees them.
 */
export const CATALOG_ENDPOINTS = {
  categories: "/categories",
  contents: "/contents",
  contentDetail: (id: string) => `/contents/${encodeURIComponent(id)}`,
  contentRating: (id: string) =>
    `/contents/${encodeURIComponent(id)}/rating`,
} as const;

export function catalogSearchParams(query: CatalogQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.fandom) params.set("fandom", query.fandom);
  if (query.type) params.set("type", query.type);
  if (query.genre) params.set("genre", query.genre);
  if (query.year) params.set("year", query.year);
  if (query.popular) params.set("popular", "true");
  if (query.sortBy) params.set("sort_by", query.sortBy);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("page_size", String(query.pageSize));
  return params;
}

export const catalogApi = {
  categories: (signal?: AbortSignal) =>
    apiClient.get<Category[]>(CATALOG_ENDPOINTS.categories, { signal }),

  contents: (query: CatalogQuery, signal?: AbortSignal) => {
    const params = catalogSearchParams(query);
    const suffix = params.size ? `?${params.toString()}` : "";
    return apiClient.get<CatalogPage>(CATALOG_ENDPOINTS.contents + suffix, {
      signal,
    });
  },

  detail: (id: string, signal?: AbortSignal) =>
    apiClient.get<ContentDetailPayload>(CATALOG_ENDPOINTS.contentDetail(id), {
      signal,
    }),

  rate: (id: string, value: number, signal?: AbortSignal) =>
    apiClient.put<ContentRatingSummary>(
      CATALOG_ENDPOINTS.contentRating(id),
      { value },
      { signal },
    ),
};
