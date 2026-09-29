import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../lib/store";
import { useAuth } from "../features/auth/AuthProvider";
import { useProfileSettings } from "../features/profile/hooks";
import { useBookmarks } from "../features/bookmarks/BookmarksProvider";
import type { ContentBookmarkItem } from "../features/bookmarks/api";
import { useHomeCatalog } from "../features/catalog/hooks";
import { FANDOM_CATEGORIES, categoryLabel } from "../shared/catalog/taxonomy";
import { resolveAvatarUrl, serverMode } from "../shared/http/client";
import { profileApi } from "../features/profile/api";
import PersonalInfoFields, {
  type PersonalInfoErrors,
  type PersonalInfoValues,
} from "../features/profile/PersonalInfoFields";
import ChangePasswordModal from "../features/profile/ChangePasswordModal";
import {
  validateBirthday,
  validateBio,
  validateCity,
  validatePhone,
} from "../features/profile/validation";
import { Link, navigate, currentPath } from "../lib/router";
import { repository } from "../services/repository";
import type { Feedback } from "../domain/types";
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
  Skeleton,
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
  const { db } = useApp();
  const { user } = useAuth();
  const { count: bookmarkCount } = useBookmarks();
  const favoriteCategories = Array.isArray(
    (user?.display_preferences as { favoriteCategories?: string[] } | undefined)
      ?.favoriteCategories,
  )
    ? ((user?.display_preferences as { favoriteCategories?: string[] })
        .favoriteCategories as string[])
    : [];
  const {
    picks,
    loading: catalogLoading,
    error: catalogError,
  } = useHomeCatalog(user);
  if (!db || !user) return null;
  const activity = db.activity.filter((a) => a.userId === user.id).slice(0, 4),
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
          <strong>{bookmarkCount}</strong>
          <span>Saved discoveries</span>
        </div>
        <div className="stat-card">
          <Icon name="globe" />
          <strong>
            {worlds.size}
            <small> / {FANDOM_CATEGORIES.length}</small>
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
          {FANDOM_CATEGORIES.map((c) => (
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
        {catalogLoading ? (
          <Skeleton cards={4} />
        ) : catalogError ? (
          <Notice kind="error">
            Personalized catalog recommendations are not available yet.{" "}
            {catalogError}
          </Notice>
        ) : (
          <div className="card-grid home-cards">
            {picks.map((pick) => (
              <ContentCard
                key={pick.content.id}
                content={pick.content}
                reason={pick.reason}
              />
            ))}
          </div>
        )}
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
            {(favoriteCategories ?? []).length ? (
              favoriteCategories.map((id) => (
                <Link to={"/explore?category=" + id} className="tag" key={id}>
                  {categoryLabel(id)}
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
  const { notify } = useApp();
  const { user } = useAuth();
  const { status, items, error, notesSupported, saveNote } = useBookmarks();
  const [q, setQ] = useState("");
  const [note, setNote] = useState<ContentBookmarkItem | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const saved = items.filter((item) =>
    item.content.title.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <>
      <PageHeading
        eyebrow="KEEP THE GOOD STUFF CLOSE"
        title="Your collection."
        description="The stories, characters and creative things you want to come back to."
      />
      <AccountNav />

      {error && <Notice kind="error">{error}</Notice>}

      <div className="collection-toolbar">
        <label className="search-input">
          <Icon name="search" />
          <input
            aria-label="Search your collection"
            placeholder="Search your saved discoveries..."
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </label>
        <span className="muted">
          {saved.length} saved {saved.length === 1 ? "item" : "items"}
        </span>
      </div>

      {status === "loading" ? (
        <Skeleton cards={4} />
      ) : saved.length ? (
        <div className="card-grid">
          {saved.map((item) => (
            <div key={item.bookmark.id}>
              <ContentCard content={item.content} />
              {notesSupported && (
                <button
                  className="note-button"
                  type="button"
                  onClick={() => {
                    setNote(item);
                    setText(item.bookmark.note ?? "");
                  }}
                >
                  <Icon name="edit" size={15} />
                  {item.bookmark.note
                    ? item.bookmark.note
                    : "Add a private demo note"}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty
          icon="bookmark"
          title={q ? "No matching saves" : "Make room for your next favorite."}
          description={
            q
              ? "Try another title or clear the search."
              : error
                ? "Your reading list could not be loaded from its current source."
                : "Use the bookmark icon on any published discovery. Changes are reflected here immediately."
          }
        >
          <Link to="/explore" className="btn btn-primary">
            Find something worth saving <Icon name="arrow" size={16} />
          </Link>
        </Empty>
      )}

      {notesSupported && (
        <Modal
          open={!!note}
          onClose={() => setNote(null)}
          title="A note for future you"
        >
          <form
            className="stack-form"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!note) return;
              setBusy(true);
              const savedNote = await saveNote(note.bookmark.id, text);
              if (savedNote) {
                notify("Note saved.");
                setNote(null);
              } else {
                notify("Your note could not be saved.", "error");
              }
              setBusy(false);
            }}
          >
            <Field
              label="Your note"
              hint="Demo-only private note. Do not enter sensitive information."
            >
              <textarea
                rows={6}
                maxLength={1000}
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </Field>
            <span className="muted">{text.length}/1000</span>
            <Button busy={busy} type="submit">
              Save note
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
function Profile() {
  const { notify, setDb } = useApp();
  const { logout } = useAuth();
  const {
    profile: user,
    loading: profileLoading,
    saving,
    error: profileError,
    save,
    adoptProfile,
  } = useProfileSettings();
  const favoriteFandoms = user?.favorite_fandoms ?? [];
  const [name, setName] = useState(user?.name || "");
  const [fandoms, setFandoms] = useState(favoriteFandoms.join(", "));
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoValues>({
    phone: user?.phone ?? "",
    birthday: user?.birthday?.slice(0, 10) ?? "",
    gender: user?.gender ?? "",
    city: user?.city ?? "",
    bio: user?.bio ?? "",
  });
  const [personalErrors, setPersonalErrors] = useState<PersonalInfoErrors>({});
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [removeAvatarOpen, setRemoveAvatarOpen] = useState(false);
  const [reset, setReset] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const profileFormRef = useRef<HTMLFormElement>(null);
  const passwordActionRef = useRef<HTMLDivElement>(null);
  const saveInFlightRef = useRef(false);
  const previousUserRef = useRef(user);

  useEffect(() => {
    if (!user) return;
    const previous = previousUserRef.current;
    if (!previous || previous.id !== user.id) {
      setName(user.name);
      setFandoms(favoriteFandoms.join(", "));
      setPersonalInfo({
        phone: user.phone ?? "",
        birthday: user.birthday?.slice(0, 10) ?? "",
        gender: user.gender ?? "",
        city: user.city ?? "",
        bio: user.bio ?? "",
      });
    } else {
      if (previous.name !== user.name) setName(user.name);
      if (
        (previous.favorite_fandoms ?? []).join("|") !==
        favoriteFandoms.join("|")
      ) {
        setFandoms(favoriteFandoms.join(", "));
      }
      setPersonalInfo((current) => ({
        phone:
          previous.phone !== user.phone ? (user.phone ?? "") : current.phone,
        birthday:
          previous.birthday !== user.birthday
            ? (user.birthday?.slice(0, 10) ?? "")
            : current.birthday,
        gender:
          previous.gender !== user.gender
            ? (user.gender ?? "")
            : current.gender,
        city: previous.city !== user.city ? (user.city ?? "") : current.city,
        bio: previous.bio !== user.bio ? (user.bio ?? "") : current.bio,
      }));
    }
    previousUserRef.current = user;
  }, [
    user?.id,
    user?.name,
    user?.favorite_fandoms?.join("|"),
    user?.phone,
    user?.birthday,
    user?.gender,
    user?.city,
    user?.bio,
  ]);

  useEffect(() => {
    setAvatarBroken(false);
  }, [user?.avatar]);

  const upload = async (file?: File) => {
    if (!file || avatarBusy) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      notify("Choose a PNG, JPEG, or WebP image no larger than 2 MB.", "error");
      return;
    }
    setAvatarBusy(true);
    try {
      const updatedUser = await profileApi.uploadAvatar(file);
      adoptProfile(updatedUser);
      setAvatarBroken(false);
      notify("Avatar updated.");
    } catch (cause) {
      notify(
        cause instanceof Error ? cause.message : "Could not upload avatar.",
        "error",
      );
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    if (avatarBusy) return;
    setAvatarBusy(true);
    try {
      const updatedUser = await profileApi.removeAvatar();
      adoptProfile(updatedUser);
      setAvatarBroken(false);
      notify("Avatar removed.");
    } catch (cause) {
      notify(
        cause instanceof Error ? cause.message : "Could not remove avatar.",
        "error",
      );
    } finally {
      setAvatarBusy(false);
    }
  };

  const signOut = async () => {
    try {
      await logout();
      navigate("/");
    } catch (cause) {
      notify(
        cause instanceof Error ? cause.message : "Could not sign out.",
        "error",
      );
    }
  };

  const isDirty = Boolean(
    user &&
    (name !== user.name ||
      fandoms !== (user.favorite_fandoms ?? []).join(", ") ||
      personalInfo.phone !== (user.phone ?? "") ||
      personalInfo.birthday !== (user.birthday?.slice(0, 10) ?? "") ||
      personalInfo.gender !== (user.gender ?? "") ||
      personalInfo.city !== (user.city ?? "") ||
      personalInfo.bio !== (user.bio ?? "")),
  );

  const closePasswordModal = () => {
    setPasswordOpen(false);
    requestAnimationFrame(() =>
      passwordActionRef.current?.querySelector("button")?.focus(),
    );
  };

  const updatePersonalInfo = (
    field: keyof PersonalInfoValues,
    value: string,
  ) => {
    setPersonalInfo((current) => ({ ...current, [field]: value }));
    setPersonalErrors((current) => ({ ...current, [field]: "" }));
  };

  const validatePersonalInfo = () => {
    const nextErrors: PersonalInfoErrors = {
      phone: validatePhone(personalInfo.phone),
      birthday: validateBirthday(personalInfo.birthday),
      gender:
        personalInfo.gender &&
        !["male", "female", "other", "undisclosed"].includes(
          personalInfo.gender,
        )
          ? "Invalid gender."
          : "",
      city: validateCity(personalInfo.city),
      bio: validateBio(personalInfo.bio),
    };
    setPersonalErrors(nextErrors);
    if (!Object.values(nextErrors).some(Boolean)) return true;

    requestAnimationFrame(() =>
      profileFormRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus(),
    );
    return false;
  };

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || saveInFlightRef.current || !isDirty) return;
    if (!validatePersonalInfo()) return;

    saveInFlightRef.current = true;
    setSavePending(true);
    try {
      const result = await save({
        name: name.trim(),
        favorite_fandoms: fandoms
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        phone: personalInfo.phone.trim() || null,
        birthday: personalInfo.birthday.trim() || null,
        gender: personalInfo.gender.trim() || null,
        city: personalInfo.city.trim() || null,
        bio: personalInfo.bio.trim() || null,
      });
      const updatedUser = result.user;

      adoptProfile(updatedUser);
      setName(updatedUser.name);
      setFandoms((updatedUser.favorite_fandoms ?? []).join(", "));
      setPersonalInfo({
        phone: updatedUser.phone ?? "",
        birthday: updatedUser.birthday?.slice(0, 10) ?? "",
        gender: updatedUser.gender ?? "",
        city: updatedUser.city ?? "",
        bio: updatedUser.bio ?? "",
      });
      setPersonalErrors({});

      if (result.unsupportedFields.length) {
        notify(
          `Profile saved, but the server does not support: ${result.unsupportedFields.join(
            ", ",
          )}.`,
          "info",
        );
      } else {
        notify("Profile saved.");
      }
    } catch (cause) {
      notify(
        cause instanceof Error ? cause.message : "Could not save your profile.",
        "error",
      );
    } finally {
      saveInFlightRef.current = false;
      setSavePending(false);
    }
  };

  if (!user) {
    return (
      <>
        <PageHeading
          eyebrow="YOUR PERSONAL SPACE"
          title="Your profile."
          description="Loading your account settings."
        />
        <AccountNav />
        {profileError ? (
          <Notice kind="error">{profileError}</Notice>
        ) : (
          <Skeleton cards={1} />
        )}
      </>
    );
  }

  return (
    <>
      <PageHeading
        eyebrow="YOUR PERSONAL SPACE"
        title="Your profile."
        description={
          serverMode
            ? "Your profile information is saved to your account."
            : "Your interests shape your discoveries. This demo profile is stored only in this browser."
        }
      />
      <AccountNav />
      <div className="profile-single">
        <section className="panel profile-card">
          <header className="profile-card-header">
            <div>
              <h2>Personal profile</h2>
              <p className="muted">
                Your profile information is saved to your account.
              </p>
            </div>
          </header>
          <div className="profile-identity">
            <div className="profile-avatar">
              {user.avatar && !avatarBroken ? (
                <img
                  src={resolveAvatarUrl(user.avatar)}
                  alt={`${user.name}'s avatar`}
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                user.name.slice(0, 1)
              )}
            </div>
            <div>
              <h3>{user.name}</h3>
              <p className="muted">{user.email}</p>
              <div className="profile-avatar-actions">
                <label className="upload-label">
                  Change avatar
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={avatarBusy}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      void upload(file);
                    }}
                  />
                </label>
                {user.avatar && (
                  <button
                    className="small-link"
                    type="button"
                    disabled={avatarBusy}
                    onClick={() => setRemoveAvatarOpen(true)}
                  >
                    Remove avatar
                  </button>
                )}
              </div>
              {avatarBusy && (
                <p className="muted" role="status">
                  Uploading image...
                </p>
              )}
            </div>
          </div>
          <div className="profile-divider" />
          <form
            ref={profileFormRef}
            className="profile-form"
            onSubmit={handleSaveProfile}
          >
            {profileError && <Notice kind="error">{profileError}</Notice>}
            {profileLoading && <p className="muted">Refreshing profile...</p>}
            <Field label="Display name">
              <input
                required
                maxLength={60}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            {serverMode && (
              <PersonalInfoFields
                user={user}
                values={personalInfo}
                errors={personalErrors}
                onChange={updatePersonalInfo}
              />
            )}
            <div className="profile-field-full">
              <Field
                label="Favorite fandoms"
                hint="Separate fandom names with commas. Up to 20 names, each no longer than 80 characters."
              >
                <input
                  value={fandoms}
                  onChange={(event) => setFandoms(event.target.value)}
                  maxLength={500}
                />
              </Field>
            </div>
            {!serverMode && (
              <Notice>
                This demo account and its data are stored only in this browser.
              </Notice>
            )}
            <div className="profile-divider" />
            <div className="profile-actions">
              <Button
                type="submit"
                busy={saving || savePending}
                disabled={!isDirty || saving || savePending}
              >
                Save profile
              </Button>
              {serverMode && (
                <div
                  className="profile-password-trigger"
                  ref={passwordActionRef}
                >
                  <Button
                    type="button"
                    variant="secondary"
                    aria-haspopup="dialog"
                    onClick={() => setPasswordOpen(true)}
                  >
                    Change password
                  </Button>
                </div>
              )}
              <Button
                type="button"
                variant="secondary"
                className="profile-signout-action"
                onClick={() => void signOut()}
              >
                Sign out
              </Button>
              {!serverMode && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setReset(true)}
                >
                  Delete all demo data
                </Button>
              )}
            </div>
          </form>
        </section>
      </div>

      <ChangePasswordModal
        open={passwordOpen}
        user={user}
        onClose={closePasswordModal}
      />
      {!serverMode && (
        <Confirm
          open={reset}
          onClose={() => setReset(false)}
          title="Delete demo workspace?"
          description="This removes profiles, notes, ratings, submissions, edits and chat history from Fan Hub Plus. Your appearance preference will remain."
          onConfirm={async () => {
            setDb(repository.resetDemo());
            notify("Demo data deleted.");
            navigate("/");
          }}
        />
      )}
      <Confirm
        open={removeAvatarOpen}
        onClose={() => setRemoveAvatarOpen(false)}
        title="Remove your avatar?"
        description="Your profile will show your initial until you upload another image."
        onConfirm={removeAvatar}
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
