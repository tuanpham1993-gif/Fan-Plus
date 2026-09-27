import type { Content } from "../../domain/types";
import { apiClient } from "../../shared/http/client";

export interface CommunityBookmarksResponse {
  postIds: string[];
}

export interface ContentBookmarkRecord {
  id: string;
  contentId: string;
  note: string;
  createdAt: string;
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

  listContents: (signal?: AbortSignal) =>
    apiClient.get<ContentBookmarksResponse>("/bookmarks", { signal }),

  setContent: (contentId: string, bookmarked: boolean) =>
    apiClient.put<SetContentBookmarkResponse>(
      `/contents/${encodeURIComponent(contentId)}/bookmark`,
      { bookmarked },
    ),
};
