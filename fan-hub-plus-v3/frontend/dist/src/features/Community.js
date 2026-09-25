import React, { useCallback, useEffect, useState } from "react";
import { useApp } from "../lib/store.js";
import { Link, navigate, currentPath, useLocation } from "../lib/router.js";
import { Button, Icon, Modal, Confirm, Empty, } from "../components/ui.js";
import { gateway } from "./gateway.js";
import { normalize } from "./demo.js";
import { serverMode } from "./http.js";
import { openLore } from "./Lore.js";
const topicNames = { anime: "Anime", movies: "Movies", music: "Music" };
const images = {
    anime: "/art/anime.svg",
    movies: "/art/movies.svg",
    music: "/art/kpop.svg",
};
const blank = {
    title: "",
    subject: "",
    body: "",
    topic: "anime",
    spoiler: false,
    rating: 0,
};
function initials(name) {
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}
function time(s) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(s));
}
export default function Community() {
    const { user, notify } = useApp(), { params } = useLocation();
    const [data, setData] = useState(null), [error, setError] = useState(""), [topic, setTopic] = useState(""), [tab, setTab] = useState("latest"), [q, setQ] = useState(""), [limit, setLimit] = useState(6), [editor, setEditor] = useState(false), [editing, setEditing] = useState(), [report, setReport] = useState(null), [reason, setReason] = useState(""), [busy, setBusy] = useState(false);
    const load = useCallback(async () => {
        try {
            const d = await gateway.social(user);
            setData(d);
            setError("");
        }
        catch (e) {
            setError(e.message);
        }
    }, [user?.id]);
    useEffect(() => {
        void load();
    }, [load]);
    useEffect(() => {
        setLimit(6);
    }, [topic, tab, q]);
    const run = async (fn, message) => {
        setBusy(true);
        try {
            await fn();
            await load();
            notify(message);
            return true;
        }
        catch (e) {
            notify(e.message, "error");
            return false;
        }
        finally {
            setBusy(false);
        }
    };
    function requireUser() {
        if (user)
            return true;
        navigate("/login?next=" + encodeURIComponent(currentPath()));
        return false;
    }
    const compose = (p) => {
        if (!requireUser())
            return;
        setEditing(p);
        setEditor(true);
    };
    let posts = data?.posts
        .filter((p) => tab === "mine"
        ? p.authorId === user?.id
        : tab === "review"
            ? p.status === "pending"
            : p.status === "published")
        .filter((p) => (!topic || p.topic === topic) &&
        (!q ||
            normalize(p.title + " " + p.subject + " " + p.body).includes(normalize(q))) &&
        (!params.get("post") || p.id === params.get("post"))) || [];
    posts = posts.sort((a, b) => tab === "popular"
        ? (data?.reactions.filter((r) => r.postId === b.id).length || 0) -
            (data?.reactions.filter((r) => r.postId === a.id).length || 0) ||
            b.createdAt.localeCompare(a.createdAt)
        : b.createdAt.localeCompare(a.createdAt));
    return (React.createElement(React.Fragment, null,
        React.createElement("section", { className: "community-intro" },
            React.createElement("div", null,
                React.createElement("span", { className: "eyebrow" }, "THE FAN HUB COMMUNITY"),
                React.createElement("h1", null,
                    "Some stories stay.",
                    React.createElement("br", null),
                    React.createElement("em", null, "Let's talk about them.")),
                React.createElement("p", null,
                    "Your film reviews, anime theories and songs on repeat.",
                    React.createElement("br", null),
                    "A little more conversation. A little less noise.")),
            React.createElement("div", { className: "community-intro-note" },
                React.createElement("span", { className: "serif-mark" }, "Fh."),
                React.createElement("span", null,
                    "A SHARED SPACE",
                    React.createElement("br", null),
                    "FOR INDIVIDUAL VOICES"))),
        React.createElement("div", { className: "community-topicbar" },
            React.createElement("div", { className: "topic-chips", "aria-label": "Filter community topics" }, [
                ["", "All conversations"],
                ["anime", "Anime"],
                ["movies", "Movies"],
                ["music", "Music"],
            ].map(([id, name]) => (React.createElement("button", { key: id, "aria-pressed": topic === id, className: topic === id ? "selected" : "", onClick: () => setTopic(id) }, name)))),
            React.createElement(Button, { onClick: () => compose() },
                React.createElement(Icon, { name: "edit", size: 17 }),
                "Write a post")),
        React.createElement("div", { className: "social-layout" },
            React.createElement("section", { className: "social-feed", "aria-label": "Community feed" },
                React.createElement("div", { className: "feed-compose" },
                    React.createElement("span", { className: "social-avatar" }, user ? initials(user.name) : "You"),
                    React.createElement("button", { onClick: () => compose() },
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
                    ].map(([id, label]) => (React.createElement("button", { key: id, className: tab === id ? "active" : "", "aria-pressed": tab === id, onClick: () => setTab(id) },
                        label,
                        id === "review" &&
                            !!data?.posts.filter((p) => p.status === "pending")
                                .length && (React.createElement("span", { className: "count-pill" }, data.posts.filter((p) => p.status === "pending")
                            .length)))))),
                    React.createElement("label", { className: "community-search" },
                        React.createElement(Icon, { name: "search", size: 17 }),
                        React.createElement("input", { "aria-label": "Search community posts", placeholder: "Search conversations", value: q, onChange: (e) => setQ(e.target.value) }))),
                params.get("post") && (React.createElement(Link, { className: "text-link", to: "/community" },
                    "See all conversations",
                    React.createElement(Icon, { name: "arrow", size: 16 }))),
                error && (React.createElement("div", { role: "alert", className: "notice" },
                    error,
                    React.createElement(Button, { variant: "secondary", onClick: () => void load() }, "Retry"))),
                !data && !error && (React.createElement("div", { className: "feed-loading", role: "status" },
                    React.createElement("span", { className: "spinner" }),
                    "Loading conversations...")),
                tab === "reports" && user?.role === "admin" ? (React.createElement("div", { className: "report-queue" },
                    data?.reports.filter((r) => !r.resolved).length === 0 && (React.createElement(Empty, { title: "The report queue is clear.", description: "Member reports will appear here for a human review." })),
                    data?.reports
                        .filter((r) => !r.resolved)
                        .map((r) => (React.createElement("article", { className: "post-card", key: r.id },
                        React.createElement("span", { className: "eyebrow" }, r.commentId ? "COMMENT REPORT" : "POST REPORT"),
                        React.createElement("h2", null, data.posts.find((p) => p.id === r.postId)?.title ||
                            "Unavailable post"),
                        React.createElement("p", null, r.reason),
                        React.createElement("div", { className: "post-actions" },
                            React.createElement(Button, { disabled: busy, onClick: () => void run(() => gateway.resolveReport(user, r.id, true), "Reported content hidden.") }, "Hide content"),
                            React.createElement(Button, { variant: "secondary", disabled: busy, onClick: () => void run(() => gateway.resolveReport(user, r.id, false), "Report dismissed.") }, "Dismiss report"))))))) : (React.createElement(React.Fragment, null,
                    data && posts.length === 0 && (React.createElement(Empty, { icon: "chat", title: tab === "mine"
                            ? "Your voice belongs here."
                            : "No conversations here yet.", description: tab === "mine"
                            ? "Write your first review. It will appear here while a moderator reads it."
                            : "Try a different topic or start the conversation." },
                        React.createElement(Button, { onClick: () => compose() }, "Write a post"))),
                    posts.slice(0, limit).map((p) => (React.createElement(PostCard, { key: p.id, post: p, data: data, busy: busy, run: run, onEdit: () => compose(p), onReport: (commentId) => {
                            if (requireUser()) {
                                setReport({ postId: p.id, commentId });
                                setReason("");
                            }
                        }, requireUser: requireUser, autoComments: params.get("post") === p.id }))),
                    posts.length > limit && (React.createElement(Button, { variant: "secondary", className: "load-conversations", onClick: () => setLimit((n) => n + 6) },
                        "Read more conversations",
                        React.createElement(Icon, { name: "arrow", size: 17 })))))),
            React.createElement("aside", { className: "community-rail" },
                React.createElement("div", { className: "rail-note" },
                    React.createElement("span", { className: "eyebrow" }, "A LITTLE HOUSEKEEPING"),
                    React.createElement("h2", null,
                        "Different takes.",
                        React.createElement("br", null),
                        "Same respect."),
                    React.createElement("p", null, "Talk about the work, not the person. Mark spoilers. Give credit. Posts are reviewed before they reach the feed."),
                    React.createElement("div", { className: "rail-rule" },
                        React.createElement("span", null, "01"),
                        "Be thoughtful, not hurtful."),
                    React.createElement("div", { className: "rail-rule" },
                        React.createElement("span", null, "02"),
                        "Let people discover the ending."),
                    React.createElement("div", { className: "rail-rule" },
                        React.createElement("span", null, "03"),
                        "Share your own words."),
                    React.createElement("small", null, "Seeded conversations and names are illustrative. Counts reflect stored sample interactions, not a live audience.")),
                React.createElement("div", { className: "rail-lore" },
                    React.createElement("span", { className: "lore-monogram" },
                        "L",
                        React.createElement("span", null, "m")),
                    React.createElement("h3", null, "Need a little context?"),
                    React.createElement("p", null, "Ask Lore Master about a character, a story, or how to shape your review."),
                    React.createElement("button", { onClick: () => openLore("How do I write a thoughtful film review?") },
                        "Ask Lore Master",
                        React.createElement(Icon, { name: "arrow", size: 17 }))),
                React.createElement(Link, { to: "/giveaways", className: "rail-gift" },
                    React.createElement("div", null,
                        React.createElement(Icon, { name: "ticket", size: 23 }),
                        React.createElement("span", { className: "eyebrow" }, "QUARTERLY GIFTS / DEMO")),
                    React.createElement("h3", null, "Beyond the screen."),
                    React.createElement("p", null, "One free entry. A few possibilities."),
                    React.createElement("span", { className: "text-link" },
                        "Explore this quarter",
                        React.createElement(Icon, { name: "arrow", size: 16 }))),
                React.createElement("p", { className: "rail-runtime" }, serverMode
                    ? "Community data uses the Flask API. Other V1 catalog tools remain a separate browser demo."
                    : "Interactive browser prototype. Posts and reactions are stored on this device."))),
        React.createElement(PostEditor, { open: editor, onClose: () => setEditor(false), post: editing, onSave: async (p) => {
                const ok = await run(() => gateway.post(user, p, editing?.id, editing?.version), "Your post is awaiting moderation.");
                if (ok) {
                    setEditor(false);
                    setTab("mine");
                }
                return ok;
            } }),
        React.createElement(Modal, { open: !!report, onClose: () => setReport(null), title: "Report this content" },
            React.createElement("p", { className: "muted" }, "A moderator will review the reason. Disagreeing with an opinion is not, on its own, a violation."),
            React.createElement("label", { className: "field" },
                React.createElement("span", null, "Reason for reporting"),
                React.createElement("textarea", { rows: 4, maxLength: 500, minLength: 5, value: reason, onChange: (e) => setReason(e.target.value) })),
            React.createElement("div", { className: "modal-actions" },
                React.createElement(Button, { variant: "secondary", onClick: () => setReport(null) }, "Cancel"),
                React.createElement(Button, { busy: busy, disabled: reason.trim().length < 5, onClick: async () => {
                        if (report &&
                            (await run(() => gateway.report(user, report.postId, reason, report.commentId), "Report sent for review.")))
                            setReport(null);
                    } }, "Send report")))));
}
function PostCard({ post: p, data, busy, run, onEdit, onReport, requireUser, autoComments, }) {
    const { user, spoilerSafe, notify } = useApp();
    const [revealed, setRevealed] = useState(false), [expanded, setExpanded] = useState(false), [comments, setComments] = useState(autoComments), [draft, setDraft] = useState(""), [reply, setReply] = useState(null), [remove, setRemove] = useState(false), [reason, setReason] = useState("");
    const hidden = p.spoiler && spoilerSafe && !revealed;
    const reactions = data.reactions.filter((r) => r.postId === p.id), mine = reactions.find((r) => r.userId === user?.id)?.kind;
    const cs = data.comments.filter((c) => c.postId === p.id), roots = cs.filter((c) => !c.parentId);
    const owner = p.authorId === user?.id;
    const reaction = (kind) => {
        if (requireUser())
            void run(() => gateway.react(user, p.id, mine === kind ? null : kind), mine === kind ? "Reaction removed." : "Reaction saved.");
    };
    const renderComment = (c) => (React.createElement("article", { key: c.id, className: "social-comment " + (c.parentId ? "reply" : "") },
        React.createElement("span", { className: "social-avatar mini" }, initials(c.authorName)),
        React.createElement("div", null,
            React.createElement("strong", null, c.authorName),
            React.createElement("p", { className: "preserve-space" }, c.body),
            React.createElement("div", { className: "comment-meta" },
                React.createElement("span", null, time(c.createdAt)),
                !c.hidden && !c.parentId && (React.createElement("button", { onClick: () => {
                        if (requireUser()) {
                            setReply(c);
                            setDraft("");
                        }
                    } }, "Reply")),
                !c.hidden && (c.authorId === user?.id || user?.role === "admin") && (React.createElement("button", { disabled: busy, onClick: () => void run(() => gateway.removeComment(user, c.id), "Comment removed.") }, "Remove")),
                !c.hidden && React.createElement("button", { onClick: () => onReport(c.id) }, "Report")))));
    return (React.createElement("article", { className: "post-card topic-" + p.topic, "data-testid": "community-post" },
        React.createElement("div", { className: "post-author" },
            React.createElement("span", { className: "social-avatar" }, initials(p.authorName)),
            React.createElement("div", null,
                React.createElement("strong", null, p.authorName),
                React.createElement("span", null,
                    time(p.createdAt),
                    " ",
                    React.createElement("span", { "aria-hidden": "true" }, "/"),
                    " ",
                    topicNames[p.topic],
                    " ",
                    p.sample && "/ Sample post")),
            React.createElement("div", { className: "post-menu" },
                owner && (React.createElement("button", { className: "icon-btn", title: "Edit post", "aria-label": "Edit " + p.title, onClick: onEdit },
                    React.createElement(Icon, { name: "edit", size: 16 }))),
                (owner || user?.role === "admin") && p.status !== "hidden" && (React.createElement("button", { className: "icon-btn", "aria-label": "Remove " + p.title, onClick: () => setRemove(true) },
                    React.createElement(Icon, { name: "trash", size: 16 }))),
                p.status === "published" && (React.createElement("button", { className: "icon-btn", "aria-label": "Report " + p.title, onClick: () => onReport(null) },
                    React.createElement(Icon, { name: "flag", size: 16 }))))),
        p.status !== "published" && (React.createElement("div", { className: "post-status " + p.status },
            React.createElement(Icon, { name: p.status === "pending" ? "clock" : "info", size: 16 }),
            React.createElement("span", null,
                p.status === "pending"
                    ? "Awaiting moderation"
                    : p.status === "rejected"
                        ? "Changes requested"
                        : "Hidden",
                p.reason && " / " + p.reason))),
        React.createElement("div", { className: "post-body" },
            React.createElement("div", { className: "post-subject" },
                React.createElement("span", null, p.subject),
                p.rating > 0 && (React.createElement("span", { className: "review-rating" },
                    React.createElement(Icon, { name: "star", size: 14 }),
                    p.rating,
                    "/5")),
                p.spoiler && React.createElement("span", { className: "spoiler-label" }, "Spoiler")),
            React.createElement("h2", null, hidden ? "A review with spoilers. Your choice to open it." : p.title),
            hidden ? (React.createElement("div", { className: "post-spoiler" },
                React.createElement(Icon, { name: "shield", size: 22 }),
                React.createElement("p", null, "This review may reveal plot details."),
                React.createElement(Button, { variant: "secondary", onClick: () => setRevealed(true) }, "Reveal this review"))) : (React.createElement(React.Fragment, null,
                React.createElement("p", { className: "preserve-space " +
                        (!expanded && p.body.length > 450 ? "post-excerpt" : "") }, p.body),
                p.body.length > 450 && (React.createElement("button", { className: "small-link", onClick: () => setExpanded(!expanded) },
                    expanded ? "Read less" : "Read the full perspective",
                    React.createElement(Icon, { name: "chevron", size: 14 })))))),
        p.sample && p.id === "post-city" && !hidden && (React.createElement("div", { className: "post-cover" },
            React.createElement("img", { src: images[p.topic], alt: "Original Fan Hub illustration of an imagined city" }),
            React.createElement("div", null,
                React.createElement("span", null, "THE WORLDS WE RETURN TO"),
                React.createElement("strong", null, p.subject)))),
        p.status === "published" && (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "post-totals" },
                React.createElement("span", null,
                    reactions.length,
                    " ",
                    reactions.length === 1 ? "appreciation" : "appreciations"),
                React.createElement("button", { onClick: () => setComments(!comments) },
                    cs.filter((c) => !c.hidden).length,
                    " comments")),
            React.createElement("div", { className: "post-actions" },
                React.createElement("button", { disabled: busy, className: mine === "like" ? "active" : "", "aria-pressed": mine === "like", onClick: () => reaction("like") },
                    React.createElement(Icon, { name: "like", size: 19 }),
                    "Like"),
                React.createElement("button", { disabled: busy, className: mine === "heart" ? "active heart" : "", "aria-pressed": mine === "heart", onClick: () => reaction("heart") },
                    React.createElement(Icon, { name: "heart", size: 19, fill: mine === "heart" ? "currentColor" : "none" }),
                    "Love"),
                React.createElement("button", { onClick: () => setComments(!comments), "aria-expanded": comments },
                    React.createElement(Icon, { name: "chat", size: 19 }),
                    "Comment"),
                React.createElement("button", { "aria-label": "Copy post link", onClick: async () => {
                        try {
                            await navigator.clipboard.writeText(location.origin +
                                "/community?post=" +
                                encodeURIComponent(p.id));
                            notify("Post link copied.");
                        }
                        catch {
                            notify("Open the post link, then copy the address.", "info");
                            navigate("/community?post=" + p.id);
                        }
                    } },
                    React.createElement(Icon, { name: "share", size: 18 }),
                    React.createElement("span", { className: "share-label" }, "Share"))),
            comments && (React.createElement("div", { className: "post-comments" },
                roots.length ? (roots.map((c) => (React.createElement(React.Fragment, { key: c.id },
                    renderComment(c),
                    cs.filter((r) => r.parentId === c.id).map(renderComment))))) : (React.createElement("p", { className: "muted small" }, "Be the first to add a thoughtful reply.")),
                user ? (React.createElement("form", { className: "comment-form", onSubmit: async (e) => {
                        e.preventDefault();
                        if (await run(() => gateway.comment(user, p.id, draft, reply?.id || null), "Comment added.")) {
                            setDraft("");
                            setReply(null);
                        }
                    } },
                    reply && (React.createElement("div", { className: "reply-to" },
                        "Replying to ",
                        reply.authorName,
                        React.createElement("button", { type: "button", onClick: () => setReply(null) }, "Cancel"))),
                    React.createElement("label", { className: "sr-only", htmlFor: "comment-" + p.id }, "Your comment"),
                    React.createElement("textarea", { id: "comment-" + p.id, rows: 2, maxLength: 1000, required: true, value: draft, onChange: (e) => setDraft(e.target.value), placeholder: "Add to the conversation..." }),
                    React.createElement("div", null,
                        React.createElement("span", null,
                            draft.length,
                            "/1000"),
                        React.createElement(Button, { type: "submit", disabled: !draft.trim(), busy: busy },
                            "Post comment",
                            React.createElement(Icon, { name: "send", size: 15 }))))) : (React.createElement(Link, { to: "/login?next=" +
                        encodeURIComponent("/community?post=" + p.id), className: "comment-signin" },
                    "Sign in to join this conversation",
                    React.createElement(Icon, { name: "arrow", size: 16 }))))))),
        p.status === "pending" &&
            user?.role === "admin" &&
            p.authorId !== user.id && (React.createElement("div", { className: "post-moderation" },
            React.createElement("label", { className: "field" },
                React.createElement("span", null, "Review note (required for rejection)"),
                React.createElement("textarea", { rows: 2, maxLength: 500, value: reason, onChange: (e) => setReason(e.target.value) })),
            React.createElement(Button, { disabled: busy, onClick: () => void run(() => gateway.moderate(user, p.id, "published", p.version, reason), "Post published to the community.") }, "Approve and publish"),
            React.createElement(Button, { disabled: busy || reason.trim().length < 5, variant: "secondary", onClick: () => void run(() => gateway.moderate(user, p.id, "rejected", p.version, reason), "Post returned with feedback.") }, "Request changes"))),
        React.createElement(Confirm, { open: remove, onClose: () => setRemove(false), title: "Remove this post?", description: "The post will be hidden from the public feed. This does not delete other members' accounts.", onConfirm: async () => {
                await run(() => gateway.removePost(user, p.id), "Post hidden.");
            } })));
}
function PostEditor({ open, onClose, post, onSave, }) {
    const { user } = useApp();
    const [form, setForm] = useState(blank), [agree, setAgree] = useState(false), [preview, setPreview] = useState(false), [busy, setBusy] = useState(false), [storageWarning, setStorageWarning] = useState(false);
    const key = "fanhub.draft.v3." + (user?.id || "visitor");
    useEffect(() => {
        if (!open)
            return;
        setAgree(false);
        setPreview(false);
        if (post) {
            setForm({
                title: post.title,
                subject: post.subject,
                body: post.body,
                topic: post.topic,
                spoiler: post.spoiler,
                rating: post.rating,
            });
            return;
        }
        try {
            const saved = JSON.parse(localStorage.getItem(key) || "null");
            setForm(saved &&
                typeof saved.title === "string" &&
                typeof saved.body === "string"
                ? { ...blank, ...saved }
                : blank);
        }
        catch {
            setForm(blank);
        }
    }, [open, post?.id, key]);
    useEffect(() => {
        if (open && !post)
            try {
                localStorage.setItem(key, JSON.stringify(form));
            }
            catch {
                setStorageWarning(true);
            }
    }, [form, open, post, key]);
    function field(k, v) {
        setForm((f) => ({ ...f, [k]: v }));
    }
    return (React.createElement(Modal, { open: open, onClose: onClose, title: post ? "Revisit your perspective" : "A thought worth sharing", wide: true },
        React.createElement("div", { className: "editor-top" },
            React.createElement("span", null, "Your words. Your point of view."),
            React.createElement("button", { className: "small-link", onClick: () => setPreview(!preview) },
                preview ? "Back to writing" : "Preview post",
                React.createElement(Icon, { name: "arrow", size: 14 }))),
        preview ? (React.createElement("article", { className: "editor-preview" },
            React.createElement("span", { className: "eyebrow" },
                topicNames[form.topic],
                " / ",
                form.subject || "Your work or topic"),
            React.createElement("h2", null, form.title || "Your title goes here"),
            React.createElement("p", { className: "preserve-space" }, form.body || "Your perspective will appear here."))) : (React.createElement("form", { id: "post-editor", className: "stack-form", onSubmit: async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    if (await onSave(form)) {
                        try {
                            localStorage.removeItem(key);
                        }
                        catch {
                            setStorageWarning(true);
                        }
                    }
                }
                finally {
                    setBusy(false);
                }
            } },
            React.createElement("div", { className: "form-row" },
                React.createElement("label", { className: "field" },
                    React.createElement("span", null, "Category"),
                    React.createElement("select", { value: form.topic, onChange: (e) => field("topic", e.target.value) }, Object.entries(topicNames).map(([k, v]) => (React.createElement("option", { key: k, value: k }, v))))),
                React.createElement("label", { className: "field" },
                    React.createElement("span", null, "Film, anime, song or discussion topic"),
                    React.createElement("input", { value: form.subject, onChange: (e) => field("subject", e.target.value), required: true, maxLength: 100, placeholder: "What are we talking about?" }))),
            React.createElement("label", { className: "field" },
                React.createElement("span", null, "Give your perspective a title"),
                React.createElement("input", { value: form.title, onChange: (e) => field("title", e.target.value), required: true, minLength: 5, maxLength: 140, placeholder: "A small detail. A big idea." })),
            React.createElement("label", { className: "field" },
                React.createElement("span", null, "Your perspective"),
                React.createElement("textarea", { rows: 8, value: form.body, onChange: (e) => field("body", e.target.value), required: true, minLength: 20, maxLength: 8000, placeholder: "What worked for you? What did not? Tell us why." }),
                React.createElement("small", null,
                    form.body.length,
                    "/8000 characters / Plain text, no embedded HTML")),
            React.createElement("div", { className: "editor-options" },
                React.createElement("label", { className: "field" },
                    React.createElement("span", null, "Optional rating"),
                    React.createElement("select", { value: form.rating, onChange: (e) => field("rating", Number(e.target.value)) },
                        React.createElement("option", { value: 0 }, "No rating"),
                        [1, 2, 3, 4, 5].map((n) => (React.createElement("option", { key: n, value: n },
                            n,
                            " / 5"))))),
                React.createElement("label", { className: "check-row" },
                    React.createElement("input", { type: "checkbox", checked: form.spoiler, onChange: (e) => field("spoiler", e.target.checked) }),
                    "This post contains spoilers")),
            React.createElement("label", { className: "check-row" },
                React.createElement("input", { required: true, type: "checkbox", checked: agree, onChange: (e) => setAgree(e.target.checked) }),
                "These are my own words, and I agree to the community rules."))),
        React.createElement("div", { className: "editor-footer" },
            React.createElement("p", null, storageWarning
                ? "Draft storage unavailable. Keep a copy before closing."
                : post
                    ? "Editing sends the post back to moderation."
                    : "Draft saved on this device. A moderator reviews each new post."),
            React.createElement(Button, { form: "post-editor", type: "submit", busy: busy, disabled: !agree || preview },
                "Send for review",
                React.createElement(Icon, { name: "arrow", size: 16 })))));
}
