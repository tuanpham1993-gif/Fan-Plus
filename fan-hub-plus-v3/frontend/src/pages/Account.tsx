import React, { useState } from "react";
import { useApp } from "../lib/store";
import { Link, navigate, currentPath } from "../lib/router";
import { repository } from "../services/repository";
import { recommend } from "../domain/logic";
import type { Bookmark, Feedback } from "../domain/types";
import {
  PageHeading,
  Crumbs,
  Icon,
  Button,
  ContentCard,
  Empty,
  Field,
  Notice,
  Modal,
  Confirm,
} from "../components/ui";
const nav = [
  ["/dashboard", "Overview"],
  ["/collection", "My collection"],
  ["/profile", "My profile"],
  ["/submit", "My stories"],
];
function AccountNav() {
  return (
    <nav className="account-nav" aria-label="Your workspace">
      {nav.map(([to, label]) => (
        <Link key={to} to={to} className={currentPath() === to ? "active" : ""}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
function Dashboard() {
  const { db, user } = useApp();
  if (!db || !user) return null;
  const saved = db.bookmarks.filter((b) => b.userId === user.id),
    activity = db.activity.filter((a) => a.userId === user.id).slice(0, 4),
    contributions = db.submissions.filter((s) => s.userId === user.id),
    worlds = new Set(
      db.activity
        .filter((a) => a.userId === user.id)
        .map((a) => db.contents.find((c) => c.id === a.contentId)?.categoryId)
        .filter(Boolean),
    );
  return (
    <>
      <PageHeading
        eyebrow="YOUR PERSONAL UNIVERSE"
        title={`Good to see you, ${user.name.split(" ")[0]}.`}
        description="A home for everything that sparks your curiosity."
      >
        <Link className="btn btn-secondary" to="/profile">
          <Icon name="edit" size={16} />
          Personalize your space
        </Link>
      </PageHeading>
      <AccountNav />
      <div className="stats-grid">
        <div className="stat-card">
          <Icon name="bookmark" />
          <strong>{saved.length}</strong>
          <span>Saved discoveries</span>
        </div>
        <div className="stat-card">
          <Icon name="globe" />
          <strong>
            {worlds.size}
            <small> / {db.categories.length}</small>
          </strong>
          <span>Worlds explored while signed in</span>
        </div>
        <div className="stat-card">
          <Icon name="edit" />
          <strong>{contributions.length}</strong>
          <span>Stories submitted</span>
        </div>
        <div className="stat-card">
          <Icon name="trophy" />
          <strong>
            {contributions.filter((s) => s.status === "approved").length > 0
              ? "Contributor"
              : "Explorer"}
          </strong>
          <span>
            {contributions.some((s) => s.status === "approved")
              ? "A story of yours has been approved."
              : "Your discovery passport starts here."}
          </span>
        </div>
      </div>
      <section className="panel passport">
        <div>
          <span className="eyebrow">YOUR DISCOVERY PASSPORT</span>
          <h2>There is always another world.</h2>
          <p className="muted">
            Visit a detail page while signed in to explore a category. These are
            local demo achievements, not event attendance.
          </p>
        </div>
        <div className="passport-stamps">
          {db.categories.map((c) => (
            <Link
              to={"/explore?category=" + c.id}
              className={worlds.has(c.id) ? "stamp earned" : "stamp"}
              key={c.id}
            >
              <Icon name={c.icon} size={23} />
              <span>{c.name}</span>
              {worlds.has(c.id) && <Icon name="check" size={12} />}
            </Link>
          ))}
        </div>
      </section>
      <section className="content-section">
        <div className="section-heading">
          <h2>Picked for your next chapter.</h2>
          <Link className="text-link" to="/explore">
            Keep exploring <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="card-grid home-cards">
          {recommend(db, user, 4).map((x) => (
            <ContentCard
              key={x.content.id}
              content={x.content}
              reason={x.reason}
            />
          ))}
        </div>
      </section>
      <div className="two-column">
        <section className="panel">
          <h2>Recently explored</h2>
          {activity.length ? (
            activity.map((a) => {
              const c = db.contents.find((x) => x.id === a.contentId);
              return c ? (
                <Link
                  className="activity-row"
                  to={"/content/" + c.id}
                  key={a.contentId}
                >
                  <img src={c.image} alt="" />
                  <span>
                    <strong>{c.title}</strong>
                    <small>{new Date(a.at).toLocaleString()}</small>
                  </span>
                  <Icon name="arrow" size={16} />
                </Link>
              ) : null;
            })
          ) : (
            <p className="muted">
              Open a story, character or collectible to begin your reading
              history.
            </p>
          )}
        </section>
        <section className="panel">
          <h2>Your favorite worlds</h2>
          <div className="tag-list">
            {user.favoriteCategories.length ? (
              user.favoriteCategories.map((id) => (
                <Link to={"/explore?category=" + id} className="tag" key={id}>
                  {db.categories.find((c) => c.id === id)?.name}
                </Link>
              ))
            ) : (
              <p className="muted">
                Choose your interests and we will explain why each discovery is
                recommended.
              </p>
            )}
          </div>
          <Link to="/profile" className="text-link">
            Edit your interests <Icon name="arrow" size={16} />
          </Link>
        </section>
      </div>
    </>
  );
}
function Collection() {
  const { db, user, perform } = useApp();
  const [q, setQ] = useState(""),
    [note, setNote] = useState<Bookmark | null>(null),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false);
  if (!db || !user) return null;
  const saved = db.bookmarks
    .filter((b) => b.userId === user.id)
    .map((b) => ({ b, c: db.contents.find((c) => c.id === b.contentId) }))
    .filter((x) => x.c?.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeading
        eyebrow="KEEP THE GOOD STUFF CLOSE"
        title="Your collection."
        description="The stories, characters and creative things you want to come back to."
      />
      <AccountNav />
      <div className="collection-toolbar">
        <label className="search-input">
          <Icon name="search" />
          <input
            aria-label="Search your collection"
            placeholder="Search your saved discoveries..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <span className="muted">
          {saved.length} saved {saved.length === 1 ? "item" : "items"}
        </span>
      </div>
      {saved.length ? (
        <div className="card-grid">
          {saved.map(
            ({ b, c }) =>
              c && (
                <div key={b.id}>
                  <ContentCard content={c} />
                  <button
                    className="note-button"
                    type="button"
                    onClick={() => {
                      setNote(b);
                      setText(b.note);
                    }}
                  >
                    <Icon name="edit" size={15} />
                    {b.note ? b.note : "Add a private demo note"}
                  </button>
                </div>
              ),
          )}
        </div>
      ) : (
        <Empty
          icon="bookmark"
          title={q ? "No matching saves" : "Make room for your next favorite."}
          description={
            q
              ? "Try another title or clear the search."
              : "Use the bookmark icon on any published discovery. Your collection is scoped to the signed-in demo profile."
          }
        >
          <Link to="/explore" className="btn btn-primary">
            Find something worth saving <Icon name="arrow" size={16} />
          </Link>
        </Empty>
      )}
      <Modal
        open={!!note}
        onClose={() => setNote(null)}
        title="A note for future you"
      >
        <form
          className="stack-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!note) return;
            setBusy(true);
            if (
              await perform(
                () => repository.saveNote(note.id, text),
                "Note saved.",
              )
            )
              setNote(null);
            setBusy(false);
          }}
        >
          <Field
            label="Your note"
            hint="Stored locally with this demo profile. Do not enter sensitive information."
          >
            <textarea
              rows={6}
              maxLength={1000}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </Field>
          <span className="muted">{text.length}/1000</span>
          <Button busy={busy} type="submit">
            Save note
          </Button>
        </form>
      </Modal>
    </>
  );
}
function Profile() {
  const {
    db,
    user,
    perform,
    notify,
    setDb,
    fontScale,
    setFontScale,
    theme,
    toggleTheme,
    spoilerSafe,
    toggleSpoilers,
  } = useApp();
  const [name, setName] = useState(user?.name || ""),
    [bio, setBio] = useState(user?.bio || ""),
    [cats, setCats] = useState(user?.favoriteCategories || []),
    [fandoms, setFandoms] = useState((user?.favoriteFandoms || []).join(", ")),
    [avatar, setAvatar] = useState(user?.avatar || ""),
    [busy, setBusy] = useState(false),
    [reset, setReset] = useState(false);
  if (!db || !user) return null;
  const upload = async (file?: File) => {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      notify("Choose a PNG, JPEG or WebP smaller than 2 MB.", "error");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file),
        canvas = document.createElement("canvas");
      canvas.width = canvas.height = 160;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Image processing unavailable.");
      const side = Math.min(bitmap.width, bitmap.height);
      ctx.drawImage(
        bitmap,
        (bitmap.width - side) / 2,
        (bitmap.height - side) / 2,
        side,
        side,
        0,
        0,
        160,
        160,
      );
      bitmap.close();
      setAvatar(canvas.toDataURL("image/webp", 0.8));
    } catch {
      notify("This image could not be opened. Try another file.", "error");
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="MAKE THIS SPACE YOURS"
        title="Your profile."
        description="Your interests shape your discoveries. Preferences are saved on this device."
      />
      <AccountNav />
      <div className="profile-grid">
        <form
          className="panel stack-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            await perform(
              () =>
                repository.updateProfile({
                  name,
                  bio,
                  favoriteCategories: cats,
                  favoriteFandoms: fandoms
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                  avatar,
                }),
              "Your profile has been updated.",
            );
            setBusy(false);
          }}
        >
          <div className="profile-identity">
            <div className="profile-avatar">
              {avatar ? (
                <img src={avatar} alt="Your demo avatar" />
              ) : (
                user.name.slice(0, 1)
              )}
            </div>
            <div>
              <h2>{user.name}</h2>
              <p className="muted">{user.email}</p>
              <label className="upload-label">
                Change avatar
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => void upload(e.target.files?.[0])}
                />
              </label>
              {avatar && (
                <button
                  className="small-link"
                  type="button"
                  onClick={() => setAvatar("")}
                >
                  Remove avatar
                </button>
              )}
            </div>
          </div>
          <Field label="Display name">
            <input
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="A little about you">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Tell us which worlds you love..."
            />
          </Field>
          <fieldset>
            <legend>Favorite categories</legend>
            <div className="preference-grid">
              {db.categories.map((c) => (
                <label
                  key={c.id}
                  className={
                    cats.includes(c.id) ? "preference selected" : "preference"
                  }
                >
                  <input
                    type="checkbox"
                    checked={cats.includes(c.id)}
                    onChange={() =>
                      setCats((s) =>
                        s.includes(c.id)
                          ? s.filter((x) => x !== c.id)
                          : [...s, c.id],
                      )
                    }
                  />
                  <Icon name={c.icon} size={18} />
                  {c.name}
                </label>
              ))}
            </div>
          </fieldset>
          <Field
            label="Favorite fandoms"
            hint="Use exact demo fandom names, separated by commas. For example: Neon Horizon, Skybound."
          >
            <input
              value={fandoms}
              onChange={(e) => setFandoms(e.target.value)}
              maxLength={500}
            />
          </Field>
          <Button type="submit" busy={busy}>
            Save profile <Icon name="check" size={17} />
          </Button>
        </form>
        <aside className="stack">
          <section className="panel">
            <h2>Reading preferences</h2>
            <div className="setting-row">
              <span>Appearance</span>
              <Button variant="secondary" onClick={toggleTheme}>
                <Icon name={theme === "dark" ? "moon" : "sun"} size={16} />
                {theme === "dark" ? "Dark" : "Light"}
              </Button>
            </div>
            <Field label="Text size">
              <select
                value={fontScale}
                onChange={(e) => setFontScale(Number(e.target.value))}
              >
                <option value={1}>Standard - 100%</option>
                <option value={1.125}>Comfortable - 112.5%</option>
                <option value={1.25}>Large - 125%</option>
              </select>
            </Field>
            <label className="check-row">
              <input
                type="checkbox"
                checked={spoilerSafe}
                onChange={toggleSpoilers}
              />
              Hide flagged story bodies until I reveal them
            </label>
            <p className="muted small">
              This is a reading convenience. It does not remove spoiler data
              from the browser.
            </p>
          </section>
          <section className="panel">
            <h2>Demo workspace</h2>
            <Notice>
              No real email or secure server session is connected. Use the
              backend integration checklist before deployment.
            </Notice>
            <div className="stack">
              <Link to="/forgot-password" className="text-link">
                Try password reset <Icon name="arrow" size={15} />
              </Link>
              <Button
                variant="secondary"
                onClick={async () => {
                  setDb(await repository.logout());
                  navigate("/");
                }}
              >
                Sign out <Icon name="logout" size={16} />
              </Button>
              <Button variant="danger" onClick={() => setReset(true)}>
                Reset all demo data
              </Button>
            </div>
          </section>
        </aside>
      </div>
      <Confirm
        open={reset}
        onClose={() => setReset(false)}
        title="Reset this demo workspace?"
        description="This removes all local profiles, notes, ratings, submissions, edits and chat history from Fan Hub Plus. Your appearance preference stays. Other websites are not affected."
        onConfirm={async () => {
          setDb(repository.resetDemo());
          notify("Demo workspace reset.");
          navigate("/");
        }}
      />
    </>
  );
}
function Submit() {
  const { db, user, perform } = useApp();
  const [title, setTitle] = useState(""),
    [categoryId, setCategory] = useState(db?.categories[0]?.id || ""),
    [fandom, setFandom] = useState(""),
    [body, setBody] = useState(""),
    [busy, setBusy] = useState(false);
  if (!db || !user) return null;
  return (
    <>
      <PageHeading
        eyebrow="FAN-MADE. COMMUNITY-LOVED."
        title="Every fan has a story."
        description="Share something original. An administrator reviews each submission before it appears in Explore."
      />
      <AccountNav />
      <div className="two-column submission-layout">
        <form
          className="panel stack-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            if (
              await perform(
                () => repository.submit({ title, categoryId, fandom, body }),
                "Your story is in the review queue.",
              )
            ) {
              setTitle("");
              setBody("");
              setFandom("");
            }
            setBusy(false);
          }}
        >
          <h2>Submit your story</h2>
          <Field label="Story title">
            <input
              required
              minLength={5}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A title that opens a door..."
            />
          </Field>
          <div className="form-row">
            <Field label="Category">
              <select
                value={categoryId}
                onChange={(e) => setCategory(e.target.value)}
              >
                {db.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fandom">
              <input
                required
                maxLength={80}
                value={fandom}
                onChange={(e) => setFandom(e.target.value)}
              />
            </Field>
          </div>
          <Field
            label="Your story"
            hint="At least 80 characters. Plain text and basic headings are supported; HTML is never executed."
          >
            <textarea
              required
              minLength={80}
              maxLength={15000}
              rows={11}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
          <label className="check-row">
            <input type="checkbox" required />
            This is my original writing, and I have permission to share it.
          </label>
          <Button type="submit" busy={busy}>
            Send for review <Icon name="send" size={17} />
          </Button>
        </form>
        <section className="panel">
          <h2>Your submission history</h2>
          <p className="muted">
            Pending stories are not included in public searches.
          </p>
          {db.submissions.filter((s) => s.userId === user.id).length ? (
            db.submissions
              .filter((s) => s.userId === user.id)
              .map((s) => (
                <article className="submission-card" key={s.id}>
                  <span className={"status status-" + s.status}>
                    {s.status}
                  </span>
                  <h3>{s.title}</h3>
                  <p className="muted small">
                    {new Date(s.createdAt).toLocaleString()}
                  </p>
                  {s.reason && (
                    <p className="review-reason">Editor's note: {s.reason}</p>
                  )}
                </article>
              ))
          ) : (
            <div className="empty compact">
              <Icon name="edit" size={32} />
              <h3>Your first story starts here.</h3>
              <p>
                Once submitted, its review status will appear in this space.
              </p>
            </div>
          )}
          <Notice>
            Review is simulated locally. Sign in as the demo administrator to
            exercise approval or rejection.
          </Notice>
        </section>
      </div>
    </>
  );
}
function FeedbackPage() {
  const { db, user, perform } = useApp();
  const [type, setType] = useState<Feedback["type"]>("suggestion"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  return (
    <>
      <Crumbs items={[{ label: "Feedback" }]} />
      <PageHeading
        eyebrow="HELP US BUILD A BETTER UNIVERSE"
        title="We're listening."
        description="Found a bug, have an idea, or need a hand? Tell us about it."
      />
      <div className="two-column">
        <form
          className="panel stack-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            if (
              await perform(
                () => repository.feedback(type, message),
                "Feedback saved to the demo review queue.",
              )
            ) {
              setMessage("");
              setDone(true);
            }
            setBusy(false);
          }}
        >
          {done && (
            <Notice kind="success">
              Thank you. This feedback has been stored locally, not sent to a
              support team.
            </Notice>
          )}
          <Field label="What is this about?">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Feedback["type"])}
            >
              <option value="suggestion">A suggestion</option>
              <option value="bug">A bug</option>
              <option value="query">A question</option>
            </select>
          </Field>
          <Field
            label="Your message"
            hint="10-2000 characters. Do not include passwords or sensitive information."
          >
            <textarea
              required
              minLength={10}
              maxLength={2000}
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="The more context, the better..."
            />
          </Field>
          <Button type="submit" busy={busy}>
            Send demo feedback <Icon name="send" size={16} />
          </Button>
        </form>
        <section className="panel">
          <h2>A few helpful answers</h2>
          {db?.faqs.slice(0, 4).map((f) => (
            <details className="faq-item" key={f.id}>
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
          {user && (
            <>
              <h3>Your recent feedback</h3>
              {db?.feedback
                .filter((f) => f.userId === user.id)
                .slice(0, 4)
                .map((f) => (
                  <div className="submission-card" key={f.id}>
                    <span className={"status status-" + f.status}>
                      {f.status}
                    </span>
                    <p>{f.message}</p>
                  </div>
                ))}
            </>
          )}
        </section>
      </div>
    </>
  );
}
export default function Account({ mode }: { mode: string }) {
  return mode === "dashboard" ? (
    <Dashboard />
  ) : mode === "collection" ? (
    <Collection />
  ) : mode === "profile" ? (
    <Profile />
  ) : mode === "submit" ? (
    <Submit />
  ) : (
    <FeedbackPage />
  );
}
