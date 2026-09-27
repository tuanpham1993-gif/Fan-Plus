import React, { useState } from "react";
import { useApp } from "../lib/store";
import { useAuth } from "../features/auth/AuthProvider";
import { useAdminDashboard } from "../features/admin/hooks";
import { serverMode } from "../shared/http/client";
import { Link, useLocation } from "../lib/router";
import type {
  Content,
  Category,
  FanEvent,
  FAQ,
  Submission,
} from "../domain/types";
import {
  Icon,
  PageHeading,
  Button,
  Field,
  Modal,
  Confirm,
  Notice,
  Empty,
  Skeleton,
  typeLabels,
} from "../components/ui";
const sections = [
  ["overview", "grid", "Overview"],
  ["content", "book", "Content library"],
  ["categories", "globe", "Categories"],
  ["events", "calendar", "Events"],
  ["submissions", "edit", "Fan submissions"],
  ["users", "users", "People"],
  ["feedback", "mail", "Feedback"],
  ["knowledge", "sparkles", "Knowledge base"],
];
type EditableValue = Content | Category | FanEvent | FAQ;
type Editor =
  | {
      kind: "content";
      value: Content;
    }
  | {
      kind: "category";
      value: Category;
    }
  | {
      kind: "event";
      value: FanEvent;
    }
  | {
      kind: "faq";
      value: FAQ;
    };
function EditorialForm({
  editor,
  categories,
  onSave,
  onDone,
}: {
  editor: Editor;
  categories: Category[];
  onSave: (kind: Editor["kind"], value: EditableValue) => Promise<boolean>;
  onDone: () => void;
}) {
  const [value, setValue] = useState<EditableValue>(editor.value),
    [busy, setBusy] = useState(false);
  const patch = (v: object) =>
    setValue((old) => ({ ...old, ...v }) as EditableValue);
  const categorySelect = (v: string) => (
    <select
      value={v}
      required
      onChange={(e) => patch({ categoryId: e.target.value })}
    >
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (await onSave(editor.kind, value)) onDone();
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="stack-form" onSubmit={submit}>
      {editor.kind === "content" &&
        (() => {
          const c = value as Content;
          return (
            <>
              <Field label="Title">
                <input
                  value={c.title}
                  required
                  minLength={3}
                  maxLength={120}
                  onChange={(e) => patch({ title: e.target.value })}
                />
              </Field>
              <div className="form-row">
                <Field label="Category">{categorySelect(c.categoryId)}</Field>
                <Field label="Content type">
                  <select
                    value={c.type}
                    onChange={(e) => patch({ type: e.target.value })}
                  >
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <option value={k} key={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="form-row">
                <Field label="Fandom">
                  <input
                    value={c.fandom}
                    required
                    maxLength={80}
                    onChange={(e) => patch({ fandom: e.target.value })}
                  />
                </Field>
                <Field label="Genre">
                  <input
                    value={c.genre}
                    required
                    maxLength={60}
                    onChange={(e) => patch({ genre: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Summary">
                <textarea
                  value={c.description}
                  required
                  minLength={12}
                  maxLength={400}
                  rows={3}
                  onChange={(e) => patch({ description: e.target.value })}
                />
              </Field>
              <Field
                label="Story / biography / description"
                hint="Plain text, ## headings and **bold**. Raw HTML is displayed as text."
              >
                <textarea
                  value={c.body}
                  maxLength={30000}
                  rows={7}
                  onChange={(e) => patch({ body: e.target.value })}
                />
              </Field>
              <div className="form-row">
                <Field label="Release year">
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    required
                    value={c.year}
                    onChange={(e) => patch({ year: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={c.status}
                    onChange={(e) => patch({ status: e.target.value })}
                  >
                    <option value="draft">Draft - private to admin</option>
                    <option value="published">Published</option>
                  </select>
                </Field>
              </div>
              <div className="form-row">
                <Field label="Cover artwork">
                  <select
                    value={c.image}
                    onChange={(e) => patch({ image: e.target.value })}
                  >
                    {[
                      "anime",
                      "gaming",
                      "movies",
                      "tv",
                      "kpop",
                      "comics",
                      "manga",
                      "cosplay",
                      "community",
                    ].map((s) => (
                      <option key={s} value={"/art/" + s + ".svg"}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tags" hint="Separate with commas.">
                  <input
                    value={c.tags.join(", ")}
                    onChange={(e) =>
                      patch({
                        tags: e.target.value.split(",").map((t) => t.trim()),
                      })
                    }
                  />
                </Field>
              </div>
              {(c.type === "video" || c.type === "audio") && (
                <Field
                  label="Media URL"
                  hint="Local /media/ file or an HTTPS direct media URL. Provider embeds need a separate allowlisted renderer."
                >
                  <input
                    value={c.mediaUrl || ""}
                    onChange={(e) => patch({ mediaUrl: e.target.value })}
                    placeholder={
                      c.type === "video"
                        ? "/media/portal.webm"
                        : "/media/orbit.wav"
                    }
                  />
                </Field>
              )}
              <Field
                label="Fictional release date (optional)"
                hint="Creates an entry in the cross-fandom release calendar."
              >
                <input
                  type="date"
                  value={c.releaseDate || ""}
                  onChange={(e) =>
                    patch({ releaseDate: e.target.value || undefined })
                  }
                />
              </Field>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={c.spoiler}
                  onChange={(e) => patch({ spoiler: e.target.checked })}
                />
                Flag story body for spoiler-safe reading
              </label>
            </>
          );
        })()}
      {editor.kind === "category" &&
        (() => {
          const c = value as Category;
          return (
            <>
              <Field label="Category name">
                <input
                  value={c.name}
                  required
                  maxLength={40}
                  onChange={(e) => patch({ name: e.target.value })}
                />
              </Field>
              <Field label="Description">
                <textarea
                  rows={3}
                  value={c.description}
                  required
                  onChange={(e) => patch({ description: e.target.value })}
                />
              </Field>
              <div className="form-row">
                <Field label="Icon">
                  <select
                    value={c.icon}
                    onChange={(e) => patch({ icon: e.target.value })}
                  >
                    {[
                      "sparkles",
                      "gamepad",
                      "film",
                      "tv",
                      "music",
                      "book",
                      "mask",
                      "globe",
                    ].map((i) => (
                      <option key={i}>{i}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Accent color">
                  <input
                    type="color"
                    value={c.color}
                    onChange={(e) => patch({ color: e.target.value })}
                  />
                </Field>
              </div>
            </>
          );
        })()}
      {editor.kind === "event" &&
        (() => {
          const e = value as FanEvent;
          return (
            <>
              <Notice>
                All events in this prototype are fictional. Do not represent
                them as real gatherings.
              </Notice>
              <Field label="Event title">
                <input
                  required
                  maxLength={120}
                  value={e.title}
                  onChange={(x) => patch({ title: x.target.value })}
                />
              </Field>
              <div className="form-row">
                <Field label="City">
                  <input
                    required
                    value={e.city}
                    onChange={(x) => patch({ city: x.target.value })}
                  />
                </Field>
                <Field label="Category">{categorySelect(e.categoryId)}</Field>
              </div>
              <Field label="Venue">
                <input
                  required
                  value={e.venue}
                  onChange={(x) => patch({ venue: x.target.value })}
                />
              </Field>
              <div className="form-row">
                <Field
                  label="Starts at"
                  hint="ISO format with explicit timezone, e.g. 2026-10-03T10:00:00+07:00."
                >
                  <input
                    required
                    value={e.startsAt}
                    onChange={(x) => patch({ startsAt: x.target.value })}
                  />
                </Field>
                <Field label="Ends at">
                  <input
                    required
                    value={e.endsAt}
                    onChange={(x) => patch({ endsAt: x.target.value })}
                  />
                </Field>
              </div>
              <div className="form-row">
                <Field label="Latitude">
                  <input
                    type="number"
                    step="any"
                    required
                    min={-90}
                    max={90}
                    value={e.lat}
                    onChange={(x) => patch({ lat: Number(x.target.value) })}
                  />
                </Field>
                <Field label="Longitude">
                  <input
                    type="number"
                    step="any"
                    required
                    min={-180}
                    max={180}
                    value={e.lng}
                    onChange={(x) => patch({ lng: Number(x.target.value) })}
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  required
                  rows={5}
                  value={e.description}
                  onChange={(x) => patch({ description: x.target.value })}
                />
              </Field>
              <Field
                label="External organizer ticket URL (optional)"
                hint="HTTPS only. This is an outbound link, not a purchase or checkout on Fan Hub Plus."
              >
                <input
                  type="url"
                  pattern="https://.*"
                  value={e.ticketUrl || ""}
                  onChange={(x) => patch({ ticketUrl: x.target.value })}
                />
              </Field>
            </>
          );
        })()}
      {editor.kind === "faq" &&
        (() => {
          const f = value as FAQ;
          return (
            <>
              <Field label="Question">
                <input
                  minLength={5}
                  required
                  value={f.question}
                  onChange={(e) => patch({ question: e.target.value })}
                />
              </Field>
              <Field label="Approved answer">
                <textarea
                  minLength={10}
                  rows={7}
                  required
                  value={f.answer}
                  onChange={(e) => patch({ answer: e.target.value })}
                />
              </Field>
              <Notice>
                The local assistant reads these entries. Vector indexing and LLM
                generation are not connected.
              </Notice>
            </>
          );
        })()}
      <div className="modal-actions">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" busy={busy}>
          Save changes <Icon name="check" size={16} />
        </Button>
      </div>
    </form>
  );
}
export default function Admin() {
  const { notify } = useApp();
  const { user } = useAuth();
  const admin = useAdminDashboard(user?.role === "admin");
  const { params } = useLocation();
  const section = sections.some((s) => s[0] === params.get("tab"))
    ? params.get("tab")!
    : "overview";
  const [q, setQ] = useState(""),
    [editor, setEditor] = useState<Editor | null>(null),
    [deletion, setDeletion] = useState<{
      title: string;
      run: () => Promise<boolean>;
    } | null>(null),
    [review, setReview] = useState<Submission | null>(null),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false);
  if (!user) return null;

  const pageHeader = (
    <>
      <PageHeading
        eyebrow="THE EDITORIAL WORKSPACE"
        title="Bring the universe to life."
        description="Manage discoveries, review community stories and keep the experience welcoming."
      >
        <Link to="/" className="btn btn-secondary">
          View public site <Icon name="external" size={16} />
        </Link>
      </PageHeading>
      <Notice>
        {serverMode
          ? "Connected administrator workspace. The backend is the authorization and business-data boundary."
          : "Local administrator simulator. Permissions here are UX behavior only; deployed authorization must remain server-side."}
      </Notice>
    </>
  );

  if (admin.loading && !admin.data) {
    return (
      <>
        {pageHeader}
        <div className="admin-content">
          <Skeleton cards={4} />
        </div>
      </>
    );
  }

  if (!admin.data) {
    return (
      <>
        {pageHeader}
        <Notice kind="error">
          <p>{admin.error || "The administrator workspace could not be loaded."}</p>
          <Button variant="secondary" onClick={() => void admin.reload()}>
            Retry
          </Button>
        </Notice>
      </>
    );
  }

  const data = admin.data;
  const pending = data.submissions.filter((s) => s.status === "pending"),
    matches = (text: string) => text.toLowerCase().includes(q.toLowerCase());

  const runAction = async (
    operation: () => Promise<void>,
    successMessage: string,
  ) => {
    try {
      await operation();
      notify(successMessage);
      return true;
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Administrator action failed.",
        "error",
      );
      return false;
    }
  };

  const saveEditorial = async (kind: Editor["kind"], value: EditableValue) => {
    if (kind === "content")
      return runAction(
        () => admin.saveContent(value as Content),
        "Content saved.",
      );
    if (kind === "category")
      return runAction(
        () => admin.saveCategory(value as Category),
        "Category saved.",
      );
    if (kind === "event")
      return runAction(() => admin.saveEvent(value as FanEvent), "Event saved.");
    return runAction(
      () => admin.saveKnowledge(value as FAQ),
      "Knowledge entry saved.",
    );
  };
  const newContent = (): Content => ({
    id: "",
    title: "",
    description: "",
    body: "",
    categoryId: data.categories[0]?.id || "",
    fandom: "",
    type: "article",
    genre: "Adventure",
    year: 2026,
    publishedAt: new Date().toISOString(),
    popularity: 0,
    rating: 0,
    duration: "New discovery",
    tags: [],
    status: "draft",
    author: user.name,
    spoiler: false,
    image: "/art/community.svg",
    sourceLabel: "Admin-created demo content",
  });
  const add = () => {
    if (section === "content")
      setEditor({ kind: "content", value: newContent() });
    if (section === "categories")
      setEditor({
        kind: "category",
        value: {
          id: "",
          name: "",
          description: "",
          icon: "globe",
          color: "#8bded1",
        },
      });
    if (section === "events")
      setEditor({
        kind: "event",
        value: {
          id: "",
          title: "",
          city: "Ho Chi Minh City",
          venue: "",
          lat: 10.7769,
          lng: 106.7009,
          startsAt: "2026-10-03T10:00:00+07:00",
          endsAt: "2026-10-03T17:00:00+07:00",
          categoryId: data.categories[0]?.id || "",
          description: "",
          image: "/art/community.svg",
        },
      });
    if (section === "knowledge")
      setEditor({ kind: "faq", value: { id: "", question: "", answer: "" } });
  };
  const remove = (title: string, run: () => Promise<boolean>) =>
    setDeletion({ title, run });
  const moderate = async (decision: "approved" | "rejected") => {
    if (!review) return;
    setBusy(true);
    const ok = await runAction(
      () => admin.moderateSubmission(review.id, decision, reason),
      decision === "approved"
        ? "Story published to Explore."
        : "Story returned with editorial feedback.",
    );
    if (ok) {
      setReview(null);
      setReason("");
    }
    setBusy(false);
  };
  return (
    <>
      {pageHeader}
      {admin.error && (
        <Notice kind="error">{admin.error}</Notice>
      )}
      <div className="admin-layout">
        <nav className="admin-nav" aria-label="Admin sections">
          {sections.map(([id, icon, label]) => (
            <Link
              key={id}
              className={section === id ? "active" : ""}
              to={"/admin?tab=" + id}
              onClick={() => setQ("")}
            >
              <Icon name={icon} size={18} />
              <span>{label}</span>
              {id === "submissions" && pending.length > 0 && (
                <span className="count-badge">{pending.length}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="admin-content">
          {section === "overview" ? (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <Icon name="book" />
                  <strong>
                    {data.contents.filter((c) => c.status === "published").length}
                  </strong>
                  <span>Published discoveries</span>
                </div>
                <div className="stat-card">
                  <Icon name="users" />
                  <strong>{data.users.filter((u) => !u.suspended).length}</strong>
                  <span>Enabled accounts</span>
                </div>
                <div className="stat-card">
                  <Icon name="edit" />
                  <strong>{pending.length}</strong>
                  <span>Awaiting review</span>
                </div>
                <div className="stat-card">
                  <Icon name="mail" />
                  <strong>
                    {data.feedback.filter((f) => f.status === "open").length}
                  </strong>
                  <span>Open feedback</span>
                </div>
              </div>
              <section className="panel">
                <h2>Content mix</h2>
                <p className="muted">
                  Calculated from the current administrator content library. These bars show
                  inventory, not live user popularity.
                </p>
                <div className="analytics-bars">
                  {data.categories.map((cat) => {
                    const count = data.contents.filter(
                      (c) => c.categoryId === cat.id,
                    ).length;
                    return (
                      <div key={cat.id}>
                        <span>{cat.name}</span>
                        <div className="bar-track">
                          <div
                            style={{
                              width:
                                (count /
                                  Math.max(
                                    1,
                                    ...data.categories.map(
                                      (c) =>
                                        data.contents.filter(
                                          (x) => x.categoryId === c.id,
                                        ).length,
                                    ),
                                  )) *
                                  100 +
                                "%",
                              background: cat.color,
                            }}
                          />
                        </div>
                        <strong>{count}</strong>
                      </div>
                    );
                  })}
                </div>
              </section>
              <div className="two-column">
                <section className="panel">
                  <h2>Review queues</h2>
                  <p>
                    Review catalog story submissions here, and moderate member
                    conversations, videos and soundtracks in Community.
                  </p>
                  <Link className="text-link" to="/admin?tab=submissions">
                    Open story submissions <Icon name="arrow" size={15} />
                  </Link>
                  <br />
                  <Link className="text-link" to="/community?view=review">
                    Open Community moderation <Icon name="arrow" size={15} />
                  </Link>
                </section>
                <section className="panel">
                  <h2>Instrumentation boundary</h2>
                  <p className="muted">
                    Active-user windows, aggregated view counts and chatbot volume are outside
                    the current admin workspace contract and remain backend gaps.
                  </p>
                </section>
              </div>
            </>
          ) : (
            <>
              <div className="admin-toolbar">
                <h2>{sections.find((s) => s[0] === section)?.[2]}</h2>
                <label className="search-input">
                  <Icon name="search" size={16} />
                  <input
                    aria-label="Search admin records"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search records..."
                  />
                </label>
                {["content", "categories", "events", "knowledge"].includes(
                  section,
                ) && (
                  <Button onClick={add}>
                    <Icon name="plus" size={16} />
                    Add new
                  </Button>
                )}
              </div>
              {section === "content" && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Discovery</th>
                        <th scope="col">Type / category</th>
                        <th scope="col">Status</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.contents
                        .filter((c) => matches(c.title + " " + c.fandom))
                        .map((c) => (
                          <tr key={c.id}>
                            <td>
                              <div className="table-item">
                                <img src={c.image} alt="" />
                                <div>
                                  <Link to={"/content/" + c.id}>{c.title}</Link>
                                  <small>{c.fandom}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              {typeLabels[c.type]}
                              <small>
                                {
                                  data.categories.find(
                                    (x) => x.id === c.categoryId,
                                  )?.name
                                }
                              </small>
                            </td>
                            <td>
                              <span className={"status status-" + c.status}>
                                {c.status}
                              </span>
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  className="icon-btn"
                                  aria-label={"Edit " + c.title}
                                  onClick={() =>
                                    setEditor({
                                      kind: "content",
                                      value: { ...c },
                                    })
                                  }
                                >
                                  <Icon name="edit" size={17} />
                                </button>
                                <button
                                  className="icon-btn danger-text"
                                  aria-label={"Delete " + c.title}
                                  onClick={() =>
                                    remove(c.title, () =>
                                      runAction(
                                        () => admin.deleteContent(c.id),
                                        "Content removed.",
                                      ),
                                    )
                                  }
                                >
                                  <Icon name="trash" size={17} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {!data.contents.some((c) =>
                    matches(c.title + " " + c.fandom),
                  ) && (
                    <Empty
                      title="No matching content"
                      description="Try another search or create a discovery."
                    />
                  )}
                </div>
              )}
              {section === "categories" && (
                <div className="admin-card-grid">
                  {data.categories
                    .filter((c) => matches(c.name))
                    .map((c) => (
                      <article className="panel" key={c.id}>
                        <div className="split-row">
                          <Icon name={c.icon} size={26} />
                          <span className="tag">
                            {
                              data.contents.filter((x) => x.categoryId === c.id)
                                .length
                            }{" "}
                            items
                          </span>
                        </div>
                        <h3>{c.name}</h3>
                        <p className="muted">{c.description}</p>
                        <div className="row-actions">
                          <Button
                            variant="secondary"
                            onClick={() =>
                              setEditor({ kind: "category", value: { ...c } })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              remove(c.name, () =>
                                runAction(
                                  () => admin.deleteCategory(c.id),
                                  "Unused category removed.",
                                ),
                              )
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </article>
                    ))}
                </div>
              )}
              {section === "events" && (
                <div className="admin-card-grid">
                  {data.events
                    .filter((e) => matches(e.title + " " + e.city))
                    .map((e) => (
                      <article className="panel" key={e.id}>
                        <span className="eyebrow">FICTIONAL EVENT</span>
                        <h3>{e.title}</h3>
                        <p>{e.city}</p>
                        <p className="muted">{e.startsAt}</p>
                        <div className="row-actions">
                          <Button
                            variant="secondary"
                            onClick={() =>
                              setEditor({ kind: "event", value: { ...e } })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              remove(e.title, () =>
                                runAction(
                                  () => admin.deleteEvent(e.id),
                                  "Event removed.",
                                ),
                              )
                            }
                          >
                            Delete
                          </Button>
                          <Link to={"/events/" + e.id} className="small-link">
                            View <Icon name="external" size={13} />
                          </Link>
                        </div>
                      </article>
                    ))}
                </div>
              )}
              {section === "submissions" && (
                <div className="stack">
                  {data.submissions.filter((s) => matches(s.title)).length ? (
                    data.submissions
                      .filter((s) => matches(s.title))
                      .map((s) => (
                        <article className="panel" key={s.id}>
                          <div className="split-row">
                            <span className={"status status-" + s.status}>
                              {s.status}
                            </span>
                            <small className="muted">
                              {new Date(s.createdAt).toLocaleString()}
                            </small>
                          </div>
                          <h3>{s.title}</h3>
                          <p className="muted">
                            By {data.users.find((u) => u.id === s.userId)?.name} /{" "}
                            {s.fandom}
                          </p>
                          <p className="clamp-3">{s.body}</p>
                          {s.status === "pending" ? (
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setReview(s);
                                setReason("");
                              }}
                            >
                              Review story <Icon name="arrow" size={15} />
                            </Button>
                          ) : (
                            s.reason && (
                              <p className="review-reason">{s.reason}</p>
                            )
                          )}
                        </article>
                      ))
                  ) : (
                    <Empty
                      icon="edit"
                      title="No stories to review"
                      description="Fan submissions will appear here after a member sends a story."
                    />
                  )}
                </div>
              )}
              {section === "users" && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Person</th>
                        <th scope="col">Role</th>
                        <th scope="col">Status</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users
                        .filter((u) => matches(u.name + " " + u.email))
                        .map((u) => (
                          <tr key={u.id}>
                            <td>
                              <strong>{u.name}</strong>
                              <small>{u.email}</small>
                            </td>
                            <td>{u.role}</td>
                            <td>
                              <span
                                className={
                                  "status status-" +
                                  (u.suspended ? "rejected" : "published")
                                }
                              >
                                {u.suspended ? "Suspended" : "Enabled"}
                              </span>
                            </td>
                            <td>
                              <Button
                                variant="secondary"
                                disabled={u.id === user.id}
                                onClick={() =>
                                  remove(
                                    (u.suspended ? "Enable " : "Suspend ") +
                                      u.name,
                                    () =>
                                      runAction(
                                        () =>
                                          admin.setUserStatus(
                                            u.id,
                                            !u.suspended,
                                          ),
                                        "Account status updated.",
                                      ),
                                  )
                                }
                              >
                                {u.suspended ? "Enable" : "Suspend"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
              {section === "feedback" && (
                <div className="stack">
                  {data.feedback.filter((f) => matches(f.message)).length ? (
                    data.feedback
                      .filter((f) => matches(f.message))
                      .map((f) => (
                        <article className="panel" key={f.id}>
                          <div className="split-row">
                            <span className="tag">{f.type}</span>
                            <span className={"status status-" + f.status}>
                              {f.status}
                            </span>
                          </div>
                          <p className="preserve-space">{f.message}</p>
                          <small className="muted">
                            {new Date(f.createdAt).toLocaleString()} /{" "}
                            {data.users.find((u) => u.id === f.userId)?.name ||
                              "Visitor"}
                          </small>
                          {f.status === "open" && (
                            <div className="panel-actions">
                              <Button
                                variant="secondary"
                                onClick={() =>
                                  void runAction(
                                    () => admin.resolveFeedback(f.id),
                                    "Feedback marked as resolved.",
                                  )
                                }
                              >
                                Mark resolved <Icon name="check" size={15} />
                              </Button>
                            </div>
                          )}
                        </article>
                      ))
                  ) : (
                    <Empty
                      icon="mail"
                      title="No feedback yet"
                      description="Bug reports, questions and ideas from the feedback form appear here."
                    />
                  )}
                </div>
              )}
              {section === "knowledge" && (
                <div className="stack">
                  {data.faqs
                    .filter((f) => matches(f.question + " " + f.answer))
                    .map((f) => (
                      <article className="panel" key={f.id}>
                        <h3>{f.question}</h3>
                        <p className="muted">{f.answer}</p>
                        <div className="row-actions">
                          <Button
                            variant="secondary"
                            onClick={() =>
                              setEditor({ kind: "faq", value: { ...f } })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              remove(f.question, () =>
                                runAction(
                                  () => admin.deleteKnowledge(f.id),
                                  "FAQ removed.",
                                ),
                              )
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Modal
        open={!!editor}
        onClose={() => setEditor(null)}
        title={
          editor?.value.id
            ? "Edit " + editor.kind
            : "Create " + (editor?.kind || "entry")
        }
        wide
      >
        {editor && (
          <EditorialForm
            editor={editor}
            categories={data.categories}
            onSave={saveEditorial}
            onDone={() => setEditor(null)}
          />
        )}
      </Modal>
      <Confirm
        open={!!deletion}
        onClose={() => setDeletion(null)}
        title="Confirm this change"
        description={`You are about to change or remove: ${deletion?.title || ""}. This affects the administrator workspace. Destructive deletions may not be reversible.`}
        onConfirm={async () => {
          await deletion?.run();
        }}
      />
      <Modal
        open={!!review}
        onClose={() => setReview(null)}
        title="Review community story"
        wide
      >
        {review && (
          <>
            <span className="eyebrow">{review.fandom}</span>
            <h3>{review.title}</h3>
            <div className="review-body preserve-space">{review.body}</div>
            <Field
              label="Editorial feedback"
              hint="At least 5 characters are required when rejecting a story."
            >
              <textarea
                rows={3}
                maxLength={2000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
            <div className="modal-actions">
              <Button
                variant="danger"
                busy={busy}
                disabled={reason.trim().length < 5}
                onClick={() => void moderate("rejected")}
              >
                Reject with feedback
              </Button>
              <Button busy={busy} onClick={() => void moderate("approved")}>
                Approve and publish <Icon name="check" size={16} />
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
