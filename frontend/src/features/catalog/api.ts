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

export const CATALOG_ENDPOINTS = {
  categories: "/categories",
  contents: "/contents",
  contentDetail: (id: string) => `/contents/${encodeURIComponent(id)}`,
  contentRating: (id: string) =>
    `/contents/${encodeURIComponent(id)}/rating`,
} as const;

export function normalizeContent(raw: any): Content {
  if (!raw) return {} as Content;
  const createdDate = raw.created_at ? new Date(raw.created_at) : new Date();
  const year = raw.year || (isNaN(createdDate.getFullYear()) ? 2026 : createdDate.getFullYear());
  
  return {
    id: String(raw.id || ""),
    title: raw.title || "",
    description: raw.summary || raw.description || "",
    body: raw.content || raw.body || raw.summary || "",
    categoryId: (raw.category_slug || (raw.category_id ? String(raw.category_id) : "anime")) as FandomCategoryId,
    fandom: raw.character_name || raw.category_name || raw.fandom || "General",
    type: raw.type || "article",
    genre: raw.genre || raw.category_name || "Community",
    image: raw.cover_image || raw.image || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800",
    year,
    publishedAt: raw.created_at || raw.publishedAt || new Date().toISOString(),
    popularity: raw.view_count || raw.popularity || 0,
    rating: raw.rating || 4.5,
    duration: raw.duration || "5 min read",
    tags: Array.isArray(raw.tags)
      ? raw.tags
      : typeof raw.tags === "string" && raw.tags
      ? raw.tags.split(",").map((t: string) => t.trim())
      : [],
    status: raw.status || "published",
    author: raw.author_name || raw.author || "Fan Hub Team",
    spoiler: Boolean(raw.spoiler),
    sourceLabel: raw.sourceLabel || "Backend Content",
  };
}

export function normalizeCategory(raw: any): Category {
  return {
    id: (raw.slug || (raw.id ? String(raw.id) : "cat")) as FandomCategoryId,
    name: raw.name || "",
    description: raw.description || "",
    icon: raw.icon || "folder",
    accentColor: raw.accentColor || "#3b82f6",
    contentCount: raw.content_count || 0,
  };
}

export function catalogSearchParams(query: CatalogQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category_slug", query.category);
  if (query.fandom) params.set("fandom", query.fandom);
  if (query.type) params.set("type", query.type);
  if (query.genre) params.set("genre", query.genre);
  if (query.year) params.set("year", query.year);
  if (query.popular) params.set("sort", "popular");
  if (query.sortBy) {
    const sortMap: Record<string, string> = {
      latest: "newest",
      popular: "popular",
      az: "newest",
    };
    params.set("sort", sortMap[query.sortBy] || query.sortBy);
  }
  return params;
}

export const catalogApi = {
  categories: async (signal?: AbortSignal): Promise<Category[]> => {
    try {
      const res: any = await apiClient.get(CATALOG_ENDPOINTS.categories, { signal });
      const rawList = Array.isArray(res) ? res : res?.categories || [];
      return rawList.map(normalizeCategory);
    } catch {
      return [];
    }
  },

  contents: async (query: CatalogQuery, signal?: AbortSignal): Promise<CatalogPage> => {
    const params = catalogSearchParams(query);
    const suffix = params.size ? `?${params.toString()}` : "";
    const res: any = await apiClient.get(CATALOG_ENDPOINTS.contents + suffix, {
      signal,
    });

    const rawList = Array.isArray(res) ? res : res?.contents || [];
    const items = rawList.map(normalizeContent);
    const total = res?.count ?? items.length;
    const pageSize = query.pageSize || 9;
    const page = query.page || 1;

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
      facets: {
        fandoms: [...new Set(items.map((c: Content) => c.fandom))].sort() as string[],
        genres: [...new Set(items.map((c: Content) => c.genre))].sort() as string[],
        years: [...new Set(items.map((c: Content) => c.year))].sort((a: number, b: number) => b - a) as number[],
      },
    };
  },

  detail: async (id: string, signal?: AbortSignal): Promise<ContentDetailPayload> => {
    const res: any = await apiClient.get(CATALOG_ENDPOINTS.contentDetail(id), {
      signal,
    });
    const rawContent = res?.content || res;
    const rawRelated = res?.related || [];
    return {
      content: normalizeContent(rawContent),
      related: rawRelated.map(normalizeContent),
      rating: {
        userRating: 0,
        average: 4.5,
        count: rawContent?.view_count || 1,
      },
    };
  },

  rate: async (id: string, value: number, signal?: AbortSignal): Promise<ContentRatingSummary> => {
    try {
      const res: any = await apiClient.put(
        CATALOG_ENDPOINTS.contentRating(id),
        { value },
        { signal },
      );
      return res || { userRating: value, average: value, count: 1 };
    } catch {
      return { userRating: value, average: value, count: 1 };
    }
  },
};
