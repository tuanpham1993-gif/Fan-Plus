
import type {
  Category,
  Content,
  ContentDetail,
  Page,
} from "../../domain/types";

import { apiClient } from "../../shared/http/client";

import type {
  FandomCategoryId,
} from "../../shared/catalog/taxonomy";

export type CatalogSort =
  | "latest"
  | "popular"
  | "az";

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
  event: BackendEvent | null;
  rating: ContentRatingSummary;
  related?: Content[];
}

export const CATALOG_ENDPOINTS = {
  categories: "/categories",

  contents: "/contents",

  contentDetail: (id: string) =>
    `/contents/${encodeURIComponent(id)}`,

  contentRating: (id: string) =>
    `/contents/${encodeURIComponent(id)}/rating`,
} as const;

export function normalizeContent(raw: any): Content {
  if (!raw) return {} as Content;

  const rawStatus = raw.status ? String(raw.status).toUpperCase() : "";
  const status: Content["status"] =
    rawStatus === "DONE"
      ? "published"
      : rawStatus === "REJECTED"
        ? "rejected"
        : rawStatus === "PENDING"
          ? "pending"
          : "published";

  const rawType = raw.content_type ? String(raw.content_type).toLowerCase() : (raw.type ? String(raw.type).toLowerCase() : "article");
  const type: Content["type"] =
    rawType === "news" || rawType === "event" || rawType === "post" ? (rawType as Content["type"]) : "article";

  const catSlug = raw.category?.slug || raw.category_slug || (typeof raw.category_id === "string" ? raw.category_id : null);
  const categorySlugMap: Record<number, string> = {
    1: "anime",
    2: "gaming",
    3: "movies",
    4: "tv",
  };
  const categoryId =
    catSlug ||
    (typeof raw.category_id === "number" ? categorySlugMap[raw.category_id] : null) ||
    "anime";

  let mediaList: any[] = [];
  if (Array.isArray(raw.media)) {
    mediaList = raw.media.map((item: any, idx: number) => ({
      id: item.id || idx,
      media_url: item.media_url || item.url || "",
      media_type: item.media_type || "IMAGE",
    }));
  }

  const firstMediaUrl = mediaList.length > 0 ? mediaList[0].media_url : undefined;
  const image = firstMediaUrl || raw.image || raw.cover_image || raw.mediaUrl || "/art/community.svg";

  let ratingVal = 0;
  if (raw.rating && typeof raw.rating.average === "number") {
    ratingVal = raw.rating.average;
  } else if (typeof raw.rating === "number") {
    ratingVal = raw.rating;
  }

  let authorName = "Unknown author";
  if (raw.author && typeof raw.author === "object" && raw.author.name) {
    authorName = raw.author.name;
  } else if (typeof raw.author_name === "string" && raw.author_name) {
    authorName = raw.author_name;
  } else if (typeof raw.author === "string" && raw.author) {
    authorName = raw.author;
  }

  return {
    id: String(raw.id || ""),
    title: raw.title || "",
    description: raw.description || (raw.body ? raw.body.substring(0, 120) + "..." : ""),
    body: raw.body || raw.content || "",
    categoryId,
    type,
    image,
    publishedAt: raw.created_at || raw.publishedAt || new Date().toISOString(),
    rating: ratingVal,
    author: authorName,
    status,
    mediaUrl: firstMediaUrl || raw.mediaUrl,
    media: mediaList,
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
      const res: any = await apiClient.get(CATALOG_ENDPOINTS.categories, { signal });
      const rawList = Array.isArray(res) ? res : (res?.items || res?.data || []);
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
      : (res?.items || res?.contents || []);
    const items = rawList.map(normalizeContent);
    const total = res?.total ?? res?.count ?? items.length;
    const pageSize = query.pageSize || 9;
    const page = query.page || 1;

    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize) || 1,
      facets: {
        fandoms: [],
        genres: [],
        years: [],
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
    const rawEvent = res?.event || null;
    const rawRating = rawContent?.rating || res?.rating;

    const rating: ContentRatingSummary = {
      userRating: 0,
      average: typeof rawRating?.average === "number" ? rawRating.average : (typeof rawRating === "number" ? rawRating : 0),
      count: typeof rawRating?.count === "number" ? rawRating.count : 0,
    };

    return {
      content: normalizeContent(rawContent),
      event: rawEvent,
      rating,
    };
  },

  rate: async (
    id: string,
    value: number,
    signal?: AbortSignal,
  ): Promise<ContentRatingSummary> => {
    try {
      const res: any = await apiClient.put(
        CATALOG_ENDPOINTS.contentRating(id),
        { value },
        { signal },
      );

      return {
        userRating: res?.userRating ?? value,
        average: res?.average ?? value,
        count: res?.count ?? 1,
      };
    } catch {
      return {
        userRating: value,
        average: value,
        count: 1,
      };
    }
  },
};
