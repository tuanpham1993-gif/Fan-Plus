import test from "node:test";
import assert from "node:assert/strict";
import {
  applyEventSearch,
  searchFromParams,
  toQueryParams,
} from "../dist/src/features/events/search.js";
import {
  isoToVnInput,
  mapBackendEvent,
  vnInputToIso,
} from "../dist/src/features/events/api.js";

const base = { q: "", city: "", from: "", to: "", sort: "soonest", includePast: false };
const event = (id, startsAt, extra = {}) => ({
  id, title: "Event " + id, city: "Hanoi", venue: "Hall", lat: 0, lng: 0,
  startsAt, endsAt: startsAt, categoryId: "1", description: "", image: "",
  joined: false, attendeeCount: 0, status: "published", ...extra,
});
const NOW = Date.parse("2026-10-01T00:00:00+07:00");

test("search params are parsed defensively from the URL", () => {
  const s = searchFromParams(new URLSearchParams("q=%20cosplay%20&from=2026-10-01&to=bad&sort=evil&past=1"));
  assert.deepEqual(s, { q: "cosplay", city: "", from: "2026-10-01", to: "", sort: "soonest", includePast: true });
});

test("sort options map onto the Flask query contract", () => {
  assert.equal(toQueryParams({ ...base, sort: "newest" }).sort_by, "created_at");
  assert.equal(toQueryParams({ ...base, sort: "latest" }).sort_order, "desc");
  assert.equal(toQueryParams({ ...base, from: "2026-10-02" }).date_from, "2026-10-02");
  assert.equal(toQueryParams(base).include_past, false);
});

test("past events are hidden unless requested", () => {
  const items = [event("old", "2026-09-01T10:00:00+07:00"), event("new", "2026-10-05T10:00:00+07:00")];
  assert.deepEqual(applyEventSearch(items, base, NOW).map((e) => e.id), ["new"]);
  assert.deepEqual(applyEventSearch(items, { ...base, includePast: true }, NOW).map((e) => e.id), ["old", "new"]);
});

test("date range uses Vietnam calendar days, not UTC", () => {
  // 00:30 on 5 Oct in Vietnam is still 4 Oct in UTC.
  const items = [event("late", "2026-10-05T00:30:00+07:00")];
  assert.equal(applyEventSearch(items, { ...base, from: "2026-10-05", to: "2026-10-05" }, NOW).length, 1);
  assert.equal(applyEventSearch(items, { ...base, to: "2026-10-04" }, NOW).length, 0);
});

test("keyword matches title, venue or city; sorts are applied", () => {
  const items = [
    event("a", "2026-10-03T10:00:00+07:00", { venue: "Tao Dan Park", createdAt: "2026-09-01T00:00:00Z" }),
    event("b", "2026-10-09T10:00:00+07:00", { city: "Da Nang", createdAt: "2026-09-20T00:00:00Z" }),
  ];
  assert.deepEqual(applyEventSearch(items, { ...base, q: "tao dan" }, NOW).map((e) => e.id), ["a"]);
  assert.deepEqual(applyEventSearch(items, { ...base, q: "DA NANG" }, NOW).map((e) => e.id), ["b"]);
  assert.deepEqual(applyEventSearch(items, { ...base, sort: "latest" }, NOW).map((e) => e.id), ["b", "a"]);
  assert.deepEqual(applyEventSearch(items, { ...base, sort: "newest" }, NOW).map((e) => e.id), ["b", "a"]);
});

test("datetime-local values round-trip through Vietnam time", () => {
  assert.equal(vnInputToIso("2026-10-10T09:00"), "2026-10-10T09:00:00+07:00");
  assert.equal(vnInputToIso(""), "");
  assert.equal(isoToVnInput("2026-10-10T02:00:00Z"), "2026-10-10T09:00");
});

test("backend events map status, category and fallback art", () => {
  const item = mapBackendEvent({
    id: 7, content_id: 9, location_name: "SECC", city: "Ho Chi Minh City",
    latitude: "10.72", longitude: "106.72", start_time: "2026-10-10T09:00:00+07:00",
    end_time: null, register_url: null, image_url: null,
    content: { id: 9, title: "Anime Fest", body: "Fun", category_id: 1, category_name: "Anime",
      author_id: 2, author_name: "John", content_type: "EVENT", status: "PENDING" },
  });
  assert.equal(item.id, "7");
  assert.equal(item.status, "pending");
  assert.equal(item.categoryName, "Anime");
  assert.equal(item.image, "/art/anime.svg");
  assert.equal(item.endsAt, item.startsAt);
  assert.equal(item.lat, 10.72);
});
