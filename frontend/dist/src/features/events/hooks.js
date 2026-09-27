import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../../lib/store.js";
import { serverMode } from "../../shared/http/client.js";
import { useAuth } from "../auth/AuthProvider.js";
import { eventsDataSource } from "./dataSource.js";
import { optimisticJoinEvent, restoreEvent } from "./state.js";
function messageOf(error) {
    return error instanceof Error ? error.message : "Events could not be loaded.";
}
export function useEvents() {
    const { db } = useApp();
    const { user } = useAuth();
    const [status, setStatus] = useState("idle");
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");
    const [pendingIds, setPendingIds] = useState(() => new Set());
    const ready = serverMode || db !== null;
    const load = useCallback(async (signal) => {
        if (!ready)
            return [];
        setStatus("loading");
        setError("");
        try {
            const result = await eventsDataSource.list(db, user, signal);
            if (signal?.aborted)
                return [];
            setItems(result.items);
            setStatus("success");
            return result.items;
        }
        catch (cause) {
            if (!signal?.aborted) {
                setError(messageOf(cause));
                setStatus("error");
            }
            return [];
        }
    }, [db, ready, user?.id]);
    useEffect(() => {
        if (!ready)
            return;
        const controller = new AbortController();
        void load(controller.signal);
        return () => controller.abort();
    }, [load, ready]);
    const join = useCallback(async (eventId) => {
        if (!user) {
            return { ok: false, error: "Please sign in to join this event." };
        }
        if (pendingIds.has(eventId))
            return { ok: false, error: "" };
        const previous = items.find((event) => event.id === eventId);
        if (!previous)
            return { ok: false, error: "Event not found." };
        if (previous.joined)
            return { ok: true, event: previous };
        setError("");
        setItems((current) => optimisticJoinEvent(current, eventId));
        setPendingIds((current) => new Set(current).add(eventId));
        try {
            const authoritative = await eventsDataSource.join(db, user, eventId);
            setItems((current) => current.map((event) => event.id === eventId ? authoritative : event));
            setStatus("success");
            return { ok: true, event: authoritative };
        }
        catch (cause) {
            const message = messageOf(cause);
            setItems((current) => restoreEvent(current, previous));
            setError(message);
            setStatus("error");
            return { ok: false, error: message };
        }
        finally {
            setPendingIds((current) => {
                const next = new Set(current);
                next.delete(eventId);
                return next;
            });
        }
    }, [db, items, pendingIds, user?.id]);
    const isPending = useCallback((eventId) => pendingIds.has(eventId), [pendingIds]);
    const cities = useMemo(() => [...new Set(items.map((event) => event.city))].sort(), [items]);
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
