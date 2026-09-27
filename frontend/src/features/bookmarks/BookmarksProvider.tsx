import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Content } from "../../domain/types";
import { useApp } from "../../lib/store";
import { ApiError, serverMode } from "../../shared/http/client";
import { useAuth } from "../auth/AuthProvider";
import type { ContentBookmarkItem } from "./api";
import { contentBookmarkDataSource } from "./dataSource";
import { restoreBookmarkItem, setOptimisticBookmark } from "./state";

type BookmarkStatus = "idle" | "loading" | "success" | "error";

interface BookmarksContextValue {
  status: BookmarkStatus;
  items: ContentBookmarkItem[];
  error: string;
  backendSupported: boolean;
  notesSupported: boolean;
  count: number;
  reload: () => Promise<void>;
  isBookmarked: (contentId: string) => boolean;
  isPending: (contentId: string) => boolean;
  toggle: (content: Content) => Promise<boolean>;
  saveNote: (bookmarkId: string, note: string) => Promise<boolean>;
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

function messageOf(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Your reading list could not be updated.";
}

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { db, setDb } = useApp();
  const [status, setStatus] = useState<BookmarkStatus>("idle");
  const [items, setItems] = useState<ContentBookmarkItem[]>([]);
  const [error, setError] = useState("");
  const [backendSupported, setBackendSupported] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [pendingNoteIds, setPendingNoteIds] = useState<Set<string>>(
    () => new Set(),
  );

  const ready = serverMode || db !== null;

  const reload = useCallback(async () => {
    if (!user) {
      setItems([]);
      setStatus("idle");
      setError("");
      setBackendSupported(true);
      return;
    }
    if (!ready) return;

    setStatus("loading");
    setError("");
    try {
      const snapshot = await contentBookmarkDataSource.list(db, user);
      setItems(Array.isArray(snapshot?.items) ? snapshot.items : []);
      setBackendSupported(true);
      setStatus("success");
    } catch (cause) {
      const unsupported =
        serverMode &&
        cause instanceof ApiError &&
        (cause.status === 404 || cause.status === 501);
      setBackendSupported(!unsupported);
      setItems([]);
      setError(
        unsupported
          ? "The connected backend does not implement the catalog bookmarks API yet."
          : messageOf(cause),
      );
      setStatus("error");
    }
  }, [db, ready, user?.id]);

  useEffect(() => {
    if (!user || !ready) {
      if (!user) {
        setItems([]);
        setStatus("idle");
        setError("");
      }
      return;
    }

    const controller = new AbortController();
    let active = true;
    setStatus("loading");
    setError("");

    void contentBookmarkDataSource
      .list(db, user, controller.signal)
      .then((snapshot) => {
        if (!active || controller.signal.aborted) return;
        setItems(Array.isArray(snapshot?.items) ? snapshot.items : []);
        setBackendSupported(true);
        setStatus("success");
      })
      .catch((cause) => {
        if (!active || controller.signal.aborted) return;
        const unsupported =
          serverMode &&
          cause instanceof ApiError &&
          (cause.status === 404 || cause.status === 501);
        setBackendSupported(!unsupported);
        setItems([]);
        setError(
          unsupported
            ? "The connected backend does not implement the catalog bookmarks API yet."
            : messageOf(cause),
        );
        setStatus("error");
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [ready, user?.id]);

  const isBookmarked = useCallback(
    (contentId: string) =>
      items.some((item) => item.bookmark.contentId === contentId),
    [items],
  );

  const isPending = useCallback(
    (contentId: string) => pendingIds.has(contentId),
    [pendingIds],
  );

  const toggle = useCallback(
    async (content: Content) => {
      if (!user || pendingIds.has(content.id)) return false;

      const previous =
        items.find((item) => item.bookmark.contentId === content.id) || null;
      const nextBookmarked = previous === null;

      setError("");
      setItems((current) =>
        setOptimisticBookmark(current, content, nextBookmarked),
      );
      setPendingIds((current) => new Set(current).add(content.id));

      try {
        const result = await contentBookmarkDataSource.set(
          db,
          user,
          content,
          nextBookmarked,
        );
        if (result.legacyDb) setDb(result.legacyDb);

        setItems((current) => {
          const withoutTarget = current.filter(
            (item) => item.bookmark.contentId !== content.id,
          );
          if (!result.bookmarked) return withoutTarget;
          if (result.item) return [result.item, ...withoutTarget];
          return setOptimisticBookmark(withoutTarget, content, true);
        });
        setBackendSupported(true);
        setStatus("success");
        return true;
      } catch (cause) {
        setItems((current) =>
          restoreBookmarkItem(current, content.id, previous),
        );
        const unsupported =
          serverMode &&
          cause instanceof ApiError &&
          (cause.status === 404 || cause.status === 501);
        setBackendSupported(!unsupported);
        setError(
          unsupported
            ? "Catalog bookmarks are not implemented by the connected backend yet."
            : messageOf(cause),
        );
        setStatus("error");
        return false;
      } finally {
        setPendingIds((current) => {
          const next = new Set(current);
          next.delete(content.id);
          return next;
        });
      }
    },
    [db, items, pendingIds, setDb, user?.id],
  );

  const saveNote = useCallback(
    async (bookmarkId: string, note: string) => {
      if (!user || serverMode || pendingNoteIds.has(bookmarkId)) return false;
      const previous = items.find((item) => item.bookmark.id === bookmarkId);
      if (!previous) return false;

      setError("");
      setPendingNoteIds((current) => new Set(current).add(bookmarkId));
      setItems((current) =>
        current.map((item) =>
          item.bookmark.id === bookmarkId
            ? {
                ...item,
                bookmark: {
                  ...item.bookmark,
                  note: note.trim().slice(0, 1000),
                },
              }
            : item,
        ),
      );

      try {
        const result = await contentBookmarkDataSource.saveNote(
          db,
          user,
          bookmarkId,
          note,
        );
        setDb(result.legacyDb);
        setItems((current) =>
          current.map((item) =>
            item.bookmark.id === bookmarkId ? result.item : item,
          ),
        );
        return true;
      } catch (cause) {
        setItems((current) =>
          current.map((item) =>
            item.bookmark.id === bookmarkId ? previous : item,
          ),
        );
        setError(messageOf(cause));
        return false;
      } finally {
        setPendingNoteIds((current) => {
          const next = new Set(current);
          next.delete(bookmarkId);
          return next;
        });
      }
    },
    [db, items, pendingNoteIds, setDb, user?.id],
  );

  const value = useMemo<BookmarksContextValue>(
    () => ({
      status,
      items,
      error,
      backendSupported,
      notesSupported: !serverMode,
      count: items.length,
      reload,
      isBookmarked,
      isPending,
      toggle,
      saveNote,
    }),
    [
      status,
      items,
      error,
      backendSupported,
      reload,
      isBookmarked,
      isPending,
      toggle,
      saveNote,
    ],
  );

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const value = useContext(BookmarksContext);
  if (!value) throw new Error("BookmarksProvider is required.");
  return value;
}
