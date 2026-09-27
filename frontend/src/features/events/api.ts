import type { FanEvent } from "../../domain/types";
import { apiClient } from "../../shared/http/client";

export interface EventItem extends FanEvent {
  joined: boolean;
  attendeeCount: number;
}

export interface EventsResponse {
  items: EventItem[];
}

export interface JoinEventResponse {
  joined: boolean;
  event: EventItem;
}

export const eventApi = {
  list: (signal?: AbortSignal) =>
    apiClient.get<EventsResponse>("/events", { signal }),

  join: (eventId: string) =>
    apiClient.post<JoinEventResponse>(
      `/events/${encodeURIComponent(eventId)}/join`,
      {},
    ),
};
