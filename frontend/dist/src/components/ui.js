import React, { useEffect, useRef, useState, useId } from 'react';
import { Link, navigate, currentPath } from '../lib/router.js';
import { useApp } from '../lib/store.js';
import { repository } from '../services/repository.js';
const paths = {
    arrow: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M5 12h14m-6-6 6 6-6 6" })), chevron: React.createElement("path", { d: "m9 5 7 7-7 7" }), search: React.createElement(React.Fragment, null,
        React.createElement("circle", { cx: "10.5", cy: "10.5", r: "6.5" }),
        React.createElement("path", { d: "m16 16 5 5" })),
    compass: React.createElement(React.Fragment, null,
        React.createElement("circle", { cx: "12", cy: "12", r: "9" }),
        React.createElement("path", { d: "m16 8-2 6-6 2 2-6Z" })),
    contrast: React.createElement(React.Fragment, null,
        React.createElement("circle", { cx: "12", cy: "12", r: "9" }),
        React.createElement("path", { d: "M12 3a9 9 0 0 1 0 18Z", fill: "currentColor", stroke: "none" })),
    gamepad: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M7 7h10c3 0 5 10 3 11-2 1-4-3-5-3H9c-1 0-3 4-5 3S4 7 7 7Z" }),
        React.createElement("path", { d: "M8 9v5m-2.5-2.5h5M16 10h.01M18 13h.01" })), film: React.createElement(React.Fragment, null,
        React.createElement("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
        React.createElement("path", { d: "M7 4v16M17 4v16M3 9h4m10 0h4M3 15h4m10 0h4" })),
    tv: React.createElement(React.Fragment, null,
        React.createElement("rect", { x: "3", y: "6", width: "18", height: "14", rx: "2" }),
        React.createElement("path", { d: "m8 2 4 4 4-4M9 16h6" })), music: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M9 17V5l11-2v12M9 8l11-2" }),
        React.createElement("ellipse", { cx: "6", cy: "18", rx: "3", ry: "3" }),
        React.createElement("ellipse", { cx: "17", cy: "16", rx: "3", ry: "3" })),
    bolt: React.createElement("path", { d: "m13 2-9 12h7l-1 8 10-13h-7Z" }), book: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M12 5v16M3 3c4-1 7 1 9 2 2-1 5-3 9-2v16c-4-1-7 1-9 2-2-1-5-3-9-2Z" })), mask: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M3 5c3 2 5 2 9 0 4 2 6 2 9 0v6c0 5-4 9-9 11-5-2-9-6-9-11Z" }),
        React.createElement("path", { d: "m6 10 3 1m6 0 3-1m-9 6h6" })),
    bookmark: React.createElement("path", { d: "M6 3h12v19l-6-4-6 4Z" }), sun: React.createElement(React.Fragment, null,
        React.createElement("circle", { cx: "12", cy: "12", r: "4" }),
        React.createElement("path", { d: "M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M20 4l-2 2M6 18l-2 2" })), moon: React.createElement("path", { d: "M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z" }),
    menu: React.createElement("path", { d: "M4 6h16M4 12h16M4 18h16" }), close: React.createElement("path", { d: "m6 6 12 12M6 18 18 6" }), check: React.createElement("path", { d: "m4 12 5 5L20 6" }), play: React.createElement("path", { d: "m8 4 13 8-13 8Z" }), star: React.createElement("path", { d: "m12 2 3 6.5 7 .8-5.1 5 1.3 7-6.2-3.5-6.2 3.5 1.3-7L2 9.3l7-.8Z" }),
    pin: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" }),
        React.createElement("circle", { cx: "12", cy: "10", r: "2.5" })), calendar: React.createElement(React.Fragment, null,
        React.createElement("rect", { x: "3", y: "5", width: "18", height: "17", rx: "2" }),
        React.createElement("path", { d: "M7 2v6m10-6v6M3 11h18m-13 4h2m4 0h2m-8 4h2" })), clock: React.createElement(React.Fragment, null,
        React.createElement("circle", { cx: "12", cy: "12", r: "9" }),
        React.createElement("path", { d: "M12 7v5l4 2" })),
    globe: React.createElement(React.Fragment, null,
        React.createElement("circle", { cx: "12", cy: "12", r: "9" }),
        React.createElement("ellipse", { cx: "12", cy: "12", rx: "4", ry: "9" }),
        React.createElement("path", { d: "M3 12h18" })), grid: React.createElement(React.Fragment, null,
        React.createElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }),
        React.createElement("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }),
        React.createElement("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }),
        React.createElement("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })), list: React.createElement("path", { d: "M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01" }),
    filter: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M4 6h16M4 12h16M4 18h16" }),
        React.createElement("circle", { cx: "8", cy: "6", r: "2" }),
        React.createElement("circle", { cx: "16", cy: "12", r: "2" }),
        React.createElement("circle", { cx: "10", cy: "18", r: "2" })), user: React.createElement(React.Fragment, null,
        React.createElement("circle", { cx: "12", cy: "7", r: "4" }),
        React.createElement("path", { d: "M4 22v-3a8 8 0 0 1 16 0v3" })), users: React.createElement(React.Fragment, null,
        React.createElement("circle", { cx: "9", cy: "7", r: "3" }),
        React.createElement("path", { d: "M2 20v-2a7 7 0 0 1 14 0v2m0-16a3 3 0 0 1 0 6m3 4c2 1 3 3 3 6" })),
    shield: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Z" }),
        React.createElement("path", { d: "m8 12 3 3 5-6" })), share: React.createElement(React.Fragment, null,
        React.createElement("circle", { cx: "5", cy: "12", r: "3" }),
        React.createElement("circle", { cx: "19", cy: "5", r: "3" }),
        React.createElement("circle", { cx: "19", cy: "19", r: "3" }),
        React.createElement("path", { d: "m8 11 8-5m-8 7 8 5" })), edit: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "m14 5 5 5M4 20l5-1L21 7l-5-5L4 14Z" })), trash: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" })), plus: React.createElement("path", { d: "M12 4v16M4 12h16" }),
    mail: React.createElement(React.Fragment, null,
        React.createElement("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2" }),
        React.createElement("path", { d: "m3 6 9 7 9-7" })), lock: React.createElement(React.Fragment, null,
        React.createElement("rect", { x: "5", y: "10", width: "14", height: "11", rx: "2" }),
        React.createElement("path", { d: "M8 10V6a4 4 0 0 1 8 0v4m-4 5v2" })), logout: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M9 3H3v18h6m4-5 4-4-4-4m-5 4h14" })), heart: React.createElement("path", { d: "M12 21S1 14 2 7c1-6 8-6 10-1 2-5 9-5 10 1 1 7-10 14-10 14Z" }),
    info: React.createElement(React.Fragment, null,
        React.createElement("circle", { cx: "12", cy: "12", r: "9" }),
        React.createElement("path", { d: "M12 11v6m0-10h.01" })), external: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M14 3h7v7m0-7L11 13M10 3H3v18h18v-7" })), download: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5" })), send: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "m22 2-7 20-4-9-9-4Zm0 0L11 13" })), trophy: React.createElement(React.Fragment, null,
        React.createElement("path", { d: "M7 3h10v8a5 5 0 0 1-10 0Zm10 2h4v3a5 5 0 0 1-4 5M7 5H3v3a5 5 0 0 0 4 5M12 16v5m-5 0h10" })),
};
export function Icon({ name, size = 20, ...props }) { return React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", ...props }, paths[name] || paths.info); }
export function Button({ children, variant = 'primary', busy = false, className = '', ...props }) { return React.createElement("button", { type: "button", ...props, disabled: busy || props.disabled, className: `btn btn-${variant} ${className}`, "aria-busy": busy || undefined },
    busy ? React.createElement("span", { className: "spinner" }) : null,
    children); }
export function PageHeading({ eyebrow, title, description, children }) { return React.createElement("div", { className: "page-heading" },
    React.createElement("div", null,
        eyebrow && React.createElement("span", { className: "eyebrow" }, eyebrow),
        React.createElement("h1", null, title),
        description && React.createElement("p", null, description)),
    children && React.createElement("div", { className: "heading-actions" }, children)); }
export function Crumbs({ items }) { return React.createElement("nav", { className: "breadcrumbs", "aria-label": "Breadcrumb" },
    React.createElement(Link, { to: "/" }, "Home"),
    items.map((i, n) => React.createElement(React.Fragment, { key: n },
        React.createElement(Icon, { name: "chevron", size: 12 }),
        i.to ? React.createElement(Link, { to: i.to }, i.label) : React.createElement("span", { "aria-current": "page" }, i.label)))); }
export function Empty({ icon = 'search', title, description, children }) { return React.createElement("div", { className: "empty" },
    React.createElement("span", { className: "empty-icon" },
        React.createElement(Icon, { name: icon, size: 30 })),
    React.createElement("h2", null, title),
    React.createElement("p", null, description),
    children); }
export function Skeleton({ cards = 3 }) { return React.createElement("div", { className: "card-grid", "aria-label": "Loading content", "aria-busy": "true" }, Array.from({ length: cards }, (_, i) => React.createElement("div", { key: i, className: "skeleton-card" },
    React.createElement("div", { className: "skeleton-image" }),
    React.createElement("div", { className: "skeleton-line" }),
    React.createElement("div", { className: "skeleton-line short" })))); }
export function Modal({ open, onClose, title, children, wide = false }) {
    const ref = useRef(null), titleId = useId();
    useEffect(() => {
        const d = ref.current;
        if (!d)
            return;
        if (open && !d.open)
            d.showModal();
        if (!open && d.open)
            d.close();
    }, [open]);
    return React.createElement("dialog", { ref: ref, "aria-labelledby": titleId, className: `modal ${wide ? 'modal-wide' : ''}`, onCancel: onClose, onClose: onClose, onClick: e => {
            if (e.target === e.currentTarget) {
                const r = e.currentTarget.getBoundingClientRect();
                if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
                    onClose();
            }
        } },
        React.createElement("div", { className: "modal-head" },
            React.createElement("h2", { id: titleId }, title),
            React.createElement("button", { type: "button", className: "icon-btn", onClick: onClose, "aria-label": "Close dialog" },
                React.createElement(Icon, { name: "close" }))),
        open && children);
}
export function Confirm({ open, onClose, onConfirm, title, description }) {
    const [busy, setBusy] = useState(false);
    return React.createElement(Modal, { open: open, onClose: onClose, title: title },
        React.createElement("p", { className: "muted" }, description),
        React.createElement("div", { className: "modal-actions" },
            React.createElement(Button, { variant: "secondary", onClick: onClose }, "Cancel"),
            React.createElement(Button, { variant: "danger", busy: busy, onClick: async () => {
                    setBusy(true);
                    try {
                        await onConfirm();
                    }
                    finally {
                        setBusy(false);
                        onClose();
                    }
                } }, "Confirm action")));
}
export const typeLabels = { article: 'Story', character: 'Character', video: 'Video', audio: 'Audio', gallery: 'Gallery', merchandise: 'Collectible' };
export function BookmarkButton({ content, compact = true }) {
    const { db, user, perform } = useApp();
    const [busy, setBusy] = useState(false);
    const saved = db?.bookmarks.some(b => b.userId === user?.id && b.contentId === content.id);
    return React.createElement("button", { type: "button", className: compact ? `card-bookmark ${saved ? 'saved' : ''}` : `btn btn-${saved ? 'primary' : 'secondary'}`, disabled: busy, "aria-pressed": !!saved, "aria-label": `${saved ? 'Remove bookmark' : 'Bookmark'}: ${content.title}`, onClick: async () => {
            if (!user) {
                navigate('/login?next=' + encodeURIComponent(currentPath()));
                return;
            }
            setBusy(true);
            await perform(() => repository.toggleBookmark(content.id), saved ? 'Removed from your collection.' : 'Saved to your collection.');
            setBusy(false);
        } },
        React.createElement(Icon, { name: "bookmark", size: 18, fill: saved ? 'currentColor' : 'none' }),
        !compact && (saved ? 'Saved' : 'Save to collection'));
}
export function ContentCard({ content, reason }) { const { db, spoilerSafe } = useApp(); const cat = db?.categories.find(c => c.id === content.categoryId); return React.createElement("article", { className: "content-card", "data-testid": "content-card" },
    React.createElement("div", { className: "card-art" },
        React.createElement(Link, { to: '/content/' + content.id, tabIndex: -1, "aria-hidden": "true" },
            React.createElement("img", { src: content.image, alt: "", width: "640", height: "450", loading: "lazy", onError: e => { e.currentTarget.onerror = null; e.currentTarget.src = '/art/community.svg'; } })),
        React.createElement("span", { className: "type-badge" },
            React.createElement(Icon, { name: content.type === 'video' ? 'play' : content.type === 'audio' ? 'music' : content.type === 'character' ? 'user' : 'book', size: 12 }),
            typeLabels[content.type]),
        React.createElement(BookmarkButton, { content: content }),
        content.spoiler && spoilerSafe && React.createElement("span", { className: "spoiler-badge" },
            React.createElement(Icon, { name: "shield", size: 12 }),
            "Spoiler flagged")),
    React.createElement("div", { className: "card-body" },
        React.createElement("div", { className: "card-meta" },
            React.createElement("span", { style: { color: cat?.color } }, cat?.name || 'Community'),
            React.createElement("span", { className: "dot" }),
            React.createElement("span", null, content.fandom)),
        React.createElement("h3", null,
            React.createElement(Link, { to: '/content/' + content.id }, content.title)),
        React.createElement("p", null, content.description),
        React.createElement("div", { className: "card-bottom" },
            React.createElement("span", null,
                React.createElement(Icon, { name: "clock", size: 13 }),
                content.duration),
            React.createElement("span", { title: "Editorial score from the fictional demo dataset" },
                React.createElement(Icon, { name: "star", size: 13 }),
                content.rating > 0 ? content.rating.toFixed(1) : 'New')),
        reason && React.createElement("div", { className: "recommend-reason" },
            React.createElement(Icon, { name: "compass", size: 12 }),
            reason))); }
export function Gate({ admin = false, children }) {
    const { user } = useApp();
    if (!user)
        return React.createElement(Empty, { icon: "lock", title: "Your own corner of the universe", description: "Sign in to save discoveries, personalize your profile and share your stories." },
            React.createElement(Link, { className: "btn btn-primary", to: '/login?next=' + encodeURIComponent(currentPath()) },
                "Sign in ",
                React.createElement(Icon, { name: "arrow" })));
    if (admin && user.role !== 'admin')
        return React.createElement(Empty, { icon: "shield", title: "Admin access required", description: "This demo account does not have permission to open the editorial workspace." },
            React.createElement(Link, { className: "btn btn-secondary", to: "/dashboard" }, "Back to your dashboard"));
    return React.createElement(React.Fragment, null, children);
}
export function Notice({ children, kind = 'info' }) { return React.createElement("div", { className: `notice notice-${kind}` },
    React.createElement(Icon, { name: kind === 'success' ? 'check' : 'info', size: 18 }),
    React.createElement("div", null, children)); }
export function Field({ label, children, hint }) {
    const uid = useId(), controlId = 'field-' + uid, hintId = controlId + '-hint';
    let assigned = false;
    const attach = (node) => {
        if (!React.isValidElement(node))
            return node;
        const element = node;
        if (!assigned && typeof element.type === 'string' && ['input', 'select', 'textarea'].includes(element.type)) {
            assigned = true;
            return React.cloneElement(element, { id: controlId, 'aria-describedby': hint ? hintId : element.props['aria-describedby'] });
        }
        return element.props.children ? React.cloneElement(element, { children: React.Children.map(element.props.children, attach) }) : element;
    };
    return React.createElement("div", { className: "field" },
        React.createElement("label", { className: "field-label", htmlFor: controlId }, label),
        React.Children.map(children, attach),
        hint && React.createElement("small", { id: hintId }, hint));
}
export async function copyText(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    }
    catch { }
    return false;
}
export function downloadFile(name, content, mime = 'text/plain') { const blob = new Blob([content], { type: mime }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
