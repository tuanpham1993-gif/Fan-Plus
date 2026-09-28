import type { Database, User } from "../../domain/types";
import { serverMode } from "../../shared/http/client";
import {
  eventApi,
  type EventDraft,
  type EventItem,
  type EventsResponse,
  type EventStatus,
  STATUS_TO_BACKEND,
} from "./api";
import { applyEventSearch, toQueryParams, type EventSearch } from "./search";

const DEMO_JOIN_KEY = "fanhub.demo.event-joins.v1";

type DemoJoinStore = Record<string, string[]>;

export interface EventsDataSource {
  /** Published events; without a search every event is returned unfiltered. */
  list(
    db: Database | null,
    user: User | null,
    search?: EventSearch,
    signal?: AbortSignal,
  ): Promise<EventsResponse>;
  /** Every event the signed-in user created, whatever its review status. */
  mine(user: User | null, signal?: AbortSignal): Promise<EventItem[]>;
  get(db: Database | null, eventId: string, signal?: AbortSignal): Promise<EventItem | null>;
  create(draft: EventDraft, image: File | null): Promise<EventItem>;
  update(eventId: string, draft: EventDraft): Promise<EventItem>;
  moderationQueue(status: EventStatus | "all", signal?: AbortSignal): Promise<EventItem[]>;
  setStatus(eventId: string, status: EventStatus): Promise<EventItem>;
  remove(eventId: string): Promise<void>;
  join(
    db: Database | null,
    user: User | null,
    eventId: string,
  ): Promise<EventItem>;
}

const CONNECTED_ONLY =
  "Creating and reviewing events requires the connected Flask backend.";

function requireDb(db: Database | null): Database {
  if (!db) throw new Error("Demo events are still loading.");
  return db;
}

function requireUser(user: User | null): User {
  if (!user) throw new Error("Please sign in to join this event.");
  if (user.status === "suspended")
    throw new Error("This account cannot join events.");
  return user;
}

function readDemoJoins(): DemoJoinStore {
  try {
    const parsed = JSON.parse(localStorage.getItem(DEMO_JOIN_KEY) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};

    const result: DemoJoinStore = {};
    for (const [userId, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) {
        result[userId] = value.filter(
          (eventId): eventId is string => typeof eventId === "string",
        );
      }
    }
    return result;
  } catch {
    return {};
  }
}

function writeDemoJoins(store: DemoJoinStore) {
  try {
    localStorage.setItem(DEMO_JOIN_KEY, JSON.stringify(store));
  } catch {
    throw new Error(
      "Demo storage is unavailable. Your event join was not saved.",
    );
  }
}

function demoEventItems(db: Database, user: User | null): EventItem[] {
  const store = readDemoJoins();
  return db.events.map((event) => {
    const joined = Boolean(user && (store[user.id] || []).includes(event.id));
    const attendeeCount = Object.values(store).filter((ids) =>
      ids.includes(event.id),
    ).length;
    return { ...event, joined, attendeeCount, status: "published" as const };
  });
}

const demoEventsDataSource: EventsDataSource = {
  async list(db, user, search) {
    const items = demoEventItems(requireDb(db), user);
    return { items: search ? applyEventSearch(items, search) : items };
  },

  async mine() {
    return [];
  },

  async get(db, eventId) {
    return demoEventItems(requireDb(db), null).find((e) => e.id === eventId) || null;
  },

  async create() {
    throw new Error(CONNECTED_ONLY);
  },

  async update() {
    throw new Error(CONNECTED_ONLY);
  },

  async moderationQueue() {
    throw new Error(CONNECTED_ONLY);
  },

  async setStatus() {
    throw new Error(CONNECTED_ONLY);
  },

  async remove() {
    throw new Error(CONNECTED_ONLY);
  },

  async join(db, user, eventId) {
    const currentDb = requireDb(db);
    const active = requireUser(user);
    const event = currentDb.events.find(
      (candidate) => candidate.id === eventId,
    );
    if (!event) throw new Error("Event not found.");

    const store = readDemoJoins();
    const current = new Set(store[active.id] || []);
    current.add(eventId);
    store[active.id] = [...current];
    writeDemoJoins(store);

    return demoEventItems(currentDb, active).find(
      (candidate) => candidate.id === eventId,
    )!;
  },
};

const apiEventsDataSource: EventsDataSource = {
  async list(_db, _user, search, signal) {
    return eventApi.list(search ? toQueryParams(search) : { limit: 100 }, signal);
  },

  async mine(user, signal) {
    if (!user) return [];
    const { items } = await eventApi.list(
      { scope: "mine", sort_by: "created_at", sort_order: "desc", limit: 100 },
      signal,
    );
    return items;
  },

  async get(_db, eventId, signal) {
    try {
      return await eventApi.getById(eventId, signal);
    } catch (error) {
      if (error instanceof Error && "status" in error && error.status === 404) return null;
      throw error;
    }
  },

  create: (draft, image) => eventApi.create(draft, image),

  update: (eventId, draft) => eventApi.update(eventId, draft),

  async moderationQueue(status, signal) {
    const { items } = await eventApi.list(
      {
        scope: "moderation",
        status: status === "all" ? "ALL" : STATUS_TO_BACKEND[status],
        sort_by: "created_at",
        sort_order: "desc",
        limit: 100,
      },
      signal,
    );
    return items;
  },

  setStatus: (eventId, status) => eventApi.setStatus(eventId, status),

  async remove(eventId) {
    await eventApi.remove(eventId);
  },

  async join() {
    // Joining is not part of the Flask contract yet; the UI hides the action.
    throw new Error("Joining events is not available yet.");
  },
};

export const eventsDataSource = serverMode
  ? apiEventsDataSource
  : demoEventsDataSource;
