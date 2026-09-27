import React, { useState } from "react";
import { Button, Confirm, Icon } from "../../components/ui";
import { useApp } from "../../lib/store";
import { Link, navigate } from "../../lib/router";
import { useAuth } from "../auth/AuthProvider";
import type { Post, SocialData } from "../types";
import type { CommunityDataUpdater } from "./hooks";
import { usePostComments, useReaction } from "./hooks";
import { formatNames, topicImages, topicNames } from "./constants";
import { CommentList } from "./CommentList";
import { communityDate, initials } from "./utils";

export function PostCard({
  post,
  data,
  updateData,
  onEdit,
  onReport,
  requireUser,
  autoComments,
  bookmarked,
  bookmarkPending,
  onBookmark,
  onRemovePost,
  onModerate,
}: {
  post: Post;
  data: SocialData;
  updateData: CommunityDataUpdater;
  onEdit: () => void;
  onReport: (commentId: string | null) => void;
  requireUser: () => boolean;
  autoComments: boolean;
  bookmarked: boolean;
  bookmarkPending: boolean;
  onBookmark: () => Promise<boolean>;
  onRemovePost: (post: Post) => Promise<boolean>;
  onModerate?: (
    post: Post,
    decision: "published" | "rejected",
    reason: string,
  ) => Promise<boolean>;
}) {
  const { user } = useAuth();
  const { spoilerSafe, notify } = useApp();
  const [revealed, setRevealed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(autoComments);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [moderationPending, setModerationPending] = useState(false);

  const hidden = post.spoiler && spoilerSafe && !revealed;
  const owner = post.authorId === user?.id;

  const reaction = useReaction({
    postId: post.id,
    user,
    data,
    updateData,
    onError: (message) => notify(message, "error"),
  });

  const commentState = usePostComments({
    postId: post.id,
    user,
    data,
    updateData,
    onSuccess: (message) => notify(message),
    onError: (message) => notify(message, "error"),
  });

  const moderate = async (decision: "published" | "rejected") => {
    if (!onModerate || moderationPending) return;
    setModerationPending(true);
    try {
      await onModerate(post, decision, reason);
    } finally {
      setModerationPending(false);
    }
  };

  return (
    <article
      className={"post-card topic-" + post.topic}
      data-testid="community-post"
    >
      <div className="post-author">
        <span className="social-avatar">{initials(post.authorName)}</span>
        <div>
          <Link
            className="author-link"
            to={"/community/member/" + post.authorId}
          >
            <strong>{post.authorName}</strong>
          </Link>
          <span>
            {communityDate(post.createdAt)} <span aria-hidden="true">/</span>{" "}
            {topicNames[post.topic]} / {formatNames[post.format]}{" "}
            {post.sample && "/ Sample post"}
          </span>
        </div>
        <div className="post-menu">
          {owner && (
            <button
              className="icon-btn"
              title="Edit post"
              aria-label={"Edit " + post.title}
              onClick={onEdit}
            >
              <Icon name="edit" size={16} />
            </button>
          )}
          {(owner || user?.role === "admin") && post.status !== "hidden" && (
            <button
              className="icon-btn"
              aria-label={"Remove " + post.title}
              onClick={() => setRemoveOpen(true)}
            >
              <Icon name="trash" size={16} />
            </button>
          )}
          {post.status === "published" && (
            <button
              className="icon-btn"
              aria-label={"Report " + post.title}
              onClick={() => onReport(null)}
            >
              <Icon name="flag" size={16} />
            </button>
          )}
        </div>
      </div>

      {post.status !== "published" && (
        <div className={"post-status " + post.status}>
          <Icon
            name={post.status === "pending" ? "clock" : "info"}
            size={16}
          />
          <span>
            {post.status === "pending"
              ? "Awaiting moderation"
              : post.status === "rejected"
                ? "Changes requested"
                : "Hidden"}
            {post.reason && " / " + post.reason}
          </span>
        </div>
      )}

      <div className="post-body">
        <div className="post-subject">
          <span>{post.subject}</span>
          {post.rating > 0 && (
            <span className="review-rating">
              <Icon name="star" size={14} />
              {post.rating}/5
            </span>
          )}
          <span className="post-format-badge">{formatNames[post.format]}</span>
          {post.spoiler && <span className="spoiler-label">Spoiler</span>}
        </div>
        <h2>
          {hidden
            ? "A review with spoilers. Your choice to open it."
            : post.title}
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
                (!expanded && post.body.length > 450 ? "post-excerpt" : "")
              }
            >
              {post.body}
            </p>
            {post.body.length > 450 && (
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

      {!hidden && post.mediaUrl && post.format !== "post" && (
        <div className={"post-media " + post.format}>
          <div className="post-media-head">
            <Icon
              name={post.format === "video" ? "play" : "music"}
              size={17}
            />
            <span>
              {post.format === "video"
                ? "Video attachment"
                : "Soundtrack attachment"}
            </span>
          </div>
          {post.format === "video" ? (
            <video controls preload="metadata" playsInline src={post.mediaUrl}>
              Your browser cannot play this video.
            </video>
          ) : (
            <audio controls preload="metadata" src={post.mediaUrl}>
              Your browser cannot play this audio.
            </audio>
          )}
        </div>
      )}

      {post.sample && post.id === "post-city" && !hidden && (
        <div className="post-cover">
          <img
            src={topicImages[post.topic]}
            alt="Original Fan Hub illustration of an imagined city"
          />
          <div>
            <span>THE WORLDS WE RETURN TO</span>
            <strong>{post.subject}</strong>
          </div>
        </div>
      )}

      {post.status === "published" && (
        <>
          <div className="post-totals">
            <span>
              {reaction.likeCount} likes / {reaction.heartCount} loves
            </span>
            <button onClick={() => setCommentsOpen(!commentsOpen)}>
              {commentState.visibleCount} comments
            </button>
          </div>

          <div className="post-actions">
            <button
              disabled={reaction.pending}
              className={
                "reaction-btn " + (reaction.mine === "like" ? "active" : "")
              }
              aria-pressed={reaction.mine === "like"}
              onClick={() => {
                if (requireUser()) void reaction.setReaction("like");
              }}
            >
              <Icon
                name="like"
                size={19}
                fill={reaction.mine === "like" ? "currentColor" : "none"}
              />
              {reaction.mine === "like" ? "Liked" : "Like"}
            </button>

            <button
              disabled={reaction.pending}
              className={
                "reaction-btn " +
                (reaction.mine === "heart" ? "active heart" : "")
              }
              aria-pressed={reaction.mine === "heart"}
              onClick={() => {
                if (requireUser()) void reaction.setReaction("heart");
              }}
            >
              <Icon
                name="heart"
                size={19}
                fill={reaction.mine === "heart" ? "currentColor" : "none"}
              />
              {reaction.mine === "heart" ? "Loved" : "Love"}
            </button>

            <button
              disabled={bookmarkPending}
              className={"reaction-btn " + (bookmarked ? "active" : "")}
              aria-pressed={bookmarked}
              onClick={() => {
                if (requireUser()) void onBookmark();
              }}
            >
              <Icon
                name="bookmark"
                size={18}
                fill={bookmarked ? "currentColor" : "none"}
              />
              {bookmarked ? "Saved" : "Bookmark"}
            </button>

            <button
              onClick={() => setCommentsOpen(!commentsOpen)}
              aria-expanded={commentsOpen}
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
                      encodeURIComponent(post.id),
                  );
                  notify("Post link copied.");
                } catch {
                  notify("Open the post link, then copy the address.", "info");
                  navigate("/community?post=" + post.id);
                }
              }}
            >
              <Icon name="share" size={18} />
              <span className="share-label">Share</span>
            </button>
          </div>

          {commentsOpen && (
            <CommentList
              postId={post.id}
              user={user}
              comments={commentState.comments}
              roots={commentState.roots}
              adding={commentState.adding}
              removingIds={commentState.removingIds}
              onAdd={commentState.addComment}
              onRemove={commentState.removeComment}
              onReport={onReport}
            />
          )}
        </>
      )}

      {post.status === "pending" &&
        user?.role === "admin" &&
        post.authorId !== user.id &&
        onModerate && (
          <div className="post-moderation">
            <label className="field">
              <span>Review note (required for rejection)</span>
              <textarea
                rows={2}
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <Button
              disabled={moderationPending}
              onClick={() => void moderate("published")}
            >
              Approve and publish
            </Button>
            <Button
              disabled={moderationPending || reason.trim().length < 5}
              variant="secondary"
              onClick={() => void moderate("rejected")}
            >
              Request changes
            </Button>
          </div>
        )}

      <Confirm
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title="Remove this post?"
        description="The post will be hidden from the public feed. This does not delete other members' accounts."
        onConfirm={async () => {
          await onRemovePost(post);
        }}
      />
    </article>
  );
}
