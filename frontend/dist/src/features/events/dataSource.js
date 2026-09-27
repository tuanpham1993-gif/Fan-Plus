import { serverMode } from "../../shared/http/client.js";
import { eventApi } from "./api.js";
const DEMO_JOIN_KEY = "fanhub.demo.event-joins.v1";
function requireDb(db) {
    if (!db)
        throw new Error("Demo events are still loading.");
    return db;
}
function requireUser(user) {
    if (!user)
        throw new Error("Please sign in to join this event.");
    if (user.suspended)
        throw new Error("This account cannot join events.");
    return user;
}
function readDemoJoins() {
    try {
        const parsed = JSON.parse(localStorage.getItem(DEMO_JOIN_KEY) || "{}");
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
            return {};
        const result = {};
        for (const [userId, value] of Object.entries(parsed)) {
            if (Array.isArray(value)) {
                result[userId] = value.filter((eventId) => typeof eventId === "string");
            }
        }
        return result;
    }
    catch {
        return {};
    }
}
function writeDemoJoins(store) {
    try {
        localStorage.setItem(DEMO_JOIN_KEY, JSON.stringify(store));
    }
    catch {
        throw new Error("Demo storage is unavailable. Your event join was not saved.");
    }
}
function demoEventItems(db, user) {
    const store = readDemoJoins();
    return db.events.map((event) => {
        const joined = Boolean(user && (store[user.id] || []).includes(event.id));
        const attendeeCount = Object.values(store).filter((ids) => ids.includes(event.id)).length;
        return { ...event, joined, attendeeCount };
    });
}
const demoEventsDataSource = {
    async list(db, user) {
        return { items: demoEventItems(requireDb(db), user) };
    },
    async join(db, user, eventId) {
        const currentDb = requireDb(db);
        const active = requireUser(user);
        const event = currentDb.events.find((candidate) => candidate.id === eventId);
        if (!event)
            throw new Error("Event not found.");
        const store = readDemoJoins();
        const current = new Set(store[active.id] || []);
        current.add(eventId);
        store[active.id] = [...current];
        writeDemoJoins(store);
        return demoEventItems(currentDb, active).find((candidate) => candidate.id === eventId);
    },
};
const apiEventsDataSource = {
    async list(_db, _user, signal) {
        return eventApi.list(signal);
    },
    async join(_db, _user, eventId) {
        return (await eventApi.join(eventId)).event;
    },
};
export const eventsDataSource = serverMode
    ? apiEventsDataSource
    : demoEventsDataSource;
