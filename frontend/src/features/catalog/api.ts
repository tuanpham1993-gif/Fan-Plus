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
  contentRating: "/reviews",
  contentRatingSummary: (id: string) =>
    `/reviews/content/${encodeURIComponent(id)}/summary`,
} as const;

export function normalizeContent(raw: any): Content {
  if (!raw) return {} as Content;
  const createdDate = raw.created_at ? new Date(raw.created_at) : new Date();
  const year =
    raw.year ||
    (isNaN(createdDate.getFullYear()) ? 2026 : createdDate.getFullYear());

  const categorySlugMap: Record<number, FandomCategoryId> = {
    1: "anime",
    2: "gaming",
    3: "movies",
    4: "tv",
  };

  const catId =
    typeof raw.category_id === "number"
      ? categorySlugMap[raw.category_id] || "anime"
      : raw.category_slug || "anime";
  const characterName =
    raw.characters && raw.characters.length > 0 ? raw.characters[0].name : null;

  return {
    id: String(raw.id || ""),
    title: raw.title || "",
    description: raw.body
      ? raw.body.substring(0, 120) + "..."
      : raw.summary || "",
    body: raw.body || raw.content || "",
    categoryId: catId as FandomCategoryId,
    fandom: characterName || raw.fandom || "General Community",
    type: (raw.content_type
      ? raw.content_type.toLowerCase()
      : raw.type || "article") as Content["type"],
    genre: raw.genre || "General",
    image:
      raw.image ||
      raw.cover_image ||
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800",
    year,
    publishedAt: raw.created_at || new Date().toISOString(),
    popularity: Number(raw.like_count || 0),
    rating: 4.8,
    duration: "5 min read",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    status: raw.status === "DONE" ? "published" : "published",
    author: raw.author_name || `Author #${raw.author_id || 1}`,
    spoiler: false,
    sourceLabel: "Backend Content",
  };
}

export function normalizeCategory(raw: any): Category {
  const categorySlugMap: Record<number, FandomCategoryId> = {
    1: "anime",
    2: "gaming",
    3: "movies",
    4: "tv",
  };

  const rawId = raw.category_id || raw.id;
  const id =
    raw.slug ||
    (typeof rawId === "number" ? categorySlugMap[rawId] : rawId) ||
    String(rawId || "anime");

  return {
    id: id as FandomCategoryId,
    name: raw.name || "",
    description: raw.description || "",
    icon: raw.icon || "folder",
    color: raw.color || raw.accentColor || "#3b82f6",
    accentColor: raw.accentColor || raw.color || "#3b82f6",
    contentCount: raw.content_count || 0,
  };
}

export function catalogSearchParams(query: CatalogQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set("title", query.q);

  if (query.category) {
    const categoryIdMap: Record<string, number> = {
      anime: 1,
      gaming: 2,
      movies: 3,
      tv: 4,
    };
    const id =
      categoryIdMap[query.category] || Number.parseInt(query.category, 10);
    if (!Number.isNaN(id)) {
      params.set("category_id", String(id));
    }
  }

  if (query.type) params.set("content_type", query.type);
  if (query.page && query.pageSize) {
    const skip = (query.page - 1) * query.pageSize;
    params.set("skip", String(skip));
    params.set("limit", String(query.pageSize));
  }
  return params;
}

export const catalogApi = {
  categories: async (signal?: AbortSignal): Promise<Category[]> => {
    try {
      const res: any = await apiClient.get("/categories", { signal });
      const rawList = Array.isArray(res) ? res : res?.data || [];
      return rawList.map(normalizeCategory);
    } catch {
      return [];
    }
  },

  contents: async (
    query: CatalogQuery,
    signal?: AbortSignal,
  ): Promise<CatalogPage> => {
    const params = catalogSearchParams(query);
    const suffix = params.size ? `?${params.toString()}` : "";
    const res: any = await apiClient.get(CATALOG_ENDPOINTS.contents + suffix, {
      signal,
    });

    const rawList = Array.isArray(res)
      ? res
      : res?.items || res?.contents || [];
    const items = rawList.map(normalizeContent);
    const total = res?.total ?? res?.count ?? items.length;
    const pageSize = query.pageSize || 9;
    const page = query.page || 1;

    const years = [...new Set(items.map((c: Content) => c.year))] as number[];
    years.sort((a, b) => b - a);

    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 1,
      facets: {
        fandoms: [
          ...new Set(items.map((c: Content) => c.fandom)),
        ].sort() as string[],
        genres: [
          ...new Set(items.map((c: Content) => c.genre)),
        ].sort() as string[],
        years,
      },
    };
  },

  detail: async (
    id: string,
    signal?: AbortSignal,
  ): Promise<ContentDetailPayload> => {
    const res: any = await apiClient.get(CATALOG_ENDPOINTS.contentDetail(id), {
      signal,
    });
    const rawContent = res?.content || res;
    const rawRelated = res?.related || [];
    let rating = { userRating: 0, average: 0, count: 0 };
    try {
      rating = await apiClient.get<ContentRatingSummary>(
        CATALOG_ENDPOINTS.contentRatingSummary(id),
        { signal },
      );
    } catch {
      /* the page still renders without the rating summary */
    }
    return {
      content: { ...normalizeContent(rawContent), rating: rating.average },
      related: rawRelated.map(normalizeContent),
      rating,
    };
  },

  /** One review per user and content: POST /reviews creates it or updates the existing one. */
  rate: async (
    id: string,
    value: number,
    signal?: AbortSignal,
  ): Promise<ContentRatingSummary> => {
    const res: any = await apiClient.post(
      CATALOG_ENDPOINTS.contentRating,
      { content_id: Number(id), rating: value },
      { signal },
    );
    return res?.summary || { userRating: value, average: value, count: 1 };
  },
};
