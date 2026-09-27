import React, { useEffect, useState } from "react";
import { useApp } from "../lib/store.js";
import { Link } from "../lib/router.js";
import { Icon, Button, Crumbs, ContentCard, BookmarkButton, Empty, Modal, Skeleton, copyText, typeLabels, } from "../components/ui.js";
import { ContentMedia } from "../features/catalog/ContentMedia.js";
import { ContentRating } from "../features/catalog/ContentRating.js";
import { useContentDetail } from "../features/catalog/hooks.js";
import { categoryLabel } from "../shared/catalog/taxonomy.js";
export function RichText({ text }) {
    return (React.createElement("div", { className: "prose" }, text.split(/\n\s*\n/).map((block, i) => {
        if (block.startsWith("## "))
            return React.createElement("h2", { key: i }, block.slice(3));
        const bits = block.split(/(\*\*[^*]+\*\*)/g);
        return (React.createElement("p", { key: i }, bits.map((part, j) => part.startsWith("**") ? (React.createElement("strong", { key: j }, part.slice(2, -2))) : (React.createElement(React.Fragment, { key: j }, part)))));
    })));
}
export default function Detail({ id }) {
    const { spoilerSafe, notify } = useApp();
    const { detail, loading, error, notFound } = useContentDetail(id);
    const [revealed, setRevealed] = useState(false);
    const [gallery, setGallery] = useState(null);
    const [shareOpen, setShareOpen] = useState(false);
    useEffect(() => {
        setRevealed(false);
        setGallery(null);
    }, [id]);
    if (loading) {
        return (React.createElement("section", { className: "content-section", "aria-label": "Loading content detail" },
            React.createElement(Skeleton, { cards: 1 })));
    }
    if (!detail) {
        return (React.createElement(Empty, { title: notFound ? "This story is unavailable" : "We couldn't load this story", description: error ||
                "The content detail service is unavailable. Please try again later." },
            React.createElement(Link, { className: "btn btn-primary", to: "/explore" }, "Back to Explore")));
    }
    const { content, related, rating } = detail;
    const categoryName = categoryLabel(content.categoryId);
    const galleryImages = [content.image, "/art/community.svg", "/art/manga.svg"];
    const share = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: content.title, url });
                return;
            }
            catch (cause) {
                if (cause instanceof Error && cause.name === "AbortError")
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
                    label: categoryName,
                    to: `/explore?category=${encodeURIComponent(content.categoryId)}`,
                },
                { label: typeLabels[content.type] },
            ] }),
        React.createElement("div", { className: "detail-banner" },
            React.createElement("img", { src: content.image, alt: `Original ${content.fandom} concept illustration`, width: "1280", height: "900" }),
            React.createElement("div", { className: "detail-banner-bottom" },
                React.createElement("span", { className: "pill" }, categoryName),
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
                        React.createElement("button", { className: "icon-btn", type: "button", onClick: share, "aria-label": "Share this story" },
                            React.createElement(Icon, { name: "share" })))),
                React.createElement(ContentMedia, { content: content, galleryImages: galleryImages, onOpenGallery: setGallery }),
                content.spoiler && spoilerSafe && !revealed ? (React.createElement("div", { className: "spoiler-gate" },
                    React.createElement(Icon, { name: "shield", size: 38 }),
                    React.createElement("h2", null, "A little heads-up."),
                    React.createElement("p", null, "This section discusses a story reveal. Your spoiler-safe preference is on."),
                    React.createElement(Button, { variant: "secondary", onClick: () => setRevealed(true) }, "I'm ready - reveal this section"))) : (React.createElement(RichText, { text: content.body })),
                React.createElement("div", { className: "tag-list" }, content.tags.map((tag) => (React.createElement("span", { className: "chip static-chip", key: tag }, tag)))),
                React.createElement(ContentRating, { contentId: content.id, initial: rating })),
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
                React.createElement(Link, { to: `/explore?fandom=${encodeURIComponent(content.fandom)}`, className: "world-callout" },
                    React.createElement("span", null, "MORE FROM"),
                    React.createElement("h3", null, content.fandom),
                    React.createElement(Icon, { name: "arrow" })))),
        related.length > 0 && (React.createElement("section", { className: "content-section" },
            React.createElement("div", { className: "section-heading" },
                React.createElement("h2", null,
                    "Stay a little longer",
                    React.createElement("span", { className: "accent" }, ".")),
                React.createElement(Link, { to: `/explore?category=${encodeURIComponent(content.categoryId)}`, className: "text-link" },
                    "Explore this world ",
                    React.createElement(Icon, { name: "arrow", size: 17 }))),
            React.createElement("div", { className: "card-grid" }, related.map((item) => (React.createElement(ContentCard, { content: item, key: item.id })))))),
        React.createElement(Modal, { title: "Concept gallery", open: gallery !== null, onClose: () => setGallery(null), wide: true }, gallery !== null && (React.createElement(React.Fragment, null,
            React.createElement("img", { className: "lightbox-image", src: galleryImages[gallery], alt: `Original concept study ${gallery + 1}` }),
            React.createElement("div", { className: "modal-actions" },
                React.createElement(Button, { variant: "secondary", onClick: () => setGallery((gallery + 2) % galleryImages.length) }, "Previous"),
                React.createElement("span", null,
                    gallery + 1,
                    " / ",
                    galleryImages.length),
                React.createElement(Button, { onClick: () => setGallery((gallery + 1) % galleryImages.length) }, "Next"))))),
        React.createElement(Modal, { title: "Share this discovery", open: shareOpen, onClose: () => setShareOpen(false) },
            React.createElement("label", { className: "field" },
                React.createElement("span", null, "Copy this address"),
                React.createElement("input", { readOnly: true, value: window.location.href, onFocus: (event) => event.currentTarget.select() })))));
}
