import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { initialDatabase, DEMO_PASSWORD } from "../dist/src/domain/seed.js";
import { repository } from "../dist/src/services/repository.js";
import {
  catalogDataSource,
  demoContentDetail,
} from "../dist/src/features/catalog/dataSource.js";
import { optimisticRatingSummary } from "../dist/src/features/catalog/rating.js";

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

test("demo content detail resolves visible content, related items and empty member-rating state", () => {
  const db = initialDatabase();
  const detail = demoContentDetail(db, "c01", null);
  assert.equal(detail.content.id, "c01");
  assert.ok(
    detail.related.every(
      (item) =>
        item.id !== detail.content.id &&
        item.categoryId === detail.content.categoryId &&
        item.status === "published",
    ),
  );
  assert.deepEqual(detail.rating, { userRating: 0, average: 0, count: 0 });
});

test("demo content detail returns 404 semantics for an unavailable id", () => {
  const db = initialDatabase();
  assert.throws(
    () => demoContentDetail(db, "missing-content", null),
    (error) => error?.status === 404 && /not found/i.test(error.message),
  );
});

test("optimistic member rating updates average without inflating count on replacement", () => {
  assert.deepEqual(
    optimisticRatingSummary({ userRating: 0, average: 4, count: 2 }, 5),
    { userRating: 5, average: 13 / 3, count: 3 },
  );
  assert.deepEqual(
    optimisticRatingSummary({ userRating: 3, average: 4, count: 2 }, 5),
    { userRating: 5, average: 5, count: 2 },
  );
});

test("demo rating persists and is restored by a later detail fetch", async () => {
  const loggedInDb = await repository.login("fan@fanhub.demo", DEMO_PASSWORD);
  const user = repository.currentUser(loggedInDb);
  assert.ok(user);

  const mutation = await catalogDataSource.rate(loggedInDb, "c01", 5, user);
  assert.equal(mutation.rating.userRating, 5);
  assert.equal(mutation.rating.count, 1);
  assert.equal(mutation.rating.average, 5);
  assert.ok(mutation.legacyDb);

  const revisited = await catalogDataSource.detail(
    mutation.legacyDb,
    "c01",
    user,
  );
  assert.equal(revisited.rating.userRating, 5);
  assert.equal(revisited.rating.average, 5);
  assert.equal(revisited.rating.count, 1);
});
