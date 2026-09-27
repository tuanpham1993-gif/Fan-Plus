export function optimisticJoinEvent(events, eventId) {
    return events.map((event) => event.id === eventId && !event.joined
        ? {
            ...event,
            joined: true,
            attendeeCount: event.attendeeCount + 1,
        }
        : event);
}
export function restoreEvent(events, previous) {
    return events.map((event) => event.id === previous.id ? previous : event);
}
