import React, { useState } from "react";
import { useApp } from "../lib/store.js";
import { useAuth } from "../features/auth/AuthProvider.js";
import { useAdminDashboard } from "../features/admin/hooks.js";
import { serverMode } from "../shared/http/client.js";
import { Link, useLocation } from "../lib/router.js";
import { Icon, PageHeading, Button, Field, Modal, Confirm, Notice, Empty, Skeleton, typeLabels, } from "../components/ui.js";
const sections = [
    ["overview", "grid", "Overview"],
    ["content", "book", "Content library"],
    ["categories", "globe", "Categories"],
    ["events", "calendar", "Events"],
    ["submissions", "edit", "Fan submissions"],
    ["users", "users", "People"],
    ["feedback", "mail", "Feedback"],
    ["knowledge", "sparkles", "Knowledge base"],
];
function EditorialForm({ editor, categories, onSave, onDone, }) {
    const [value, setValue] = useState(editor.value), [busy, setBusy] = useState(false);
    const patch = (v) => setValue((old) => ({ ...old, ...v }));
    const categorySelect = (v) => (React.createElement("select", { value: v, required: true, onChange: (e) => patch({ categoryId: e.target.value }) }, categories.map((c) => (React.createElement("option", { key: c.id, value: c.id }, c.name)))));
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            if (await onSave(editor.kind, value))
                onDone();
        }
        finally {
            setBusy(false);
        }
    };
    return (React.createElement("form", { className: "stack-form", onSubmit: submit },
        editor.kind === "content" &&
            (() => {
                const c = value;
                return (React.createElement(React.Fragment, null,
                    React.createElement(Field, { label: "Title" },
                        React.createElement("input", { value: c.title, required: true, minLength: 3, maxLength: 120, onChange: (e) => patch({ title: e.target.value }) })),
                    React.createElement("div", { className: "form-row" },
                        React.createElement(Field, { label: "Category" }, categorySelect(c.categoryId)),
                        React.createElement(Field, { label: "Content type" },
                            React.createElement("select", { value: c.type, onChange: (e) => patch({ type: e.target.value }) }, Object.entries(typeLabels).map(([k, v]) => (React.createElement("option", { value: k, key: k }, v)))))),
                    React.createElement("div", { className: "form-row" },
                        React.createElement(Field, { label: "Fandom" },
                            React.createElement("input", { value: c.fandom, required: true, maxLength: 80, onChange: (e) => patch({ fandom: e.target.value }) })),
                        React.createElement(Field, { label: "Genre" },
                            React.createElement("input", { value: c.genre, required: true, maxLength: 60, onChange: (e) => patch({ genre: e.target.value }) }))),
                    React.createElement(Field, { label: "Summary" },
                        React.createElement("textarea", { value: c.description, required: true, minLength: 12, maxLength: 400, rows: 3, onChange: (e) => patch({ description: e.target.value }) })),
                    React.createElement(Field, { label: "Story / biography / description", hint: "Plain text, ## headings and **bold**. Raw HTML is displayed as text." },
                        React.createElement("textarea", { value: c.body, maxLength: 30000, rows: 7, onChange: (e) => patch({ body: e.target.value }) })),
                    React.createElement("div", { className: "form-row" },
                        React.createElement(Field, { label: "Release year" },
                            React.createElement("input", { type: "number", min: 1900, max: 2100, required: true, value: c.year, onChange: (e) => patch({ year: Number(e.target.value) }) })),
                        React.createElement(Field, { label: "Status" },
                            React.createElement("select", { value: c.status, onChange: (e) => patch({ status: e.target.value }) },
                                React.createElement("option", { value: "draft" }, "Draft - private to admin"),
                                React.createElement("option", { value: "published" }, "Published")))),
                    React.createElement("div", { className: "form-row" },
                        React.createElement(Field, { label: "Cover artwork" },
                            React.createElement("select", { value: c.image, onChange: (e) => patch({ image: e.target.value }) }, [
                                "anime",
                                "gaming",
                                "movies",
                                "tv",
                                "kpop",
                                "comics",
                                "manga",
                                "cosplay",
                                "community",
                            ].map((s) => (React.createElement("option", { key: s, value: "/art/" + s + ".svg" }, s))))),
                        React.createElement(Field, { label: "Tags", hint: "Separate with commas." },
                            React.createElement("input", { value: c.tags.join(", "), onChange: (e) => patch({
                                    tags: e.target.value.split(",").map((t) => t.trim()),
                                }) }))),
                    (c.type === "video" || c.type === "audio") && (React.createElement(Field, { label: "Media URL", hint: "Local /media/ file or an HTTPS direct media URL. Provider embeds need a separate allowlisted renderer." },
                        React.createElement("input", { value: c.mediaUrl || "", onChange: (e) => patch({ mediaUrl: e.target.value }), placeholder: c.type === "video"
                                ? "/media/portal.webm"
                                : "/media/orbit.wav" }))),
                    React.createElement(Field, { label: "Fictional release date (optional)", hint: "Creates an entry in the cross-fandom release calendar." },
                        React.createElement("input", { type: "date", value: c.releaseDate || "", onChange: (e) => patch({ releaseDate: e.target.value || undefined }) })),
                    React.createElement("label", { className: "check-row" },
                        React.createElement("input", { type: "checkbox", checked: c.spoiler, onChange: (e) => patch({ spoiler: e.target.checked }) }),
                        "Flag story body for spoiler-safe reading")));
            })(),
        editor.kind === "category" &&
            (() => {
                const c = value;
                return (React.createElement(React.Fragment, null,
                    React.createElement(Field, { label: "Category name" },
                        React.createElement("input", { value: c.name, required: true, maxLength: 40, onChange: (e) => patch({ name: e.target.value }) })),
                    React.createElement(Field, { label: "Description" },
                        React.createElement("textarea", { rows: 3, value: c.description, required: true, onChange: (e) => patch({ description: e.target.value }) })),
                    React.createElement("div", { className: "form-row" },
                        React.createElement(Field, { label: "Icon" },
                            React.createElement("select", { value: c.icon, onChange: (e) => patch({ icon: e.target.value }) }, [
                                "sparkles",
                                "gamepad",
                                "film",
                                "tv",
                                "music",
                                "book",
                                "mask",
                                "globe",
                            ].map((i) => (React.createElement("option", { key: i }, i))))),
                        React.createElement(Field, { label: "Accent color" },
                            React.createElement("input", { type: "color", value: c.color, onChange: (e) => patch({ color: e.target.value }) })))));
            })(),
        editor.kind === "event" &&
            (() => {
                const e = value;
                return (React.createElement(React.Fragment, null,
                    React.createElement(Notice, null, "All events in this prototype are fictional. Do not represent them as real gatherings."),
                    React.createElement(Field, { label: "Event title" },
                        React.createElement("input", { required: true, maxLength: 120, value: e.title, onChange: (x) => patch({ title: x.target.value }) })),
                    React.createElement("div", { className: "form-row" },
                        React.createElement(Field, { label: "City" },
                            React.createElement("input", { required: true, value: e.city, onChange: (x) => patch({ city: x.target.value }) })),
                        React.createElement(Field, { label: "Category" }, categorySelect(e.categoryId))),
                    React.createElement(Field, { label: "Venue" },
                        React.createElement("input", { required: true, value: e.venue, onChange: (x) => patch({ venue: x.target.value }) })),
                    React.createElement("div", { className: "form-row" },
                        React.createElement(Field, { label: "Starts at", hint: "ISO format with explicit timezone, e.g. 2026-10-03T10:00:00+07:00." },
                            React.createElement("input", { required: true, value: e.startsAt, onChange: (x) => patch({ startsAt: x.target.value }) })),
                        React.createElement(Field, { label: "Ends at" },
                            React.createElement("input", { required: true, value: e.endsAt, onChange: (x) => patch({ endsAt: x.target.value }) }))),
                    React.createElement("div", { className: "form-row" },
                        React.createElement(Field, { label: "Latitude" },
                            React.createElement("input", { type: "number", step: "any", required: true, min: -90, max: 90, value: e.lat, onChange: (x) => patch({ lat: Number(x.target.value) }) })),
                        React.createElement(Field, { label: "Longitude" },
                            React.createElement("input", { type: "number", step: "any", required: true, min: -180, max: 180, value: e.lng, onChange: (x) => patch({ lng: Number(x.target.value) }) }))),
                    React.createElement(Field, { label: "Description" },
                        React.createElement("textarea", { required: true, rows: 5, value: e.description, onChange: (x) => patch({ description: x.target.value }) })),
                    React.createElement(Field, { label: "External organizer ticket URL (optional)", hint: "HTTPS only. This is an outbound link, not a purchase or checkout on Fan Hub Plus." },
                        React.createElement("input", { type: "url", pattern: "https://.*", value: e.ticketUrl || "", onChange: (x) => patch({ ticketUrl: x.target.value }) }))));
            })(),
        editor.kind === "faq" &&
            (() => {
                const f = value;
                return (React.createElement(React.Fragment, null,
                    React.createElement(Field, { label: "Question" },
                        React.createElement("input", { minLength: 5, required: true, value: f.question, onChange: (e) => patch({ question: e.target.value }) })),
                    React.createElement(Field, { label: "Approved answer" },
                        React.createElement("textarea", { minLength: 10, rows: 7, required: true, value: f.answer, onChange: (e) => patch({ answer: e.target.value }) })),
                    React.createElement(Notice, null, "The local assistant reads these entries. Vector indexing and LLM generation are not connected.")));
            })(),
        React.createElement("div", { className: "modal-actions" },
            React.createElement(Button, { variant: "secondary", onClick: onDone }, "Cancel"),
            React.createElement(Button, { type: "submit", busy: busy },
                "Save changes ",
                React.createElement(Icon, { name: "check", size: 16 })))));
}
export default function Admin() {
    const { notify } = useApp();
    const { user } = useAuth();
    const admin = useAdminDashboard(user?.role === "admin");
    const { params } = useLocation();
    const section = sections.some((s) => s[0] === params.get("tab"))
        ? params.get("tab")
        : "overview";
    const [q, setQ] = useState(""), [editor, setEditor] = useState(null), [deletion, setDeletion] = useState(null), [review, setReview] = useState(null), [reason, setReason] = useState(""), [busy, setBusy] = useState(false);
    if (!user)
        return null;
    const pageHeader = (React.createElement(React.Fragment, null,
        React.createElement(PageHeading, { eyebrow: "THE EDITORIAL WORKSPACE", title: "Bring the universe to life.", description: "Manage discoveries, review community stories and keep the experience welcoming." },
            React.createElement(Link, { to: "/", className: "btn btn-secondary" },
                "View public site ",
                React.createElement(Icon, { name: "external", size: 16 }))),
        React.createElement(Notice, null, serverMode
            ? "Connected administrator workspace. The backend is the authorization and business-data boundary."
            : "Local administrator simulator. Permissions here are UX behavior only; deployed authorization must remain server-side.")));
    if (admin.loading && !admin.data) {
        return (React.createElement(React.Fragment, null,
            pageHeader,
            React.createElement("div", { className: "admin-content" },
                React.createElement(Skeleton, { cards: 4 }))));
    }
    if (!admin.data) {
        return (React.createElement(React.Fragment, null,
            pageHeader,
            React.createElement(Notice, { kind: "error" },
                React.createElement("p", null, admin.error || "The administrator workspace could not be loaded."),
                React.createElement(Button, { variant: "secondary", onClick: () => void admin.reload() }, "Retry"))));
    }
    const data = admin.data;
    const pending = data.submissions.filter((s) => s.status === "pending"), matches = (text) => text.toLowerCase().includes(q.toLowerCase());
    const runAction = async (operation, successMessage) => {
        try {
            await operation();
            notify(successMessage);
            return true;
        }
        catch (error) {
            notify(error instanceof Error ? error.message : "Administrator action failed.", "error");
            return false;
        }
    };
    const saveEditorial = async (kind, value) => {
        if (kind === "content")
            return runAction(() => admin.saveContent(value), "Content saved.");
        if (kind === "category")
            return runAction(() => admin.saveCategory(value), "Category saved.");
        if (kind === "event")
            return runAction(() => admin.saveEvent(value), "Event saved.");
        return runAction(() => admin.saveKnowledge(value), "Knowledge entry saved.");
    };
    const newContent = () => ({
        id: "",
        title: "",
        description: "",
        body: "",
        categoryId: data.categories[0]?.id || "",
        fandom: "",
        type: "article",
        genre: "Adventure",
        year: 2026,
        publishedAt: new Date().toISOString(),
        popularity: 0,
        rating: 0,
        duration: "New discovery",
        tags: [],
        status: "draft",
        author: user.name,
        spoiler: false,
        image: "/art/community.svg",
        sourceLabel: "Admin-created demo content",
    });
    const add = () => {
        if (section === "content")
            setEditor({ kind: "content", value: newContent() });
        if (section === "categories")
            setEditor({
                kind: "category",
                value: {
                    id: "",
                    name: "",
                    description: "",
                    icon: "globe",
                    color: "#8bded1",
                },
            });
        if (section === "events")
            setEditor({
                kind: "event",
                value: {
                    id: "",
                    title: "",
                    city: "Ho Chi Minh City",
                    venue: "",
                    lat: 10.7769,
                    lng: 106.7009,
                    startsAt: "2026-10-03T10:00:00+07:00",
                    endsAt: "2026-10-03T17:00:00+07:00",
                    categoryId: data.categories[0]?.id || "",
                    description: "",
                    image: "/art/community.svg",
                },
            });
        if (section === "knowledge")
            setEditor({ kind: "faq", value: { id: "", question: "", answer: "" } });
    };
    const remove = (title, run) => setDeletion({ title, run });
    const moderate = async (decision) => {
        if (!review)
            return;
        setBusy(true);
        const ok = await runAction(() => admin.moderateSubmission(review.id, decision, reason), decision === "approved"
            ? "Story published to Explore."
            : "Story returned with editorial feedback.");
        if (ok) {
            setReview(null);
            setReason("");
        }
        setBusy(false);
    };
    return (React.createElement(React.Fragment, null,
        pageHeader,
        admin.error && (React.createElement(Notice, { kind: "error" }, admin.error)),
        React.createElement("div", { className: "admin-layout" },
            React.createElement("nav", { className: "admin-nav", "aria-label": "Admin sections" }, sections.map(([id, icon, label]) => (React.createElement(Link, { key: id, className: section === id ? "active" : "", to: "/admin?tab=" + id, onClick: () => setQ("") },
                React.createElement(Icon, { name: icon, size: 18 }),
                React.createElement("span", null, label),
                id === "submissions" && pending.length > 0 && (React.createElement("span", { className: "count-badge" }, pending.length)))))),
            React.createElement("div", { className: "admin-content" }, section === "overview" ? (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "stats-grid" },
                    React.createElement("div", { className: "stat-card" },
                        React.createElement(Icon, { name: "book" }),
                        React.createElement("strong", null, data.contents.filter((c) => c.status === "published").length),
                        React.createElement("span", null, "Published discoveries")),
                    React.createElement("div", { className: "stat-card" },
                        React.createElement(Icon, { name: "users" }),
                        React.createElement("strong", null, data.users.filter((u) => !u.suspended).length),
                        React.createElement("span", null, "Enabled accounts")),
                    React.createElement("div", { className: "stat-card" },
                        React.createElement(Icon, { name: "edit" }),
                        React.createElement("strong", null, pending.length),
                        React.createElement("span", null, "Awaiting review")),
                    React.createElement("div", { className: "stat-card" },
                        React.createElement(Icon, { name: "mail" }),
                        React.createElement("strong", null, data.feedback.filter((f) => f.status === "open").length),
                        React.createElement("span", null, "Open feedback"))),
                React.createElement("section", { className: "panel" },
                    React.createElement("h2", null, "Content mix"),
                    React.createElement("p", { className: "muted" }, "Calculated from the current administrator content library. These bars show inventory, not live user popularity."),
                    React.createElement("div", { className: "analytics-bars" }, data.categories.map((cat) => {
                        const count = data.contents.filter((c) => c.categoryId === cat.id).length;
                        return (React.createElement("div", { key: cat.id },
                            React.createElement("span", null, cat.name),
                            React.createElement("div", { className: "bar-track" },
                                React.createElement("div", { style: {
                                        width: (count /
                                            Math.max(1, ...data.categories.map((c) => data.contents.filter((x) => x.categoryId === c.id).length))) *
                                            100 +
                                            "%",
                                        background: cat.color,
                                    } })),
                            React.createElement("strong", null, count)));
                    }))),
                React.createElement("div", { className: "two-column" },
                    React.createElement("section", { className: "panel" },
                        React.createElement("h2", null, "Review queues"),
                        React.createElement("p", null, "Review catalog story submissions here, and moderate member conversations, videos and soundtracks in Community."),
                        React.createElement(Link, { className: "text-link", to: "/admin?tab=submissions" },
                            "Open story submissions ",
                            React.createElement(Icon, { name: "arrow", size: 15 })),
                        React.createElement("br", null),
                        React.createElement(Link, { className: "text-link", to: "/community?view=review" },
                            "Open Community moderation ",
                            React.createElement(Icon, { name: "arrow", size: 15 }))),
                    React.createElement("section", { className: "panel" },
                        React.createElement("h2", null, "Instrumentation boundary"),
                        React.createElement("p", { className: "muted" }, "Active-user windows, aggregated view counts and chatbot volume are outside the current admin workspace contract and remain backend gaps."))))) : (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "admin-toolbar" },
                    React.createElement("h2", null, sections.find((s) => s[0] === section)?.[2]),
                    React.createElement("label", { className: "search-input" },
                        React.createElement(Icon, { name: "search", size: 16 }),
                        React.createElement("input", { "aria-label": "Search admin records", value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search records..." })),
                    ["content", "categories", "events", "knowledge"].includes(section) && (React.createElement(Button, { onClick: add },
                        React.createElement(Icon, { name: "plus", size: 16 }),
                        "Add new"))),
                section === "content" && (React.createElement("div", { className: "table-wrap" },
                    React.createElement("table", null,
                        React.createElement("thead", null,
                            React.createElement("tr", null,
                                React.createElement("th", { scope: "col" }, "Discovery"),
                                React.createElement("th", { scope: "col" }, "Type / category"),
                                React.createElement("th", { scope: "col" }, "Status"),
                                React.createElement("th", { scope: "col" }, "Actions"))),
                        React.createElement("tbody", null, data.contents
                            .filter((c) => matches(c.title + " " + c.fandom))
                            .map((c) => (React.createElement("tr", { key: c.id },
                            React.createElement("td", null,
                                React.createElement("div", { className: "table-item" },
                                    React.createElement("img", { src: c.image, alt: "" }),
                                    React.createElement("div", null,
                                        React.createElement(Link, { to: "/content/" + c.id }, c.title),
                                        React.createElement("small", null, c.fandom)))),
                            React.createElement("td", null,
                                typeLabels[c.type],
                                React.createElement("small", null, data.categories.find((x) => x.id === c.categoryId)?.name)),
                            React.createElement("td", null,
                                React.createElement("span", { className: "status status-" + c.status }, c.status)),
                            React.createElement("td", null,
                                React.createElement("div", { className: "row-actions" },
                                    React.createElement("button", { className: "icon-btn", "aria-label": "Edit " + c.title, onClick: () => setEditor({
                                            kind: "content",
                                            value: { ...c },
                                        }) },
                                        React.createElement(Icon, { name: "edit", size: 17 })),
                                    React.createElement("button", { className: "icon-btn danger-text", "aria-label": "Delete " + c.title, onClick: () => remove(c.title, () => runAction(() => admin.deleteContent(c.id), "Content removed.")) },
                                        React.createElement(Icon, { name: "trash", size: 17 }))))))))),
                    !data.contents.some((c) => matches(c.title + " " + c.fandom)) && (React.createElement(Empty, { title: "No matching content", description: "Try another search or create a discovery." })))),
                section === "categories" && (React.createElement("div", { className: "admin-card-grid" }, data.categories
                    .filter((c) => matches(c.name))
                    .map((c) => (React.createElement("article", { className: "panel", key: c.id },
                    React.createElement("div", { className: "split-row" },
                        React.createElement(Icon, { name: c.icon, size: 26 }),
                        React.createElement("span", { className: "tag" },
                            data.contents.filter((x) => x.categoryId === c.id)
                                .length,
                            " ",
                            "items")),
                    React.createElement("h3", null, c.name),
                    React.createElement("p", { className: "muted" }, c.description),
                    React.createElement("div", { className: "row-actions" },
                        React.createElement(Button, { variant: "secondary", onClick: () => setEditor({ kind: "category", value: { ...c } }) }, "Edit"),
                        React.createElement(Button, { variant: "ghost", onClick: () => remove(c.name, () => runAction(() => admin.deleteCategory(c.id), "Unused category removed.")) }, "Delete"))))))),
                section === "events" && (React.createElement("div", { className: "admin-card-grid" }, data.events
                    .filter((e) => matches(e.title + " " + e.city))
                    .map((e) => (React.createElement("article", { className: "panel", key: e.id },
                    React.createElement("span", { className: "eyebrow" }, "FICTIONAL EVENT"),
                    React.createElement("h3", null, e.title),
                    React.createElement("p", null, e.city),
                    React.createElement("p", { className: "muted" }, e.startsAt),
                    React.createElement("div", { className: "row-actions" },
                        React.createElement(Button, { variant: "secondary", onClick: () => setEditor({ kind: "event", value: { ...e } }) }, "Edit"),
                        React.createElement(Button, { variant: "ghost", onClick: () => remove(e.title, () => runAction(() => admin.deleteEvent(e.id), "Event removed.")) }, "Delete"),
                        React.createElement(Link, { to: "/events/" + e.id, className: "small-link" },
                            "View ",
                            React.createElement(Icon, { name: "external", size: 13 })))))))),
                section === "submissions" && (React.createElement("div", { className: "stack" }, data.submissions.filter((s) => matches(s.title)).length ? (data.submissions
                    .filter((s) => matches(s.title))
                    .map((s) => (React.createElement("article", { className: "panel", key: s.id },
                    React.createElement("div", { className: "split-row" },
                        React.createElement("span", { className: "status status-" + s.status }, s.status),
                        React.createElement("small", { className: "muted" }, new Date(s.createdAt).toLocaleString())),
                    React.createElement("h3", null, s.title),
                    React.createElement("p", { className: "muted" },
                        "By ",
                        data.users.find((u) => u.id === s.userId)?.name,
                        " /",
                        " ",
                        s.fandom),
                    React.createElement("p", { className: "clamp-3" }, s.body),
                    s.status === "pending" ? (React.createElement(Button, { variant: "secondary", onClick: () => {
                            setReview(s);
                            setReason("");
                        } },
                        "Review story ",
                        React.createElement(Icon, { name: "arrow", size: 15 }))) : (s.reason && (React.createElement("p", { className: "review-reason" }, s.reason))))))) : (React.createElement(Empty, { icon: "edit", title: "No stories to review", description: "Fan submissions will appear here after a member sends a story." })))),
                section === "users" && (React.createElement("div", { className: "table-wrap" },
                    React.createElement("table", null,
                        React.createElement("thead", null,
                            React.createElement("tr", null,
                                React.createElement("th", { scope: "col" }, "Person"),
                                React.createElement("th", { scope: "col" }, "Role"),
                                React.createElement("th", { scope: "col" }, "Status"),
                                React.createElement("th", { scope: "col" }, "Actions"))),
                        React.createElement("tbody", null, data.users
                            .filter((u) => matches(u.name + " " + u.email))
                            .map((u) => (React.createElement("tr", { key: u.id },
                            React.createElement("td", null,
                                React.createElement("strong", null, u.name),
                                React.createElement("small", null, u.email)),
                            React.createElement("td", null, u.role),
                            React.createElement("td", null,
                                React.createElement("span", { className: "status status-" +
                                        (u.suspended ? "rejected" : "published") }, u.suspended ? "Suspended" : "Enabled")),
                            React.createElement("td", null,
                                React.createElement(Button, { variant: "secondary", disabled: u.id === user.id, onClick: () => remove((u.suspended ? "Enable " : "Suspend ") +
                                        u.name, () => runAction(() => admin.setUserStatus(u.id, !u.suspended), "Account status updated.")) }, u.suspended ? "Enable" : "Suspend"))))))))),
                section === "feedback" && (React.createElement("div", { className: "stack" }, data.feedback.filter((f) => matches(f.message)).length ? (data.feedback
                    .filter((f) => matches(f.message))
                    .map((f) => (React.createElement("article", { className: "panel", key: f.id },
                    React.createElement("div", { className: "split-row" },
                        React.createElement("span", { className: "tag" }, f.type),
                        React.createElement("span", { className: "status status-" + f.status }, f.status)),
                    React.createElement("p", { className: "preserve-space" }, f.message),
                    React.createElement("small", { className: "muted" },
                        new Date(f.createdAt).toLocaleString(),
                        " /",
                        " ",
                        data.users.find((u) => u.id === f.userId)?.name ||
                            "Visitor"),
                    f.status === "open" && (React.createElement("div", { className: "panel-actions" },
                        React.createElement(Button, { variant: "secondary", onClick: () => void runAction(() => admin.resolveFeedback(f.id), "Feedback marked as resolved.") },
                            "Mark resolved ",
                            React.createElement(Icon, { name: "check", size: 15 })))))))) : (React.createElement(Empty, { icon: "mail", title: "No feedback yet", description: "Bug reports, questions and ideas from the feedback form appear here." })))),
                section === "knowledge" && (React.createElement("div", { className: "stack" }, data.faqs
                    .filter((f) => matches(f.question + " " + f.answer))
                    .map((f) => (React.createElement("article", { className: "panel", key: f.id },
                    React.createElement("h3", null, f.question),
                    React.createElement("p", { className: "muted" }, f.answer),
                    React.createElement("div", { className: "row-actions" },
                        React.createElement(Button, { variant: "secondary", onClick: () => setEditor({ kind: "faq", value: { ...f } }) }, "Edit"),
                        React.createElement(Button, { variant: "ghost", onClick: () => remove(f.question, () => runAction(() => admin.deleteKnowledge(f.id), "FAQ removed.")) }, "Delete"))))))))))),
        React.createElement(Modal, { open: !!editor, onClose: () => setEditor(null), title: editor?.value.id
                ? "Edit " + editor.kind
                : "Create " + (editor?.kind || "entry"), wide: true }, editor && (React.createElement(EditorialForm, { editor: editor, categories: data.categories, onSave: saveEditorial, onDone: () => setEditor(null) }))),
        React.createElement(Confirm, { open: !!deletion, onClose: () => setDeletion(null), title: "Confirm this change", description: `You are about to change or remove: ${deletion?.title || ""}. This affects the administrator workspace. Destructive deletions may not be reversible.`, onConfirm: async () => {
                await deletion?.run();
            } }),
        React.createElement(Modal, { open: !!review, onClose: () => setReview(null), title: "Review community story", wide: true }, review && (React.createElement(React.Fragment, null,
            React.createElement("span", { className: "eyebrow" }, review.fandom),
            React.createElement("h3", null, review.title),
            React.createElement("div", { className: "review-body preserve-space" }, review.body),
            React.createElement(Field, { label: "Editorial feedback", hint: "At least 5 characters are required when rejecting a story." },
                React.createElement("textarea", { rows: 3, maxLength: 2000, value: reason, onChange: (e) => setReason(e.target.value) })),
            React.createElement("div", { className: "modal-actions" },
                React.createElement(Button, { variant: "danger", busy: busy, disabled: reason.trim().length < 5, onClick: () => void moderate("rejected") }, "Reject with feedback"),
                React.createElement(Button, { busy: busy, onClick: () => void moderate("approved") },
                    "Approve and publish ",
                    React.createElement(Icon, { name: "check", size: 16 }))))))));
}
