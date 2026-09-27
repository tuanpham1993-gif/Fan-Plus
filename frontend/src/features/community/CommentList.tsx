import React, { useState } from "react";
import type { User } from "../../domain/types";
import { Button, Icon } from "../../components/ui";
import { Link } from "../../lib/router";
import type { Comment } from "../types";
import { communityDate, initials } from "./utils";

export function CommentList({
  postId,
  user,
  comments,
  roots,
  adding,
  removingIds,
  onAdd,
  onRemove,
  onReport,
}: {
  postId: string;
  user: User | null;
  comments: Comment[];
  roots: Comment[];
  adding: boolean;
  removingIds: Set<string>;
  onAdd: (body: string, parentId: string | null) => Promise<boolean>;
  onRemove: (comment: Comment) => Promise<boolean>;
  onReport: (commentId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState<Comment | null>(null);

  const renderComment = (comment: Comment) => (
    <article
      key={comment.id}
      className={"social-comment " + (comment.parentId ? "reply" : "")}
    >
      <span className="social-avatar mini">{initials(comment.authorName)}</span>
      <div>
        <Link
          className="author-link"
          to={"/community/member/" + comment.authorId}
        >
          <strong>{comment.authorName}</strong>
        </Link>
        <p className="preserve-space">{comment.body}</p>
        <div className="comment-meta">
          <span>{communityDate(comment.createdAt)}</span>
          {!comment.hidden && !comment.parentId && (
            <button
              onClick={() => {
                setReply(comment);
                setDraft("");
              }}
            >
              Reply
            </button>
          )}
          {!comment.hidden &&
            (comment.authorId === user?.id || user?.role === "admin") && (
              <button
                disabled={removingIds.has(comment.id)}
                onClick={() => void onRemove(comment)}
              >
                {removingIds.has(comment.id) ? "Removing..." : "Remove"}
              </button>
            )}
          {!comment.hidden && (
            <button onClick={() => onReport(comment.id)}>Report</button>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <div className="post-comments">
      {roots.length ? (
        roots.map((comment) => (
          <React.Fragment key={comment.id}>
            {renderComment(comment)}
            {comments
              .filter((replyComment) => replyComment.parentId === comment.id)
              .map(renderComment)}
          </React.Fragment>
        ))
      ) : (
        <p className="muted small">Be the first to add a thoughtful reply.</p>
      )}

      {user ? (
        <form
          className="comment-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (await onAdd(draft, reply?.id || null)) {
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
          <label className="sr-only" htmlFor={"comment-" + postId}>
            Your comment
          </label>
          <textarea
            id={"comment-" + postId}
            rows={2}
            maxLength={1000}
            required
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add to the conversation..."
          />
          <div>
            <span>{draft.length}/1000</span>
            <Button type="submit" disabled={!draft.trim()} busy={adding}>
              Post comment
              <Icon name="send" size={15} />
            </Button>
          </div>
        </form>
      ) : (
        <Link
          to={
            "/login?next=" +
            encodeURIComponent("/community?post=" + postId)
          }
          className="comment-signin"
        >
          Sign in to join this conversation
          <Icon name="arrow" size={16} />
        </Link>
      )}
    </div>
  );
}
