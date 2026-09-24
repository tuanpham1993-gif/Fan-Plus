import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../lib/store.js';
import { Link } from '../lib/router.js';
import { normalize } from '../domain/logic.js';
import { Button, Icon, PageHeading, Confirm } from '../components/ui.js';
const greeting = { id: 'welcome', role: 'assistant', text: 'Hello, curious human. I can search this fictional demo catalog or answer an approved platform FAQ. Try "How do I bookmark?", "Neon Horizon" or "cosplay". I am a local search preview, not a connected AI model.' };
export default function Assistant() {
    const { db, user, spoilerSafe, notify } = useApp();
    const key = 'fanhub.chat.' + (user?.id || 'visitor');
    const [messages, setMessages] = useState(() => {
        try {
            const m = JSON.parse(localStorage.getItem(key) || 'null');
            return Array.isArray(m) && m.every(x => typeof x.text === 'string' && ['user', 'assistant'].includes(x.role)) ? m.slice(-60) : [greeting];
        }
        catch {
            return [greeting];
        }
    }), [draft, setDraft] = useState(''), [busy, setBusy] = useState(false), [category, setCategory] = useState(''), [confirm, setConfirm] = useState(false);
    const tail = useRef(null), timer = useRef(null);
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(messages.slice(-60)));
        }
        catch {
            notify('Chat could not be saved on this device.', 'error');
        }
        tail.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
    }, [messages, key, notify]);
    useEffect(() => () => {
        if (timer.current)
            window.clearTimeout(timer.current);
    }, []);
    if (!db)
        return null;
    const send = (text) => {
        const query = text.trim().slice(0, 2000);
        if (!query || busy)
            return;
        setDraft('');
        setBusy(true);
        setMessages(m => [...m, { id: crypto.randomUUID(), role: 'user', text: query }]);
        timer.current = window.setTimeout(() => {
            const words = normalize(query).split(/\W+/).filter(w => w.length > 2 && !['the', 'how', 'can', 'you', 'and', 'are', 'for', 'this', 'about', 'what', 'does'].includes(w));
            const rankedFaq = db.faqs.map(f => ({ f, score: words.filter(w => normalize(f.question + ' ' + f.answer).includes(w)).length })).sort((a, b) => b.score - a.score);
            const ranked = db.contents.filter(c => c.status === 'published' && (!spoilerSafe || !c.spoiler) && (!category || c.categoryId === category)).map(c => ({ c, score: words.filter(w => normalize([c.title, c.description, c.fandom, db.categories.find(x => x.id === c.categoryId)?.name, ...c.tags].join(' ')).includes(w)).length })).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
            let answer;
            if (rankedFaq[0]?.score >= 1 && (/bookmark|save|platform|account|payment|purchase|location|privacy|submit|review|assistant|chatbot/.test(normalize(query)))) {
                const f = rankedFaq[0].f;
                answer = { id: crypto.randomUUID(), role: 'assistant', text: f.answer + '\n\nSource: approved local FAQ - ' + f.question };
            }
            else if (ranked.length) {
                const items = ranked.slice(0, 3);
                answer = { id: crypto.randomUUID(), role: 'assistant', text: 'Here are published demo discoveries matching your words' + (category ? ' in ' + db.categories.find(c => c.id === category)?.name : '') + '. These are search matches, not an AI-generated answer. Open the source cards below to read more.', sourceIds: items.map(x => x.c.id) };
            }
            else {
                answer = { id: crypto.randomUUID(), role: 'assistant', text: 'I do not have a published source matching that question in this demo. I will not invent an answer. Try an exact fictional fandom name, select another category, or ask how bookmarking works.' };
            }
            setMessages(m => [...m, answer]);
            setBusy(false);
        }, 450);
    };
    return React.createElement(React.Fragment, null,
        React.createElement(PageHeading, { eyebrow: "A LITTLE GUIDANCE. A LOT TO DISCOVER.", title: "Meet your discovery guide.", description: "Ask about the platform, find a new world, and always see where the answer comes from." }),
        React.createElement("div", { className: "assistant-layout" },
            React.createElement("aside", { className: "assistant-sidebar panel" },
                React.createElement("span", { className: "assistant-emblem" },
                    React.createElement(Icon, { name: "compass", size: 35 })),
                React.createElement("h2", null, "Your curiosity, with a compass."),
                React.createElement("p", { className: "muted" }, "Search the original demo catalog and approved FAQs. No external AI request is made."),
                React.createElement("label", { className: "field" },
                    React.createElement("span", null, "Keep the search in"),
                    React.createElement("select", { value: category, onChange: e => setCategory(e.target.value) },
                        React.createElement("option", { value: "" }, "All worlds"),
                        db.categories.map(c => React.createElement("option", { key: c.id, value: c.id }, c.name)))),
                React.createElement("h3", null, "A few places to start"),
                React.createElement("div", { className: "suggested-prompts" }, ['How do I bookmark?', 'Neon Horizon', 'Show me cosplay', 'Can I purchase merchandise?'].map(p => React.createElement("button", { type: "button", key: p, disabled: busy, onClick: () => send(p) },
                    p,
                    React.createElement(Icon, { name: "arrow", size: 14 })))),
                React.createElement("p", { className: "small muted" }, "History belongs to this demo identity and stays on this browser. Maximum 60 recent messages are retained. No sensitive information, please."),
                React.createElement(Button, { variant: "secondary", onClick: () => setConfirm(true) },
                    React.createElement(Icon, { name: "trash", size: 15 }),
                    "Clear conversation")),
            React.createElement("section", { className: "chat-panel" },
                React.createElement("div", { className: "chat-head" },
                    React.createElement("span", { className: "assistant-mini" },
                        React.createElement(Icon, { name: "compass", size: 20 })),
                    React.createElement("div", null,
                        React.createElement("strong", null, "Fan Hub Guide"),
                        React.createElement("small", null,
                            React.createElement("span", { className: "live-dot" }),
                            "Local search preview / No LLM connected")),
                    React.createElement("span", { className: "tag" }, spoilerSafe ? 'Flagged sources hidden' : 'All published sources')),
                React.createElement("div", { className: "chat-messages", role: "log", "aria-live": "polite", "aria-relevant": "additions text" },
                    messages.map(m => React.createElement("article", { className: 'chat-message ' + m.role, key: m.id },
                        React.createElement("span", { className: "chat-avatar" },
                            React.createElement(Icon, { name: m.role === 'assistant' ? 'compass' : 'user', size: 17 })),
                        React.createElement("div", null,
                            React.createElement("small", null, m.role === 'assistant' ? 'Fan Hub Guide' : user?.name || 'You'),
                            React.createElement("p", { className: "preserve-space" }, m.text),
                            m.sourceIds && React.createElement("div", { className: "chat-sources" }, m.sourceIds.map(id => { const c = db.contents.find(c => c.id === id && c.status === 'published' && (!spoilerSafe || !c.spoiler)); return c ? React.createElement(Link, { to: '/content/' + c.id, key: id },
                                React.createElement("img", { src: c.image, alt: "" }),
                                React.createElement("span", null,
                                    React.createElement("small", null, "CATALOG SOURCE"),
                                    React.createElement("strong", null, c.title)),
                                React.createElement(Icon, { name: "arrow", size: 16 })) : React.createElement("p", { className: "small muted", key: id }, "This source is no longer available or is hidden by your spoiler preference."); }))))),
                    busy && React.createElement("div", { className: "chat-typing", role: "status" },
                        React.createElement("span", { className: "spinner" }),
                        "Searching local sources..."),
                    React.createElement("div", { ref: tail })),
                React.createElement("form", { className: "chat-composer", onSubmit: e => { e.preventDefault(); send(draft); } },
                    React.createElement("label", { className: "sr-only", htmlFor: "chat-draft" }, "Your question"),
                    React.createElement("input", { id: "chat-draft", value: draft, onChange: e => setDraft(e.target.value), maxLength: 2000, placeholder: "Where will your curiosity take you?", autoComplete: "off" }),
                    React.createElement(Button, { type: "submit", busy: busy, disabled: !draft.trim(), "aria-label": "Send question" },
                        React.createElement(Icon, { name: "send", size: 19 }))),
                React.createElement("div", { className: "chat-disclaimer" }, "Fictional catalog. Explicit sources. No generated lore or real-world event advice."))),
        React.createElement(Confirm, { open: confirm, onClose: () => setConfirm(false), title: "Clear this conversation?", description: "Only the current demo identity's local conversation will be removed.", onConfirm: async () => setMessages([greeting]) }));
}
