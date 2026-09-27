import { api, apiClient } from "../../shared/http/client";

export interface CategoryRecord {
  category_id: number;
  name: string;
  description: string | null;
}

export interface CharacterRecord {
  character_id: number;
  category_id: number;
  name: string;
  bio: string | null;
  image_url: string | null;
}

export interface MerchandiseRecord {
  item_id: number;
  category_id: number;
  character_id: number | null;
  name: string;
  tag: string | null;
  is_upcoming: boolean;
  image_url: string | null;
}

export interface ResourcePage<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const RESOURCE_ENDPOINTS = {
  categories: "/categories",
  characters: "/characters",
  character: (id: number | string) => `/characters/${encodeURIComponent(id)}`,
  merchandise: "/merchandise",
  merchandiseItem: (id: number | string) =>
    `/merchandise/${encodeURIComponent(id)}`,
} as const;

export function imageSource(imageUrl: string | null | undefined) {
  if (!imageUrl) return "/art/community.svg";
  if (/^(https?:)?\/\//i.test(imageUrl) || imageUrl.startsWith("data:"))
    return imageUrl;
  return `/${imageUrl.replace(/^\.\//, "").replace(/^\//, "")}`;
}

function queryString(values: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.size ? `?${params.toString()}` : "";
}

function pageFromResponse<T>(response: ListResponse<T>): ResourcePage<T> {
  const meta = response.meta;
  return {
    items: Array.isArray(response.data) ? response.data : [],
    page: meta?.page || 1,
    limit: meta?.limit || 10,
    total: meta?.total || 0,
    pages: meta?.pages || 1,
  };
}

export const resourceApi = {
  categories: (signal?: AbortSignal) =>
    apiClient.get<CategoryRecord[]>(RESOURCE_ENDPOINTS.categories, {
      signal,
      apiPrefix: false,
    }),

  createCategory: (body: Pick<CategoryRecord, "name" | "description">) =>
    apiClient.post<CategoryRecord>(RESOURCE_ENDPOINTS.categories, body, {
      apiPrefix: false,
    }),

  updateCategory: (
    id: number,
    body: Partial<Pick<CategoryRecord, "name" | "description">>,
  ) => apiClient.put<CategoryRecord>(`${RESOURCE_ENDPOINTS.categories}/${id}`, body, {
    apiPrefix: false,
  }),

  deleteCategory: (id: number) =>
    apiClient.delete<void>(`${RESOURCE_ENDPOINTS.categories}/${id}`, {
      apiPrefix: false,
    }),

  async characters(
    filters: {
      category_id?: number;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
    signal?: AbortSignal,
  ) {
    const response = await apiClient.getEnvelope<ListResponse<CharacterRecord>>(
      RESOURCE_ENDPOINTS.characters + queryString(filters),
      { signal, apiPrefix: false },
    );
    return pageFromResponse(response);
  },

  character: (id: number, signal?: AbortSignal) =>
    apiClient.get<CharacterRecord>(RESOURCE_ENDPOINTS.character(id), {
      signal,
      apiPrefix: false,
    }),

  saveCharacter: (id: number | null, body: FormData) =>
    api(
      id === null ? RESOURCE_ENDPOINTS.characters : RESOURCE_ENDPOINTS.character(id),
      { method: id === null ? "POST" : "PUT", body, apiPrefix: false },
    ) as Promise<CharacterRecord>,

  deleteCharacter: (id: number) =>
    apiClient.delete<void>(RESOURCE_ENDPOINTS.character(id), {
      apiPrefix: false,
    }),

  async merchandise(
    filters: {
      category_id?: number;
      character_id?: number;
      tag?: string;
      is_upcoming?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
    signal?: AbortSignal,
  ) {
    const response = await apiClient.getEnvelope<ListResponse<MerchandiseRecord>>(
      RESOURCE_ENDPOINTS.merchandise + queryString(filters),
      { signal, apiPrefix: false },
    );
    return pageFromResponse(response);
  },

  merchandiseItem: (id: number, signal?: AbortSignal) =>
    apiClient.get<MerchandiseRecord>(RESOURCE_ENDPOINTS.merchandiseItem(id), {
      signal,
      apiPrefix: false,
    }),

  saveMerchandise: (id: number | null, body: FormData) =>
    api(
      id === null
        ? RESOURCE_ENDPOINTS.merchandise
        : RESOURCE_ENDPOINTS.merchandiseItem(id),
      { method: id === null ? "POST" : "PUT", body, apiPrefix: false },
    ) as Promise<MerchandiseRecord>,

  deleteMerchandise: (id: number) =>
    apiClient.delete<void>(RESOURCE_ENDPOINTS.merchandiseItem(id), {
      apiPrefix: false,
    }),
};
