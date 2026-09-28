import { useCallback, useEffect, useState } from "react";
import { useApp } from "../../lib/store";
import { serverMode } from "../../shared/http/client";
import { useAuth } from "../auth/AuthProvider";
import {
  eventApi,
  type EventCategory,
  type EventItem,
  type EventStatus,
} from "./api";
import { eventsDataSource } from "./dataSource";
import type { EventSearch } from "./search";
import { optimisticJoinEvent, restoreEvent } from "./state";

type EventsStatus = "idle" | "loading" | "success" | "error";

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Events could not be loaded.";
}

export function useEvents(search: EventSearch, enabled = true) {
  const { db } = useApp();
  const { user } = useAuth();
  const [status, setStatus] = useState<EventsStatus>("idle");
  const [items, setItems] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const ready = enabled && (serverMode || db !== null);
  const searchKey = JSON.stringify(search);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!ready) return [] as EventItem[];
      setStatus("loading");
      setError("");
      try {
        const result = await eventsDataSource.list(
          db,
          user,
          JSON.parse(searchKey) as EventSearch,
          signal,
        );
        if (signal?.aborted) return [];
        setItems(result.items);
        setTotal(result.total ?? result.items.length);
        setStatus("success");
        return result.items;
      } catch (cause) {
        if (!signal?.aborted) {
          setError(messageOf(cause));
          setStatus("error");
        }
        return [];
      }
    },
    [db, ready, user?.id, searchKey],
  );

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, ready]);

  const join = useCallback(
    async (eventId: string) => {
      if (!user) {
        return {
          ok: false as const,
          error: "Please sign in to join this event.",
        };
      }
      if (pendingIds.has(eventId)) return { ok: false as const, error: "" };

      const previous = items.find((event) => event.id === eventId);
      if (!previous) return { ok: false as const, error: "Event not found." };
      if (previous.joined) return { ok: true as const, event: previous };

      setError("");
      setItems((current) => optimisticJoinEvent(current, eventId));
      setPendingIds((current) => new Set(current).add(eventId));

      try {
        const authoritative = await eventsDataSource.join(db, user, eventId);
        setItems((current) =>
          current.map((event) =>
            event.id === eventId ? authoritative : event,
          ),
        );
        setStatus("success");
        return { ok: true as const, event: authoritative };
      } catch (cause) {
        const message = messageOf(cause);
        setItems((current) => restoreEvent(current, previous));
        setError(message);
        setStatus("error");
        return { ok: false as const, error: message };
      } finally {
        setPendingIds((current) => {
          const next = new Set(current);
          next.delete(eventId);
          return next;
        });
      }
    },
    [db, items, pendingIds, user?.id],
  );

  const isPending = useCallback(
    (eventId: string) => pendingIds.has(eventId),
    [pendingIds],
  );

  return {
    status,
    events: items,
    total,
    error,
    reload: load,
    join,
    isPending,
  };
}

/** Events the signed-in user created, including ones still under review. */
export function useMyEvents() {
  const { user } = useAuth();
  const [items, setItems] = useState<EventItem[]>([]);

  useEffect(() => {
    if (!serverMode || !user) {
      setItems([]);
      return;
    }
    const controller = new AbortController();
    eventsDataSource
      .mine(user, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setItems(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setItems([]);
      });
    return () => controller.abort();
  }, [user?.id]);

  return items;
}

export function useEventDetail(eventId: string | undefined) {
  const { db } = useApp();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [status, setStatus] = useState<EventsStatus>("idle");
  const [error, setError] = useState("");
  const ready = serverMode || db !== null;

  useEffect(() => {
    if (!eventId || !ready) return;
    const controller = new AbortController();
    setStatus("loading");
    setError("");
    eventsDataSource
      .get(db, eventId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setEvent(result);
        setStatus("success");
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setError(messageOf(cause));
        setStatus("error");
      });
    return () => controller.abort();
  }, [eventId, ready, db, user?.id]);

  return { event, status, error };
}

export function useEventCategories() {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!serverMode) return;
    const controller = new AbortController();
    eventApi
      .categories(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setCategories(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(messageOf(cause));
      });
    return () => controller.abort();
  }, []);

  return { categories, error };
}

export function useModerationQueue(filter: EventStatus | "all") {
  const [items, setItems] = useState<EventItem[]>([]);
  const [status, setStatus] = useState<EventsStatus>("idle");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setStatus("loading");
      setError("");
      try {
        const result = await eventsDataSource.moderationQueue(filter, signal);
        if (signal?.aborted) return;
        setItems(result);
        setStatus("success");
      } catch (cause) {
        if (signal?.aborted) return;
        setError(messageOf(cause));
        setStatus("error");
      }
    },
    [filter],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const run = useCallback(
    async (eventId: string, action: () => Promise<unknown>) => {
      setBusyId(eventId);
      try {
        await action();
        await load();
        return { ok: true as const };
      } catch (cause) {
        return { ok: false as const, error: messageOf(cause) };
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  return {
    items,
    status,
    error,
    busyId,
    reload: load,
    setStatus: (eventId: string, next: EventStatus) =>
      run(eventId, () => eventsDataSource.setStatus(eventId, next)),
    remove: (eventId: string) =>
      run(eventId, () => eventsDataSource.remove(eventId)),
  };
}
