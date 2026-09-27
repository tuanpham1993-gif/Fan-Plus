import type { Content, Database, User } from "../../domain/types";
import { repository } from "../../services/repository";
import { ApiError, serverMode } from "../../shared/http/client";
import {
  bookmarkApi,
  type ContentBookmarkItem,
} from "./api";

const COMMUNITY_DEMO_KEY = "fanhub.community.bookmarks.v1";

interface DemoCommunityBookmarkStore {
  [userId: string]: string[];
}

export interface CommunityBookmarkSnapshot {
  postIds: string[];
  backendSupported: boolean;
}

export interface CommunityBookmarkDataSource {
  list(
    user: User | null,
    signal?: AbortSignal,
  ): Promise<CommunityBookmarkSnapshot>;
  set(
    user: User | null,
    postId: string,
    bookmarked: boolean,
  ): Promise<{ bookmarked: boolean }>;
}

export interface ContentBookmarkSnapshot {
  items: ContentBookmarkItem[];
}

export interface ContentBookmarkMutationResult {
  bookmarked: boolean;
  item: ContentBookmarkItem | null;
  legacyDb: Database | null;
}

export interface ContentBookmarkDataSource {
  list(
    db: Database | null,
    user: User | null,
    signal?: AbortSignal,
  ): Promise<ContentBookmarkSnapshot>;
  set(
    db: Database | null,
    user: User | null,
    content: Content,
    bookmarked: boolean,
  ): Promise<ContentBookmarkMutationResult>;
  saveNote(
    db: Database | null,
    user: User | null,
    bookmarkId: string,
    note: string,
  ): Promise<{ item: ContentBookmarkItem; legacyDb: Database }>;
}

function requireUser(user: User | null): User {
  if (!user) throw new Error("Please sign in.");
  return user;
}

function requireDb(db: Database | null): Database {
  if (!db) throw new Error("Demo reading list is still loading.");
  return db;
}

function readCommunityDemoStore(): DemoCommunityBookmarkStore {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(COMMUNITY_DEMO_KEY) || "{}",
    );
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const result: DemoCommunityBookmarkStore = {};
    for (const [userId, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) {
        result[userId] = value.filter(
          (item): item is string => typeof item === "string",
        );
      }
    }
    return result;
  } catch {
    return {};
  }
}

const demoCommunityDataSource: CommunityBookmarkDataSource = {
  async list(user: User | null): Promise<CommunityBookmarkSnapshot> {
    const active = requireUser(user);
    const store = readCommunityDemoStore();
    return {
      postIds: store[active.id] || [],
      backendSupported: true,
    };
  },

  async set(user: User | null, postId: string, bookmarked: boolean) {
    const active = requireUser(user);
    const store = readCommunityDemoStore();
    const current = new Set(store[active.id] || []);

    if (bookmarked) current.add(postId);
    else current.delete(postId);

    store[active.id] = [...current];
    localStorage.setItem(COMMUNITY_DEMO_KEY, JSON.stringify(store));

    return { bookmarked };
  },
};

const apiCommunityDataSource: CommunityBookmarkDataSource = {
  async list(
    _user: User | null,
    signal?: AbortSignal,
  ): Promise<CommunityBookmarkSnapshot> {
    try {
      const result = await bookmarkApi.listCommunityPosts(signal);
      return {
        postIds: result.postIds,
        backendSupported: true,
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return {
          postIds: [],
          backendSupported: false,
        };
      }
      throw error;
    }
  },

  async set(_user: User | null, postId: string, bookmarked: boolean) {
    return bookmarkApi.setCommunityPost(postId, bookmarked);
  },
};

function demoContentItems(db: Database, user: User): ContentBookmarkItem[] {
  return db.bookmarks
    .filter((bookmark) => bookmark.userId === user.id)
    .map((bookmark) => {
      const content = db.contents.find(
        (candidate) =>
          candidate.id === bookmark.contentId &&
          candidate.status === "published",
      );
      if (!content) return null;
      return {
        bookmark: {
          id: bookmark.id,
          contentId: bookmark.contentId,
          note: bookmark.note,
          createdAt: bookmark.createdAt,
        },
        content,
      } satisfies ContentBookmarkItem;
    })
    .filter((item): item is ContentBookmarkItem => item !== null)
    .sort(
      (a, b) =>
        new Date(b.bookmark.createdAt).getTime() -
        new Date(a.bookmark.createdAt).getTime(),
    );
}

const demoContentDataSource: ContentBookmarkDataSource = {
  async list(db: Database | null, user: User | null) {
    const active = requireUser(user);
    return { items: demoContentItems(requireDb(db), active) };
  },

  async set(db, user, content, bookmarked) {
    const active = requireUser(user);
    const currentDb = requireDb(db);
    const existing = currentDb.bookmarks.find(
      (bookmark) =>
        bookmark.userId === active.id && bookmark.contentId === content.id,
    );

    let nextDb = currentDb;
    if (Boolean(existing) !== bookmarked) {
      nextDb = await repository.toggleBookmark(content.id);
    }

    const nextBookmark = nextDb.bookmarks.find(
      (bookmark) =>
        bookmark.userId === active.id && bookmark.contentId === content.id,
    );

    return {
      bookmarked: Boolean(nextBookmark),
      item: nextBookmark
        ? {
            bookmark: {
              id: nextBookmark.id,
              contentId: nextBookmark.contentId,
              note: nextBookmark.note,
              createdAt: nextBookmark.createdAt,
            },
            content,
          }
        : null,
      legacyDb: nextDb,
    };
  },

  async saveNote(db, user, bookmarkId, note) {
    const active = requireUser(user);
    requireDb(db);
    const nextDb = await repository.saveNote(bookmarkId, note);
    const bookmark = nextDb.bookmarks.find(
      (candidate) =>
        candidate.id === bookmarkId && candidate.userId === active.id,
    );
    if (!bookmark) throw new Error("Bookmark not found.");
    const content = nextDb.contents.find(
      (candidate) => candidate.id === bookmark.contentId,
    );
    if (!content) throw new Error("Bookmarked content is unavailable.");

    return {
      item: {
        bookmark: {
          id: bookmark.id,
          contentId: bookmark.contentId,
          note: bookmark.note,
          createdAt: bookmark.createdAt,
        },
        content,
      },
      legacyDb: nextDb,
    };
  },
};

const apiContentDataSource: ContentBookmarkDataSource = {
  async list(_db, _user, signal) {
    return bookmarkApi.listContents(signal);
  },

  async set(_db, _user, content, bookmarked) {
    const result = await bookmarkApi.setContent(content.id, bookmarked);
    return {
      bookmarked: result.bookmarked,
      item: result.item,
      legacyDb: null,
    };
  },

  async saveNote() {
    throw new Error(
      "Bookmark notes are not implemented by the connected backend yet.",
    );
  },
};

export const communityBookmarkDataSource: CommunityBookmarkDataSource =
  serverMode ? apiCommunityDataSource : demoCommunityDataSource;

export const contentBookmarkDataSource: ContentBookmarkDataSource = serverMode
  ? apiContentDataSource
  : demoContentDataSource;
