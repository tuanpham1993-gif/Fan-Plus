import React, { useState } from "react";
import { Button, Confirm, Icon } from "../../components/ui.js";
import { useApp } from "../../lib/store.js";
import { Link, navigate } from "../../lib/router.js";
import { useAuth } from "../auth/AuthProvider.js";
import { usePostComments, useReaction } from "./hooks.js";
import { formatNames, topicImages, topicNames } from "./constants.js";
import { CommentList } from "./CommentList.js";
import { communityDate, initials } from "./utils.js";
export function PostCard({ post, data, updateData, onEdit, onReport, requireUser, autoComments, bookmarked, bookmarkPending, onBookmark, onRemovePost, onModerate, }) {
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
    const moderate = async (decision) => {
        if (!onModerate || moderationPending)
            return;
        setModerationPending(true);
        try {
            await onModerate(post, decision, reason);
        }
        finally {
            setModerationPending(false);
        }
    };
    return (React.createElement("article", { className: "post-card topic-" + post.topic, "data-testid": "community-post" },
        React.createElement("div", { className: "post-author" },
            React.createElement("span", { className: "social-avatar" }, initials(post.authorName)),
            React.createElement("div", null,
                React.createElement(Link, { className: "author-link", to: "/community/member/" + post.authorId },
                    React.createElement("strong", null, post.authorName)),
                React.createElement("span", null,
                    communityDate(post.createdAt),
                    " ",
                    React.createElement("span", { "aria-hidden": "true" }, "/"),
                    " ",
                    topicNames[post.topic],
                    " / ",
                    formatNames[post.format],
                    " ",
                    post.sample && "/ Sample post")),
            React.createElement("div", { className: "post-menu" },
                owner && (React.createElement("button", { className: "icon-btn", title: "Edit post", "aria-label": "Edit " + post.title, onClick: onEdit },
                    React.createElement(Icon, { name: "edit", size: 16 }))),
                (owner || user?.role === "admin") && post.status !== "hidden" && (React.createElement("button", { className: "icon-btn", "aria-label": "Remove " + post.title, onClick: () => setRemoveOpen(true) },
                    React.createElement(Icon, { name: "trash", size: 16 }))),
                post.status === "published" && (React.createElement("button", { className: "icon-btn", "aria-label": "Report " + post.title, onClick: () => onReport(null) },
                    React.createElement(Icon, { name: "flag", size: 16 }))))),
        post.status !== "published" && (React.createElement("div", { className: "post-status " + post.status },
            React.createElement(Icon, { name: post.status === "pending" ? "clock" : "info", size: 16 }),
            React.createElement("span", null,
                post.status === "pending"
                    ? "Awaiting moderation"
                    : post.status === "rejected"
                        ? "Changes requested"
                        : "Hidden",
                post.reason && " / " + post.reason))),
        React.createElement("div", { className: "post-body" },
            React.createElement("div", { className: "post-subject" },
                React.createElement("span", null, post.subject),
                post.rating > 0 && (React.createElement("span", { className: "review-rating" },
                    React.createElement(Icon, { name: "star", size: 14 }),
                    post.rating,
                    "/5")),
                React.createElement("span", { className: "post-format-badge" }, formatNames[post.format]),
                post.spoiler && React.createElement("span", { className: "spoiler-label" }, "Spoiler")),
            React.createElement("h2", null, hidden
                ? "A review with spoilers. Your choice to open it."
                : post.title),
            hidden ? (React.createElement("div", { className: "post-spoiler" },
                React.createElement(Icon, { name: "shield", size: 22 }),
                React.createElement("p", null, "This review may reveal plot details."),
                React.createElement(Button, { variant: "secondary", onClick: () => setRevealed(true) }, "Reveal this review"))) : (React.createElement(React.Fragment, null,
                React.createElement("p", { className: "preserve-space " +
                        (!expanded && post.body.length > 450 ? "post-excerpt" : "") }, post.body),
                post.body.length > 450 && (React.createElement("button", { className: "small-link", onClick: () => setExpanded(!expanded) },
                    expanded ? "Read less" : "Read the full perspective",
                    React.createElement(Icon, { name: "chevron", size: 14 })))))),
        !hidden && post.mediaUrl && post.format !== "post" && (React.createElement("div", { className: "post-media " + post.format },
            React.createElement("div", { className: "post-media-head" },
                React.createElement(Icon, { name: post.format === "video" ? "play" : "music", size: 17 }),
                React.createElement("span", null, post.format === "video"
                    ? "Video attachment"
                    : "Soundtrack attachment")),
            post.format === "video" ? (React.createElement("video", { controls: true, preload: "metadata", playsInline: true, src: post.mediaUrl }, "Your browser cannot play this video.")) : (React.createElement("audio", { controls: true, preload: "metadata", src: post.mediaUrl }, "Your browser cannot play this audio.")))),
        post.sample && post.id === "post-city" && !hidden && (React.createElement("div", { className: "post-cover" },
            React.createElement("img", { src: topicImages[post.topic], alt: "Original Fan Hub illustration of an imagined city" }),
            React.createElement("div", null,
                React.createElement("span", null, "THE WORLDS WE RETURN TO"),
                React.createElement("strong", null, post.subject)))),
        post.status === "published" && (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "post-totals" },
                React.createElement("span", null,
                    reaction.likeCount,
                    " likes / ",
                    reaction.heartCount,
                    " loves"),
                React.createElement("button", { onClick: () => setCommentsOpen(!commentsOpen) },
                    commentState.visibleCount,
                    " comments")),
            React.createElement("div", { className: "post-actions" },
                React.createElement("button", { disabled: reaction.pending, className: "reaction-btn " + (reaction.mine === "like" ? "active" : ""), "aria-pressed": reaction.mine === "like", onClick: () => {
                        if (requireUser())
                            void reaction.setReaction("like");
                    } },
                    React.createElement(Icon, { name: "like", size: 19, fill: reaction.mine === "like" ? "currentColor" : "none" }),
                    reaction.mine === "like" ? "Liked" : "Like"),
                React.createElement("button", { disabled: reaction.pending, className: "reaction-btn " +
                        (reaction.mine === "heart" ? "active heart" : ""), "aria-pressed": reaction.mine === "heart", onClick: () => {
                        if (requireUser())
                            void reaction.setReaction("heart");
                    } },
                    React.createElement(Icon, { name: "heart", size: 19, fill: reaction.mine === "heart" ? "currentColor" : "none" }),
                    reaction.mine === "heart" ? "Loved" : "Love"),
                React.createElement("button", { disabled: bookmarkPending, className: "reaction-btn " + (bookmarked ? "active" : ""), "aria-pressed": bookmarked, onClick: () => {
                        if (requireUser())
                            void onBookmark();
                    } },
                    React.createElement(Icon, { name: "bookmark", size: 18, fill: bookmarked ? "currentColor" : "none" }),
                    bookmarked ? "Saved" : "Bookmark"),
                React.createElement("button", { onClick: () => setCommentsOpen(!commentsOpen), "aria-expanded": commentsOpen },
                    React.createElement(Icon, { name: "chat", size: 19 }),
                    "Comment"),
                React.createElement("button", { "aria-label": "Copy post link", onClick: async () => {
                        try {
                            await navigator.clipboard.writeText(location.origin +
                                "/community?post=" +
                                encodeURIComponent(post.id));
                            notify("Post link copied.");
                        }
                        catch {
                            notify("Open the post link, then copy the address.", "info");
                            navigate("/community?post=" + post.id);
                        }
                    } },
                    React.createElement(Icon, { name: "share", size: 18 }),
                    React.createElement("span", { className: "share-label" }, "Share"))),
            commentsOpen && (React.createElement(CommentList, { postId: post.id, user: user, comments: commentState.comments, roots: commentState.roots, adding: commentState.adding, removingIds: commentState.removingIds, onAdd: commentState.addComment, onRemove: commentState.removeComment, onReport: onReport })))),
        post.status === "pending" &&
            user?.role === "admin" &&
            post.authorId !== user.id &&
            onModerate && (React.createElement("div", { className: "post-moderation" },
            React.createElement("label", { className: "field" },
                React.createElement("span", null, "Review note (required for rejection)"),
                React.createElement("textarea", { rows: 2, maxLength: 500, value: reason, onChange: (event) => setReason(event.target.value) })),
            React.createElement(Button, { disabled: moderationPending, onClick: () => void moderate("published") }, "Approve and publish"),
            React.createElement(Button, { disabled: moderationPending || reason.trim().length < 5, variant: "secondary", onClick: () => void moderate("rejected") }, "Request changes"))),
        React.createElement(Confirm, { open: removeOpen, onClose: () => setRemoveOpen(false), title: "Remove this post?", description: "The post will be hidden from the public feed. This does not delete other members' accounts.", onConfirm: async () => {
                await onRemovePost(post);
            } })));
}
