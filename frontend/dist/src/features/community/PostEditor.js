import React, { useEffect, useMemo, useState } from "react";
import { Button, Icon, Modal } from "../../components/ui.js";
import { useAuth } from "../auth/AuthProvider.js";
import { formatNames, topicNames, topicOptions } from "./constants.js";
const kindNames = {
    discussion: "Discussion",
    review: "Review",
    media: "Media Share",
};
const blank = {
    title: "",
    subject: "",
    body: "",
    topic: "anime",
    format: "post",
    mediaUrl: "",
    spoiler: false,
    rating: 0,
};
function kindForPost(post) {
    if (!post)
        return "discussion";
    if (post.rating > 0)
        return "review";
    if (post.format !== "post")
        return "media";
    return "discussion";
}
export function PostEditor({ open, onClose, post, onSave, }) {
    const { user } = useAuth();
    const [form, setForm] = useState(blank);
    const [kind, setKind] = useState("discussion");
    const [agree, setAgree] = useState(false);
    const [preview, setPreview] = useState(false);
    const [busy, setBusy] = useState(false);
    const [storageWarning, setStorageWarning] = useState(false);
    const key = "fanhub.draft.v3." + (user?.id || "visitor");
    useEffect(() => {
        if (!open)
            return;
        setAgree(false);
        setPreview(false);
        setStorageWarning(false);
        if (post) {
            setKind(kindForPost(post));
            setForm({
                title: post.title,
                subject: post.subject,
                body: post.body,
                topic: post.topic,
                format: post.format,
                mediaUrl: post.mediaUrl,
                spoiler: post.spoiler,
                rating: post.rating,
            });
            return;
        }
        try {
            const saved = JSON.parse(localStorage.getItem(key) || "null");
            const next = saved &&
                typeof saved.title === "string" &&
                typeof saved.body === "string"
                ? {
                    ...blank,
                    ...saved,
                    topic: saved.topic === "music" ? "soundtrack" : saved.topic,
                }
                : blank;
            setForm(next);
            setKind(next.rating > 0
                ? "review"
                : next.format !== "post"
                    ? "media"
                    : "discussion");
        }
        catch {
            setForm(blank);
            setKind("discussion");
        }
    }, [open, post?.id, key]);
    useEffect(() => {
        if (!open || post)
            return;
        try {
            localStorage.setItem(key, JSON.stringify(form));
        }
        catch {
            setStorageWarning(true);
        }
    }, [form, open, post, key]);
    function field(name, value) {
        setForm((current) => ({ ...current, [name]: value }));
    }
    function changeKind(next) {
        setKind(next);
        setForm((current) => {
            if (next === "discussion") {
                return {
                    ...current,
                    format: "post",
                    mediaUrl: "",
                    rating: 0,
                };
            }
            if (next === "review") {
                return {
                    ...current,
                    format: "post",
                    mediaUrl: "",
                };
            }
            return {
                ...current,
                format: current.format === "post" ? "video" : current.format,
                rating: 0,
            };
        });
    }
    const ratingAllowed = useMemo(() => {
        const words = new Set(form.body
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((word) => word.toLowerCase()));
        return (form.body.trim().length >= 20 &&
            words.size >= 4 &&
            !/(.)\1{9,}/.test(form.body));
    }, [form.body]);
    const reviewRatingMissing = kind === "review" && (!ratingAllowed || form.rating < 1 || form.rating > 5);
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
                kindNames[kind],
                " / ",
                form.subject || "Your work or topic"),
            React.createElement("h2", null, form.title || "Your title goes here"),
            kind === "review" && form.rating > 0 && (React.createElement("p", { className: "review-rating" },
                React.createElement(Icon, { name: "star", size: 14 }),
                form.rating,
                "/5")),
            React.createElement("p", { className: "preserve-space" }, form.body || "Your perspective will appear here."),
            kind === "media" && form.mediaUrl && form.format === "video" && (React.createElement("video", { className: "editor-preview-media", controls: true, preload: "metadata", src: form.mediaUrl })),
            kind === "media" &&
                form.mediaUrl &&
                form.format === "soundtrack" && (React.createElement("audio", { className: "editor-preview-media", controls: true, preload: "metadata", src: form.mediaUrl })))) : (React.createElement("form", { id: "post-editor", className: "stack-form", onSubmit: async (event) => {
                event.preventDefault();
                if (reviewRatingMissing)
                    return;
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
                    React.createElement("select", { value: form.topic, onChange: (event) => field("topic", event.target.value) }, topicOptions.map(([id, label]) => (React.createElement("option", { key: id, value: id }, label))))),
                React.createElement("label", { className: "field" },
                    React.createElement("span", null, "Post kind"),
                    React.createElement("select", { value: kind, onChange: (event) => changeKind(event.target.value) },
                        React.createElement("option", { value: "discussion" }, "Discussion"),
                        React.createElement("option", { value: "review" }, "Review"),
                        React.createElement("option", { value: "media" }, "Media Share")))),
            kind === "media" && (React.createElement("div", { className: "form-row" },
                React.createElement("label", { className: "field" },
                    React.createElement("span", null, "Media type"),
                    React.createElement("select", { value: form.format, onChange: (event) => field("format", event.target.value) },
                        React.createElement("option", { value: "video" }, "Video"),
                        React.createElement("option", { value: "soundtrack" }, "Soundtrack / audio"))),
                React.createElement("label", { className: "field" },
                    React.createElement("span", null, form.format === "video" ? "Video URL" : "Soundtrack URL"),
                    React.createElement("input", { type: "text", value: form.mediaUrl, onChange: (event) => field("mediaUrl", event.target.value), required: true, maxLength: 500, placeholder: form.format === "video"
                            ? "/media/portal.webm"
                            : "/media/orbit.wav" }),
                    React.createElement("small", null, "Use a direct HTTPS media URL or a local /media/ path. Embedded HTML is not accepted.")))),
            React.createElement("label", { className: "field" },
                React.createElement("span", null, "Title, work, character or discussion topic"),
                React.createElement("input", { value: form.subject, onChange: (event) => field("subject", event.target.value), required: true, maxLength: 100, placeholder: "What are we talking about?" })),
            React.createElement("label", { className: "field" },
                React.createElement("span", null, "Give your perspective a title"),
                React.createElement("input", { value: form.title, onChange: (event) => field("title", event.target.value), required: true, minLength: 5, maxLength: 140, placeholder: "A small detail. A big idea." })),
            React.createElement("label", { className: "field" },
                React.createElement("span", null, "Your perspective"),
                React.createElement("textarea", { rows: 8, value: form.body, onChange: (event) => field("body", event.target.value), required: true, minLength: 20, maxLength: 8000, placeholder: "What worked for you? What did not? Tell us why." }),
                React.createElement("small", null,
                    form.body.length,
                    "/8000 characters / Plain text, no embedded HTML")),
            React.createElement("div", { className: "editor-options" },
                kind === "review" && (React.createElement("label", { className: "field" },
                    React.createElement("span", null, "Star rating (required)"),
                    React.createElement("select", { "aria-label": "Star rating", value: form.rating, required: true, disabled: !ratingAllowed, onChange: (event) => field("rating", Number(event.target.value)) },
                        React.createElement("option", { value: 0 }, "Choose a rating"),
                        [1, 2, 3, 4, 5].map((rating) => (React.createElement("option", { key: rating, value: rating },
                            rating,
                            " / 5")))),
                    !ratingAllowed && (React.createElement("small", null, "Write a real perspective of at least 20 characters before choosing a rating.")))),
                React.createElement("label", { className: "check-row" },
                    React.createElement("input", { type: "checkbox", checked: form.spoiler, onChange: (event) => field("spoiler", event.target.checked) }),
                    "This post contains spoilers")),
            React.createElement("label", { className: "check-row" },
                React.createElement("input", { required: true, type: "checkbox", checked: agree, onChange: (event) => setAgree(event.target.checked) }),
                "These are my own words, I agree to the community rules, and this post contains no sensitive, explicit or non-consensual imagery."))),
        React.createElement("div", { className: "editor-footer" },
            React.createElement("p", null, storageWarning
                ? "Draft storage unavailable. Keep a copy before closing."
                : post
                    ? user?.role === "admin"
                        ? "Administrator edits are published immediately."
                        : "Editing sends the post back to moderation."
                    : user?.role === "admin"
                        ? "Administrator posts are published immediately."
                        : "Draft saved on this device. A moderator reviews each new post."),
            React.createElement(Button, { form: "post-editor", type: "submit", busy: busy, disabled: !agree || preview || reviewRatingMissing },
                user?.role === "admin"
                    ? post
                        ? "Publish changes"
                        : "Publish now"
                    : "Send for review",
                React.createElement(Icon, { name: "arrow", size: 16 })))));
}
export const postKindLabel = kindNames;
export const postFormatLabel = formatNames;
