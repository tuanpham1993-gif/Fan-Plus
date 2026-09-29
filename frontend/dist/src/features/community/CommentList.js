import React, { useState } from "react";
import { Button, Icon } from "../../components/ui.js";
import { Link } from "../../lib/router.js";
import { communityDate, initials } from "./utils.js";
export function CommentList({ postId, user, comments, roots, adding, removingIds, onAdd, onRemove, onReport, }) {
    const [draft, setDraft] = useState("");
    const [reply, setReply] = useState(null);
    const renderComment = (comment) => (React.createElement("article", { key: comment.id, className: "social-comment " + (comment.parentId ? "reply" : "") },
        React.createElement("span", { className: "social-avatar mini" }, initials(comment.authorName)),
        React.createElement("div", null,
            React.createElement(Link, { className: "author-link", to: "/community/member/" + comment.authorId },
                React.createElement("strong", null, comment.authorName)),
            React.createElement("p", { className: "preserve-space" }, comment.body),
            React.createElement("div", { className: "comment-meta" },
                React.createElement("span", null, communityDate(comment.createdAt)),
                !comment.hidden && !comment.parentId && (React.createElement("button", { onClick: () => {
                        setReply(comment);
                        setDraft("");
                    } }, "Reply")),
                !comment.hidden &&
                    (comment.authorId === user?.id || user?.role === "admin") && (React.createElement("button", { disabled: removingIds.has(comment.id), onClick: () => void onRemove(comment) }, removingIds.has(comment.id) ? "Removing..." : "Remove")),
                !comment.hidden && (React.createElement("button", { onClick: () => onReport(comment.id) }, "Report"))))));
    return (React.createElement("div", { className: "post-comments" },
        roots.length ? (roots.map((comment) => (React.createElement(React.Fragment, { key: comment.id },
            renderComment(comment),
            comments
                .filter((replyComment) => replyComment.parentId === comment.id)
                .map(renderComment))))) : (React.createElement("p", { className: "muted small" }, "Be the first to add a thoughtful reply.")),
        user ? (React.createElement("form", { className: "comment-form", onSubmit: async (event) => {
                event.preventDefault();
                if (await onAdd(draft, reply?.id || null)) {
                    setDraft("");
                    setReply(null);
                }
            } },
            reply && (React.createElement("div", { className: "reply-to" },
                "Replying to ",
                reply.authorName,
                React.createElement("button", { type: "button", onClick: () => setReply(null) }, "Cancel"))),
            React.createElement("label", { className: "sr-only", htmlFor: "comment-" + postId }, "Your comment"),
            React.createElement("textarea", { id: "comment-" + postId, rows: 2, maxLength: 1000, required: true, value: draft, onChange: (event) => setDraft(event.target.value), placeholder: "Add to the conversation..." }),
            React.createElement("div", null,
                React.createElement("span", null,
                    draft.length,
                    "/1000"),
                React.createElement(Button, { type: "submit", disabled: !draft.trim(), busy: adding },
                    "Post comment",
                    React.createElement(Icon, { name: "send", size: 15 }))))) : (React.createElement(Link, { to: "/login?next=" +
                encodeURIComponent("/community?post=" + postId), className: "comment-signin" },
            "Sign in to join this conversation",
            React.createElement(Icon, { name: "arrow", size: 16 })))));
}
