import { useCallback, useEffect, useState } from "react";
import { communityBookmarkDataSource } from "./dataSource.js";
function messageOf(error) {
    return error instanceof Error ? error.message : "Bookmark request failed.";
}
export function useCommunityBookmarks({ user, onError, }) {
    const [savedIds, setSavedIds] = useState(() => new Set());
    const [pendingIds, setPendingIds] = useState(() => new Set());
    const [backendSupported, setBackendSupported] = useState(true);
    useEffect(() => {
        const controller = new AbortController();
        if (!user) {
            setSavedIds(new Set());
            setBackendSupported(true);
            return () => controller.abort();
        }
        void communityBookmarkDataSource
            .list(user, controller.signal)
            .then((snapshot) => {
            if (controller.signal.aborted)
                return;
            setSavedIds(new Set(snapshot.postIds));
            setBackendSupported(snapshot.backendSupported);
        })
            .catch((cause) => {
            if (!controller.signal.aborted)
                onError(messageOf(cause));
        });
        return () => controller.abort();
    }, [user?.id, onError]);
    const toggle = useCallback(async (postId) => {
        if (!user || pendingIds.has(postId))
            return false;
        const previous = savedIds.has(postId);
        const next = !previous;
        // Optimistic state changes immediately. Only this post is pending.
        setSavedIds((current) => {
            const copy = new Set(current);
            if (next)
                copy.add(postId);
            else
                copy.delete(postId);
            return copy;
        });
        setPendingIds((current) => new Set(current).add(postId));
        try {
            await communityBookmarkDataSource.set(user, postId, next);
            setBackendSupported(true);
            return true;
        }
        catch (cause) {
            // Roll back exactly this bookmark. Do not reset bookmarks on other posts.
            setSavedIds((current) => {
                const copy = new Set(current);
                if (previous)
                    copy.add(postId);
                else
                    copy.delete(postId);
                return copy;
            });
            onError(messageOf(cause));
            return false;
        }
        finally {
            setPendingIds((current) => {
                const copy = new Set(current);
                copy.delete(postId);
                return copy;
            });
        }
    }, [user?.id, pendingIds, savedIds, onError]);
    return {
        backendSupported,
        isBookmarked: (postId) => savedIds.has(postId),
        isPending: (postId) => pendingIds.has(postId),
        toggle,
    };
}
// Shared catalog reading-list hook. The provider is mounted once at app root so
// Explore, Detail and Account observe the same optimistic bookmark state.
export { useBookmarks } from "./BookmarksProvider.js";
