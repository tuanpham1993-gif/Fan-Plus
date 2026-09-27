import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../../lib/store";
import { serverMode } from "../../shared/http/client";
import { useAuth } from "../auth/AuthProvider";
import type { EventItem } from "./api";
import { eventsDataSource } from "./dataSource";
import { optimisticJoinEvent, restoreEvent } from "./state";

type EventsStatus = "idle" | "loading" | "success" | "error";

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Events could not be loaded.";
}

export function useEvents() {
  const { db } = useApp();
  const { user } = useAuth();
  const [status, setStatus] = useState<EventsStatus>("idle");
  const [items, setItems] = useState<EventItem[]>([]);
  const [error, setError] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const ready = serverMode || db !== null;

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!ready) return [] as EventItem[];
      setStatus("loading");
      setError("");
      try {
        const result = await eventsDataSource.list(db, user, signal);
        if (signal?.aborted) return [];
        setItems(result.items);
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
    [db, ready, user?.id],
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
        return { ok: false as const, error: "Please sign in to join this event." };
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

  const cities = useMemo(
    () => [...new Set(items.map((event) => event.city))].sort(),
    [items],
  );

  return {
    status,
    events: items,
    cities,
    error,
    reload: load,
    join,
    isPending,
  };
}
