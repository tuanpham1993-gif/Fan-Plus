import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { webcrypto } from "node:crypto";
import { DEMO_PASSWORD } from "../dist/src/domain/seed.js";
import { repository } from "../dist/src/services/repository.js";
import { adminDataSource } from "../dist/src/features/admin/dataSource.js";

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

async function loginAdmin() {
  const db = await repository.login("admin@fanhub.demo", DEMO_PASSWORD);
  const user = repository.currentUser(db);
  assert.ok(user);
  assert.equal(user.role, "admin");
  return user;
}

test("admin demo data source gates workspace loading to an administrator", async () => {
  await assert.rejects(
    () => adminDataSource.load(),
    (error) => error?.status === 403 && /administrator/i.test(error.message),
  );

  await loginAdmin();
  const workspace = await adminDataSource.load();
  assert.ok(workspace.contents.length > 0);
  assert.ok(workspace.categories.length > 0);
  assert.ok(workspace.users.some((user) => user.role === "admin"));
});

test("admin content edit and account-status mutations reconcile through the data source", async () => {
  const admin = await loginAdmin();
  const first = await adminDataSource.load();
  const content = first.contents[0];

  const edited = await adminDataSource.saveContent({
    ...content,
    title: `${content.title} - editorial check`,
  });
  assert.equal(
    edited.contents.find((item) => item.id === content.id)?.title,
    `${content.title} - editorial check`,
  );

  const member = edited.users.find((user) => user.id !== admin.id && user.role === "member");
  assert.ok(member);
  const suspended = await adminDataSource.setUserStatus(member.id, true);
  assert.equal(
    suspended.users.find((user) => user.id === member.id)?.suspended,
    true,
  );
});

test("legacy gateway is removed and Community no longer imports it", async () => {
  await assert.rejects(() => access(new URL("../src/features/gateway.ts", import.meta.url)));
  const source = await readFile(
    new URL("../src/features/community/CommunityPage.tsx", import.meta.url),
    "utf8",
  );
  assert.equal(source.includes("../gateway"), false);
  assert.equal(source.includes("gateway."), false);
});
