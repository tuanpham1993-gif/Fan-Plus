import type { Content } from "../../domain/types";
import { apiClient } from "../../shared/http/client";
import { normalizeContent } from "../catalog/api";

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

function toItem(row: ContentBookmarkRecord, content: Content): ContentBookmarkItem {
  return {
    bookmark: {
      id: String(row.id),
      contentId: String(row.content_id ?? content.id),
      note: row.note ?? "",
      createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    },
    content,
  };
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

  /** GET /bookmarks returns the caller's rows; each row is joined with its content for the collection page. */
  listContents: async (signal?: AbortSignal): Promise<ContentBookmarksResponse> => {
    const raw = await apiClient.get<any>("/bookmarks?limit=100", { signal });
    const rows: ContentBookmarkRecord[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.items)
        ? raw.items
        : [];
    const items = await Promise.all(
      rows.map(async (row) => {
        const contentId = String(row.content_id ?? row.contentId ?? "");
        try {
          const detail = await apiClient.get<any>(
            `/contents/${encodeURIComponent(contentId)}`,
            { signal },
          );
          return toItem(row, normalizeContent(detail?.content || detail));
        } catch {
          return null;
        }
      }),
    );
    return { items: items.filter((x): x is ContentBookmarkItem => x !== null) };
  },

  setContent: async (
    content: Content,
    bookmarked: boolean,
  ): Promise<SetContentBookmarkResponse> => {
    if (!bookmarked) {
      await apiClient.delete(`/bookmarks/${encodeURIComponent(content.id)}`);
      return { bookmarked: false, item: null };
    }
    const row = await apiClient.post<ContentBookmarkRecord>("/bookmarks", {
      content_id: Number(content.id),
    });
    return { bookmarked: true, item: toItem(row, content) };
  },
};
