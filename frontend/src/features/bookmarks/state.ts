import type { Content } from "../../domain/types";
import type { ContentBookmarkItem } from "./api";

export function optimisticBookmarkItem(
  content: Content,
  createdAt = new Date().toISOString(),
): ContentBookmarkItem {
  return {
    bookmark: {
      id: `optimistic:${content.id}`,
      contentId: content.id,
      note: "",
      createdAt,
    },
    content,
  };
}

export function setOptimisticBookmark(
  items: ContentBookmarkItem[],
  content: Content,
  bookmarked: boolean,
  createdAt?: string,
): ContentBookmarkItem[] {
  const remaining = items.filter(
    (item) => item.bookmark.contentId !== content.id,
  );

  return bookmarked
    ? [optimisticBookmarkItem(content, createdAt), ...remaining]
    : remaining;
}

export function restoreBookmarkItem(
  items: ContentBookmarkItem[],
  contentId: string,
  previous: ContentBookmarkItem | null,
): ContentBookmarkItem[] {
  const remaining = items.filter(
    (item) => item.bookmark.contentId !== contentId,
  );
  return previous ? [previous, ...remaining] : remaining;
}
