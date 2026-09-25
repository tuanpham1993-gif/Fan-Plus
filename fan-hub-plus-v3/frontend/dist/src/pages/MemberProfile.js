import React, { useEffect, useState } from "react";
import { Link } from "../lib/router.js";
import { gateway } from "../features/gateway.js";
import { Icon, Skeleton, Empty } from "../components/ui.js";
function initials(name) {
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}
export default function MemberProfile({ id }) {
    const [profile, setProfile] = useState(null), [error, setError] = useState("");
    useEffect(() => {
        setProfile(null);
        setError("");
        gateway
            .publicProfile(id)
            .then(setProfile)
            .catch((e) => setError(e.message));
    }, [id]);
    if (error)
        return (React.createElement(Empty, { title: "This member could not be found.", description: error },
            React.createElement(Link, { className: "btn btn-primary", to: "/community" },
                "Back to community ",
                React.createElement(Icon, { name: "arrow", size: 16 }))));
    if (!profile)
        return React.createElement(Skeleton, { cards: 1 });
    return (React.createElement("section", { className: "panel member-profile" },
        React.createElement("div", { className: "profile-identity" },
            React.createElement("div", { className: "profile-avatar" }, initials(profile.name)),
            React.createElement("div", null,
                React.createElement("h2", null, profile.name),
                React.createElement("p", { className: "muted" },
                    profile.role === "admin" ? "Administrator" : "Member",
                    profile.createdAt && " / Joined " + new Date(profile.createdAt).toLocaleDateString()))),
        profile.bio && React.createElement("p", { className: "preserve-space" }, profile.bio),
        profile.favoriteCategories.length > 0 && (React.createElement("div", { className: "tag-list" }, profile.favoriteCategories.map((c) => (React.createElement("span", { className: "tag", key: c }, c))))),
        React.createElement("div", { className: "stats-grid" },
            React.createElement("div", { className: "stat-card" },
                React.createElement(Icon, { name: "edit" }),
                React.createElement("strong", null, profile.publishedPosts),
                React.createElement("span", null, "Published community posts"))),
        React.createElement(Link, { className: "text-link", to: "/community" },
            "Back to community ",
            React.createElement(Icon, { name: "arrow", size: 16 }))));
}
