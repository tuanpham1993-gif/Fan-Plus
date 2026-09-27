import React, { useEffect, useState } from "react";
import { Link } from "../lib/router";
import { useAuth } from "../features/auth/AuthProvider";
import { useBookmarks } from "../features/bookmarks/BookmarksProvider";
import { profileDataSource } from "../features/profile/dataSource";
import type { PublicProfile } from "../features/types";
import { ContentCard, Empty, Icon, Notice, Skeleton } from "../components/ui";
import { categoryLabel } from "../shared/catalog/taxonomy";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function MemberProfile({ id }: { id: string }) {
  const { user } = useAuth();
  const {
    status: bookmarkStatus,
    items: bookmarkItems,
    error: bookmarkError,
  } = useBookmarks();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState("");
  const ownProfile = user?.id === id;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setProfile(null);
    setError("");

    profileDataSource
      .publicProfile(id, controller.signal)
      .then((next) => {
        if (active) setProfile(next);
      })
      .catch((cause) => {
        if (!controller.signal.aborted && active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Profile could not be loaded.",
          );
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);

  if (error) {
    return (
      <Empty title="This member could not be found." description={error}>
        <Link className="btn btn-primary" to="/community">
          Back to community <Icon name="arrow" size={16} />
        </Link>
      </Empty>
    );
  }
  if (!profile) return <Skeleton cards={1} />;

  return (
    <section className="panel member-profile">
      <div className="profile-identity">
        <div className="profile-avatar">{initials(profile.name)}</div>
        <div>
          <h2>{profile.name}</h2>
          <p className="muted">
            {profile.role === "admin" ? "Administrator" : "Member"}
            {profile.createdAt &&
              " / Joined " + new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      {profile.bio && <p className="preserve-space">{profile.bio}</p>}
      {profile.favoriteCategories.length > 0 && (
        <div className="tag-list">
          {profile.favoriteCategories.map((category) => (
            <span className="tag" key={category}>
              {categoryLabel(category)}
            </span>
          ))}
        </div>
      )}
      <div className="stats-grid">
        <div className="stat-card">
          <Icon name="edit" />
          <strong>{profile.publishedPosts}</strong>
          <span>Published community posts</span>
        </div>
      </div>

      {ownProfile && (
        <div className="content-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">PRIVATE TO YOU</span>
              <h3>Your reading list</h3>
            </div>
            <Link className="text-link" to="/collection">
              Open collection <Icon name="arrow" size={15} />
            </Link>
          </div>

          {bookmarkStatus === "loading" ? (
            <Skeleton cards={3} />
          ) : bookmarkError ? (
            <Notice kind="error">{bookmarkError}</Notice>
          ) : bookmarkItems.length ? (
            <div className="card-grid">
              {bookmarkItems.slice(0, 3).map((item) => (
                <ContentCard content={item.content} key={item.bookmark.id} />
              ))}
            </div>
          ) : (
            <p className="muted">
              Your saved discoveries will appear here only when you are viewing
              your own profile.
            </p>
          )}
        </div>
      )}

      <Link className="text-link" to="/community">
        Back to community <Icon name="arrow" size={16} />
      </Link>
    </section>
  );
}
