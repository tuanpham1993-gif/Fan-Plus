import React, { useMemo, useState } from "react";
import { Icon, Notice } from "../../components/ui.js";
function safeMediaSource(value) {
    const candidate = value?.trim();
    if (!candidate)
        return "";
    try {
        // document.baseURI also works in the offline UI harness, where the page
        // itself is about:blank but the application has an explicit <base>.
        const base = new URL(document.baseURI);
        const parsed = new URL(candidate, base);
        const sameOrigin = parsed.origin === base.origin;
        if (parsed.username || parsed.password)
            return "";
        if (sameOrigin && (parsed.protocol === "http:" || parsed.protocol === "https:")) {
            return candidate;
        }
        if (parsed.protocol === "https:")
            return parsed.href;
    }
    catch {
        return "";
    }
    return "";
}
function videoMime(src) {
    const clean = src.split(/[?#]/)[0].toLowerCase();
    if (clean.endsWith(".mp4"))
        return "video/mp4";
    if (clean.endsWith(".ogv") || clean.endsWith(".ogg"))
        return "video/ogg";
    if (clean.endsWith(".webm"))
        return "video/webm";
    return undefined;
}
export function ContentMedia({ content, galleryImages, onOpenGallery, }) {
    const [mediaError, setMediaError] = useState(false);
    const mediaUrl = useMemo(() => safeMediaSource(content.mediaUrl), [content.mediaUrl]);
    if (content.type === "article")
        return null;
    if (content.type === "character") {
        return (React.createElement("div", { className: "character-facts" },
            React.createElement("div", null,
                React.createElement("span", null, "Universe"),
                React.createElement("strong", null, content.fandom)),
            React.createElement("div", null,
                React.createElement("span", null, "Genre"),
                React.createElement("strong", null, content.genre)),
            React.createElement("div", null,
                React.createElement("span", null, "Demo year"),
                React.createElement("strong", null, content.year))));
    }
    if (content.type === "video") {
        return (React.createElement(React.Fragment, null,
            mediaUrl ? (React.createElement("div", { className: "media-player" },
                React.createElement("video", { key: content.id, controls: true, preload: "metadata", poster: content.image, onError: () => setMediaError(true) },
                    React.createElement("source", { src: mediaUrl, type: videoMime(mediaUrl), onError: () => setMediaError(true) }),
                    React.createElement("track", { kind: "captions", src: "/media/portal.vtt", srcLang: "en", label: "English", default: true }),
                    "Your browser does not support this video."),
                React.createElement("p", { className: "caption" }, "Original demo animation. Captions are available when supplied by the content package."))) : (React.createElement(Notice, { kind: "error" }, "This video does not have a safe playable media URL.")),
            mediaError && (React.createElement(Notice, { kind: "error" }, "The media could not load. Check the media URL and try again."))));
    }
    if (content.type === "audio") {
        return (React.createElement(React.Fragment, null,
            mediaUrl ? (React.createElement("div", { className: "audio-player" },
                React.createElement("span", { className: "audio-icon" },
                    React.createElement(Icon, { name: "music", size: 38 })),
                React.createElement("div", null,
                    React.createElement("h2", null, content.title),
                    React.createElement("audio", { controls: true, preload: "metadata", src: mediaUrl, onError: () => setMediaError(true) }, "Your browser does not support audio."),
                    React.createElement("p", { className: "caption" }, "Audio is loaded only from a same-origin or HTTPS source.")))) : (React.createElement(Notice, { kind: "error" }, "This audio entry does not have a safe playable media URL.")),
            mediaError && (React.createElement(Notice, { kind: "error" }, "The media could not load. Check the media URL and try again."))));
    }
    if (content.type === "gallery" || content.type === "merchandise") {
        return (React.createElement(React.Fragment, null,
            React.createElement("h2", { className: "section-small-title" }, "A closer look"),
            React.createElement("div", { className: "gallery-grid" }, galleryImages.map((src, index) => (React.createElement("button", { type: "button", key: `${src}-${index}`, className: "gallery-item", onClick: () => onOpenGallery(index), "aria-label": `Open concept image ${index + 1}` },
                React.createElement("img", { src: src, alt: `Original concept study ${index + 1}`, width: "640", height: "450" }),
                React.createElement("span", null,
                    React.createElement(Icon, { name: "plus", size: 18 })))))),
            content.type === "merchandise" && (React.createElement(Notice, null, "This is a fictional showcase concept. There is no purchase, payment, preorder transaction or delivery service."))));
    }
    return null;
}
