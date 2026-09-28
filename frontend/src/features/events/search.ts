import type { EventItem, EventQueryParams } from "./api";

export type EventSort = "soonest" | "latest" | "newest";

/** Event search state. Lives in the /events URL so results are shareable. */
export interface EventSearch {
  q: string;
  city: string;
  /** Vietnam calendar days, YYYY-MM-DD, inclusive. */
  from: string;
  to: string;
  sort: EventSort;
  includePast: boolean;
}

export const EVENT_SORT_LABELS: Record<EventSort, string> = {
  soonest: "Soonest first",
  latest: "Latest date first",
  newest: "Newest posted",
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const SORTS = Object.keys(EVENT_SORT_LABELS) as EventSort[];

export function searchFromParams(params: URLSearchParams): EventSearch {
  const day = (key: string) => {
    const value = params.get(key) || "";
    return DAY.test(value) ? value : "";
  };
  const sort = params.get("sort") as EventSort;
  return {
    q: (params.get("q") || "").trim().slice(0, 100),
    city: params.get("city") || "",
    from: day("from"),
    to: day("to"),
    sort: SORTS.includes(sort) ? sort : "soonest",
    includePast: params.get("past") === "1",
  };
}

export function isFiltered(search: EventSearch) {
  return Boolean(
    search.q || search.city || search.from || search.to || search.includePast,
  );
}

export function toQueryParams(search: EventSearch): EventQueryParams {
  const order: Record<EventSort, Pick<EventQueryParams, "sort_by" | "sort_order">> = {
    soonest: { sort_by: "start_time", sort_order: "asc" },
    latest: { sort_by: "start_time", sort_order: "desc" },
    newest: { sort_by: "created_at", sort_order: "desc" },
  };
  return {
    q: search.q || undefined,
    city: search.city || undefined,
    date_from: search.from || undefined,
    date_to: search.to || undefined,
    include_past: search.includePast,
    ...order[search.sort],
    limit: 100,
  };
}

/** YYYY-MM-DD of an instant, in Vietnam time. */
export function vnDay(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso));
}

/** Same semantics as the Flask filter, for the offline demo data source. */
export function applyEventSearch(
  events: readonly EventItem[],
  search: EventSearch,
  now = Date.now(),
): EventItem[] {
  const q = search.q.toLowerCase();
  const city = search.city.toLowerCase();
  const matches = events.filter((event) => {
    const finish = event.endsAt || event.startsAt;
    if (
      q &&
      ![event.title, event.venue, event.city].some((text) =>
        text.toLowerCase().includes(q),
      )
    )
      return false;
    if (city && event.city.toLowerCase() !== city) return false;
    if (search.from && vnDay(finish) < search.from) return false;
    if (search.to && vnDay(event.startsAt) > search.to) return false;
    if (!search.includePast && Date.parse(finish) < now) return false;
    return true;
  });
  const time = (event: EventItem) =>
    search.sort === "newest"
      ? Date.parse(event.createdAt || event.startsAt)
      : Date.parse(event.startsAt);
  const direction = search.sort === "soonest" ? 1 : -1;
  return matches.sort((a, b) => (time(a) - time(b)) * direction);
}
