import React, { useState } from "react";
import { useApp } from "../lib/store.js";
import { Link, navigate, currentPath } from "../lib/router.js";
import { repository } from "../services/repository.js";
import { recommend } from "../domain/logic.js";
import { PageHeading, Crumbs, Icon, Button, ContentCard, Empty, Field, Notice, Modal, Confirm, } from "../components/ui.js";
const nav = [
    ["/dashboard", "Overview"],
    ["/collection", "My collection"],
    ["/profile", "My profile"],
    ["/submit", "My stories"],
];
function AccountNav() {
    return (React.createElement("nav", { className: "account-nav", "aria-label": "Your workspace" }, nav.map(([to, label]) => (React.createElement(Link, { key: to, to: to, className: currentPath() === to ? "active" : "" }, label)))));
}
function Dashboard() {
    const { db, user } = useApp();
    if (!db || !user)
        return null;
    const saved = db.bookmarks.filter((b) => b.userId === user.id), activity = db.activity.filter((a) => a.userId === user.id).slice(0, 4), contributions = db.submissions.filter((s) => s.userId === user.id), worlds = new Set(db.activity
        .filter((a) => a.userId === user.id)
        .map((a) => db.contents.find((c) => c.id === a.contentId)?.categoryId)
        .filter(Boolean));
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHeading, { eyebrow: "YOUR PERSONAL UNIVERSE", title: `Good to see you, ${user.name.split(" ")[0]}.`, description: "A home for everything that sparks your curiosity." },
            React.createElement(Link, { className: "btn btn-secondary", to: "/profile" },
                React.createElement(Icon, { name: "edit", size: 16 }),
                "Personalize your space")),
        React.createElement(AccountNav, null),
        React.createElement("div", { className: "stats-grid" },
            React.createElement("div", { className: "stat-card" },
                React.createElement(Icon, { name: "bookmark" }),
                React.createElement("strong", null, saved.length),
                React.createElement("span", null, "Saved discoveries")),
            React.createElement("div", { className: "stat-card" },
                React.createElement(Icon, { name: "globe" }),
                React.createElement("strong", null,
                    worlds.size,
                    React.createElement("small", null,
                        " / ",
                        db.categories.length)),
                React.createElement("span", null, "Worlds explored while signed in")),
            React.createElement("div", { className: "stat-card" },
                React.createElement(Icon, { name: "edit" }),
                React.createElement("strong", null, contributions.length),
                React.createElement("span", null, "Stories submitted")),
            React.createElement("div", { className: "stat-card" },
                React.createElement(Icon, { name: "trophy" }),
                React.createElement("strong", null, contributions.filter((s) => s.status === "approved").length > 0
                    ? "Contributor"
                    : "Explorer"),
                React.createElement("span", null, contributions.some((s) => s.status === "approved")
                    ? "A story of yours has been approved."
                    : "Your discovery passport starts here."))),
        React.createElement("section", { className: "panel passport" },
            React.createElement("div", null,
                React.createElement("span", { className: "eyebrow" }, "YOUR DISCOVERY PASSPORT"),
                React.createElement("h2", null, "There is always another world."),
                React.createElement("p", { className: "muted" }, "Visit a detail page while signed in to explore a category. These are local demo achievements, not event attendance.")),
            React.createElement("div", { className: "passport-stamps" }, db.categories.map((c) => (React.createElement(Link, { to: "/explore?category=" + c.id, className: worlds.has(c.id) ? "stamp earned" : "stamp", key: c.id },
                React.createElement(Icon, { name: c.icon, size: 23 }),
                React.createElement("span", null, c.name),
                worlds.has(c.id) && React.createElement(Icon, { name: "check", size: 12 })))))),
        React.createElement("section", { className: "content-section" },
            React.createElement("div", { className: "section-heading" },
                React.createElement("h2", null, "Picked for your next chapter."),
                React.createElement(Link, { className: "text-link", to: "/explore" },
                    "Keep exploring ",
                    React.createElement(Icon, { name: "arrow", size: 16 }))),
            React.createElement("div", { className: "card-grid home-cards" }, recommend(db, user, 4).map((x) => (React.createElement(ContentCard, { key: x.content.id, content: x.content, reason: x.reason }))))),
        React.createElement("div", { className: "two-column" },
            React.createElement("section", { className: "panel" },
                React.createElement("h2", null, "Recently explored"),
                activity.length ? (activity.map((a) => {
                    const c = db.contents.find((x) => x.id === a.contentId);
                    return c ? (React.createElement(Link, { className: "activity-row", to: "/content/" + c.id, key: a.contentId },
                        React.createElement("img", { src: c.image, alt: "" }),
                        React.createElement("span", null,
                            React.createElement("strong", null, c.title),
                            React.createElement("small", null, new Date(a.at).toLocaleString())),
                        React.createElement(Icon, { name: "arrow", size: 16 }))) : null;
                })) : (React.createElement("p", { className: "muted" }, "Open a story, character or collectible to begin your reading history."))),
            React.createElement("section", { className: "panel" },
                React.createElement("h2", null, "Your favorite worlds"),
                React.createElement("div", { className: "tag-list" }, user.favoriteCategories.length ? (user.favoriteCategories.map((id) => (React.createElement(Link, { to: "/explore?category=" + id, className: "tag", key: id }, db.categories.find((c) => c.id === id)?.name)))) : (React.createElement("p", { className: "muted" }, "Choose your interests and we will explain why each discovery is recommended."))),
                React.createElement(Link, { to: "/profile", className: "text-link" },
                    "Edit your interests ",
                    React.createElement(Icon, { name: "arrow", size: 16 }))))));
}
function Collection() {
    const { db, user, perform } = useApp();
    const [q, setQ] = useState(""), [note, setNote] = useState(null), [text, setText] = useState(""), [busy, setBusy] = useState(false);
    if (!db || !user)
        return null;
    const saved = db.bookmarks
        .filter((b) => b.userId === user.id)
        .map((b) => ({ b, c: db.contents.find((c) => c.id === b.contentId) }))
        .filter((x) => x.c?.title.toLowerCase().includes(q.toLowerCase()));
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHeading, { eyebrow: "KEEP THE GOOD STUFF CLOSE", title: "Your collection.", description: "The stories, characters and creative things you want to come back to." }),
        React.createElement(AccountNav, null),
        React.createElement("div", { className: "collection-toolbar" },
            React.createElement("label", { className: "search-input" },
                React.createElement(Icon, { name: "search" }),
                React.createElement("input", { "aria-label": "Search your collection", placeholder: "Search your saved discoveries...", value: q, onChange: (e) => setQ(e.target.value) })),
            React.createElement("span", { className: "muted" },
                saved.length,
                " saved ",
                saved.length === 1 ? "item" : "items")),
        saved.length ? (React.createElement("div", { className: "card-grid" }, saved.map(({ b, c }) => c && (React.createElement("div", { key: b.id },
            React.createElement(ContentCard, { content: c }),
            React.createElement("button", { className: "note-button", type: "button", onClick: () => {
                    setNote(b);
                    setText(b.note);
                } },
                React.createElement(Icon, { name: "edit", size: 15 }),
                b.note ? b.note : "Add a private demo note")))))) : (React.createElement(Empty, { icon: "bookmark", title: q ? "No matching saves" : "Make room for your next favorite.", description: q
                ? "Try another title or clear the search."
                : "Use the bookmark icon on any published discovery. Your collection is scoped to the signed-in demo profile." },
            React.createElement(Link, { to: "/explore", className: "btn btn-primary" },
                "Find something worth saving ",
                React.createElement(Icon, { name: "arrow", size: 16 })))),
        React.createElement(Modal, { open: !!note, onClose: () => setNote(null), title: "A note for future you" },
            React.createElement("form", { className: "stack-form", onSubmit: async (e) => {
                    e.preventDefault();
                    if (!note)
                        return;
                    setBusy(true);
                    if (await perform(() => repository.saveNote(note.id, text), "Note saved."))
                        setNote(null);
                    setBusy(false);
                } },
                React.createElement(Field, { label: "Your note", hint: "Stored locally with this demo profile. Do not enter sensitive information." },
                    React.createElement("textarea", { rows: 6, maxLength: 1000, value: text, onChange: (e) => setText(e.target.value) })),
                React.createElement("span", { className: "muted" },
                    text.length,
                    "/1000"),
                React.createElement(Button, { busy: busy, type: "submit" }, "Save note")))));
}
function Profile() {
    const { db, user, perform, notify, setDb, fontScale, setFontScale, theme, toggleTheme, spoilerSafe, toggleSpoilers, } = useApp();
    const [name, setName] = useState(user?.name || ""), [bio, setBio] = useState(user?.bio || ""), [cats, setCats] = useState(user?.favoriteCategories || []), [fandoms, setFandoms] = useState((user?.favoriteFandoms || []).join(", ")), [avatar, setAvatar] = useState(user?.avatar || ""), [busy, setBusy] = useState(false), [reset, setReset] = useState(false);
    if (!db || !user)
        return null;
    const upload = async (file) => {
        if (!file)
            return;
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
            file.size > 2 * 1024 * 1024) {
            notify("Choose a PNG, JPEG or WebP smaller than 2 MB.", "error");
            return;
        }
        try {
            const bitmap = await createImageBitmap(file), canvas = document.createElement("canvas");
            canvas.width = canvas.height = 160;
            const ctx = canvas.getContext("2d");
            if (!ctx)
                throw new Error("Image processing unavailable.");
            const side = Math.min(bitmap.width, bitmap.height);
            ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 160, 160);
            bitmap.close();
            setAvatar(canvas.toDataURL("image/webp", 0.8));
        }
        catch {
            notify("This image could not be opened. Try another file.", "error");
        }
    };
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHeading, { eyebrow: "MAKE THIS SPACE YOURS", title: "Your profile.", description: "Your interests shape your discoveries. Preferences are saved on this device." }),
        React.createElement(AccountNav, null),
        React.createElement("div", { className: "profile-grid" },
            React.createElement("form", { className: "panel stack-form", onSubmit: async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    await perform(() => repository.updateProfile({
                        name,
                        bio,
                        favoriteCategories: cats,
                        favoriteFandoms: fandoms
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean),
                        avatar,
                    }), "Your profile has been updated.");
                    setBusy(false);
                } },
                React.createElement("div", { className: "profile-identity" },
                    React.createElement("div", { className: "profile-avatar" }, avatar ? (React.createElement("img", { src: avatar, alt: "Your demo avatar" })) : (user.name.slice(0, 1))),
                    React.createElement("div", null,
                        React.createElement("h2", null, user.name),
                        React.createElement("p", { className: "muted" }, user.email),
                        React.createElement("label", { className: "upload-label" },
                            "Change avatar",
                            React.createElement("input", { type: "file", accept: "image/png,image/jpeg,image/webp", onChange: (e) => void upload(e.target.files?.[0]) })),
                        avatar && (React.createElement("button", { className: "small-link", type: "button", onClick: () => setAvatar("") }, "Remove avatar")))),
                React.createElement(Field, { label: "Display name" },
                    React.createElement("input", { required: true, maxLength: 60, value: name, onChange: (e) => setName(e.target.value) })),
                React.createElement(Field, { label: "A little about you" },
                    React.createElement("textarea", { value: bio, onChange: (e) => setBio(e.target.value), maxLength: 500, rows: 3, placeholder: "Tell us which worlds you love..." })),
                React.createElement("fieldset", null,
                    React.createElement("legend", null, "Favorite categories"),
                    React.createElement("div", { className: "preference-grid" }, db.categories.map((c) => (React.createElement("label", { key: c.id, className: cats.includes(c.id) ? "preference selected" : "preference" },
                        React.createElement("input", { type: "checkbox", checked: cats.includes(c.id), onChange: () => setCats((s) => s.includes(c.id)
                                ? s.filter((x) => x !== c.id)
                                : [...s, c.id]) }),
                        React.createElement(Icon, { name: c.icon, size: 18 }),
                        c.name))))),
                React.createElement(Field, { label: "Favorite fandoms", hint: "Use exact demo fandom names, separated by commas. For example: Neon Horizon, Skybound." },
                    React.createElement("input", { value: fandoms, onChange: (e) => setFandoms(e.target.value), maxLength: 500 })),
                React.createElement(Button, { type: "submit", busy: busy },
                    "Save profile ",
                    React.createElement(Icon, { name: "check", size: 17 }))),
            React.createElement("aside", { className: "stack" },
                React.createElement("section", { className: "panel" },
                    React.createElement("h2", null, "Reading preferences"),
                    React.createElement("div", { className: "setting-row" },
                        React.createElement("span", null, "Appearance"),
                        React.createElement(Button, { variant: "secondary", onClick: toggleTheme },
                            React.createElement(Icon, { name: theme === "dark" ? "moon" : "sun", size: 16 }),
                            theme === "dark" ? "Dark" : "Light")),
                    React.createElement(Field, { label: "Text size" },
                        React.createElement("select", { value: fontScale, onChange: (e) => setFontScale(Number(e.target.value)) },
                            React.createElement("option", { value: 1 }, "Standard - 100%"),
                            React.createElement("option", { value: 1.125 }, "Comfortable - 112.5%"),
                            React.createElement("option", { value: 1.25 }, "Large - 125%"))),
                    React.createElement("label", { className: "check-row" },
                        React.createElement("input", { type: "checkbox", checked: spoilerSafe, onChange: toggleSpoilers }),
                        "Hide flagged story bodies until I reveal them"),
                    React.createElement("p", { className: "muted small" }, "This is a reading convenience. It does not remove spoiler data from the browser.")),
                React.createElement("section", { className: "panel" },
                    React.createElement("h2", null, "Demo workspace"),
                    React.createElement(Notice, null, "No real email or secure server session is connected. Use the backend integration checklist before deployment."),
                    React.createElement("div", { className: "stack" },
                        React.createElement(Link, { to: "/forgot-password", className: "text-link" },
                            "Try password reset ",
                            React.createElement(Icon, { name: "arrow", size: 15 })),
                        React.createElement(Button, { variant: "secondary", onClick: async () => {
                                setDb(await repository.logout());
                                navigate("/");
                            } },
                            "Sign out ",
                            React.createElement(Icon, { name: "logout", size: 16 })),
                        React.createElement(Button, { variant: "danger", onClick: () => setReset(true) }, "Reset all demo data"))))),
        React.createElement(Confirm, { open: reset, onClose: () => setReset(false), title: "Reset this demo workspace?", description: "This removes all local profiles, notes, ratings, submissions, edits and chat history from Fan Hub Plus. Your appearance preference stays. Other websites are not affected.", onConfirm: async () => {
                setDb(repository.resetDemo());
                notify("Demo workspace reset.");
                navigate("/");
            } })));
}
function Submit() {
    const { db, user, perform } = useApp();
    const [title, setTitle] = useState(""), [categoryId, setCategory] = useState(db?.categories[0]?.id || ""), [fandom, setFandom] = useState(""), [body, setBody] = useState(""), [busy, setBusy] = useState(false);
    if (!db || !user)
        return null;
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHeading, { eyebrow: "FAN-MADE. COMMUNITY-LOVED.", title: "Every fan has a story.", description: "Share something original. An administrator reviews each submission before it appears in Explore." }),
        React.createElement(AccountNav, null),
        React.createElement("div", { className: "two-column submission-layout" },
            React.createElement("form", { className: "panel stack-form", onSubmit: async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    if (await perform(() => repository.submit({ title, categoryId, fandom, body }), "Your story is in the review queue.")) {
                        setTitle("");
                        setBody("");
                        setFandom("");
                    }
                    setBusy(false);
                } },
                React.createElement("h2", null, "Submit your story"),
                React.createElement(Field, { label: "Story title" },
                    React.createElement("input", { required: true, minLength: 5, maxLength: 120, value: title, onChange: (e) => setTitle(e.target.value), placeholder: "A title that opens a door..." })),
                React.createElement("div", { className: "form-row" },
                    React.createElement(Field, { label: "Category" },
                        React.createElement("select", { value: categoryId, onChange: (e) => setCategory(e.target.value) }, db.categories.map((c) => (React.createElement("option", { key: c.id, value: c.id }, c.name))))),
                    React.createElement(Field, { label: "Fandom" },
                        React.createElement("input", { required: true, maxLength: 80, value: fandom, onChange: (e) => setFandom(e.target.value) }))),
                React.createElement(Field, { label: "Your story", hint: "At least 80 characters. Plain text and basic headings are supported; HTML is never executed." },
                    React.createElement("textarea", { required: true, minLength: 80, maxLength: 15000, rows: 11, value: body, onChange: (e) => setBody(e.target.value) })),
                React.createElement("label", { className: "check-row" },
                    React.createElement("input", { type: "checkbox", required: true }),
                    "This is my original writing, and I have permission to share it."),
                React.createElement(Button, { type: "submit", busy: busy },
                    "Send for review ",
                    React.createElement(Icon, { name: "send", size: 17 }))),
            React.createElement("section", { className: "panel" },
                React.createElement("h2", null, "Your submission history"),
                React.createElement("p", { className: "muted" }, "Pending stories are not included in public searches."),
                db.submissions.filter((s) => s.userId === user.id).length ? (db.submissions
                    .filter((s) => s.userId === user.id)
                    .map((s) => (React.createElement("article", { className: "submission-card", key: s.id },
                    React.createElement("span", { className: "status status-" + s.status }, s.status),
                    React.createElement("h3", null, s.title),
                    React.createElement("p", { className: "muted small" }, new Date(s.createdAt).toLocaleString()),
                    s.reason && (React.createElement("p", { className: "review-reason" },
                        "Editor's note: ",
                        s.reason)))))) : (React.createElement("div", { className: "empty compact" },
                    React.createElement(Icon, { name: "edit", size: 32 }),
                    React.createElement("h3", null, "Your first story starts here."),
                    React.createElement("p", null, "Once submitted, its review status will appear in this space."))),
                React.createElement(Notice, null, "Review is simulated locally. Sign in as the demo administrator to exercise approval or rejection.")))));
}
function FeedbackPage() {
    const { db, user, perform } = useApp();
    const [type, setType] = useState("suggestion"), [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [done, setDone] = useState(false);
    return (React.createElement(React.Fragment, null,
        React.createElement(Crumbs, { items: [{ label: "Feedback" }] }),
        React.createElement(PageHeading, { eyebrow: "HELP US BUILD A BETTER UNIVERSE", title: "We're listening.", description: "Found a bug, have an idea, or need a hand? Tell us about it." }),
        React.createElement("div", { className: "two-column" },
            React.createElement("form", { className: "panel stack-form", onSubmit: async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    if (await perform(() => repository.feedback(type, message), "Feedback saved to the demo review queue.")) {
                        setMessage("");
                        setDone(true);
                    }
                    setBusy(false);
                } },
                done && (React.createElement(Notice, { kind: "success" }, "Thank you. This feedback has been stored locally, not sent to a support team.")),
                React.createElement(Field, { label: "What is this about?" },
                    React.createElement("select", { value: type, onChange: (e) => setType(e.target.value) },
                        React.createElement("option", { value: "suggestion" }, "A suggestion"),
                        React.createElement("option", { value: "bug" }, "A bug"),
                        React.createElement("option", { value: "query" }, "A question"))),
                React.createElement(Field, { label: "Your message", hint: "10-2000 characters. Do not include passwords or sensitive information." },
                    React.createElement("textarea", { required: true, minLength: 10, maxLength: 2000, rows: 8, value: message, onChange: (e) => setMessage(e.target.value), placeholder: "The more context, the better..." })),
                React.createElement(Button, { type: "submit", busy: busy },
                    "Send demo feedback ",
                    React.createElement(Icon, { name: "send", size: 16 }))),
            React.createElement("section", { className: "panel" },
                React.createElement("h2", null, "A few helpful answers"),
                db?.faqs.slice(0, 4).map((f) => (React.createElement("details", { className: "faq-item", key: f.id },
                    React.createElement("summary", null, f.question),
                    React.createElement("p", null, f.answer)))),
                user && (React.createElement(React.Fragment, null,
                    React.createElement("h3", null, "Your recent feedback"),
                    db?.feedback
                        .filter((f) => f.userId === user.id)
                        .slice(0, 4)
                        .map((f) => (React.createElement("div", { className: "submission-card", key: f.id },
                        React.createElement("span", { className: "status status-" + f.status }, f.status),
                        React.createElement("p", null, f.message))))))))));
}
export default function Account({ mode }) {
    return mode === "dashboard" ? (React.createElement(Dashboard, null)) : mode === "collection" ? (React.createElement(Collection, null)) : mode === "profile" ? (React.createElement(Profile, null)) : mode === "submit" ? (React.createElement(Submit, null)) : (React.createElement(FeedbackPage, null));
}
