import type { BackendEvent, FanEvent } from "../../domain/types";
import { apiClient } from "../../shared/http/client";

export type EventStatus = "published" | "pending" | "rejected";

export interface EventItem extends FanEvent {
  joined: boolean;
  attendeeCount: number;
  status: EventStatus;
  authorId?: string;
  authorName?: string;
  /** Display name of the category; categoryId holds the backend id. */
  categoryName?: string;
  createdAt?: string;
}

export interface BackendEventsResponse {
  total: number;
  items: BackendEvent[];
}

export interface EventsResponse {
  items: EventItem[];
  total?: number;
}

export interface JoinEventResponse {
  joined: boolean;
  event: EventItem;
}

export interface EventQueryParams {
  q?: string;
  city?: string;
  date_from?: string;
  date_to?: string;
  include_past?: boolean;
  scope?: "public" | "mine" | "moderation";
  status?: "PENDING" | "DONE" | "REJECTED" | "ALL";
  skip?: number;
  limit?: number;
  sort_by?: "start_time" | "created_at" | "updated_at";
  sort_order?: "asc" | "desc";
}

/** Form values shared by create and edit. Times are Vietnam wall-clock
 * "YYYY-MM-DDTHH:mm" strings as produced by <input type="datetime-local">. */
export interface EventDraft {
  title: string;
  body: string;
  categoryId: string;
  city: string;
  venue: string;
  lat: number | null;
  lng: number | null;
  startsAt: string;
  endsAt: string;
  registerUrl: string;
}

export interface EventCategory {
  id: string;
  name: string;
}

const STATUS_FROM_BACKEND: Record<string, EventStatus> = {
  DONE: "published",
  PENDING: "pending",
  REJECTED: "rejected",
};

export const STATUS_TO_BACKEND: Record<EventStatus, "DONE" | "PENDING" | "REJECTED"> = {
  published: "DONE",
  pending: "PENDING",
  rejected: "REJECTED",
};

const CATEGORY_ART: Record<string, string> = {
  anime: "/art/anime.svg",
  gaming: "/art/gaming.svg",
  movies: "/art/movies.svg",
  "tv series": "/art/tv.svg",
  "tv shows": "/art/tv.svg",
  "k-pop": "/art/kpop.svg",
  comics: "/art/comics.svg",
  manga: "/art/manga.svg",
  cosplay: "/art/cosplay.svg",
};

function coordinate(value: number | string) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapBackendEvent(raw: BackendEvent): EventItem {
  const content = raw.content;
  const categoryName = content?.category_name || undefined;
  return {
    id: String(raw.id),
    title: content?.title || raw.location_name || `Event #${raw.id}`,
    city: raw.city,
    venue: raw.location_name,
    lat: coordinate(raw.latitude),
    lng: coordinate(raw.longitude),
    startsAt: raw.start_time,
    endsAt: raw.end_time || raw.start_time,
    categoryId: content ? String(content.category_id) : "",
    categoryName,
    description: content?.body || "",
    image:
      raw.image_url ||
      CATEGORY_ART[(categoryName || "").toLowerCase()] ||
      "/art/community.svg",
    ticketUrl: raw.register_url || undefined,
    status: STATUS_FROM_BACKEND[content?.status || "DONE"] || "pending",
    authorId: content ? String(content.author_id) : undefined,
    authorName: content?.author_name || undefined,
    createdAt: raw.created_at,
    joined: false,
    attendeeCount: 0,
  };
}

function queryString(params: EventQueryParams = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}

/** Converts a datetime-local value (Vietnam time) to an explicit ISO offset. */
export function vnInputToIso(value: string) {
  return value ? `${value.length === 16 ? value + ":00" : value}+07:00` : "";
}

/** Converts an ISO instant to a datetime-local value in Vietnam time. */
export function isoToVnInput(iso: string) {
  if (!iso) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Ho_Chi_Minh",
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function draftFields(draft: EventDraft) {
  return {
    title: draft.title.trim(),
    body: draft.body.trim(),
    category_id: draft.categoryId,
    city: draft.city.trim(),
    location_name: draft.venue.trim(),
    latitude: draft.lat === null ? "" : String(draft.lat),
    longitude: draft.lng === null ? "" : String(draft.lng),
    start_time: vnInputToIso(draft.startsAt),
    end_time: vnInputToIso(draft.endsAt),
    register_url: draft.registerUrl.trim(),
  };
}

export const eventApi = {
  list: async (
    params?: EventQueryParams,
    signal?: AbortSignal,
  ): Promise<EventsResponse> => {
    const res = await apiClient.get<BackendEventsResponse>(
      `/events${queryString(params)}`,
      { signal },
    );
    return { items: (res.items || []).map(mapBackendEvent), total: res.total };
  },

  getById: async (eventId: string, signal?: AbortSignal): Promise<EventItem> =>
    mapBackendEvent(
      await apiClient.get<BackendEvent>(`/events/${encodeURIComponent(eventId)}`, {
        signal,
      }),
    ),

  create: async (draft: EventDraft, image: File | null): Promise<EventItem> => {
    const form = new FormData();
    for (const [key, value] of Object.entries(draftFields(draft))) {
      form.set(key, value);
    }
    if (image) form.set("image", image);
    return mapBackendEvent(await apiClient.postForm<BackendEvent>("/events", form));
  },

  update: async (eventId: string, draft: EventDraft): Promise<EventItem> => {
    const fields = draftFields(draft);
    return mapBackendEvent(
      await apiClient.put<BackendEvent>(`/events/${encodeURIComponent(eventId)}`, {
        ...fields,
        category_id: Number(fields.category_id),
        latitude: draft.lat,
        longitude: draft.lng,
        end_time: fields.end_time || null,
        register_url: fields.register_url || null,
      }),
    );
  },

  setStatus: async (eventId: string, status: EventStatus): Promise<EventItem> =>
    mapBackendEvent(
      await apiClient.patch<BackendEvent>(
        `/events/${encodeURIComponent(eventId)}/status`,
        { status: STATUS_TO_BACKEND[status] },
      ),
    ),

  remove: (eventId: string) =>
    apiClient.delete<{ message: string }>(`/events/${encodeURIComponent(eventId)}`),

  categories: async (signal?: AbortSignal): Promise<EventCategory[]> => {
    const rows = await apiClient.get<{ category_id: number; name: string }[]>(
      "/categories",
      { signal },
    );
    return (rows || []).map((row) => ({ id: String(row.category_id), name: row.name }));
  },
};
