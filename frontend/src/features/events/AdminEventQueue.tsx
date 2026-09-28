import React, { useState } from "react";
import { useApp } from "../../lib/store";
import { Link } from "../../lib/router";
import { Button, Confirm, Empty, Icon, Notice, Skeleton } from "../../components/ui";
import type { EventItem, EventStatus } from "./api";
import { useModerationQueue } from "./hooks";

const FILTERS: [EventStatus | "all", string][] = [
  ["pending", "Pending review"],
  ["published", "Published"],
  ["rejected", "Not approved"],
  ["all", "All"],
];

const STATUS_LABELS: Record<EventStatus, string> = {
  published: "Published",
  pending: "Pending review",
  rejected: "Not approved",
};

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso));

/** Admin review queue backed by GET /events?scope=moderation. */
export default function AdminEventQueue() {
  const { notify } = useApp();
  const [filter, setFilter] = useState<EventStatus | "all">("pending");
  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState<EventItem | null>(null);
  const queue = useModerationQueue(filter);

  const decide = async (event: EventItem, next: EventStatus) => {
    const result = await queue.setStatus(event.id, next);
    if (result.ok)
      notify(
        next === "published"
          ? `"${event.title}" is now public.`
          : next === "rejected"
            ? `"${event.title}" was not approved.`
            : `"${event.title}" moved back to review.`,
        "success",
      );
    else notify(result.error, "error");
  };

  const needle = q.trim().toLowerCase();
  const items = queue.items.filter(
    (e) =>
      !needle ||
      [e.title, e.city, e.venue, e.authorName || ""].some((t) =>
        t.toLowerCase().includes(needle),
      ),
  );

  return (
    <>
      <div className="admin-toolbar">
        <h2>Events</h2>
        <label className="search-input">
          <Icon name="search" size={16} />
          <input
            aria-label="Search events in this queue"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search records..."
          />
        </label>
        <Link className="btn btn-primary" to="/events/new">
          <Icon name="plus" size={16} />
          Add new
        </Link>
      </div>
      <div className="segmented admin-event-filter" role="group" aria-label="Event review status">
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={filter === value ? "active" : ""}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {queue.error && (
        <Notice kind="error">
          {queue.error}{" "}
          <Button variant="ghost" onClick={() => void queue.reload()}>
            Retry
          </Button>
        </Notice>
      )}
      {queue.status === "loading" && !queue.items.length ? (
        <Skeleton cards={3} />
      ) : items.length ? (
        <div className="admin-card-grid">
          {items.map((e) => {
            const busy = queue.busyId === e.id;
            return (
              <article className="panel" key={e.id}>
                <div className="split-row">
                  <span className={"status status-" + e.status}>
                    {STATUS_LABELS[e.status]}
                  </span>
                  {e.createdAt && (
                    <small className="muted">Sent {when(e.createdAt)}</small>
                  )}
                </div>
                <h3>{e.title}</h3>
                <p className="muted">
                  {e.categoryName} / by {e.authorName || "Unknown member"}
                </p>
                <p>
                  {when(e.startsAt)} / {e.venue}, {e.city}
                </p>
                <p className="clamp-3">{e.description}</p>
                <div className="row-actions admin-event-actions">
                  {e.status !== "published" && (
                    <Button busy={busy} onClick={() => void decide(e, "published")}>
                      <Icon name="check" size={15} />
                      Approve
                    </Button>
                  )}
                  {e.status !== "rejected" && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void decide(e, "rejected")}
                    >
                      {e.status === "published" ? "Unpublish" : "Reject"}
                    </Button>
                  )}
                  <Link className="small-link" to={`/events/${e.id}/edit`}>
                    Edit
                  </Link>
                  <Link className="small-link" to={`/events/${e.id}`}>
                    View <Icon name="external" size={13} />
                  </Link>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setDeleting(e)}
                  >
                    <Icon name="trash" size={15} />
                    Delete
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty
          icon="calendar"
          title={filter === "pending" ? "Nothing waiting for review" : "No events here"}
          description={
            filter === "pending"
              ? "Events members create will appear here for approval."
              : "Try another status or clear the search."
          }
        />
      )}
      <Confirm
        open={!!deleting}
        title={`Delete "${deleting?.title}"?`}
        description="The event, its cover image and any bookmarks of it are removed permanently."
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const result = await queue.remove(deleting.id);
          if (result.ok) notify("Event deleted.", "success");
          else notify(result.error, "error");
          setDeleting(null);
        }}
      />
    </>
  );
}
