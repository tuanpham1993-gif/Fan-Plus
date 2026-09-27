import type { Content } from "../../domain/types";
import { apiClient } from "../../shared/http/client";

export interface CommunityBookmarksResponse {
  postIds: string[];
}

export interface ContentBookmarkRecord {
  id: string;
  user_id?: number;
  content_id?: string | number;
  contentId?: string;
  note?: string;
  created_at?: string;
  createdAt?: string;
}

export interface ContentBookmarkItem {
  bookmark: ContentBookmarkRecord;
  content: Content;
}

export interface ContentBookmarksResponse {
  items: ContentBookmarkItem[];
}

export interface SetContentBookmarkResponse {
  bookmarked: boolean;
  item: ContentBookmarkItem | null;
}

export const bookmarkApi = {
  listCommunityPosts: (signal?: AbortSignal) =>
    apiClient.get<CommunityBookmarksResponse>("/community/bookmarks", {
      signal,
    }),

  setCommunityPost: (postId: string, bookmarked: boolean) =>
    apiClient.put<{ bookmarked: boolean }>(
      `/community/posts/${encodeURIComponent(postId)}/bookmark`,
      { bookmarked },
    ),

  listContents: async (signal?: AbortSignal) => {
    const raw = await apiClient.get<any>("/bookmarks", { signal });
    const items = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.items)
        ? raw.items
        : [];
    return { items } as ContentBookmarksResponse;
  },

  setContent: (contentId: string, bookmarked: boolean) =>
    apiClient.put<SetContentBookmarkResponse>(
      `/contents/${encodeURIComponent(contentId)}/bookmark`,
      { bookmarked },
    ),
};
