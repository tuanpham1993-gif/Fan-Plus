import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../lib/store.js";
import { Link, useLocation } from "../lib/router.js";
import { Icon, Button, Confirm, PageHeading } from "../components/ui.js";
import { useLore, useLoreSource } from "./lore/hooks.js";
import { knowledge } from "./seed.js";
export const openLore = (question = "") => window.dispatchEvent(new CustomEvent("fanhub:open-lore", { detail: question }));
const questions = [
    "T\u00f3m t\u1eaft c\u01a1 ch\u1ebf V\u00f4 H\u1ea1 H\u1ea1n c\u1ee7a Gojo?",
    "T\u00f3m t\u1eaft Neon Horizon, kh\u00f4ng spoiler.",
    "How do I write a thoughtful film review?",
];
const FAB_MARGIN = 20;
const FAB_SIZE = 48;
const FAB_POS_KEY = "fanhub:lore-fab-pos";
const FAB_MOVE_EVENT = "fanhub:lore-fab-pos";
const POPUP_WIDTH = 400;
const POPUP_MAX_HEIGHT = 600;
const POPUP_GAP = 14;
const POPUP_MARGIN = 16;
const GREETINGS = [
    "Hi there! What can I help you with today?",
    "Hello! Which world are you curious about?",
    "Welcome to Fan Hub Plus! Need anything explained?",
    "Hi there! Curious about a character or a story? Ask me anything.",
    "Hey! Want a quick summary of a film or a character?",
    "Hello! I'm always happy to answer without spoiling anything.",
    "Welcome to Fan Hub Plus! Ask me anything about the story.",
    "Hello! Need a spoiler-safe explanation? I'm right here.",
];
const GREETING_SHOW_DELAY = 700;
const GREETING_HIDE_AFTER = 8000;
const GREETING_MARGIN = 16;
function greetingStyle(fab) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const onRight = fab.x + FAB_SIZE / 2 >= vw / 2;
    const style = {
        bottom: Math.max(GREETING_MARGIN, vh - fab.y + POPUP_GAP) + "px",
    };
    if (onRight)
        style.right = Math.max(GREETING_MARGIN, vw - fab.x - FAB_SIZE) + "px";
    else
        style.left = Math.max(GREETING_MARGIN, fab.x) + "px";
    return style;
}
function popupRect(fab) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const width = Math.min(POPUP_WIDTH, vw - POPUP_MARGIN * 2);
    const fabCenterX = fab.x + FAB_SIZE / 2;
    let left = fabCenterX < vw / 2 ? fab.x : fab.x + FAB_SIZE - width;
    left = Math.min(Math.max(left, POPUP_MARGIN), vw - width - POPUP_MARGIN);
    const fabCenterY = fab.y + FAB_SIZE / 2;
    const openUp = fabCenterY > vh / 2;
    let top, height;
    if (openUp) {
        height = Math.min(POPUP_MAX_HEIGHT, Math.max(280, fab.y - POPUP_GAP - POPUP_MARGIN));
        top = fab.y - POPUP_GAP - height;
    }
    else {
        height = Math.min(POPUP_MAX_HEIGHT, Math.max(280, vh - fab.y - FAB_SIZE - POPUP_GAP - POPUP_MARGIN));
        top = fab.y + FAB_SIZE + POPUP_GAP;
    }
    top = Math.min(Math.max(top, POPUP_MARGIN), vh - height - POPUP_MARGIN);
    return { left, top, width, height };
}
export function LoreFab() {
    const { pathname } = useLocation();
    const [pos, setPos] = useState(null);
    const [greeting, setGreeting] = useState(null);
    const dragState = useRef(null);
    const clamp = (x, y) => ({
        x: Math.min(Math.max(x, FAB_MARGIN), window.innerWidth - FAB_SIZE - FAB_MARGIN),
        y: Math.min(Math.max(y, FAB_MARGIN), window.innerHeight - FAB_SIZE - FAB_MARGIN),
    });
    useEffect(() => {
        let initial = null;
        try {
            const raw = localStorage.getItem(FAB_POS_KEY);
            if (raw)
                initial = JSON.parse(raw);
        }
        catch { }
        const fallback = {
            x: window.innerWidth - FAB_SIZE - FAB_MARGIN,
            y: window.innerHeight - FAB_SIZE - FAB_MARGIN,
        };
        setPos(clamp(initial?.x ?? fallback.x, initial?.y ?? fallback.y));
        const onResize = () => setPos((p) => (p ? clamp(p.x, p.y) : p));
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);
    useEffect(() => {
        if (pos)
            window.dispatchEvent(new CustomEvent(FAB_MOVE_EVENT, { detail: pos }));
    }, [pos]);
    useEffect(() => {
        if (pathname === "/assistant")
            return;
        const msg = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
        const showTimer = setTimeout(() => setGreeting(msg), GREETING_SHOW_DELAY);
        return () => clearTimeout(showTimer);
    }, []);
    useEffect(() => {
        if (!greeting)
            return;
        const hideTimer = setTimeout(() => setGreeting(null), GREETING_HIDE_AFTER);
        return () => clearTimeout(hideTimer);
    }, [greeting]);
    if (pathname === "/assistant")
        return null;
    return (React.createElement(React.Fragment, null,
        greeting && pos && (React.createElement("div", { className: "fab-greeting", style: greetingStyle(pos), role: "status" },
            React.createElement("button", { type: "button", className: "fab-greeting-dismiss", "aria-label": "Dismiss message", onClick: () => setGreeting(null) },
                React.createElement(Icon, { name: "close", size: 13 })),
            React.createElement("p", { onClick: () => {
                    setGreeting(null);
                    openLore();
                } }, greeting))),
        React.createElement("button", { type: "button", className: "assistant-fab", style: pos
                ? {
                    left: pos.x + "px",
                    top: pos.y + "px",
                    right: "auto",
                    bottom: "auto",
                }
                : undefined, title: "Ask Lore Master", "aria-label": "Open Lore Master chat", onPointerDown: (e) => {
                if (!pos)
                    return;
                e.target.setPointerCapture(e.pointerId);
                dragState.current = {
                    startX: e.clientX,
                    startY: e.clientY,
                    originX: pos.x,
                    originY: pos.y,
                    moved: false,
                    pointerId: e.pointerId,
                };
            }, onPointerMove: (e) => {
                const d = dragState.current;
                if (!d)
                    return;
                const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
                if (Math.abs(dx) > 4 || Math.abs(dy) > 4)
                    d.moved = true;
                if (d.moved)
                    setPos(clamp(d.originX + dx, d.originY + dy));
            }, onPointerUp: (e) => {
                const d = dragState.current;
                dragState.current = null;
                if (!d)
                    return;
                e.target.releasePointerCapture(d.pointerId);
                if (d.moved) {
                    setPos((p) => {
                        if (p) {
                            try {
                                localStorage.setItem(FAB_POS_KEY, JSON.stringify(p));
                            }
                            catch { }
                        }
                        return p;
                    });
                }
                else {
                    setGreeting(null);
                    openLore();
                }
            } },
            React.createElement(Icon, { name: "bot", size: 26 }))));
}
export function LoreDock() {
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false), [prompt, setPrompt] = useState(""), [fabPos, setFabPos] = useState(null);
    useEffect(() => {
        const listener = (e) => {
            setPrompt(e.detail || "");
            setOpen(true);
        };
        window.addEventListener("fanhub:open-lore", listener);
        return () => window.removeEventListener("fanhub:open-lore", listener);
    }, []);
    useEffect(() => {
        const listener = (e) => setFabPos(e.detail);
        window.addEventListener(FAB_MOVE_EVENT, listener);
        return () => window.removeEventListener(FAB_MOVE_EVENT, listener);
    }, []);
    useEffect(() => setOpen(false), [pathname]);
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === "Escape")
                setOpen(false);
        };
        const onResize = () => setFabPos((p) => (p ? { ...p } : p));
        window.addEventListener("keydown", onKey);
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("resize", onResize);
        };
    }, [open]);
    if (!open)
        return null;
    const rect = fabPos ? popupRect(fabPos) : null;
    return (React.createElement("div", { className: "lore-popup", role: "dialog", "aria-label": "Lore Master", style: rect
            ? {
                left: rect.left + "px",
                top: rect.top + "px",
                width: rect.width + "px",
                height: rect.height + "px",
                right: "auto",
                bottom: "auto",
            }
            : undefined },
        React.createElement("div", { className: "lore-popup-head" },
            React.createElement("h2", null, "Lore Master"),
            React.createElement("button", { type: "button", className: "icon-btn", onClick: () => setOpen(false), "aria-label": "Close Lore Master" },
                React.createElement(Icon, { name: "close" }))),
        React.createElement("div", { className: "lore-window" },
            React.createElement("div", { className: "lore-expand" },
                React.createElement("span", null, "Context beside your curiosity."),
                React.createElement(Link, { to: "/assistant" +
                        (prompt ? "?ask=" + encodeURIComponent(prompt) : ""), onClick: () => setOpen(false), "aria-label": "Open full Lore workspace" },
                    React.createElement(Icon, { name: "expand", size: 16 }),
                    "Full workspace")),
            React.createElement(ChatPanel, { compact: true, initialQuestion: prompt }))));
}
export function ChatPanel({ compact = false, initialQuestion = "", }) {
    const { spoilerSafe, notify } = useApp();
    const { messages, draft, setDraft, safe, setSafe, topic, setTopic, isLoading, isTyping, error, serviceMode, send, clearConversation, editLastQuestion, } = useLore(spoilerSafe);
    const [clear, setClear] = useState(false);
    const tail = useRef(null);
    const once = useRef(false);
    const lastNotifiedError = useRef("");
    useEffect(() => {
        tail.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [messages, isTyping]);
    useEffect(() => {
        if (!error) {
            lastNotifiedError.current = "";
            return;
        }
        if (error === lastNotifiedError.current)
            return;
        lastNotifiedError.current = error;
        notify(error, "error");
    }, [error, notify]);
    useEffect(() => {
        if (!isLoading && initialQuestion && !once.current) {
            once.current = true;
            void send(initialQuestion);
        }
    }, [initialQuestion, isLoading, send]);
    return (React.createElement("section", { className: "lore-chat " + (compact ? "compact" : ""), "aria-label": "Lore conversation" },
        React.createElement("div", { className: "lore-head" },
            React.createElement("span", { className: "lore-monogram" },
                "L",
                React.createElement("span", null, "m")),
            React.createElement("div", null,
                React.createElement("strong", null, "Lore Master"),
                React.createElement("span", { className: "lore-status" },
                    serviceMode,
                    " ",
                    React.createElement("span", { className: "status-divider" }, "/"),
                    " Source-aware answers")),
            React.createElement("button", { className: "icon-btn", title: "Clear conversation", "aria-label": "Clear conversation", onClick: () => setClear(true), disabled: isTyping || isLoading },
                React.createElement(Icon, { name: "trash", size: 17 }))),
        React.createElement("div", { className: "lore-controls" },
            React.createElement("label", { className: "check-row" },
                React.createElement("input", { type: "checkbox", checked: safe, onChange: (e) => setSafe(e.target.checked) }),
                "Spoiler-safe"),
            React.createElement("label", { className: "sr-only", htmlFor: compact ? "lore-topic-dock" : "lore-topic-page" }, "Knowledge collection"),
            React.createElement("select", { id: compact ? "lore-topic-dock" : "lore-topic-page", value: topic, onChange: (e) => setTopic(e.target.value) },
                React.createElement("option", { value: "" }, "All approved collections"),
                ["Jujutsu Kaisen", "Neon Horizon", "Community", "Fan Hub"].map((t) => (React.createElement("option", { key: t }, t))))),
        React.createElement("div", { className: "lore-transcript", role: "log", "aria-live": "polite", "aria-relevant": "additions text" },
            isLoading ? (React.createElement("p", { className: "muted" }, "Opening your conversation...")) : messages.length === 0 ? (React.createElement("div", { className: "lore-welcome" },
                React.createElement("span", { className: "eyebrow" }, "THE STORY BEHIND THE STORY"),
                React.createElement("h2", null,
                    "Less searching.",
                    React.createElement("br", null),
                    React.createElement("em", null, "More understanding.")),
                React.createElement("p", null, "A film introduction, a character's ability, or a second perspective. Start with what makes you curious."),
                React.createElement("div", { className: "lore-prompts" }, questions.map((q, i) => (React.createElement("button", { key: q, onClick: () => void send(q) },
                    React.createElement("span", { className: "prompt-number" },
                        "0",
                        i + 1),
                    React.createElement("span", null, q),
                    React.createElement(Icon, { name: "arrow", size: 16 }))))),
                React.createElement("small", null, "Without an AI key, answers are excerpts from the approved sample library rather than model-generated text."))) : (messages.map((m) => (React.createElement("article", { key: m.id, className: "lore-message " + m.role },
                React.createElement("small", null, m.role === "user" ? "YOU" : "LORE MASTER"),
                React.createElement("p", { className: "preserve-space" }, safe && m.sources?.some((s) => (s.spoilerLevel || 0) > 0)
                    ? "This earlier answer is hidden by your spoiler-safe setting."
                    : m.text),
                m.role === "assistant" && m.mode && (React.createElement("span", { className: "answer-mode" }, m.mode === "no-source"
                    ? "No matching source / no generation"
                    : m.mode.includes("extractive")
                        ? "Library excerpt / no LLM"
                        : "Generated answer / verify sources")),
                m.sources
                    ?.filter((s) => !safe || !s.spoilerLevel)
                    .map((s) => (React.createElement(Link, { key: s.id, className: "lore-source", to: s.path },
                    React.createElement(Icon, { name: "book", size: 17 }),
                    React.createElement("span", null,
                        React.createElement("strong", null, s.title),
                        React.createElement("small", null, s.sample
                            ? "Sample source / not canon-verified"
                            : s.label)),
                    React.createElement(Icon, { name: "arrow", size: 15 })))))))),
            isTyping && (React.createElement("div", { className: "lore-working", role: "status", "aria-live": "polite" },
                React.createElement("span", { className: "spinner" }),
                "Lore Master is typing...")),
            React.createElement("div", { ref: tail })),
        error && (React.createElement("div", { className: "lore-error", role: "alert" },
            error,
            React.createElement("button", { className: "small-link", onClick: editLastQuestion }, "Edit and retry"))),
        React.createElement("form", { className: "lore-compose", onSubmit: (e) => {
                e.preventDefault();
                void send(draft);
            } },
            React.createElement("label", { className: "sr-only", htmlFor: compact ? "question-dock" : "question-page" }, "Ask Lore Master"),
            React.createElement("textarea", { id: compact ? "question-dock" : "question-page", value: draft, onChange: (e) => setDraft(e.target.value), maxLength: 2000, rows: 2, placeholder: "Ask about a film, character or song...", onKeyDown: (e) => {
                    if (e.key === "Enter" &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        void send(draft);
                    }
                } }),
            React.createElement(Button, { type: "submit", busy: isTyping, disabled: !draft.trim() || isLoading, "aria-label": "Send to Lore Master" },
                React.createElement(Icon, { name: "send", size: 19 }))),
        React.createElement("div", { className: "lore-footnote" },
            React.createElement("span", null, serviceMode === "Sample library"
                ? "Local preview. Only this browser stores your conversation."
                : "Conversation history is managed by the Fan Hub service; AI mode may send retrieved passages to the configured provider."),
            React.createElement("span", null,
                draft.length,
                "/2000")),
        React.createElement(Confirm, { open: clear, onClose: () => setClear(false), title: "Clear this conversation?", description: "This removes the conversation for your current identity. It does not delete the source library.", onConfirm: async () => {
                const cleared = await clearConversation();
                if (cleared) {
                    setClear(false);
                    notify("Conversation cleared.");
                }
            } })));
}
export default function LorePage() {
    const { params } = useLocation();
    return (React.createElement(React.Fragment, null,
        React.createElement(PageHeading, { eyebrow: "A CLOSER LOOK AT THE WORLDS YOU LOVE", title: "Every story has another layer.", description: "Meet Lore Master: a reading companion with visible sources and a little respect for spoilers." }),
        React.createElement("div", { className: "lore-workspace" },
            React.createElement("aside", { className: "lore-library" },
                React.createElement("span", { className: "eyebrow" }, "YOUR READING COMPANION"),
                React.createElement("h2", null,
                    "Curiosity.",
                    React.createElement("br", null),
                    "With context."),
                React.createElement("p", null, "Ask in Vietnamese or English. Name the work and the part you want to understand."),
                React.createElement("div", { className: "lore-principles" },
                    React.createElement("div", null,
                        React.createElement(Icon, { name: "shield" }),
                        React.createElement("strong", null, "Spoilers are a choice."),
                        React.createElement("p", null, "Flagged passages are filtered before retrieval.")),
                    React.createElement("div", null,
                        React.createElement(Icon, { name: "book" }),
                        React.createElement("strong", null, "The source stays visible."),
                        React.createElement("p", null, "Open the actual note used in the answer.")),
                    React.createElement("div", null,
                        React.createElement(Icon, { name: "info" }),
                        React.createElement("strong", null, "No source? We say so."),
                        React.createElement("p", null, "A small sample library is not universal knowledge."))),
                React.createElement("span", { className: "eyebrow" }, "INSIDE THE SAMPLE LIBRARY"),
                knowledge
                    .filter((k) => k.spoilerLevel === 0)
                    .map((k) => (React.createElement(Link, { className: "library-link", key: k.id, to: "/knowledge/" + k.id },
                    k.title,
                    React.createElement(Icon, { name: "arrow", size: 15 }))))),
            React.createElement(ChatPanel, { initialQuestion: params.get("ask") || "" }))));
}
export function KnowledgePage({ id }) {
    const { doc, loading, error, notFound } = useLoreSource(id);
    if (loading) {
        return (React.createElement("div", { className: "page-heading" },
            React.createElement("h1", null, "Opening source...")));
    }
    if (!doc) {
        return (React.createElement("div", { className: "page-heading" },
            React.createElement("h1", null, notFound ? "Source not found." : error || "Source unavailable.")));
    }
    return (React.createElement("article", { className: "knowledge-page" },
        React.createElement(Link, { className: "text-link", to: "/assistant" },
            "Back to Lore Master",
            React.createElement(Icon, { name: "arrow", size: 16 })),
        React.createElement("span", { className: "eyebrow" },
            "KNOWLEDGE LIBRARY / ",
            doc.topic),
        React.createElement("h1", null, doc.title),
        React.createElement("div", { className: "source-disclosure" },
            React.createElement(Icon, { name: "info", size: 20 }),
            React.createElement("p", null,
                doc.sourceLabel,
                ".",
                " ",
                doc.sample
                    ? "This is demonstration material, not an independently verified reference."
                    : "")),
        React.createElement("p", { className: "preserve-space" }, doc.body),
        doc.relatedPath && (React.createElement(Link, { to: doc.relatedPath, className: "text-link" },
            "Open related catalog entry",
            React.createElement(Icon, { name: "arrow", size: 16 }))),
        React.createElement(Button, { onClick: () => openLore("Explain " + doc.title), variant: "secondary" },
            "Ask about this note",
            React.createElement(Icon, { name: "chat", size: 17 }))));
}
