import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "../../domain/types";
import { Button, Empty, Icon } from "../../components/ui";
import { Link } from "../../lib/router";
import { normalize } from "../demo";
import type { Post, SocialData } from "../types";
import type { CommunityDataUpdater } from "./hooks";
import { PostCard } from "./PostCard";
import { topicOptions } from "./constants";
import { initials } from "./utils";

export type CommunityTab =
  | "latest"
  | "popular"
  | "mine"
  | "review"
  | "reports";

export function CommunityFeed({
  user,
  data,
  loading,
  error,
  reload,
  updateData,
  tab,
  onTabChange,
  focusedPostId,
  onCompose,
  onEdit,
  onReport,
  requireUser,
  isBookmarked,
  isBookmarkPending,
  onBookmark,
  onRemovePost,
  onModerate,
  rail,
  reportsPanel,
}: {
  user: User | null;
  data: SocialData | null;
  loading: boolean;
  error: string;
  reload: () => Promise<SocialData>;
  updateData: CommunityDataUpdater;
  tab: CommunityTab;
  onTabChange: (tab: CommunityTab) => void;
  focusedPostId: string | null;
  onCompose: () => void;
  onEdit: (post: Post) => void;
  onReport: (postId: string, commentId: string | null) => void;
  requireUser: () => boolean;
  isBookmarked: (postId: string) => boolean;
  isBookmarkPending: (postId: string) => boolean;
  onBookmark: (postId: string) => Promise<boolean>;
  onRemovePost: (post: Post) => Promise<boolean>;
  onModerate?: (
    post: Post,
    decision: "published" | "rejected",
    reason: string,
  ) => Promise<boolean>;
  rail: ReactNode;
  reportsPanel?: ReactNode;
}) {
  const [topic, setTopic] = useState("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(6);

  useEffect(() => {
    setLimit(6);
  }, [topic, tab, q, focusedPostId]);

  const posts = useMemo(() => {
    if (!data) return [];

    return data.posts
      .filter((post) =>
        tab === "mine"
          ? post.authorId === user?.id
          : tab === "review"
            ? post.status === "pending"
            : post.status === "published",
      )
      .filter(
        (post) =>
          (!topic || post.topic === topic) &&
          (!q ||
            normalize(post.title + " " + post.subject + " " + post.body).includes(
              normalize(q),
            )) &&
          (!focusedPostId || post.id === focusedPostId),
      )
      .sort((left, right) =>
        tab === "popular"
          ? data.reactions.filter((reaction) => reaction.postId === right.id)
              .length -
              data.reactions.filter((reaction) => reaction.postId === left.id)
                .length || right.createdAt.localeCompare(left.createdAt)
          : right.createdAt.localeCompare(left.createdAt),
      );
  }, [data, tab, user?.id, topic, q, focusedPostId]);

  const pendingCount =
    data?.posts.filter((post) => post.status === "pending").length || 0;

  return (
    <>
      <div className="community-topicbar">
        <div className="topic-chips" aria-label="Filter community topics">
          {[["", "All conversations"], ...topicOptions].map(([id, name]) => (
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
        <Button onClick={onCompose}>
          <Icon name="edit" size={17} />
          Write a post
        </Button>
      </div>

      <div className="social-layout">
        <section className="social-feed" aria-label="Community feed">
      <div className="feed-compose">
        <span className="social-avatar">{user ? initials(user.name) : "You"}</span>
        <button onClick={onCompose}>
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
        <div className="feed-tabs" role="group" aria-label="Community feed view">
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
              onClick={() => onTabChange(id as CommunityTab)}
            >
              {label}
              {id === "review" && pendingCount > 0 && (
                <span className="count-pill">{pendingCount}</span>
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
            onChange={(event) => setQ(event.target.value)}
          />
        </label>
      </div>


      {focusedPostId && (
        <Link className="text-link" to="/community">
          See all conversations
          <Icon name="arrow" size={16} />
        </Link>
      )}

      {error && (
        <div role="alert" className="notice">
          {error}
          <Button variant="secondary" onClick={() => void reload()}>
            Retry
          </Button>
        </div>
      )}

      {loading && !data && !error && (
        <div className="feed-loading" role="status">
          <span className="spinner" />
          Loading conversations...
        </div>
      )}

      {tab === "reports" && reportsPanel}

      {data && posts.length === 0 && tab !== "reports" && (
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
          <Button onClick={onCompose}>Write a post</Button>
        </Empty>
      )}

      {tab !== "reports" &&
        posts.slice(0, limit).map((post) => (
          <PostCard
            key={post.id}
            post={post}
            data={data!}
            updateData={updateData}
            onEdit={() => onEdit(post)}
            onReport={(commentId) => onReport(post.id, commentId)}
            requireUser={requireUser}
            autoComments={focusedPostId === post.id}
            bookmarked={isBookmarked(post.id)}
            bookmarkPending={isBookmarkPending(post.id)}
            onBookmark={() => onBookmark(post.id)}
            onRemovePost={onRemovePost}
            onModerate={onModerate}
          />
        ))}

      {tab !== "reports" && posts.length > limit && (
        <Button
          variant="secondary"
          className="load-conversations"
          onClick={() => setLimit((current) => current + 6)}
        >
          Read more conversations
          <Icon name="arrow" size={17} />
        </Button>
      )}
        </section>
        {rail}
      </div>
    </>
  );
}
