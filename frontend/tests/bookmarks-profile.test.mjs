import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { initialDatabase, DEMO_PASSWORD } from "../dist/src/domain/seed.js";
import { repository } from "../dist/src/services/repository.js";
import { contentBookmarkDataSource } from "../dist/src/features/bookmarks/dataSource.js";
import {
  restoreBookmarkItem,
  setOptimisticBookmark,
} from "../dist/src/features/bookmarks/state.js";
import { profileDataSource } from "../dist/src/features/profile/dataSource.js";

class MemoryStorage {
  data = new Map();
  getItem(key) {
    return this.data.get(key) ?? null;
  }
  setItem(key, value) {
    this.data.set(key, String(value));
  }
  removeItem(key) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
  key(index) {
    return [...this.data.keys()][index] ?? null;
  }
  get length() {
    return this.data.size;
  }
}

Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
  configurable: true,
});

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage();
  globalThis.sessionStorage = new MemoryStorage();
});

test("optimistic bookmark helpers update and roll back only the target content", () => {
  const [a, b] = initialDatabase().contents;
  const withA = setOptimisticBookmark([], a, true, "2026-01-01T00:00:00.000Z");
  const withBoth = setOptimisticBookmark(withA, b, true, "2026-01-02T00:00:00.000Z");
  assert.deepEqual(
    withBoth.map((item) => item.bookmark.contentId),
    [b.id, a.id],
  );

  const previousA = withBoth.find((item) => item.bookmark.contentId === a.id);
  const removedA = setOptimisticBookmark(withBoth, a, false);
  assert.deepEqual(
    removedA.map((item) => item.bookmark.contentId),
    [b.id],
  );

  const restored = restoreBookmarkItem(removedA, a.id, previousA);
  assert.equal(restored.some((item) => item.bookmark.contentId === a.id), true);
  assert.equal(restored.some((item) => item.bookmark.contentId === b.id), true);
});

test("demo reading list add/remove is idempotent and returns content payloads", async () => {
  const loggedInDb = await repository.login("fan@fanhub.demo", DEMO_PASSWORD);
  const user = repository.currentUser(loggedInDb);
  assert.ok(user);
  const content = loggedInDb.contents[0];

  const first = await contentBookmarkDataSource.set(
    loggedInDb,
    user,
    content,
    true,
  );
  assert.equal(first.bookmarked, true);
  assert.equal(first.item?.content.id, content.id);
  assert.ok(first.legacyDb);

  const repeated = await contentBookmarkDataSource.set(
    first.legacyDb,
    user,
    content,
    true,
  );
  assert.equal(repeated.bookmarked, true);
  assert.equal(
    repeated.legacyDb.bookmarks.filter(
      (bookmark) =>
        bookmark.userId === user.id && bookmark.contentId === content.id,
    ).length,
    1,
  );

  const listed = await contentBookmarkDataSource.list(repeated.legacyDb, user);
  assert.equal(listed.items.length, 1);
  assert.equal(listed.items[0].content.id, content.id);

  const removed = await contentBookmarkDataSource.set(
    repeated.legacyDb,
    user,
    content,
    false,
  );
  assert.equal(removed.bookmarked, false);
  assert.equal((await contentBookmarkDataSource.list(removed.legacyDb, user)).items.length, 0);
});

test("demo private reading-list note stays inside the bookmark data source", async () => {
  const loggedInDb = await repository.login("fan@fanhub.demo", DEMO_PASSWORD);
  const user = repository.currentUser(loggedInDb);
  assert.ok(user);
  const content = loggedInDb.contents[0];
  const added = await contentBookmarkDataSource.set(loggedInDb, user, content, true);
  assert.ok(added.item && added.legacyDb);

  const saved = await contentBookmarkDataSource.saveNote(
    added.legacyDb,
    user,
    added.item.bookmark.id,
    "Return for the soundtrack notes.",
  );
  assert.equal(saved.item.bookmark.note, "Return for the soundtrack notes.");
});

test("profile data source fetch/update keeps demo profile behavior behind the feature boundary", async () => {
  const loggedInDb = await repository.login("fan@fanhub.demo", DEMO_PASSWORD);
  const user = repository.currentUser(loggedInDb);
  assert.ok(user);

  const current = await profileDataSource.current(user);
  assert.equal(current.id, user.id);

  const result = await profileDataSource.update(current, {
    name: "Fan Reader",
    bio: "I collect thoughtful stories.",
    favoriteCategories: ["anime", "manga"],
    favoriteFandoms: ["Neon Horizon"],
    avatar: "",
  });

  assert.equal(result.user.name, "Fan Reader");
  assert.deepEqual(result.user.favoriteCategories, ["anime", "manga"]);
  assert.deepEqual(result.unsupportedFields, []);
});
