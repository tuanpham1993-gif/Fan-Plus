import React, { useEffect, useMemo, useState } from "react";
import { Button, Empty, Icon } from "../../components/ui.js";
import { Link } from "../../lib/router.js";
import { normalize } from "../demo.js";
import { PostCard } from "./PostCard.js";
import { topicOptions } from "./constants.js";
import { initials } from "./utils.js";
export function CommunityFeed({ user, data, loading, error, reload, updateData, tab, onTabChange, focusedPostId, onCompose, onEdit, onReport, requireUser, isBookmarked, isBookmarkPending, onBookmark, onRemovePost, onModerate, rail, reportsPanel, }) {
    const [topic, setTopic] = useState("");
    const [q, setQ] = useState("");
    const [limit, setLimit] = useState(6);
    useEffect(() => {
        setLimit(6);
    }, [topic, tab, q, focusedPostId]);
    const posts = useMemo(() => {
        if (!data)
            return [];
        return data.posts
            .filter((post) => tab === "mine"
            ? post.authorId === user?.id
            : tab === "review"
                ? post.status === "pending"
                : post.status === "published")
            .filter((post) => (!topic || post.topic === topic) &&
            (!q ||
                normalize(post.title + " " + post.subject + " " + post.body).includes(normalize(q))) &&
            (!focusedPostId || post.id === focusedPostId))
            .sort((left, right) => tab === "popular"
            ? data.reactions.filter((reaction) => reaction.postId === right.id)
                .length -
                data.reactions.filter((reaction) => reaction.postId === left.id)
                    .length || right.createdAt.localeCompare(left.createdAt)
            : right.createdAt.localeCompare(left.createdAt));
    }, [data, tab, user?.id, topic, q, focusedPostId]);
    const pendingCount = data?.posts.filter((post) => post.status === "pending").length || 0;
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "community-topicbar" },
            React.createElement("div", { className: "topic-chips", "aria-label": "Filter community topics" }, [["", "All conversations"], ...topicOptions].map(([id, name]) => (React.createElement("button", { key: id, "aria-pressed": topic === id, className: topic === id ? "selected" : "", onClick: () => setTopic(id) }, name)))),
            React.createElement(Button, { onClick: onCompose },
                React.createElement(Icon, { name: "edit", size: 17 }),
                "Write a post")),
        React.createElement("div", { className: "social-layout" },
            React.createElement("section", { className: "social-feed", "aria-label": "Community feed" },
                React.createElement("div", { className: "feed-compose" },
                    React.createElement("span", { className: "social-avatar" }, user ? initials(user.name) : "You"),
                    React.createElement("button", { onClick: onCompose },
                        React.createElement("strong", null, user
                            ? `${user.name.split(" ")[0]}, what stayed with you?`
                            : "A good conversation starts with a perspective."),
                        React.createElement("span", null, "Share a review, a thought, a recommendation.")),
                    React.createElement(Icon, { name: "edit", size: 20 })),
                React.createElement("div", { className: "feed-tools" },
                    React.createElement("div", { className: "feed-tabs", role: "group", "aria-label": "Community feed view" }, [
                        ["latest", "Latest"],
                        ["popular", "Most appreciated"],
                        ...(user ? [["mine", "My posts"]] : []),
                        ...(user?.role === "admin"
                            ? [
                                ["review", "Review queue"],
                                ["reports", "Reports"],
                            ]
                            : []),
                    ].map(([id, label]) => (React.createElement("button", { key: id, className: tab === id ? "active" : "", "aria-pressed": tab === id, onClick: () => onTabChange(id) },
                        label,
                        id === "review" && pendingCount > 0 && (React.createElement("span", { className: "count-pill" }, pendingCount)))))),
                    React.createElement("label", { className: "community-search" },
                        React.createElement(Icon, { name: "search", size: 17 }),
                        React.createElement("input", { "aria-label": "Search community posts", placeholder: "Search conversations", value: q, onChange: (event) => setQ(event.target.value) }))),
                focusedPostId && (React.createElement(Link, { className: "text-link", to: "/community" },
                    "See all conversations",
                    React.createElement(Icon, { name: "arrow", size: 16 }))),
                error && (React.createElement("div", { role: "alert", className: "notice" },
                    error,
                    React.createElement(Button, { variant: "secondary", onClick: () => void reload() }, "Retry"))),
                loading && !data && !error && (React.createElement("div", { className: "feed-loading", role: "status" },
                    React.createElement("span", { className: "spinner" }),
                    "Loading conversations...")),
                tab === "reports" && reportsPanel,
                data && posts.length === 0 && tab !== "reports" && (React.createElement(Empty, { icon: "chat", title: tab === "mine"
                        ? "Your voice belongs here."
                        : "No conversations here yet.", description: tab === "mine"
                        ? "Write your first review. It will appear here while a moderator reads it."
                        : "Try a different topic or start the conversation." },
                    React.createElement(Button, { onClick: onCompose }, "Write a post"))),
                tab !== "reports" &&
                    posts.slice(0, limit).map((post) => (React.createElement(PostCard, { key: post.id, post: post, data: data, updateData: updateData, onEdit: () => onEdit(post), onReport: (commentId) => onReport(post.id, commentId), requireUser: requireUser, autoComments: focusedPostId === post.id, bookmarked: isBookmarked(post.id), bookmarkPending: isBookmarkPending(post.id), onBookmark: () => onBookmark(post.id), onRemovePost: onRemovePost, onModerate: onModerate }))),
                tab !== "reports" && posts.length > limit && (React.createElement(Button, { variant: "secondary", className: "load-conversations", onClick: () => setLimit((current) => current + 6) },
                    "Read more conversations",
                    React.createElement(Icon, { name: "arrow", size: 17 })))),
            rail)));
}
