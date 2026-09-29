import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { useEventDetail, useEvents, useMyEvents } from "../features/events/hooks";
import type { EventItem, EventStatus } from "../features/events/api";
import { EVENT_CITIES } from "../features/events/cities";
import {
  EVENT_SORT_LABELS,
  isFiltered,
  searchFromParams,
  vnDay,
  type EventSort,
} from "../features/events/search";
import { useApp } from "../lib/store";
import { Link, currentPath, useLocation, navigate } from "../lib/router";
import { distanceKm, calendarFile, safeExternalUrl } from "../domain/logic";
import { serverMode } from "../shared/http/client";
import { categoryLabel } from "../shared/catalog/taxonomy";
import {
  Icon,
  Button,
  Crumbs,
  PageHeading,
  Notice,
  Empty,
  Skeleton,
  downloadFile,
} from "../components/ui";

const date = (
  s: string,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) =>
  new Intl.DateTimeFormat("en-GB", {
    ...opts,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(s));

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  published: "Published",
  pending: "Pending review",
  rejected: "Not approved",
};

const categoryOf = (event: EventItem) =>
  event.categoryName || categoryLabel(event.categoryId);

function monthStart(day: string) {
  const [year, month] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

function startCreating(user: unknown) {
  navigate(user ? "/events/new" : `/login?next=${encodeURIComponent("/events/new")}`);
}

export default function Events({ id }: { id?: string }) {
  return id ? <EventDetail key={id} id={id} /> : <EventList />;
}

function EventDetail({ id }: { id: string }) {
  const { notify } = useApp();
  const { user } = useAuth();
  const { event: loaded, status, error } = useEventDetail(id);
  const noSearch = useMemo(() => searchFromParams(new URLSearchParams()), []);
  const demo = useEvents(noSearch, !serverMode);
  const event = (!serverMode && demo.events.find((e) => e.id === id)) || loaded;

  const joinEvent = async (eventId: string) => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/events/${eventId}`)}`);
      return;
    }
    const result = await demo.join(eventId);
    if (result.ok) notify("You joined this demo event.", "success");
    else if (result.error) notify(result.error, "error");
  };

  if (!event && (status === "loading" || status === "idle")) {
    return (
      <>
        <Crumbs items={[{ label: "Events", to: "/events" }, { label: "Loading..." }]} />
        <Skeleton cards={1} />
      </>
    );
  }

  if (!event)
    return (
      <Empty
        title={status === "error" ? "Event could not be loaded" : "Event not found"}
        description={error || "This event may have been removed or is still waiting for review."}
      >
        <Link className="btn btn-primary" to="/events">
          Browse events
        </Link>
      </Empty>
    );

  const canEdit =
    serverMode &&
    !!user &&
    (user.role === "admin" ||
      (event.authorId === String(user.id) && event.status === "pending"));

  return (
    <>
      <Crumbs
        items={[{ label: "Events", to: "/events" }, { label: event.title }]}
      />
      {demo.error && !serverMode && <Notice kind="error">{demo.error}</Notice>}
      {event.status === "pending" && (
        <Notice>
          This event is waiting for an administrator to review it. Only its
          creator and administrators can see it until it is approved.
        </Notice>
      )}
      {event.status === "rejected" && (
        <Notice kind="error">
          This event was not approved and is not visible to other fans.
        </Notice>
      )}
      <div className="event-detail">
        <img
          src={event.image}
          alt={serverMode ? "" : "Original event concept artwork"}
          width="1280"
          height="900"
        />
        <div>
          <span className="eyebrow">
            {serverMode
              ? categoryOf(event).toUpperCase() + " EVENT"
              : "A FICTIONAL COMMUNITY EVENT"}
          </span>
          <h1>{event.title}</h1>
          {event.status !== "published" && (
            <span className={"status status-" + event.status}>
              {EVENT_STATUS_LABELS[event.status]}
            </span>
          )}
          <p className="event-description">{event.description}</p>
          <div className="event-detail-facts">
            <p>
              <Icon name="calendar" />
              {date(event.startsAt)}
            </p>
            <p>
              <Icon name="clock" />
              {date(event.startsAt, { timeStyle: "short" })}
              {event.endsAt !== event.startsAt &&
                ` - ${date(event.endsAt, vnDay(event.endsAt) === vnDay(event.startsAt) ? { timeStyle: "short" } : { dateStyle: "medium", timeStyle: "short" })}`}{" "}
              (GMT+7)
            </p>
            <p>
              <Icon name="pin" />
              {event.venue}, {event.city}
            </p>
            {event.authorName && (
              <p>
                <Icon name="user" />
                Organized by {event.authorName}
              </p>
            )}
            {event.attendeeCount > 0 && (
              <p>
                <Icon name="users" />
                {event.attendeeCount} demo attendee
                {event.attendeeCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
          {!serverMode && (
            <Button
              busy={demo.isPending(event.id)}
              disabled={event.joined}
              onClick={() => void joinEvent(event.id)}
            >
              <Icon name={event.joined ? "check" : "users"} size={18} />
              {event.joined ? "Joined" : user ? "Join event" : "Sign in to join"}
            </Button>
          )}
          {canEdit && (
            <Link className="btn btn-primary" to={`/events/${event.id}/edit`}>
              <Icon name="edit" size={17} />
              Edit event
            </Link>
          )}
          <Button
            variant="secondary"
            onClick={() =>
              downloadFile(
                (serverMode ? "fanhub-event-" : "fanhub-demo-") + event.id + ".ics",
                calendarFile(event, !serverMode),
                "text/calendar;charset=utf-8",
              )
            }
          >
            <Icon name="download" size={18} />
            {serverMode ? "Add to calendar" : "Add demo event to calendar"}
          </Button>
          {event.ticketUrl && safeExternalUrl(event.ticketUrl) ? (
            <a
              className="btn btn-secondary"
              href={safeExternalUrl(event.ticketUrl)!}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit organizer's ticket page <Icon name="external" size={16} />
            </a>
          ) : (
            !serverMode && (
              <p className="caption">
                No real tickets are available for this fictional event.
              </p>
            )
          )}
          {!serverMode && (
            <Notice>
              Do not travel to this location based on the demo. Event name,
              venue and schedule are test data.
            </Notice>
          )}
        </div>
      </div>
      <Link
        className="text-link"
        to={"/events?city=" + encodeURIComponent(event.city)}
      >
        More events in {event.city}
        <Icon name="arrow" size={17} />
      </Link>
    </>
  );
}

function EventList() {
  const { notify } = useApp();
  const { user } = useAuth();
  const { params } = useLocation();
  const search = useMemo(() => searchFromParams(params), [params.toString()]);
  const {
    events: sourceEvents,
    total,
    status,
    error,
    reload,
    join,
    isPending,
  } = useEvents(search);
  const myEvents = useMyEvents();
  const awaiting = myEvents.filter((event) => event.status !== "published");

  const [view, setView] = useState("list"),
    [geo, setGeo] = useState<{
      lat: number;
      lng: number;
    } | null>(null),
    [geoBusy, setGeoBusy] = useState(false),
    [geoError, setGeoError] = useState(""),
    [onlineMap, setOnlineMap] = useState(false),
    [selected, setSelected] = useState(""),
    [month, setMonth] = useState(() => monthStart(search.from || vnDay(new Date().toISOString()))),
    [keyword, setKeyword] = useState(search.q);

  const radius = Number(params.get("radius") || 0);

  const update = (changes: Record<string, string>, replace = false) => {
    const p = new URL(currentPath(), "https://fanhub.invalid").searchParams;
    for (const [key, value] of Object.entries(changes)) {
      value ? p.set(key, value) : p.delete(key);
    }
    navigate("/events" + (p.size ? "?" + p : ""), replace);
  };

  useEffect(() => setKeyword(search.q), [search.q]);
  useEffect(() => {
    const next = keyword.trim();
    if (next === search.q) return;
    const timer = window.setTimeout(() => update({ q: next }, true), 350);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const cities = useMemo(
    () =>
      [...new Set([...EVENT_CITIES.map((c) => c.name), ...sourceEvents.map((e) => e.city), search.city])]
        .filter(Boolean)
        .sort(),
    [sourceEvents, search.city],
  );

  const events = useMemo(() => {
    const now = new Date();

    const items = sourceEvents
      .filter((event) => {
        const endTime = new Date(event.endsAt || event.startsAt);

        return endTime >= now;
      })
      .map((event) => ({
        ...event,
        distance: geo ? distanceKm(geo, event) : null,
      }))
      .filter((event) => !geo || !radius || event.distance! <= radius);

    return geo ? items.sort((a, b) => a.distance! - b.distance!) : items;
  }, [sourceEvents, geo, radius]);

  const resetFilters = () => {
    setGeo(null);
    setKeyword("");
    navigate("/events");
  };

  const joinEvent = async (eventId: string) => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent("/events")}`);
      return;
    }
    const result = await join(eventId);
    if (result.ok) notify("You joined this demo event.", "success");
    else if (result.error) notify(result.error, "error");
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is unavailable. Please select a city.");
      return;
    }
    setGeoBusy(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeo({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeoBusy(false);
        update({ city: "" });
        notify(
          "Events are sorted by distance. Your coordinates are not saved.",
          "info",
        );
      },
      (err) => {
        setGeoBusy(false);
        setGeoError(
          err.code === 1
            ? "Location permission was denied. You can still browse by city."
            : "Location could not be determined. Try again or choose a city.",
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  };

  const heading = (
    <>
      <Crumbs items={[{ label: "Events" }]} />
      <PageHeading
        eyebrow="BEYOND THE SCREEN"
        title="Find your people."
        description="The best part of a fandom? Sharing it. Discover gatherings, workshops and worlds close to you."
      >
        <Button variant="secondary" busy={geoBusy} onClick={locate}>
          <Icon name="pin" size={17} />
          {geo ? "Refresh my location" : "Use my location"}
        </Button>
        <Button onClick={() => startCreating(user)}>
          <Icon name="plus" size={17} />
          {user ? "Create event" : "Sign in to create"}
        </Button>
      </PageHeading>
    </>
  );

  if (status === "error" && sourceEvents.length === 0 && !isFiltered(search)) {
    return (
      <>
        {heading}
        <Empty
          icon="calendar"
          title="Events could not be loaded"
          description={error || "Try again in a moment."}
        >
          <Button onClick={() => void reload()}>Try again</Button>
        </Empty>
      </>
    );
  }

  const mapEvent = events.find((event) => event.id === selected) || events[0];
  const days = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
    ).getUTCDate(),
    offset = (month.getUTCDay() + 6) % 7;
  const marker = mapEvent ? `${mapEvent.lat},${mapEvent.lng}` : "";
  const bbox = mapEvent
    ? `${mapEvent.lng - 0.055},${mapEvent.lat - 0.035},${mapEvent.lng + 0.055},${mapEvent.lat + 0.035}`
    : "";
  const loading = status === "loading" || status === "idle";

  return (
    <>
      {heading}
      <Notice>
        {serverMode
          ? "Location is requested only when you choose it, kept in memory and never saved. Online maps contact OpenStreetMap only after you load them."
          : "All events below are fictional test data. Location is requested only when you choose it, kept in memory and never saved. Online maps contact OpenStreetMap only after you load them."}
      </Notice>
      {awaiting.length > 0 && (
        <section className="panel my-events" aria-labelledby="my-events-title">
          <h2 id="my-events-title">Your submissions</h2>
          <p className="muted">
            Events you create appear publicly after an administrator approves
            them.
          </p>
          <ul>
            {awaiting.map((event) => (
              <li key={event.id}>
                <span className={"status status-" + event.status}>
                  {EVENT_STATUS_LABELS[event.status]}
                </span>
                <Link to={"/events/" + event.id}>{event.title}</Link>
                <small className="muted">
                  {date(event.startsAt)} / {event.city}
                </small>
                {event.status === "pending" && (
                  <Link className="small-link" to={`/events/${event.id}/edit`}>
                    Edit
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      {geoError && (
        <div className="form-error" role="alert">
          {geoError}
        </div>
      )}
      <form
        className="event-search"
        role="search"
        aria-label="Search events"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: keyword.trim() });
        }}
      >
        <label className="search-input event-search-keyword">
          <Icon name="search" size={16} />
          <input
            type="search"
            aria-label="Search events by name, venue or city"
            placeholder="Search by event, venue or city..."
            value={keyword}
            maxLength={100}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </label>
        <label className="event-search-date">
          <span>From</span>
          <input
            type="date"
            value={search.from}
            max={search.to || undefined}
            onChange={(e) =>
              update({
                from: e.target.value,
                ...(search.to && e.target.value > search.to ? { to: "" } : {}),
              })
            }
          />
        </label>
        <label className="event-search-date">
          <span>To</span>
          <input
            type="date"
            value={search.to}
            min={search.from || undefined}
            onChange={(e) => update({ to: e.target.value })}
          />
        </label>
        <label className="event-search-sort">
          <span className="sr-only">Sort events</span>
          <select
            value={search.sort}
            onChange={(e) =>
              update({ sort: e.target.value === "soonest" ? "" : e.target.value })
            }
          >
            {(Object.keys(EVENT_SORT_LABELS) as EventSort[]).map((value) => (
              <option key={value} value={value}>
                {EVENT_SORT_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </form>
      <div className="event-toolbar">
        <div>
          <label className="sr-only" htmlFor="city">
            Filter events by city
          </label>
          <select
            id="city"
            value={search.city}
            onChange={(e) => update({ city: e.target.value })}
          >
            <option value="">All cities</option>
            {cities.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <label className="check-row">
            <input
              type="checkbox"
              checked={search.includePast}
              onChange={(e) => update({ past: e.target.checked ? "1" : "" })}
            />
            Show past events
          </label>
          {geo && (
            <>
              <select
                aria-label="Distance radius"
                value={radius}
                onChange={(e) => update({ radius: e.target.value })}
              >
                <option value={0}>Any distance</option>
                <option value={25}>Within 25 km</option>
                <option value={100}>Within 100 km</option>
                <option value={500}>Within 500 km</option>
              </select>
              <button
                type="button"
                className="small-link"
                onClick={() => {
                  setGeo(null);
                  update({ radius: "" });
                }}
              >
                Forget location
              </button>
            </>
          )}
        </div>
        <div className="segmented" role="group" aria-label="Event view">
          {[
            ["list", "list", "List"],
            ["calendar", "calendar", "Calendar"],
            ["map", "pin", "Map"],
          ].map(([v, icon, label]) => (
            <button
              key={v}
              type="button"
              className={view === v ? "active" : ""}
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              <Icon name={icon} size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="event-result-count" aria-live="polite">
        {loading
          ? "Searching events..."
          : total > events.length && !geo
            ? `Showing ${events.length} of ${total} events. Narrow your search to see the rest.`
            : `${events.length} event${events.length === 1 ? "" : "s"}`}
        {isFiltered(search) && (
          <button type="button" className="small-link" onClick={resetFilters}>
            Clear filters
          </button>
        )}
      </p>
      {loading && sourceEvents.length === 0 ? (
        <Skeleton cards={3} />
      ) : (
        <>
          {view === "list" &&
            (events.length ? (
              <div className={"event-list" + (loading ? " is-refreshing" : "")}>
                {events.map((event) => (
                  <article className="event-card" key={event.id}>
                    <img src={event.image} alt="" width="280" height="180" />
                    <div className="event-date">
                      <strong>{date(event.startsAt, { day: "2-digit" })}</strong>
                      <span>{date(event.startsAt, { month: "short" })}</span>
                    </div>
                    <div className="event-card-body">
                      <span className="eyebrow">
                        {categoryOf(event)}
                        {serverMode ? "" : " / DEMO EVENT"}
                      </span>
                      <h2>
                        <Link to={"/events/" + event.id}>{event.title}</Link>
                      </h2>
                      <p>{event.description}</p>
                      <div className="event-meta">
                        <span>
                          <Icon name="pin" size={14} />
                          {event.city}
                        </span>
                        <span>
                          <Icon name="calendar" size={14} />
                          {date(event.startsAt, { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                        <span>
                          <Icon name="clock" size={14} />
                          {date(event.startsAt, { timeStyle: "short" })} GMT+7
                        </span>
                        {event.distance !== null && (
                          <span>{event.distance.toFixed(1)} km away</span>
                        )}
                        {event.attendeeCount > 0 && (
                          <span>
                            <Icon name="users" size={14} />
                            {event.attendeeCount} joined
                          </span>
                        )}
                      </div>
                      {!serverMode && (
                        <Button
                          variant="ghost"
                          busy={isPending(event.id)}
                          disabled={event.joined}
                          onClick={() => void joinEvent(event.id)}
                        >
                          <Icon name={event.joined ? "check" : "users"} size={15} />
                          {event.joined
                            ? "Joined"
                            : user
                              ? "Join event"
                              : "Sign in to join"}
                        </Button>
                      )}
                    </div>
                    <Link
                      className="icon-btn event-arrow"
                      aria-label={"View " + event.title}
                      to={"/events/" + event.id}
                    >
                      <Icon name="arrow" />
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                icon="pin"
                title="No events match your search"
                description={
                  search.includePast
                    ? "Try other words, another city or a wider date range."
                    : "Try other words, a wider date range, or include past events."
                }
              >
                <Button onClick={resetFilters}>Reset event filters</Button>
              </Empty>
            ))}
          {view === "calendar" && (
            <div className="calendar-panel">
              <div className="calendar-header">
                <Button
                  variant="ghost"
                  onClick={() =>
                    setMonth(
                      new Date(
                        Date.UTC(
                          month.getUTCFullYear(),
                          month.getUTCMonth() - 1,
                          1,
                        ),
                      ),
                    )
                  }
                >
                  Previous month
                </Button>
                <h2>
                  {new Intl.DateTimeFormat("en-GB", {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(month)}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setMonth(
                      new Date(
                        Date.UTC(
                          month.getUTCFullYear(),
                          month.getUTCMonth() + 1,
                          1,
                        ),
                      ),
                    )
                  }
                >
                  Next month
                </Button>
              </div>
              <p className="caption">
                Event dates shown in Asia/Ho_Chi_Minh (GMT+7).
              </p>
              <div className="calendar-grid">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div className="calendar-weekday" key={d}>
                    {d}
                  </div>
                ))}
                {Array.from({ length: offset }, (_, i) => (
                  <div key={"empty" + i} className="calendar-day calendar-blank" />
                ))}
                {Array.from({ length: days }, (_, i) => {
                  const key = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                  return (
                    <div className="calendar-day" key={key}>
                      <span>{i + 1}</span>
                      {events
                        .filter((event) => vnDay(event.startsAt) === key)
                        .map((event) => (
                          <Link to={"/events/" + event.id} key={event.id}>
                            {event.title}
                          </Link>
                        ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {view === "map" && (
            <div className="map-layout">
              <div className="map-list">
                {events.map((event) => (
                  <button
                    type="button"
                    key={event.id}
                    onClick={() => setSelected(event.id)}
                    className={mapEvent?.id === event.id ? "active" : ""}
                  >
                    <strong>{event.title}</strong>
                    <span>{event.city}</span>
                  </button>
                ))}
              </div>
              <div className="map-canvas">
                {!mapEvent ? (
                  <Empty
                    title="No events to map"
                    description="Choose another city or remove the distance filter."
                  />
                ) : onlineMap ? (
                  <>
                    <iframe
                      title={"OpenStreetMap location of " + mapEvent.title}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`}
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                    <div className="map-caption">
                      <span>
                        {serverMode ? mapEvent.venue : "Fictional venue"} / {mapEvent.city}
                      </span>
                      <Link to={"/events/" + mapEvent.id}>
                        View event <Icon name="arrow" size={15} />
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="map-consent">
                    <Icon name="globe" size={54} />
                    <h2>Your next connection, mapped.</h2>
                    <p>
                      Load a live OpenStreetMap for the selected
                      {serverMode ? "" : " fictional"} event. Your browser will
                      contact an external map provider.
                    </p>
                    <Button onClick={() => setOnlineMap(true)}>
                      Load online map <Icon name="external" size={16} />
                    </Button>
                    <small>
                      Internet required. Event list and calendar work offline.
                    </small>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
