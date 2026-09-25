/** Browser simulator. All permissions here are UX checks, not a security boundary. */
import { initialSocial, knowledge } from "./seed.js";
const KEY = "fanhub.extensions.v3";
const uid = (prefix) => prefix + "-" + crypto.randomUUID();
function read() {
    try {
        const s = JSON.parse(localStorage.getItem(KEY) || "null");
        if (s?.schema === 3 && s.social?.posts && Array.isArray(s.campaigns))
            return s;
    }
    catch { }
    return { schema: 3, social: initialSocial(), campaigns: [], chats: {} };
}
function write(s) {
    try {
        localStorage.setItem(KEY, JSON.stringify(s));
    }
    catch {
        throw new Error("Storage is unavailable or full. Your change was not saved.");
    }
}
function actor(user, admin = false) {
    if (!user || user.suspended)
        throw new Error("Sign in with an active account to continue.");
    if (admin && user.role !== "admin")
        throw new Error("Administrator access required.");
    return user;
}
export const normalize = (s) => s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .toLowerCase();
export async function sha256(s) {
    if (!crypto.subtle)
        throw new Error("Secure browser cryptography is unavailable. Open this demo on localhost or HTTPS.");
    return [
        ...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))),
    ]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
}
export function quarter(now = new Date()) {
    const d = new Date(now.getTime() + 7 * 3600000), y = d.getUTCFullYear(), q = Math.floor(d.getUTCMonth() / 3);
    return {
        id: `${y}-Q${q + 1}`,
        title: `Quarter ${q + 1} / ${y}`,
        opensAt: new Date(Date.UTC(y, q * 3, 1, -7)).toISOString(),
        closesAt: new Date(Date.UTC(y, q * 3 + 3, 1, -7)).toISOString(),
        drawAt: new Date(Date.UTC(y, q * 3 + 3, 1, 13)).toISOString(),
    };
}
export async function rankTickets(seed, snapshotHash, tickets) {
    const key = await crypto.subtle.importKey("raw", new Uint8Array(seed.match(/../g).map((x) => parseInt(x, 16))), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const rows = await Promise.all(tickets.map(async (ticket) => ({
        ticket,
        score: [
            ...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(snapshotHash + "|" + ticket))),
        ]
            .map((x) => x.toString(16).padStart(2, "0"))
            .join(""),
    })));
    return rows
        .sort((a, b) => a.score.localeCompare(b.score) || a.ticket.localeCompare(b.ticket))
        .map((x) => x.ticket);
}
function validPost(p) {
    if (!["anime", "movies", "music"].includes(p.topic))
        throw new Error("Choose Anime, Movies or Music.");
    if (p.title.trim().length < 5 || p.title.length > 140)
        throw new Error("Use a title of 5-140 characters.");
    if (!p.subject.trim() || p.subject.length > 100)
        throw new Error("Add a work or discussion topic (up to 100 characters).");
    if (p.body.trim().length < 20 || p.body.length > 8000)
        throw new Error("Write 20-8,000 characters.");
    if (!Number.isInteger(p.rating) || p.rating < 0 || p.rating > 5)
        throw new Error("Choose an optional rating from 1 to 5.");
}
function findPost(s, id, user, published = false) {
    const p = s.social.posts.find((p) => p.id === id);
    if (!p ||
        (published && p.status !== "published") ||
        (!published &&
            p.status !== "published" &&
            p.authorId !== user?.id &&
            user?.role !== "admin"))
        throw new Error("This post is not available.");
    return p;
}
export const demo = {
    async social(user) {
        const s = read().social;
        const visible = s.posts.filter((p) => p.status === "published" ||
            p.authorId === user?.id ||
            user?.role === "admin");
        const ids = new Set(visible.map((p) => p.id));
        return {
            posts: visible,
            comments: s.comments
                .filter((c) => ids.has(c.postId))
                .map((c) => (c.hidden ? { ...c, body: "Comment removed." } : c)),
            reactions: s.reactions.filter((r) => ids.has(r.postId)),
            reports: user?.role === "admin" ? s.reports : [],
        };
    },
    async post(user, input, id, version) {
        const u = actor(user), s = read();
        validPost(input);
        if (id) {
            const p = findPost(s, id, u);
            if (p.authorId !== u.id)
                throw new Error("Only the author can edit this post.");
            if (p.version !== version)
                throw new Error("This post changed. Reload it before editing.");
            Object.assign(p, input, {
                status: "pending",
                reason: "",
                version: p.version + 1,
            });
        }
        else {
            s.social.posts.unshift({
                ...input,
                title: input.title.trim(),
                subject: input.subject.trim(),
                body: input.body.trim(),
                id: uid("post"),
                authorId: u.id,
                authorName: u.name,
                status: "pending",
                reason: "",
                version: 1,
                createdAt: new Date().toISOString(),
            });
        }
        write(s);
    },
    async removePost(user, id) {
        const u = actor(user), s = read(), p = findPost(s, id, u);
        if (p.authorId !== u.id && u.role !== "admin")
            throw new Error("You cannot remove another member's post.");
        p.status = "hidden";
        p.version++;
        write(s);
    },
    async moderate(user, id, decision, version, reason = "") {
        const u = actor(user, true), s = read(), p = findPost(s, id, u);
        if (p.authorId === u.id)
            throw new Error("An independent moderator must review your own post.");
        if (p.status !== "pending" || p.version !== version)
            throw new Error("The review is no longer current. Reload the queue.");
        if (!["published", "rejected"].includes(decision))
            throw new Error("Invalid review decision.");
        if (decision === "rejected" && reason.trim().length < 5)
            throw new Error("Explain the decision in at least 5 characters.");
        p.status = decision;
        p.reason = reason.slice(0, 500);
        p.version++;
        write(s);
    },
    async react(user, id, kind) {
        const u = actor(user), s = read();
        findPost(s, id, u, true);
        if (kind !== null && !["like", "heart"].includes(kind))
            throw new Error("Invalid reaction.");
        s.social.reactions = s.social.reactions.filter((r) => !(r.postId === id && r.userId === u.id));
        if (kind)
            s.social.reactions.push({ postId: id, userId: u.id, kind });
        write(s);
    },
    async comment(user, id, body, parentId = null) {
        const u = actor(user), s = read();
        findPost(s, id, u, true);
        if (!body.trim() || body.length > 1000)
            throw new Error("A comment must contain 1-1,000 characters.");
        if (parentId &&
            !s.social.comments.some((c) => c.id === parentId && c.postId === id && !c.parentId && !c.hidden))
            throw new Error("Reply to a visible top-level comment in this post.");
        s.social.comments.push({
            id: uid("comment"),
            postId: id,
            authorId: u.id,
            authorName: u.name,
            body: body.trim(),
            parentId,
            createdAt: new Date().toISOString(),
            hidden: false,
        });
        write(s);
    },
    async removeComment(user, id) {
        const u = actor(user), s = read(), c = s.social.comments.find((c) => c.id === id);
        if (!c || (c.authorId !== u.id && u.role !== "admin"))
            throw new Error("This comment cannot be removed by your account.");
        c.hidden = true;
        write(s);
    },
    async report(user, postId, reason, commentId = null) {
        const u = actor(user), s = read();
        findPost(s, postId, u, true);
        if (reason.trim().length < 5 || reason.length > 500)
            throw new Error("Give a reason of 5-500 characters.");
        if (commentId &&
            !s.social.comments.some((c) => c.id === commentId && c.postId === postId))
            throw new Error("Comment not found in this post.");
        if (s.social.reports.some((r) => r.postId === postId &&
            r.commentId === commentId &&
            r.userId === u.id &&
            !r.resolved))
            throw new Error("Your report is already in the review queue.");
        s.social.reports.push({
            id: uid("report"),
            postId,
            commentId,
            userId: u.id,
            reason: reason.trim(),
            resolved: false,
        });
        write(s);
    },
    async resolveReport(user, id, hide) {
        actor(user, true);
        const s = read(), r = s.social.reports.find((r) => r.id === id);
        if (!r)
            throw new Error("Report not found.");
        if (hide) {
            if (r.commentId) {
                const c = s.social.comments.find((c) => c.id === r.commentId);
                if (c)
                    c.hidden = true;
            }
            else {
                const p = s.social.posts.find((p) => p.id === r.postId);
                if (p) {
                    p.status = "hidden";
                    p.version++;
                }
            }
        }
        r.resolved = true;
        write(s);
    },
    async campaigns() {
        const s = read();
        return s.campaigns
            .map((c) => ({ id: c.id, title: c.title, status: c.status }))
            .sort((a, b) => b.id.localeCompare(a.id));
    },
    async campaign(user, id) {
        let s = read();
        const q = quarter();
        let c = s.campaigns.find((c) => c.id === (id || q.id));
        if (!c) {
            if (id && id !== q.id)
                throw new Error("Campaign not found.");
            const bytes = crypto.getRandomValues(new Uint8Array(32)), seed = [...bytes].map((x) => x.toString(16).padStart(2, "0")).join("");
            const commitment = await sha256(seed);
            s = read();
            c = s.campaigns.find((c) => c.id === q.id);
            if (!c) {
                c = {
                    ...q,
                    status: "open",
                    demo: true,
                    termsVersion: "demo-1",
                    seedCommitment: commitment,
                    snapshotHash: null,
                    seedReveal: null,
                    privateSeed: seed,
                    entries: [],
                    snapshot: [],
                    winners: [],
                    audit: [],
                    prizes: [
                        {
                            id: "prize-seoul",
                            rank: 1,
                            title: "A journey to South Korea",
                            subtitle: "One proposed travel prize / illustrative only",
                            kind: "seoul",
                        },
                        {
                            id: "prize-dalat",
                            rank: 2,
                            title: "A slow escape to Da Lat",
                            subtitle: "One proposed trip / illustrative only",
                            kind: "dalat",
                        },
                        {
                            id: "prize-cinema",
                            rank: 3,
                            title: "Your next cinema night",
                            subtitle: "One proposed cinema ticket / illustrative only",
                            kind: "cinema",
                        },
                    ],
                };
                s.campaigns.push(c);
                write(s);
            }
        }
        const { privateSeed, entries, ...pub } = c;
        return {
            ...pub,
            entryCount: entries.length,
            myEntry: entries.find((e) => e.userId === user?.id) || null,
        };
    },
    async enter(user, id, agree) {
        const u = actor(user);
        if (u.role === "admin")
            throw new Error("Promoter accounts do not participate.");
        if (!agree)
            throw new Error("Read and accept the rules first.");
        const s = read(), c = s.campaigns.find((c) => c.id === id);
        if (!c ||
            c.status !== "open" ||
            Date.now() < Date.parse(c.opensAt) ||
            Date.now() >= Date.parse(c.closesAt))
            throw new Error("Entries for this quarter are closed.");
        if (c.entries.some((e) => e.userId === u.id))
            return;
        const ticket = "FH-" + crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
        c.entries.push({
            ticket,
            userId: u.id,
            joinedAt: new Date().toISOString(),
            termsVersion: c.termsVersion,
        });
        c.audit.push({ event: "entry-recorded", at: new Date().toISOString() });
        write(s);
    },
    async freeze(user, id) {
        actor(user, true);
        let s = read(), c = s.campaigns.find((c) => c.id === id);
        if (!c || c.status !== "open")
            throw new Error("Only an open demo campaign can be locked.");
        if (!c.entries.length)
            throw new Error("At least one member must enter before a demo draw.");
        const tickets = c.entries.map((e) => e.ticket).sort(), hash = await sha256(tickets.join("\n"));
        s = read();
        c = s.campaigns.find((c) => c.id === id);
        if (!c || c.status !== "open" || c.entries.length !== tickets.length)
            throw new Error("Entries changed. Lock the snapshot again.");
        c.status = "locked";
        c.snapshot = tickets;
        c.snapshotHash = hash;
        c.audit.push({
            event: "demo-snapshot-locked",
            at: new Date().toISOString(),
        });
        write(s);
    },
    async draw(user, id) {
        actor(user, true);
        let s = read(), c = s.campaigns.find((c) => c.id === id);
        if (!c)
            throw new Error("Campaign not found.");
        if (c.status === "drawn")
            return;
        if (c.status !== "locked" || !c.snapshotHash)
            throw new Error("Lock the entry snapshot first.");
        const ordered = await rankTickets(c.privateSeed, c.snapshotHash, c.snapshot);
        s = read();
        c = s.campaigns.find((c) => c.id === id);
        if (!c || c.status !== "locked")
            return;
        c.winners = c.prizes
            .slice()
            .sort((a, b) => a.rank - b.rank)
            .slice(0, ordered.length)
            .map((p, i) => ({ ticket: ordered[i], prizeId: p.id, rank: p.rank }));
        c.seedReveal = c.privateSeed;
        c.status = "drawn";
        c.audit.push({
            event: "demo-result-recorded-once",
            at: new Date().toISOString(),
        });
        write(s);
    },
    async chat(user, question, safe, topic) {
        const q = normalize(question), stop = new Set("the a an and or of to in is it what how about tell me please can you this that with for phim ve la cua mot nhung va cac hay tom tat giai thich co che".split(" "));
        const words = [
            ...new Set(q.split(/\W+/).filter((w) => w.length > 1 && !stop.has(w))),
        ];
        const candidates = knowledge
            .filter((k) => k.status === "published" &&
            (!safe || k.spoilerLevel === 0) &&
            (!topic || k.topic === topic))
            .map((k) => {
            const aliases = k.aliases.map(normalize);
            const exact = aliases.some((a) => (" " + q + " ").includes(" " + a + " "));
            const titles = normalize(k.title + " " + k.aliases.join(" ")).split(/\W+/);
            const score = words.filter((w) => titles.includes(w)).length;
            return { k, score: exact ? 100 + score : score };
        })
            .filter((x) => x.score >= 2)
            .sort((a, b) => b.score - a.score);
        await new Promise((r) => setTimeout(r, 380));
        if (!candidates.length)
            return {
                text: "No matching approved source is available. Please specify the exact title, year or adaptation. This preview extracts library notes; it does not generate film summaries from a model.",
                sources: [],
                mode: "no-source",
            };
        const k = candidates[0].k;
        return {
            text: k.body,
            sources: [
                {
                    id: k.id,
                    title: k.title,
                    label: k.sourceLabel,
                    path: "/knowledge/" + k.id,
                    sample: k.sample,
                    spoilerLevel: k.spoilerLevel,
                },
            ],
            mode: "extractive-demo",
        };
    },
    async history(user) {
        return read().chats[user?.id || "visitor"] || [];
    },
    async saveChat(user, messages) {
        const s = read();
        s.chats[user?.id || "visitor"] = messages.slice(-40);
        write(s);
    },
    async clearChat(user) {
        const s = read();
        delete s.chats[user?.id || "visitor"];
        write(s);
    },
};
export async function verifyCampaignRecord(c) {
    if (c.status !== "drawn" ||
        !c.seedReveal ||
        !c.snapshotHash ||
        !c.snapshot.length)
        return false;
    if (!/^[a-f0-9]{64}$/i.test(c.seedReveal))
        return false;
    if (new Set(c.snapshot).size !== c.snapshot.length ||
        [...c.snapshot].sort().join("\n") !== c.snapshot.join("\n"))
        return false;
    if ((await sha256(c.seedReveal)) !== c.seedCommitment ||
        (await sha256(c.snapshot.join("\n"))) !== c.snapshotHash)
        return false;
    const ranked = await rankTickets(c.seedReveal, c.snapshotHash, c.snapshot), prizes = [...c.prizes].sort((a, b) => a.rank - b.rank), winners = [...c.winners].sort((a, b) => a.rank - b.rank);
    if (winners.length !== Math.min(ranked.length, prizes.length))
        return false;
    return winners.every((w, i) => w.ticket === ranked[i] &&
        w.prizeId === prizes[i].id &&
        w.rank === prizes[i].rank);
}
