import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { DEMO_PASSWORD } from "../dist/src/domain/seed.js";
import { repository } from "../dist/src/services/repository.js";
import { loreDataSource } from "../dist/src/features/lore/dataSource.js";
import {
  appendLoreAssistantMessage,
  appendLoreUserMessage,
  loreModeLabel,
} from "../dist/src/features/lore/state.js";

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

async function demoMember() {
  const db = await repository.login("fan@fanhub.demo", DEMO_PASSWORD);
  const user = repository.currentUser(db);
  assert.ok(user);
  return user;
}

test("Lore message helpers append optimistic user and authoritative assistant messages in order", () => {
  const userMessages = appendLoreUserMessage([], "Explain Gojo Limitless", "u1");
  assert.deepEqual(userMessages, [
    { id: "u1", role: "user", text: "Explain Gojo Limitless" },
  ]);

  const completed = appendLoreAssistantMessage(
    userMessages,
    {
      text: "A source-grounded answer",
      sources: [],
      mode: "extractive-demo",
    },
    "a1",
  );

  assert.equal(completed.length, 2);
  assert.deepEqual(completed[1], {
    id: "a1",
    role: "assistant",
    text: "A source-grounded answer",
    sources: [],
    mode: "extractive-demo",
  });
});

test("Demo Lore data source reports sample-library mode and persists conversation history", async () => {
  const user = await demoMember();
  const status = await loreDataSource.status();
  assert.equal(status.mode, "extractive-demo");

  const result = await loreDataSource.send(user, {
    question: "Explain Gojo Limitless",
    spoilerSafe: true,
    topic: "",
  });
  assert.equal(result.mode, "extractive-demo");
  assert.ok(result.sources.length > 0);

  const messages = appendLoreAssistantMessage(
    appendLoreUserMessage([], "Explain Gojo Limitless", "u1"),
    result,
    "a1",
  );
  await loreDataSource.persistDemoHistory(user, messages);

  const revisited = await loreDataSource.history(user);
  assert.deepEqual(revisited, messages);

  await loreDataSource.clear(user);
  assert.deepEqual(await loreDataSource.history(user), []);
});

test("Demo Lore source lookup enforces published source semantics", async () => {
  const source = await loreDataSource.source("gojo-limitless");
  assert.equal(source.id, "gojo-limitless");
  assert.equal(source.status, "published");

  await assert.rejects(
    () => loreDataSource.source("missing-source"),
    (error) => error?.status === 404 && /not found/i.test(error.message),
  );
});

test("Lore service mode labels stay presentation-safe", () => {
  assert.equal(loreModeLabel("openai"), "AI configured");
  assert.equal(loreModeLabel("extractive-server"), "Extractive library");
  assert.equal(loreModeLabel("extractive-demo"), "Sample library");
  assert.equal(loreModeLabel("service-unavailable"), "Service unavailable");
});
