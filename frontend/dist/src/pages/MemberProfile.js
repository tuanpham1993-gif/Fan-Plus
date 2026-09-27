import React, { useEffect, useState } from "react";
import { Link } from "../lib/router.js";
import { useAuth } from "../features/auth/AuthProvider.js";
import { useBookmarks } from "../features/bookmarks/BookmarksProvider.js";
import { profileDataSource } from "../features/profile/dataSource.js";
import { ContentCard, Empty, Icon, Notice, Skeleton } from "../components/ui.js";
import { categoryLabel } from "../shared/catalog/taxonomy.js";
function initials(name) {
    return name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}
export default function MemberProfile({ id }) {
    const { user } = useAuth();
    const { status: bookmarkStatus, items: bookmarkItems, error: bookmarkError, } = useBookmarks();
    const [profile, setProfile] = useState(null);
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
            if (active)
                setProfile(next);
        })
            .catch((cause) => {
            if (!controller.signal.aborted && active) {
                setError(cause instanceof Error
                    ? cause.message
                    : "Profile could not be loaded.");
            }
        });
        return () => {
            active = false;
            controller.abort();
        };
    }, [id]);
    if (error) {
        return (React.createElement(Empty, { title: "This member could not be found.", description: error },
            React.createElement(Link, { className: "btn btn-primary", to: "/community" },
                "Back to community ",
                React.createElement(Icon, { name: "arrow", size: 16 }))));
    }
    if (!profile)
        return React.createElement(Skeleton, { cards: 1 });
    return (React.createElement("section", { className: "panel member-profile" },
        React.createElement("div", { className: "profile-identity" },
            React.createElement("div", { className: "profile-avatar" }, initials(profile.name)),
            React.createElement("div", null,
                React.createElement("h2", null, profile.name),
                React.createElement("p", { className: "muted" },
                    profile.role === "admin" ? "Administrator" : "Member",
                    profile.createdAt &&
                        " / Joined " + new Date(profile.createdAt).toLocaleDateString()))),
        profile.bio && React.createElement("p", { className: "preserve-space" }, profile.bio),
        profile.favoriteCategories.length > 0 && (React.createElement("div", { className: "tag-list" }, profile.favoriteCategories.map((category) => (React.createElement("span", { className: "tag", key: category }, categoryLabel(category)))))),
        React.createElement("div", { className: "stats-grid" },
            React.createElement("div", { className: "stat-card" },
                React.createElement(Icon, { name: "edit" }),
                React.createElement("strong", null, profile.publishedPosts),
                React.createElement("span", null, "Published community posts"))),
        ownProfile && (React.createElement("div", { className: "content-section" },
            React.createElement("div", { className: "section-heading" },
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "PRIVATE TO YOU"),
                    React.createElement("h3", null, "Your reading list")),
                React.createElement(Link, { className: "text-link", to: "/collection" },
                    "Open collection ",
                    React.createElement(Icon, { name: "arrow", size: 15 }))),
            bookmarkStatus === "loading" ? (React.createElement(Skeleton, { cards: 3 })) : bookmarkError ? (React.createElement(Notice, { kind: "error" }, bookmarkError)) : bookmarkItems.length ? (React.createElement("div", { className: "card-grid" }, bookmarkItems.slice(0, 3).map((item) => (React.createElement(ContentCard, { content: item.content, key: item.bookmark.id }))))) : (React.createElement("p", { className: "muted" }, "Your saved discoveries will appear here only when you are viewing your own profile.")))),
        React.createElement(Link, { className: "text-link", to: "/community" },
            "Back to community ",
            React.createElement(Icon, { name: "arrow", size: 16 }))));
}
