import { repository } from "../../services/repository.js";
import { ApiError, serverMode } from "../../shared/http/client.js";
import { bookmarkApi, } from "./api.js";
const COMMUNITY_DEMO_KEY = "fanhub.community.bookmarks.v1";
function requireUser(user) {
    if (!user)
        throw new Error("Please sign in.");
    return user;
}
function requireDb(db) {
    if (!db)
        throw new Error("Demo reading list is still loading.");
    return db;
}
function readCommunityDemoStore() {
    try {
        const parsed = JSON.parse(localStorage.getItem(COMMUNITY_DEMO_KEY) || "{}");
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return {};
        }
        const result = {};
        for (const [userId, value] of Object.entries(parsed)) {
            if (Array.isArray(value)) {
                result[userId] = value.filter((item) => typeof item === "string");
            }
        }
        return result;
    }
    catch {
        return {};
    }
}
const demoCommunityDataSource = {
    async list(user) {
        const active = requireUser(user);
        const store = readCommunityDemoStore();
        return {
            postIds: store[active.id] || [],
            backendSupported: true,
        };
    },
    async set(user, postId, bookmarked) {
        const active = requireUser(user);
        const store = readCommunityDemoStore();
        const current = new Set(store[active.id] || []);
        if (bookmarked)
            current.add(postId);
        else
            current.delete(postId);
        store[active.id] = [...current];
        localStorage.setItem(COMMUNITY_DEMO_KEY, JSON.stringify(store));
        return { bookmarked };
    },
};
const apiCommunityDataSource = {
    async list(_user, signal) {
        try {
            const result = await bookmarkApi.listCommunityPosts(signal);
            return {
                postIds: result.postIds,
                backendSupported: true,
            };
        }
        catch (error) {
            if (error instanceof ApiError && error.status === 404) {
                return {
                    postIds: [],
                    backendSupported: false,
                };
            }
            throw error;
        }
    },
    async set(_user, postId, bookmarked) {
        return bookmarkApi.setCommunityPost(postId, bookmarked);
    },
};
function demoContentItems(db, user) {
    return db.bookmarks
        .filter((bookmark) => bookmark.userId === user.id)
        .map((bookmark) => {
        const content = db.contents.find((candidate) => candidate.id === bookmark.contentId &&
            candidate.status === "published");
        if (!content)
            return null;
        return {
            bookmark: {
                id: bookmark.id,
                contentId: bookmark.contentId,
                note: bookmark.note,
                createdAt: bookmark.createdAt,
            },
            content,
        };
    })
        .filter((item) => item !== null)
        .sort((a, b) => new Date(b.bookmark.createdAt).getTime() -
        new Date(a.bookmark.createdAt).getTime());
}
const demoContentDataSource = {
    async list(db, user) {
        const active = requireUser(user);
        return { items: demoContentItems(requireDb(db), active) };
    },
    async set(db, user, content, bookmarked) {
        const active = requireUser(user);
        const currentDb = requireDb(db);
        const existing = currentDb.bookmarks.find((bookmark) => bookmark.userId === active.id && bookmark.contentId === content.id);
        let nextDb = currentDb;
        if (Boolean(existing) !== bookmarked) {
            // Demo compatibility only. Connected mode never uses repository bookmarks.
            nextDb = await repository.toggleBookmark(content.id);
        }
        const nextBookmark = nextDb.bookmarks.find((bookmark) => bookmark.userId === active.id && bookmark.contentId === content.id);
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
        const bookmark = nextDb.bookmarks.find((candidate) => candidate.id === bookmarkId && candidate.userId === active.id);
        if (!bookmark)
            throw new Error("Bookmark not found.");
        const content = nextDb.contents.find((candidate) => candidate.id === bookmark.contentId);
        if (!content)
            throw new Error("Bookmarked content is unavailable.");
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
const apiContentDataSource = {
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
        throw new Error("Bookmark notes are not implemented by the connected backend yet.");
    },
};
export const communityBookmarkDataSource = serverMode ? apiCommunityDataSource : demoCommunityDataSource;
export const contentBookmarkDataSource = serverMode
    ? apiContentDataSource
    : demoContentDataSource;
