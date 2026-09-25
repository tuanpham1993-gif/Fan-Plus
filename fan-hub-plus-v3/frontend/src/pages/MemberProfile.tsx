import React, { useEffect, useState } from "react";
import { Link } from "../lib/router";
import { gateway } from "../features/gateway";
import type { PublicProfile } from "../features/types";
import { Icon, Skeleton, Empty } from "../components/ui";
function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
export default function MemberProfile({ id }: { id: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    setProfile(null);
    setError("");
    gateway
      .publicProfile(id)
      .then(setProfile)
      .catch((e) => setError((e as Error).message));
  }, [id]);
  if (error)
    return (
      <Empty title="This member could not be found." description={error}>
        <Link className="btn btn-primary" to="/community">
          Back to community <Icon name="arrow" size={16} />
        </Link>
      </Empty>
    );
  if (!profile) return <Skeleton cards={1} />;
  return (
    <section className="panel member-profile">
      <div className="profile-identity">
        <div className="profile-avatar">{initials(profile.name)}</div>
        <div>
          <h2>{profile.name}</h2>
          <p className="muted">
            {profile.role === "admin" ? "Administrator" : "Member"}
            {profile.createdAt && " / Joined " + new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      {profile.bio && <p className="preserve-space">{profile.bio}</p>}
      {profile.favoriteCategories.length > 0 && (
        <div className="tag-list">
          {profile.favoriteCategories.map((c) => (
            <span className="tag" key={c}>
              {c}
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
      <Link className="text-link" to="/community">
        Back to community <Icon name="arrow" size={16} />
      </Link>
    </section>
  );
}
