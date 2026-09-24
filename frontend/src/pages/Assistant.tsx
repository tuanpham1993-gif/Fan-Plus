import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../lib/store';
import { Link } from '../lib/router';
import { normalize } from '../domain/logic';
import type { ChatMessage } from '../domain/types';
import { Button, Icon, Notice, PageHeading, Confirm } from '../components/ui';
const greeting: ChatMessage = { id: 'welcome', role: 'assistant', text: 'Hello, curious human. I can search this fictional demo catalog or answer an approved platform FAQ. Try "How do I bookmark?", "Neon Horizon" or "cosplay". I am a local search preview, not a connected AI model.' };
export default function Assistant() {
    const { db, user, spoilerSafe, notify } = useApp();
    const key = 'fanhub.chat.' + (user?.id || 'visitor');
    const [messages, setMessages] = useState<ChatMessage[]>(() => { try {
        const m = JSON.parse(localStorage.getItem(key) || 'null');
        return Array.isArray(m) && m.every(x => typeof x.text === 'string' && ['user', 'assistant'].includes(x.role)) ? m.slice(-60) : [greeting];
    }
    catch {
        return [greeting];
    } }), [draft, setDraft] = useState(''), [busy, setBusy] = useState(false), [category, setCategory] = useState(''), [confirm, setConfirm] = useState(false);
    const tail = useRef<HTMLDivElement>(null), timer = useRef<number | null>(null);
    useEffect(() => { try {
        localStorage.setItem(key, JSON.stringify(messages.slice(-60)));
    }
    catch {
        notify('Chat could not be saved on this device.', 'error');
    } tail.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' }); }, [messages, key, notify]);
    useEffect(() => () => { if (timer.current)
        window.clearTimeout(timer.current); }, []);
    if (!db)
        return null;
    const send = (text: string) => { const query = text.trim().slice(0, 2000); if (!query || busy)
        return; setDraft(''); setBusy(true); setMessages(m => [...m, { id: crypto.randomUUID(), role: 'user', text: query }]); timer.current = window.setTimeout(() => { const words = normalize(query).split(/\W+/).filter(w => w.length > 2 && !['the', 'how', 'can', 'you', 'and', 'are', 'for', 'this', 'about', 'what', 'does'].includes(w)); const rankedFaq = db.faqs.map(f => ({ f, score: words.filter(w => normalize(f.question + ' ' + f.answer).includes(w)).length })).sort((a, b) => b.score - a.score); const ranked = db.contents.filter(c => c.status === 'published' && (!spoilerSafe || !c.spoiler) && (!category || c.categoryId === category)).map(c => ({ c, score: words.filter(w => normalize([c.title, c.description, c.fandom, db.categories.find(x => x.id === c.categoryId)?.name, ...c.tags].join(' ')).includes(w)).length })).filter(x => x.score > 0).sort((a, b) => b.score - a.score); let answer: ChatMessage; if (rankedFaq[0]?.score >= 1 && (/bookmark|save|platform|account|payment|purchase|location|privacy|submit|review|assistant|chatbot/.test(normalize(query)))) {
        const f = rankedFaq[0].f;
        answer = { id: crypto.randomUUID(), role: 'assistant', text: f.answer + '\n\nSource: approved local FAQ - ' + f.question };
    }
    else if (ranked.length) {
        const items = ranked.slice(0, 3);
        answer = { id: crypto.randomUUID(), role: 'assistant', text: 'Here are published demo discoveries matching your words' + (category ? ' in ' + db.categories.find(c => c.id === category)?.name : '') + '. These are search matches, not an AI-generated answer. Open the source cards below to read more.', sourceIds: items.map(x => x.c.id) };
    }
    else {
        answer = { id: crypto.randomUUID(), role: 'assistant', text: 'I do not have a published source matching that question in this demo. I will not invent an answer. Try an exact fictional fandom name, select another category, or ask how bookmarking works.' };
    } setMessages(m => [...m, answer]); setBusy(false); }, 450); };
    return <><PageHeading eyebrow="A LITTLE GUIDANCE. A LOT TO DISCOVER." title="Meet your discovery guide." description="Ask about the platform, find a new world, and always see where the answer comes from."/><div className="assistant-layout"><aside className="assistant-sidebar panel"><span className="assistant-emblem"><Icon name="compass" size={35}/></span><h2>Your curiosity, with a compass.</h2><p className="muted">Search the original demo catalog and approved FAQs. No external AI request is made.</p><label className="field"><span>Keep the search in</span><select value={category} onChange={e => setCategory(e.target.value)}><option value="">All worlds</option>{db.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><h3>A few places to start</h3><div className="suggested-prompts">{['How do I bookmark?', 'Neon Horizon', 'Show me cosplay', 'Can I purchase merchandise?'].map(p => <button type="button" key={p} disabled={busy} onClick={() => send(p)}>{p}<Icon name="arrow" size={14}/></button>)}</div><p className="small muted">History belongs to this demo identity and stays on this browser. Maximum 60 recent messages are retained. No sensitive information, please.</p><Button variant="secondary" onClick={() => setConfirm(true)}><Icon name="trash" size={15}/>Clear conversation</Button></aside><section className="chat-panel"><div className="chat-head"><span className="assistant-mini"><Icon name="compass" size={20}/></span><div><strong>Fan Hub Guide</strong><small><span className="live-dot"/>Local search preview / No LLM connected</small></div><span className="tag">{spoilerSafe ? 'Flagged sources hidden' : 'All published sources'}</span></div><div className="chat-messages" role="log" aria-live="polite" aria-relevant="additions text">{messages.map(m => <article className={'chat-message ' + m.role} key={m.id}><span className="chat-avatar"><Icon name={m.role === 'assistant' ? 'compass' : 'user'} size={17}/></span><div><small>{m.role === 'assistant' ? 'Fan Hub Guide' : user?.name || 'You'}</small><p className="preserve-space">{m.text}</p>{m.sourceIds && <div className="chat-sources">{m.sourceIds.map(id => { const c = db.contents.find(c => c.id === id && c.status === 'published' && (!spoilerSafe || !c.spoiler)); return c ? <Link to={'/content/' + c.id} key={id}><img src={c.image} alt=""/><span><small>CATALOG SOURCE</small><strong>{c.title}</strong></span><Icon name="arrow" size={16}/></Link> : <p className="small muted" key={id}>This source is no longer available or is hidden by your spoiler preference.</p>; })}</div>}</div></article>)}{busy && <div className="chat-typing" role="status"><span className="spinner"/>Searching local sources...</div>}<div ref={tail}/></div><form className="chat-composer" onSubmit={e => { e.preventDefault(); send(draft); }}><label className="sr-only" htmlFor="chat-draft">Your question</label><input id="chat-draft" value={draft} onChange={e => setDraft(e.target.value)} maxLength={2000} placeholder="Where will your curiosity take you?" autoComplete="off"/><Button type="submit" busy={busy} disabled={!draft.trim()} aria-label="Send question"><Icon name="send" size={19}/></Button></form><div className="chat-disclaimer">Fictional catalog. Explicit sources. No generated lore or real-world event advice.</div></section></div><Confirm open={confirm} onClose={() => setConfirm(false)} title="Clear this conversation?" description="Only the current demo identity's local conversation will be removed." onConfirm={async () => setMessages([greeting])}/></>;
}
