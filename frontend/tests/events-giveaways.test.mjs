import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { DEMO_PASSWORD } from "../dist/src/domain/seed.js";
import { repository } from "../dist/src/services/repository.js";
import { eventsDataSource } from "../dist/src/features/events/dataSource.js";
import {
  optimisticJoinEvent,
  restoreEvent,
} from "../dist/src/features/events/state.js";
import { giveawayDataSource } from "../dist/src/features/giveaways/dataSource.js";
import { optimisticCampaignEntry } from "../dist/src/features/giveaways/state.js";

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
  return { db, user };
}

test("event optimistic helper updates only the selected event and can roll back", async () => {
  const { db, user } = await demoMember();
  const { items } = await eventsDataSource.list(db, user);
  const target = items[0];
  const other = items[1];

  const optimistic = optimisticJoinEvent(items, target.id);
  assert.equal(optimistic.find((event) => event.id === target.id)?.joined, true);
  assert.equal(
    optimistic.find((event) => event.id === target.id)?.attendeeCount,
    target.attendeeCount + 1,
  );
  assert.deepEqual(
    optimistic.find((event) => event.id === other.id),
    other,
  );

  const restored = restoreEvent(optimistic, target);
  assert.deepEqual(restored.find((event) => event.id === target.id), target);
});

test("demo event join is persisted per user and remains idempotent", async () => {
  const { db, user } = await demoMember();
  const firstList = await eventsDataSource.list(db, user);
  const event = firstList.items[0];
  assert.equal(event.joined, false);

  const joined = await eventsDataSource.join(db, user, event.id);
  assert.equal(joined.joined, true);
  assert.equal(joined.attendeeCount, 1);

  const repeated = await eventsDataSource.join(db, user, event.id);
  assert.equal(repeated.joined, true);
  assert.equal(repeated.attendeeCount, 1);

  const revisited = await eventsDataSource.list(db, user);
  assert.equal(
    revisited.items.find((candidate) => candidate.id === event.id)?.joined,
    true,
  );
});

test("giveaway optimistic entry immediately exposes joined state without duplicating an existing entry", async () => {
  const { user } = await demoMember();
  const campaign = await giveawayDataSource.detail(user);

  const optimistic = optimisticCampaignEntry(
    campaign,
    user,
    "2026-09-26T10:00:00.000Z",
  );
  assert.equal(optimistic.myEntry?.ticket, "PENDING");
  assert.equal(optimistic.entryCount, campaign.entryCount + 1);

  const second = optimisticCampaignEntry(optimistic, user);
  assert.equal(second.entryCount, optimistic.entryCount);
});

test("demo giveaway entry reconciles to an authoritative ticket and is idempotent", async () => {
  const { user } = await demoMember();
  const campaign = await giveawayDataSource.detail(user);
  const entered = await giveawayDataSource.enter(user, campaign.id, true);

  assert.ok(entered.myEntry);
  assert.notEqual(entered.myEntry.ticket, "PENDING");
  assert.equal(entered.entryCount, campaign.entryCount + 1);

  const repeated = await giveawayDataSource.enter(user, campaign.id, true);
  assert.equal(repeated.myEntry?.ticket, entered.myEntry.ticket);
  assert.equal(repeated.entryCount, entered.entryCount);
});
