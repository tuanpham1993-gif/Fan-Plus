import React, { useEffect, useMemo, useState } from "react";
import { Button, Icon, Modal } from "../../components/ui";
import { useAuth } from "../auth/AuthProvider";
import type { Post, PostFormat, PostInput, Topic } from "../types";
import { formatNames, topicNames, topicOptions } from "./constants";

export type PostKind = "discussion" | "review" | "media";

const kindNames: Record<PostKind, string> = {
  discussion: "Discussion",
  review: "Review",
  media: "Media Share",
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

function kindForPost(post?: Post): PostKind {
  if (!post) return "discussion";
  if (post.rating > 0) return "review";
  if (post.format !== "post") return "media";
  return "discussion";
}

export function PostEditor({
  open,
  onClose,
  post,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  post?: Post;
  onSave: (input: PostInput) => Promise<boolean>;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState<PostInput>(blank);
  const [kind, setKind] = useState<PostKind>("discussion");
  const [agree, setAgree] = useState(false);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);

  const key = "fanhub.draft.v3." + (user?.id || "visitor");

  useEffect(() => {
    if (!open) return;

    setAgree(false);
    setPreview(false);
    setStorageWarning(false);

    if (post) {
      setKind(kindForPost(post));
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
      const next =
        saved &&
        typeof saved.title === "string" &&
        typeof saved.body === "string"
          ? {
              ...blank,
              ...saved,
              topic: saved.topic === "music" ? "soundtrack" : saved.topic,
            }
          : blank;

      setForm(next);
      setKind(
        next.rating > 0
          ? "review"
          : next.format !== "post"
            ? "media"
            : "discussion",
      );
    } catch {
      setForm(blank);
      setKind("discussion");
    }
  }, [open, post?.id, key]);

  useEffect(() => {
    if (!open || post) return;
    try {
      localStorage.setItem(key, JSON.stringify(form));
    } catch {
      setStorageWarning(true);
    }
  }, [form, open, post, key]);

  function field<K extends keyof PostInput>(name: K, value: PostInput[K]) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function changeKind(next: PostKind) {
    setKind(next);
    setForm((current) => {
      if (next === "discussion") {
        return {
          ...current,
          format: "post",
          mediaUrl: "",
          rating: 0,
        };
      }

      if (next === "review") {
        return {
          ...current,
          format: "post",
          mediaUrl: "",
        };
      }

      return {
        ...current,
        format: current.format === "post" ? "video" : current.format,
        rating: 0,
      };
    });
  }

  const ratingAllowed = useMemo(() => {
    const words = new Set(
      form.body
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.toLowerCase()),
    );

    return (
      form.body.trim().length >= 20 &&
      words.size >= 4 &&
      !/(.)\1{9,}/.test(form.body)
    );
  }, [form.body]);

  const reviewRatingMissing =
    kind === "review" && (!ratingAllowed || form.rating < 1 || form.rating > 5);

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
            {topicNames[form.topic]} / {kindNames[kind]} / {form.subject || "Your work or topic"}
          </span>
          <h2>{form.title || "Your title goes here"}</h2>
          {kind === "review" && form.rating > 0 && (
            <p className="review-rating">
              <Icon name="star" size={14} />
              {form.rating}/5
            </p>
          )}
          <p className="preserve-space">
            {form.body || "Your perspective will appear here."}
          </p>
          {kind === "media" && form.mediaUrl && form.format === "video" && (
            <video
              className="editor-preview-media"
              controls
              preload="metadata"
              src={form.mediaUrl}
            />
          )}
          {kind === "media" &&
            form.mediaUrl &&
            form.format === "soundtrack" && (
              <audio
                className="editor-preview-media"
                controls
                preload="metadata"
                src={form.mediaUrl}
              />
            )}
        </article>
      ) : (
        <form
          id="post-editor"
          className="stack-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (reviewRatingMissing) return;

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
                onChange={(event) => field("topic", event.target.value as Topic)}
              >
                {topicOptions.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Post kind</span>
              <select
                value={kind}
                onChange={(event) => changeKind(event.target.value as PostKind)}
              >
                <option value="discussion">Discussion</option>
                <option value="review">Review</option>
                <option value="media">Media Share</option>
              </select>
            </label>
          </div>

          {kind === "media" && (
            <div className="form-row">
              <label className="field">
                <span>Media type</span>
                <select
                  value={form.format}
                  onChange={(event) =>
                    field("format", event.target.value as PostFormat)
                  }
                >
                  <option value="video">Video</option>
                  <option value="soundtrack">Soundtrack / audio</option>
                </select>
              </label>

              <label className="field">
                <span>
                  {form.format === "video" ? "Video URL" : "Soundtrack URL"}
                </span>
                <input
                  type="text"
                  value={form.mediaUrl}
                  onChange={(event) => field("mediaUrl", event.target.value)}
                  required
                  maxLength={500}
                  placeholder={
                    form.format === "video"
                      ? "/media/portal.webm"
                      : "/media/orbit.wav"
                  }
                />
                <small>
                  Use a direct HTTPS media URL or a local /media/ path. Embedded
                  HTML is not accepted.
                </small>
              </label>
            </div>
          )}

          <label className="field">
            <span>Title, work, character or discussion topic</span>
            <input
              value={form.subject}
              onChange={(event) => field("subject", event.target.value)}
              required
              maxLength={100}
              placeholder="What are we talking about?"
            />
          </label>

          <label className="field">
            <span>Give your perspective a title</span>
            <input
              value={form.title}
              onChange={(event) => field("title", event.target.value)}
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
              onChange={(event) => field("body", event.target.value)}
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
            {kind === "review" && (
              <label className="field">
                <span>Star rating (required)</span>
                <select
                  aria-label="Star rating"
                  value={form.rating}
                  required
                  disabled={!ratingAllowed}
                  onChange={(event) => field("rating", Number(event.target.value))}
                >
                  <option value={0}>Choose a rating</option>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} / 5
                    </option>
                  ))}
                </select>
                {!ratingAllowed && (
                  <small>
                    Write a real perspective of at least 20 characters before
                    choosing a rating.
                  </small>
                )}
              </label>
            )}

            <label className="check-row">
              <input
                type="checkbox"
                checked={form.spoiler}
                onChange={(event) => field("spoiler", event.target.checked)}
              />
              This post contains spoilers
            </label>
          </div>

          <label className="check-row">
            <input
              required
              type="checkbox"
              checked={agree}
              onChange={(event) => setAgree(event.target.checked)}
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
          disabled={!agree || preview || reviewRatingMissing}
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

export const postKindLabel = kindNames;
export const postFormatLabel = formatNames;
