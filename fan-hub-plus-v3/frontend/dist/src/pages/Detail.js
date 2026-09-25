import React, { useEffect, useState } from "react";
import { useApp } from "../lib/store.js";
import { Link, navigate } from "../lib/router.js";
import { repository } from "../services/repository.js";
import { Icon, Button, Crumbs, ContentCard, BookmarkButton, Empty, Notice, Modal, copyText, typeLabels, } from "../components/ui.js";
export function RichText({ text }) {
    return (React.createElement("div", { className: "prose" }, text.split(/\n\s*\n/).map((block, i) => {
        if (block.startsWith("## "))
            return React.createElement("h2", { key: i }, block.slice(3));
        const bits = block.split(/(\*\*[^*]+\*\*)/g);
        return (React.createElement("p", { key: i }, bits.map((t, j) => t.startsWith("**") ? (React.createElement("strong", { key: j }, t.slice(2, -2))) : (React.createElement(React.Fragment, { key: j }, t)))));
    })));
}
export default function Detail({ id }) {
    const { db, user, spoilerSafe, perform, notify } = useApp();
    const [revealed, setRevealed] = useState(false), [gallery, setGallery] = useState(null), [shareOpen, setShareOpen] = useState(false), [mediaError, setMediaError] = useState(false), [ratingBusy, setRatingBusy] = useState(false);
    const content = db?.contents.find((c) => c.id === id && (c.status === "published" || user?.role === "admin"));
    useEffect(() => {
        setRevealed(false);
        setMediaError(false);
        if (user && content)
            void perform(() => repository.recordView(id));
    }, [id, user?.id]);
    if (!db || !content)
        return (React.createElement(Empty, { title: "This story is unavailable", description: "It may have been removed or may not be published yet." },
            React.createElement(Link, { className: "btn btn-primary", to: "/explore" }, "Back to Explore")));
    const category = db.categories.find((c) => c.id === content.categoryId), related = db.contents
        .filter((c) => c.id !== id &&
        c.categoryId === content.categoryId &&
        c.status === "published")
        .slice(0, 3), myRating = db.ratings.find((r) => r.userId === user?.id && r.contentId === id)
        ?.value || 0, ratings = db.ratings.filter((r) => r.contentId === id);
    const galleryImages = [content.image, "/art/community.svg", "/art/manga.svg"];
    const share = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: content.title, url });
                return;
            }
            catch (e) {
                if (e instanceof Error && e.name === "AbortError")
                    return;
            }
        }
        if (await copyText(url))
            notify("Story link copied.");
        else
            setShareOpen(true);
    };
    return (React.createElement(React.Fragment, null,
        React.createElement(Crumbs, { items: [
                { label: "Explore", to: "/explore" },
                {
                    label: category?.name || "Community",
                    to: "/explore?category=" + content.categoryId,
                },
                { label: typeLabels[content.type] },
            ] }),
        React.createElement("div", { className: "detail-banner" },
            React.createElement("img", { src: content.image, alt: `Original ${content.fandom} concept illustration`, width: "1280", height: "900" }),
            React.createElement("div", { className: "detail-banner-bottom" },
                React.createElement("span", { className: "pill" }, category?.name),
                React.createElement("span", null, content.fandom),
                React.createElement("span", { className: "pill pill-outline" }, typeLabels[content.type]))),
        React.createElement("div", { className: "detail-layout" },
            React.createElement("article", null,
                React.createElement("div", { className: "detail-title" },
                    React.createElement("span", { className: "eyebrow" }, content.status === "draft"
                        ? "UNPUBLISHED DRAFT - ADMIN PREVIEW"
                        : "FROM THE FAN HUB COLLECTION"),
                    React.createElement("h1", null, content.title),
                    React.createElement("p", { className: "detail-deck" }, content.description),
                    React.createElement("div", { className: "byline" },
                        React.createElement("span", { className: "avatar avatar-small" }, "FH"),
                        React.createElement("span", null,
                            React.createElement("strong", null, content.author),
                            React.createElement("br", null),
                            React.createElement("small", null,
                                new Intl.DateTimeFormat("en-GB", {
                                    dateStyle: "medium",
                                    timeZone: "Asia/Ho_Chi_Minh",
                                }).format(new Date(content.publishedAt)),
                                " ",
                                "/ ",
                                content.duration)),
                        React.createElement("button", { className: "icon-btn", onClick: share, "aria-label": "Share this story" },
                            React.createElement(Icon, { name: "share" })))),
                content.type === "character" && (React.createElement("div", { className: "character-facts" },
                    React.createElement("div", null,
                        React.createElement("span", null, "Universe"),
                        React.createElement("strong", null, content.fandom)),
                    React.createElement("div", null,
                        React.createElement("span", null, "Genre"),
                        React.createElement("strong", null, content.genre)),
                    React.createElement("div", null,
                        React.createElement("span", null, "Demo year"),
                        React.createElement("strong", null, content.year)))),
                content.type === "video" && (React.createElement("div", { className: "media-player" },
                    React.createElement("video", { key: id, controls: true, preload: "metadata", poster: content.image, onError: () => setMediaError(true) },
                        React.createElement("source", { src: content.mediaUrl, onError: () => setMediaError(true), type: content.mediaUrl?.split("?")[0].endsWith(".mp4")
                                ? "video/mp4"
                                : "video/webm" }),
                        React.createElement("track", { kind: "captions", src: "/media/portal.vtt", srcLang: "en", label: "English", default: true }),
                        "Your browser does not support this video."),
                    React.createElement("p", { className: "caption" }, "Original six-second animation. Captions available. No third-party footage."))),
                content.type === "audio" && (React.createElement("div", { className: "audio-player" },
                    React.createElement("span", { className: "audio-icon" },
                        React.createElement(Icon, { name: "music", size: 38 })),
                    React.createElement("div", null,
                        React.createElement("h2", null, "Orbit: an ambient sketch"),
                        React.createElement("audio", { controls: true, preload: "metadata", src: content.mediaUrl, onError: () => setMediaError(true) }, "Your browser does not support audio."),
                        React.createElement("p", { className: "caption" }, "Transcript: eight seconds of instrumental synthesized tones. No speech.")))),
                mediaError && (React.createElement(Notice, { kind: "error" }, "The media could not load. Check that the local media files are included, then refresh.")),
                ["gallery", "merchandise"].includes(content.type) && (React.createElement(React.Fragment, null,
                    React.createElement("h2", { className: "section-small-title" }, "A closer look"),
                    React.createElement("div", { className: "gallery-grid" }, galleryImages.map((src, i) => (React.createElement("button", { key: i, className: "gallery-item", onClick: () => setGallery(i), "aria-label": `Open concept image ${i + 1}` },
                        React.createElement("img", { src: src, alt: `Original concept study ${i + 1}`, width: "640", height: "450" }),
                        React.createElement("span", null,
                            React.createElement(Icon, { name: "plus", size: 18 })))))))),
                content.type === "merchandise" && (React.createElement(Notice, null, "This is a fictional showcase concept. There is no purchase, payment, preorder transaction or delivery service.")),
                content.spoiler && spoilerSafe && !revealed ? (React.createElement("div", { className: "spoiler-gate" },
                    React.createElement(Icon, { name: "shield", size: 38 }),
                    React.createElement("h2", null, "A little heads-up."),
                    React.createElement("p", null, "This section discusses a story reveal. Your spoiler-safe preference is on."),
                    React.createElement(Button, { variant: "secondary", onClick: () => setRevealed(true) }, "I'm ready - reveal this section"))) : (React.createElement(RichText, { text: content.body })),
                React.createElement("div", { className: "tag-list" }, content.tags.map((t) => (React.createElement("span", { className: "chip static-chip", key: t }, t)))),
                React.createElement("section", { className: "rating-panel" },
                    React.createElement("div", null,
                        React.createElement("h2", null, "Worth the discovery?"),
                        React.createElement("p", null, ratings.length
                            ? `${ratings.length} demo rating${ratings.length > 1 ? "s" : ""} / ${(ratings.reduce((s, r) => s + r.value, 0) / ratings.length).toFixed(1)} average`
                            : "Be the first to rate this entry in your demo workspace.")),
                    React.createElement("div", { role: "group", "aria-label": "Rate this content", className: "stars" }, [1, 2, 3, 4, 5].map((n) => (React.createElement("button", { key: n, disabled: ratingBusy, "aria-label": `Rate ${n} out of 5`, "aria-pressed": myRating === n, onClick: async () => {
                            if (!user) {
                                navigate("/login?next=" + encodeURIComponent("/content/" + id));
                                return;
                            }
                            setRatingBusy(true);
                            await perform(() => repository.rate(id, n), "Your rating has been saved.");
                            setRatingBusy(false);
                        } },
                        React.createElement(Icon, { name: "star", size: 25, fill: n <= myRating ? "currentColor" : "none" }))))))),
            React.createElement("aside", { className: "detail-sidebar" },
                React.createElement("div", { className: "panel" },
                    React.createElement("span", { className: "eyebrow" }, "MAKE ROOM FOR A NEW FAVORITE"),
                    React.createElement("h2", null, "Keep this world close."),
                    React.createElement("p", null, "Save it for later. Add a note. Pick up where curiosity left off."),
                    React.createElement(BookmarkButton, { content: content, compact: false }),
                    React.createElement(Button, { variant: "ghost", onClick: share },
                        React.createElement(Icon, { name: "share", size: 17 }),
                        "Share this discovery")),
                React.createElement("div", { className: "panel source-panel" },
                    React.createElement(Icon, { name: "shield", size: 24 }),
                    React.createElement("h3", null, "Know what you're reading"),
                    React.createElement("p", null,
                        content.sourceLabel,
                        ". This entry is for interface testing, not a verified reference about a real franchise."),
                    React.createElement(Link, { to: "/privacy", className: "small-link" },
                        "Content & privacy notes ",
                        React.createElement(Icon, { name: "arrow", size: 13 }))),
                React.createElement(Link, { to: "/explore?fandom=" + encodeURIComponent(content.fandom), className: "world-callout" },
                    React.createElement("span", null, "MORE FROM"),
                    React.createElement("h3", null, content.fandom),
                    React.createElement(Icon, { name: "arrow" })))),
        related.length > 0 && (React.createElement("section", { className: "content-section" },
            React.createElement("div", { className: "section-heading" },
                React.createElement("h2", null,
                    "Stay a little longer",
                    React.createElement("span", { className: "accent" }, ".")),
                React.createElement(Link, { to: "/explore?category=" + content.categoryId, className: "text-link" },
                    "Explore this world ",
                    React.createElement(Icon, { name: "arrow", size: 17 }))),
            React.createElement("div", { className: "card-grid" }, related.map((c) => (React.createElement(ContentCard, { content: c, key: c.id })))))),
        React.createElement(Modal, { title: "Concept gallery", open: gallery !== null, onClose: () => setGallery(null), wide: true }, gallery !== null && (React.createElement(React.Fragment, null,
            React.createElement("img", { className: "lightbox-image", src: galleryImages[gallery], alt: `Original concept study ${gallery + 1}` }),
            React.createElement("div", { className: "modal-actions" },
                React.createElement(Button, { variant: "secondary", onClick: () => setGallery((gallery + 2) % 3) }, "Previous"),
                React.createElement("span", null,
                    gallery + 1,
                    " / 3"),
                React.createElement(Button, { onClick: () => setGallery((gallery + 1) % 3) }, "Next"))))),
        React.createElement(Modal, { title: "Share this discovery", open: shareOpen, onClose: () => setShareOpen(false) },
            React.createElement("label", { className: "field" },
                React.createElement("span", null, "Copy this address"),
                React.createElement("input", { readOnly: true, value: window.location.href, onFocus: (e) => e.currentTarget.select() })))));
}
