import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "../lib/store";
import { Link, navigate, currentPath, useLocation } from "../lib/router";
import {
  Button,
  Icon,
  Modal,
  Confirm,
  PageHeading,
  Empty,
} from "../components/ui";
import { gateway } from "./gateway";
import { normalize } from "./demo";
import { serverMode } from "./http";
import { openLore } from "./Lore";
import type {
  Post,
  PostFormat,
  PostInput,
  SocialData,
  Topic,
  Comment,
} from "./types";
const topicNames: Record<Topic, string> = {
  soundtrack: "Soundtrack",
  anime: "Anime",
  gaming: "Gaming",
  movies: "Movies",
  tv: "TV Shows",
  kpop: "K-pop",
  comic: "Comic",
  manga: "Manga",
  cosplay: "Cosplay",
};
const topicOptions = Object.entries(topicNames) as [Topic, string][];
const formatNames: Record<PostFormat, string> = {
  post: "Post",
  video: "Video",
  soundtrack: "Soundtrack",
};
const images: Record<Topic, string> = {
  soundtrack: "/art/kpop.svg",
  anime: "/art/anime.svg",
  gaming: "/art/gaming.svg",
  movies: "/art/movies.svg",
  tv: "/art/tv.svg",
  kpop: "/art/kpop.svg",
  comic: "/art/comics.svg",
  manga: "/art/manga.svg",
  cosplay: "/art/cosplay.svg",
};
const blank: PostInput = {
  title: "",
  subject: "",
  body: "",
  topic: "anime",
  format: "post",
  mediaUrl: "",
  spoiler: false,
  rating: 0,
};
function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
function time(s: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(s));
}
type Run = (fn: () => Promise<unknown>, message: string) => Promise<boolean>;
export default function Community() {
  const { user, notify } = useApp(),
    { params } = useLocation();
  const [data, setData] = useState<SocialData | null>(null),
    [error, setError] = useState(""),
    [topic, setTopic] = useState(""),
    [tab, setTab] = useState(() =>
      user?.role === "admin" && params.get("view") === "review"
        ? "review"
        : user?.role === "admin" && params.get("view") === "reports"
          ? "reports"
          : "latest",
    ),
    [q, setQ] = useState(""),
    [limit, setLimit] = useState(6),
    [editor, setEditor] = useState(false),
    [editing, setEditing] = useState<Post | undefined>(),
    [report, setReport] = useState<{
      postId: string;
      commentId: string | null;
    } | null>(null),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const d = await gateway.social(user);
      setData(d);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [user?.id]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    setLimit(6);
  }, [topic, tab, q]);
  const run: Run = async (fn, message) => {
    setBusy(true);
    try {
      await fn();
      await load();
      notify(message);
      return true;
    } catch (e) {
      notify((e as Error).message, "error");
      return false;
    } finally {
      setBusy(false);
    }
  };
  function requireUser() {
    if (user) return true;
    navigate("/login?next=" + encodeURIComponent(currentPath()));
    return false;
  }
  const compose = (p?: Post) => {
    if (!requireUser()) return;
    setEditing(p);
    setEditor(true);
  };
  let posts =
    data?.posts
      .filter((p) =>
        tab === "mine"
          ? p.authorId === user?.id
          : tab === "review"
            ? p.status === "pending"
            : p.status === "published",
      )
      .filter(
        (p) =>
          (!topic || p.topic === topic) &&
          (!q ||
            normalize(p.title + " " + p.subject + " " + p.body).includes(
              normalize(q),
            )) &&
          (!params.get("post") || p.id === params.get("post")),
      ) || [];
  posts = posts.sort((a, b) =>
    tab === "popular"
      ? (data?.reactions.filter((r) => r.postId === b.id).length || 0) -
          (data?.reactions.filter((r) => r.postId === a.id).length || 0) ||
        b.createdAt.localeCompare(a.createdAt)
      : b.createdAt.localeCompare(a.createdAt),
  );
  return (
    <>
      <section className="community-intro">
        <div>
          <span className="eyebrow">THE FAN HUB COMMUNITY</span>
          <h1>
            Some stories stay.
            <br />
            <em>Let's talk about them.</em>
          </h1>
          <p>
            Reviews, videos, soundtracks, theories and fan-made perspectives.
            <br />Anime, games, film, TV, K-pop, comics, manga and cosplay.
          </p>
        </div>
        <div className="community-intro-note">
          <span className="serif-mark">Fh.</span>
          <span>
            A SHARED SPACE
            <br />
            FOR INDIVIDUAL VOICES
          </span>
        </div>
      </section>
      <div className="community-topicbar">
        <div className="topic-chips" aria-label="Filter community topics">
          {[
            ["", "All conversations"],
            ...topicOptions,
          ].map(([id, name]) => (
            <button
              key={id}
              aria-pressed={topic === id}
              className={topic === id ? "selected" : ""}
              onClick={() => setTopic(id)}
            >
              {name}
            </button>
          ))}
        </div>
        <Button onClick={() => compose()}>
          <Icon name="edit" size={17} />
          Write a post
        </Button>
      </div>
      <div className="social-layout">
        <section className="social-feed" aria-label="Community feed">
          <div className="feed-compose">
            <span className="social-avatar">
              {user ? initials(user.name) : "You"}
            </span>
            <button onClick={() => compose()}>
              <strong>
                {user
                  ? `${user.name.split(" ")[0]}, what stayed with you?`
                  : "A good conversation starts with a perspective."}
              </strong>
              <span>Share a review, a thought, a recommendation.</span>
            </button>
            <Icon name="edit" size={20} />
          </div>
          <div className="feed-tools">
            <div
              className="feed-tabs"
              role="group"
              aria-label="Community feed view"
            >
              {[
                ["latest", "Latest"],
                ["popular", "Most appreciated"],
                ...(user ? [["mine", "My posts"]] : []),
                ...(user?.role === "admin"
                  ? [
                      ["review", "Review queue"],
                      ["reports", "Reports"],
                    ]
                  : []),
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={tab === id ? "active" : ""}
                  aria-pressed={tab === id}
                  onClick={() => setTab(id)}
                >
                  {label}
                  {id === "review" &&
                    !!data?.posts.filter((p) => p.status === "pending")
                      .length && (
                      <span className="count-pill">
                        {
                          data.posts.filter((p) => p.status === "pending")
                            .length
                        }
                      </span>
                    )}
                </button>
              ))}
            </div>
            <label className="community-search">
              <Icon name="search" size={17} />
              <input
                aria-label="Search community posts"
                placeholder="Search conversations"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
          </div>
          {params.get("post") && (
            <Link className="text-link" to="/community">
              See all conversations
              <Icon name="arrow" size={16} />
            </Link>
          )}
          {error && (
            <div role="alert" className="notice">
              {error}
              <Button variant="secondary" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          )}
          {!data && !error && (
            <div className="feed-loading" role="status">
              <span className="spinner" />
              Loading conversations...
            </div>
          )}
          {tab === "reports" && user?.role === "admin" ? (
            <div className="report-queue">
              {data?.reports.filter((r) => !r.resolved).length === 0 && (
                <Empty
                  title="The report queue is clear."
                  description="Member reports will appear here for a human review."
                />
              )}
              {data?.reports
                .filter((r) => !r.resolved)
                .map((r) => (
                  <article className="post-card report-card" key={r.id}>
                    <span className="eyebrow">
                      {r.commentId ? "COMMENT REPORT" : "POST REPORT"}
                      {" / "}
                      {time(r.createdAt)}
                    </span>
                    <h2>{r.postTitle}</h2>
                    <p className="muted small">
                      Reported by <strong>{r.reporterName}</strong> / Content
                      by <strong>{r.authorName}</strong>
                    </p>
                    <p>
                      <strong>Reason: </strong>
                      {r.reason}
                    </p>
                    {r.contentPreview && (
                      <blockquote className="report-preview preserve-space">
                        {r.contentPreview}
                      </blockquote>
                    )}
                    <div className="post-actions">
                      <Button
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () => gateway.resolveReport(user, r.id, true),
                            "Reported content hidden.",
                          )
                        }
                      >
                        Hide content
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () => gateway.resolveReport(user, r.id, false),
                            "Report dismissed.",
                          )
                        }
                      >
                        Dismiss report
                      </Button>
                    </div>
                  </article>
                ))}
            </div>
          ) : (
            <>
              {data && posts.length === 0 && (
                <Empty
                  icon="chat"
                  title={
                    tab === "mine"
                      ? "Your voice belongs here."
                      : "No conversations here yet."
                  }
                  description={
                    tab === "mine"
                      ? "Write your first review. It will appear here while a moderator reads it."
                      : "Try a different topic or start the conversation."
                  }
                >
                  <Button onClick={() => compose()}>Write a post</Button>
                </Empty>
              )}
              {posts.slice(0, limit).map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  data={data!}
                  busy={busy}
                  run={run}
                  onEdit={() => compose(p)}
                  onReport={(commentId) => {
                    if (requireUser()) {
                      setReport({ postId: p.id, commentId });
                      setReason("");
                    }
                  }}
                  requireUser={requireUser}
                  autoComments={params.get("post") === p.id}
                />
              ))}
              {posts.length > limit && (
                <Button
                  variant="secondary"
                  className="load-conversations"
                  onClick={() => setLimit((n) => n + 6)}
                >
                  Read more conversations
                  <Icon name="arrow" size={17} />
                </Button>
              )}
            </>
          )}
        </section>
        <aside className="community-rail">
          <div className="rail-note">
            <span className="eyebrow">A LITTLE HOUSEKEEPING</span>
            <h2>
              Different takes.
              <br />
              Same respect.
            </h2>
            <p>
              Talk about the work, not the person. Mark spoilers. Give credit.
              Member posts and media are reviewed before they reach the feed.
            </p>
            <div className="rail-rule">
              <span>01</span>Be thoughtful, not hurtful.
            </div>
            <div className="rail-rule">
              <span>02</span>Let people discover the ending.
            </div>
            <div className="rail-rule">
              <span>03</span>Share your own words.
            </div>
            <small>
              Seeded conversations and names are illustrative. Counts reflect
              stored sample interactions, not a live audience.
            </small>
          </div>
          <div className="rail-lore">
            <span className="lore-monogram">
              L<span>m</span>
            </span>
            <h3>Need a little context?</h3>
            <p>
              Ask Lore Master about a character, a story, or how to shape your
              review.
            </p>
            <button
              onClick={() =>
                openLore("How do I write a thoughtful film review?")
              }
            >
              Ask Lore Master
              <Icon name="arrow" size={17} />
            </button>
          </div>
          <Link to="/giveaways" className="rail-gift">
            <div>
              <Icon name="ticket" size={23} />
              <span className="eyebrow">QUARTERLY GIFTS / DEMO</span>
            </div>
            <h3>Beyond the screen.</h3>
            <p>One free entry. A few possibilities.</p>
            <span className="text-link">
              Explore this quarter
              <Icon name="arrow" size={16} />
            </span>
          </Link>
          <p className="rail-runtime">
            {serverMode
              ? "Community data uses the Flask API. Other V1 catalog tools remain a separate browser demo."
              : "Interactive browser prototype. Posts and reactions are stored on this device."}
          </p>
        </aside>
      </div>
      <PostEditor
        open={editor}
        onClose={() => setEditor(false)}
        post={editing}
        onSave={async (p) => {
          const isAdmin = user?.role === "admin";
          const ok = await run(
            () => gateway.post(user, p, editing?.id, editing?.version),
            isAdmin
              ? "Your post is published."
              : "Your post is awaiting moderation.",
          );
          if (ok) {
            setEditor(false);
            setTab(isAdmin ? "latest" : "mine");
          }
          return ok;
        }}
      />
      <Modal
        open={!!report}
        onClose={() => setReport(null)}
        title="Report this content"
      >
        <p className="muted">
          A moderator will review the reason. Disagreeing with an opinion is
          not, on its own, a violation.
        </p>
        <label className="field">
          <span>Reason for reporting</span>
          <textarea
            rows={4}
            maxLength={500}
            minLength={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setReport(null)}>
            Cancel
          </Button>
          <Button
            busy={busy}
            disabled={reason.trim().length < 5}
            onClick={async () => {
              if (
                report &&
                (await run(
                  () =>
                    gateway.report(
                      user,
                      report.postId,
                      reason,
                      report.commentId,
                    ),
                  "Report sent for review.",
                ))
              )
                setReport(null);
            }}
          >
            Send report
          </Button>
        </div>
      </Modal>
    </>
  );
}
function PostCard({
  post: p,
  data,
  busy,
  run,
  onEdit,
  onReport,
  requireUser,
  autoComments,
}: {
  post: Post;
  data: SocialData;
  busy: boolean;
  run: Run;
  onEdit: () => void;
  onReport: (id: string | null) => void;
  requireUser: () => boolean;
  autoComments: boolean;
}) {
  const { user, spoilerSafe, notify } = useApp();
  const [revealed, setRevealed] = useState(false),
    [expanded, setExpanded] = useState(false),
    [comments, setComments] = useState(autoComments),
    [draft, setDraft] = useState(""),
    [reply, setReply] = useState<Comment | null>(null),
    [remove, setRemove] = useState(false),
    [reason, setReason] = useState("");
  const hidden = p.spoiler && spoilerSafe && !revealed;
  const reactions = data.reactions.filter((r) => r.postId === p.id),
    mine = reactions.find((r) => r.userId === user?.id)?.kind;
  const cs = data.comments.filter((c) => c.postId === p.id),
    roots = cs.filter((c) => !c.parentId);
  const owner = p.authorId === user?.id;
  const reaction = (kind: "like" | "heart") => {
    if (requireUser())
      void run(
        () => gateway.react(user, p.id, mine === kind ? null : kind),
        mine === kind ? "Reaction removed." : "Reaction saved.",
      );
  };
  const renderComment = (c: Comment) => (
    <article
      key={c.id}
      className={"social-comment " + (c.parentId ? "reply" : "")}
    >
      <span className="social-avatar mini">{initials(c.authorName)}</span>
      <div>
        <Link className="author-link" to={"/community/member/" + c.authorId}>
          <strong>{c.authorName}</strong>
        </Link>
        <p className="preserve-space">{c.body}</p>
        <div className="comment-meta">
          <span>{time(c.createdAt)}</span>
          {!c.hidden && !c.parentId && (
            <button
              onClick={() => {
                if (requireUser()) {
                  setReply(c);
                  setDraft("");
                }
              }}
            >
              Reply
            </button>
          )}
          {!c.hidden && (c.authorId === user?.id || user?.role === "admin") && (
            <button
              disabled={busy}
              onClick={() =>
                void run(
                  () => gateway.removeComment(user, c.id),
                  "Comment removed.",
                )
              }
            >
              Remove
            </button>
          )}
          {!c.hidden && <button onClick={() => onReport(c.id)}>Report</button>}
        </div>
      </div>
    </article>
  );
  return (
    <article
      className={"post-card topic-" + p.topic}
      data-testid="community-post"
    >
      <div className="post-author">
        <span className="social-avatar">{initials(p.authorName)}</span>
        <div>
          <Link className="author-link" to={"/community/member/" + p.authorId}>
            <strong>{p.authorName}</strong>
          </Link>
          <span>
            {time(p.createdAt)} <span aria-hidden="true">/</span>{" "}
            {topicNames[p.topic]} / {formatNames[p.format]}{" "}
            {p.sample && "/ Sample post"}
          </span>
        </div>
        <div className="post-menu">
          {owner && (
            <button
              className="icon-btn"
              title="Edit post"
              aria-label={"Edit " + p.title}
              onClick={onEdit}
            >
              <Icon name="edit" size={16} />
            </button>
          )}
          {(owner || user?.role === "admin") && p.status !== "hidden" && (
            <button
              className="icon-btn"
              aria-label={"Remove " + p.title}
              onClick={() => setRemove(true)}
            >
              <Icon name="trash" size={16} />
            </button>
          )}
          {p.status === "published" && (
            <button
              className="icon-btn"
              aria-label={"Report " + p.title}
              onClick={() => onReport(null)}
            >
              <Icon name="flag" size={16} />
            </button>
          )}
        </div>
      </div>
      {p.status !== "published" && (
        <div className={"post-status " + p.status}>
          <Icon name={p.status === "pending" ? "clock" : "info"} size={16} />
          <span>
            {p.status === "pending"
              ? "Awaiting moderation"
              : p.status === "rejected"
                ? "Changes requested"
                : "Hidden"}
            {p.reason && " / " + p.reason}
          </span>
        </div>
      )}
      <div className="post-body">
        <div className="post-subject">
          <span>{p.subject}</span>
          {p.rating > 0 && (
            <span className="review-rating">
              <Icon name="star" size={14} />
              {p.rating}/5
            </span>
          )}
          <span className="post-format-badge">{formatNames[p.format]}</span>
          {p.spoiler && <span className="spoiler-label">Spoiler</span>}
        </div>
        <h2>
          {hidden ? "A review with spoilers. Your choice to open it." : p.title}
        </h2>
        {hidden ? (
          <div className="post-spoiler">
            <Icon name="shield" size={22} />
            <p>This review may reveal plot details.</p>
            <Button variant="secondary" onClick={() => setRevealed(true)}>
              Reveal this review
            </Button>
          </div>
        ) : (
          <>
            <p
              className={
                "preserve-space " +
                (!expanded && p.body.length > 450 ? "post-excerpt" : "")
              }
            >
              {p.body}
            </p>
            {p.body.length > 450 && (
              <button
                className="small-link"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Read less" : "Read the full perspective"}
                <Icon name="chevron" size={14} />
              </button>
            )}
          </>
        )}
      </div>
      {!hidden && p.mediaUrl && p.format !== "post" && (
        <div className={"post-media " + p.format}>
          <div className="post-media-head">
            <Icon name={p.format === "video" ? "play" : "music"} size={17} />
            <span>{p.format === "video" ? "Video attachment" : "Soundtrack attachment"}</span>
          </div>
          {p.format === "video" ? (
            <video controls preload="metadata" playsInline src={p.mediaUrl}>
              Your browser cannot play this video.
            </video>
          ) : (
            <audio controls preload="metadata" src={p.mediaUrl}>
              Your browser cannot play this audio.
            </audio>
          )}
        </div>
      )}
      {p.sample && p.id === "post-city" && !hidden && (
        <div className="post-cover">
          <img
            src={images[p.topic]}
            alt="Original Fan Hub illustration of an imagined city"
          />
          <div>
            <span>THE WORLDS WE RETURN TO</span>
            <strong>{p.subject}</strong>
          </div>
        </div>
      )}
      {p.status === "published" && (
        <>
          <div className="post-totals">
            <span>
              {reactions.filter((r) => r.kind === "like").length} likes /{" "}
              {reactions.filter((r) => r.kind === "heart").length} loves
            </span>
            <button onClick={() => setComments(!comments)}>
              {cs.filter((c) => !c.hidden).length} comments
            </button>
          </div>
          <div className="post-actions">
            <button
              disabled={busy}
              className={"reaction-btn " + (mine === "like" ? "active" : "")}
              aria-pressed={mine === "like"}
              onClick={() => reaction("like")}
            >
              <Icon
                name="like"
                size={19}
                fill={mine === "like" ? "currentColor" : "none"}
              />
              {mine === "like" ? "Liked" : "Like"}
            </button>
            <button
              disabled={busy}
              className={
                "reaction-btn " + (mine === "heart" ? "active heart" : "")
              }
              aria-pressed={mine === "heart"}
              onClick={() => reaction("heart")}
            >
              <Icon
                name="heart"
                size={19}
                fill={mine === "heart" ? "currentColor" : "none"}
              />
              {mine === "heart" ? "Loved" : "Love"}
            </button>
            <button
              onClick={() => setComments(!comments)}
              aria-expanded={comments}
            >
              <Icon name="chat" size={19} />
              Comment
            </button>
            <button
              aria-label="Copy post link"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    location.origin +
                      "/community?post=" +
                      encodeURIComponent(p.id),
                  );
                  notify("Post link copied.");
                } catch {
                  notify("Open the post link, then copy the address.", "info");
                  navigate("/community?post=" + p.id);
                }
              }}
            >
              <Icon name="share" size={18} />
              <span className="share-label">Share</span>
            </button>
          </div>
          {comments && (
            <div className="post-comments">
              {roots.length ? (
                roots.map((c) => (
                  <React.Fragment key={c.id}>
                    {renderComment(c)}
                    {cs.filter((r) => r.parentId === c.id).map(renderComment)}
                  </React.Fragment>
                ))
              ) : (
                <p className="muted small">
                  Be the first to add a thoughtful reply.
                </p>
              )}
              {user ? (
                <form
                  className="comment-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (
                      await run(
                        () =>
                          gateway.comment(user, p.id, draft, reply?.id || null),
                        "Comment added.",
                      )
                    ) {
                      setDraft("");
                      setReply(null);
                    }
                  }}
                >
                  {reply && (
                    <div className="reply-to">
                      Replying to {reply.authorName}
                      <button type="button" onClick={() => setReply(null)}>
                        Cancel
                      </button>
                    </div>
                  )}
                  <label className="sr-only" htmlFor={"comment-" + p.id}>
                    Your comment
                  </label>
                  <textarea
                    id={"comment-" + p.id}
                    rows={2}
                    maxLength={1000}
                    required
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Add to the conversation..."
                  />
                  <div>
                    <span>{draft.length}/1000</span>
                    <Button type="submit" disabled={!draft.trim()} busy={busy}>
                      Post comment
                      <Icon name="send" size={15} />
                    </Button>
                  </div>
                </form>
              ) : (
                <Link
                  to={
                    "/login?next=" +
                    encodeURIComponent("/community?post=" + p.id)
                  }
                  className="comment-signin"
                >
                  Sign in to join this conversation
                  <Icon name="arrow" size={16} />
                </Link>
              )}
            </div>
          )}
        </>
      )}
      {p.status === "pending" &&
        user?.role === "admin" &&
        p.authorId !== user.id && (
          <div className="post-moderation">
            <label className="field">
              <span>Review note (required for rejection)</span>
              <textarea
                rows={2}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <Button
              disabled={busy}
              onClick={() =>
                void run(
                  () =>
                    gateway.moderate(
                      user,
                      p.id,
                      "published",
                      p.version,
                      reason,
                    ),
                  "Post published to the community.",
                )
              }
            >
              Approve and publish
            </Button>
            <Button
              disabled={busy || reason.trim().length < 5}
              variant="secondary"
              onClick={() =>
                void run(
                  () =>
                    gateway.moderate(user, p.id, "rejected", p.version, reason),
                  "Post returned with feedback.",
                )
              }
            >
              Request changes
            </Button>
          </div>
        )}
      <Confirm
        open={remove}
        onClose={() => setRemove(false)}
        title="Remove this post?"
        description="The post will be hidden from the public feed. This does not delete other members' accounts."
        onConfirm={async () => {
          await run(() => gateway.removePost(user, p.id), "Post hidden.");
        }}
      />
    </article>
  );
}
function PostEditor({
  open,
  onClose,
  post,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  post?: Post;
  onSave: (p: PostInput) => Promise<boolean>;
}) {
  const { user } = useApp();
  const [form, setForm] = useState<PostInput>(blank),
    [agree, setAgree] = useState(false),
    [preview, setPreview] = useState(false),
    [busy, setBusy] = useState(false),
    [storageWarning, setStorageWarning] = useState(false);
  const key = "fanhub.draft.v3." + (user?.id || "visitor");
  useEffect(() => {
    if (!open) return;
    setAgree(false);
    setPreview(false);
    if (post) {
      setForm({
        title: post.title,
        subject: post.subject,
        body: post.body,
        topic: post.topic,
        format: post.format,
        mediaUrl: post.mediaUrl,
        spoiler: post.spoiler,
        rating: post.rating,
      });
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      setForm(
        saved &&
          typeof saved.title === "string" &&
          typeof saved.body === "string"
          ? {
              ...blank,
              ...saved,
              topic: saved.topic === "music" ? "soundtrack" : saved.topic,
            }
          : blank,
      );
    } catch {
      setForm(blank);
    }
  }, [open, post?.id, key]);
  useEffect(() => {
    if (open && !post)
      try {
        localStorage.setItem(key, JSON.stringify(form));
      } catch {
        setStorageWarning(true);
      }
  }, [form, open, post, key]);
  function field<K extends keyof PostInput>(k: K, v: PostInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  const bodyWords = new Set(
    form.body
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.toLowerCase()),
  );
  const ratingAllowed =
    form.body.trim().length >= 20 &&
    bodyWords.size >= 4 &&
    !/(.)\1{9,}/.test(form.body);
  useEffect(() => {
    if (!ratingAllowed && form.rating > 0) field("rating", 0);
  }, [ratingAllowed]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={post ? "Revisit your perspective" : "A thought worth sharing"}
      wide
    >
      <div className="editor-top">
        <span>Your words. Your point of view.</span>
        <button className="small-link" onClick={() => setPreview(!preview)}>
          {preview ? "Back to writing" : "Preview post"}
          <Icon name="arrow" size={14} />
        </button>
      </div>
      {preview ? (
        <article className="editor-preview">
          <span className="eyebrow">
            {topicNames[form.topic]} / {formatNames[form.format]} /{" "}
            {form.subject || "Your work or topic"}
          </span>
          <h2>{form.title || "Your title goes here"}</h2>
          <p className="preserve-space">
            {form.body || "Your perspective will appear here."}
          </p>
          {form.mediaUrl && form.format === "video" && (
            <video className="editor-preview-media" controls preload="metadata" src={form.mediaUrl} />
          )}
          {form.mediaUrl && form.format === "soundtrack" && (
            <audio className="editor-preview-media" controls preload="metadata" src={form.mediaUrl} />
          )}
        </article>
      ) : (
        <form
          id="post-editor"
          className="stack-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              if (await onSave(form)) {
                try {
                  localStorage.removeItem(key);
                } catch {
                  setStorageWarning(true);
                }
              }
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="form-row">
            <label className="field">
              <span>Category</span>
              <select
                value={form.topic}
                onChange={(e) => field("topic", e.target.value as Topic)}
              >
                {topicOptions.map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Post type</span>
              <select
                value={form.format}
                onChange={(e) => {
                  const next = e.target.value as PostFormat;
                  setForm((f) => ({
                    ...f,
                    format: next,
                    mediaUrl: next === "post" ? "" : f.mediaUrl,
                  }));
                }}
              >
                <option value="post">Post / discussion</option>
                <option value="video">Video</option>
                <option value="soundtrack">Soundtrack / audio</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>Title, work, character or discussion topic</span>
            <input
              value={form.subject}
              onChange={(e) => field("subject", e.target.value)}
              required
              maxLength={100}
              placeholder="What are we talking about?"
            />
          </label>
          {form.format !== "post" && (
            <label className="field">
              <span>{form.format === "video" ? "Video URL" : "Soundtrack URL"}</span>
              <input
                type="text"
                value={form.mediaUrl}
                onChange={(e) => field("mediaUrl", e.target.value)}
                required
                maxLength={500}
                placeholder={form.format === "video" ? "/media/portal.webm" : "/media/orbit.wav"}
              />
              <small>Use a direct HTTPS media URL or a local /media/ path. Embedded HTML is not accepted.</small>
            </label>
          )}
          <label className="field">
            <span>Give your perspective a title</span>
            <input
              value={form.title}
              onChange={(e) => field("title", e.target.value)}
              required
              minLength={5}
              maxLength={140}
              placeholder="A small detail. A big idea."
            />
          </label>
          <label className="field">
            <span>Your perspective</span>
            <textarea
              rows={8}
              value={form.body}
              onChange={(e) => field("body", e.target.value)}
              required
              minLength={20}
              maxLength={8000}
              placeholder="What worked for you? What did not? Tell us why."
            />
            <small>
              {form.body.length}/8000 characters / Plain text, no embedded HTML
            </small>
          </label>
          <div className="editor-options">
            <label className="field">
              <span>Optional rating</span>
              <select
                value={form.rating}
                disabled={!ratingAllowed}
                onChange={(e) => field("rating", Number(e.target.value))}
              >
                <option value={0}>No rating</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} / 5
                  </option>
                ))}
              </select>
              {!ratingAllowed && (
                <small>
                  Write a real perspective of at least 20 characters before
                  rating.
                </small>
              )}
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={form.spoiler}
                onChange={(e) => field("spoiler", e.target.checked)}
              />
              This post contains spoilers
            </label>
          </div>
          <label className="check-row">
            <input
              required
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            These are my own words, I agree to the community rules, and this
            post contains no sensitive, explicit or non-consensual imagery.
          </label>
        </form>
      )}
      <div className="editor-footer">
        <p>
          {storageWarning
            ? "Draft storage unavailable. Keep a copy before closing."
            : post
              ? user?.role === "admin"
                ? "Administrator edits are published immediately."
                : "Editing sends the post back to moderation."
              : user?.role === "admin"
                ? "Administrator posts are published immediately."
                : "Draft saved on this device. A moderator reviews each new post."}
        </p>
        <Button
          form="post-editor"
          type="submit"
          busy={busy}
          disabled={!agree || preview}
        >
          {user?.role === "admin"
            ? post
              ? "Publish changes"
              : "Publish now"
            : "Send for review"}
          <Icon name="arrow" size={16} />
        </Button>
      </div>
    </Modal>
  );
}
