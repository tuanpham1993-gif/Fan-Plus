import type { BackendEvent, FanEvent } from "../../domain/types";
import { apiClient } from "../../shared/http/client";

export interface EventItem extends FanEvent {
  joined: boolean;
  attendeeCount: number;
}

export interface BackendEventsResponse {
  total: number;
  items: BackendEvent[];
}

export interface EventsResponse {
  items: EventItem[];
}

export interface JoinEventResponse {
  joined: boolean;
  event: EventItem;
}

export interface EventQueryParams {
  city?: string;
  start_time?: string;
  end_time?: string;
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: string;
}

export function mapBackendEventToFanEvent(raw: BackendEvent): FanEvent {
  const content = raw.content;
  return {
    id: String(raw.id),
    title: content?.title || raw.location_name || `Event #${raw.id}`,
    city: raw.city || "Unknown City",
    venue: raw.location_name || "TBA",
    lat: typeof raw.latitude === "number" ? raw.latitude : parseFloat(String(raw.latitude)) || 10.77,
    lng: typeof raw.longitude === "number" ? raw.longitude : parseFloat(String(raw.longitude)) || 106.65,
    startsAt: raw.start_time,
    endsAt: raw.end_time || raw.start_time,
    categoryId: content?.category_id ? String(content.category_id) : "anime",
    description: content?.body || `Event at ${raw.location_name}`,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1280&q=80",
    ticketUrl: raw.register_url || undefined,
  };
}

export const eventApi = {
  list: async (params?: EventQueryParams, signal?: AbortSignal): Promise<EventsResponse> => {
    const query = new URLSearchParams();
    if (params?.city) query.set("city", params.city);
    if (params?.start_time) query.set("start_time", params.start_time);
    if (params?.end_time) query.set("end_time", params.end_time);
    if (params?.skip !== undefined) query.set("skip", String(params.skip));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.sort_by) query.set("sort_by", params.sort_by);
    if (params?.sort_order) query.set("sort_order", params.sort_order);

    const queryString = query.toString();
    const endpoint = `/events${queryString ? `?${queryString}` : ""}`;
    const res = await apiClient.get<BackendEventsResponse>(endpoint, { signal });
    
    const items: EventItem[] = (res.items || []).map((raw) => ({
      ...mapBackendEventToFanEvent(raw),
      joined: false,
      attendeeCount: 0,
    }));
    return { items };
  },

  getById: async (eventId: string, signal?: AbortSignal): Promise<EventItem> => {
    const raw = await apiClient.get<BackendEvent>(`/events/${encodeURIComponent(eventId)}`, { signal });
    return {
      ...mapBackendEventToFanEvent(raw),
      joined: false,
      attendeeCount: 0,
    };
  },

  join: async (eventId: string): Promise<JoinEventResponse> => {
    try {
      return await apiClient.post<JoinEventResponse>(
        `/events/${encodeURIComponent(eventId)}/join`,
        {},
      );
    } catch {
      // Return optimistic fallback if join endpoint is not implemented in backend
      return {
        joined: true,
        event: {
          id: eventId,
          title: "Event",
          city: "",
          venue: "",
          lat: 0,
          lng: 0,
          startsAt: new Date().toISOString(),
          endsAt: new Date().toISOString(),
          categoryId: "anime",
          description: "",
          image: "",
          joined: true,
          attendeeCount: 1,
        },
      };
    }
  },
};
