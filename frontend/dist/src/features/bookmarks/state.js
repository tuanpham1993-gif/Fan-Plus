export function optimisticBookmarkItem(content, createdAt = new Date().toISOString()) {
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
export function setOptimisticBookmark(items, content, bookmarked, createdAt) {
    const remaining = items.filter((item) => item.bookmark.contentId !== content.id);
    return bookmarked
        ? [optimisticBookmarkItem(content, createdAt), ...remaining]
        : remaining;
}
export function restoreBookmarkItem(items, contentId, previous) {
    const remaining = items.filter((item) => item.bookmark.contentId !== contentId);
    return previous ? [previous, ...remaining] : remaining;
}
