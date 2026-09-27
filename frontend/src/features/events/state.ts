import type { EventItem } from "./api";

export function optimisticJoinEvent(
  events: readonly EventItem[],
  eventId: string,
): EventItem[] {
  return events.map((event) =>
    event.id === eventId && !event.joined
      ? {
          ...event,
          joined: true,
          attendeeCount: event.attendeeCount + 1,
        }
      : event,
  );
}

export function restoreEvent(
  events: readonly EventItem[],
  previous: EventItem,
): EventItem[] {
  return events.map((event) =>
    event.id === previous.id ? previous : event,
  );
}
