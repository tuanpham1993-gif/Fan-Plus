import React, { useEffect, useState, useCallback } from "react";
import { useApp } from "../lib/store.js";
import { Link, navigate } from "../lib/router.js";
import { Icon, Button, Modal, Empty } from "../components/ui.js";
import { gateway } from "./gateway.js";
import { serverMode } from "./http.js";
import { verifyCampaignRecord } from "./demo.js";
const format = (s) => new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
}).format(new Date(s));
function Countdown({ end }) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(id);
    }, []);
    const diff = Math.max(0, Date.parse(end) - now), d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60;
    return (React.createElement("div", { className: "quarter-countdown", "aria-label": "Time until entry closes" }, [
        [d, "DAYS"],
        [h, "HOURS"],
        [m, "MINUTES"],
    ].map(([v, l]) => (React.createElement("div", { key: l },
        React.createElement("strong", null, String(v).padStart(2, "0")),
        React.createElement("span", null, l))))));
}
function PrizeArt({ prize: p }) {
    return (React.createElement("div", { className: "prize-art " + p.kind, "aria-label": "Illustrative artwork for " + p.title },
        React.createElement("span", { className: "prize-edition" },
            "FAN HUB JOURNEYS / 0",
            p.rank),
        p.kind === "seoul" ? (React.createElement(React.Fragment, null,
            React.createElement("span", { className: "destination-type" }, "SEOUL"),
            React.createElement("div", { className: "city-sun" }),
            React.createElement("div", { className: "city-silhouette", "aria-hidden": "true" }, [35, 57, 76, 44, 92, 115, 53, 82, 62, 32].map((h, i) => (React.createElement("span", { key: i, style: { height: h + "px" } })))),
            React.createElement("div", { className: "destination-footer" },
                React.createElement("span", null,
                    "A DIFFERENT KIND",
                    React.createElement("br", null),
                    "OF DISCOVERY"),
                React.createElement(Icon, { name: "globe", size: 33 })))) : p.kind === "dalat" ? (React.createElement(React.Fragment, null,
            React.createElement("span", { className: "destination-type" }, "DA LAT"),
            React.createElement("div", { className: "mountain one" }),
            React.createElement("div", { className: "mountain two" }),
            React.createElement("div", { className: "mountain three" }),
            React.createElement("div", { className: "destination-footer" },
                React.createElement("span", null,
                    "A LITTLE SLOWER.",
                    React.createElement("br", null),
                    "A LITTLE CLOSER."),
                React.createElement(Icon, { name: "pin", size: 28 })))) : (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "cinema-lines" }),
            React.createElement("span", { className: "destination-type" },
                "ONE",
                React.createElement("br", null),
                "MORE",
                React.createElement("br", null),
                "STORY."),
            React.createElement("div", { className: "destination-footer" },
                React.createElement("span", null,
                    "THE BIG SCREEN",
                    React.createElement("br", null),
                    "IS CALLING"),
                React.createElement(Icon, { name: "film", size: 28 }))))));
}
export default function Giveaways() {
    const { user, notify } = useApp();
    const [campaign, setCampaign] = useState(null), [archive, setArchive] = useState([]), [selected, setSelected] = useState(""), [error, setError] = useState(""), [tab, setTab] = useState("prizes"), [join, setJoin] = useState(false), [agree, setAgree] = useState(false), [age, setAge] = useState(false), [busy, setBusy] = useState(false), [verify, setVerify] = useState(""), [confirmDraw, setConfirmDraw] = useState(false), [confirmFreeze, setConfirmFreeze] = useState(false);
    const load = useCallback(async () => {
        try {
            setCampaign(await gateway.campaign(user, selected || undefined));
            setArchive(await gateway.campaigns());
            setError("");
            setVerify("");
        }
        catch (e) {
            setError(e.message);
        }
    }, [user?.id, selected]);
    useEffect(() => {
        void load();
    }, [load]);
    async function run(fn, message) {
        setBusy(true);
        try {
            await fn();
            await load();
            notify(message);
            return true;
        }
        catch (e) {
            notify(e.message, "error");
            return false;
        }
        finally {
            setBusy(false);
        }
    }
    async function checkProof() {
        if (!campaign)
            return;
        try {
            const valid = await verifyCampaignRecord(campaign);
            setVerify(valid
                ? "Record consistency verified: seed commitment, snapshot and selected tickets match. This does not independently prove promoter fairness."
                : "Verification failed. Do not rely on this record.");
        }
        catch (e) {
            setVerify(e.message);
        }
    }
    if (error && !campaign)
        return (React.createElement(Empty, { title: "The quarter could not be loaded.", description: error },
            React.createElement(Button, { onClick: () => void load() }, "Try again")));
    if (!campaign)
        return (React.createElement("div", { className: "loading-page", role: "status" },
            React.createElement("span", { className: "spinner" }),
            "Opening this quarter..."));
    const c = campaign, open = c.status === "open" &&
        Date.now() >= Date.parse(c.opensAt) &&
        Date.now() < Date.parse(c.closesAt);
    return (React.createElement(React.Fragment, null,
        React.createElement("section", { className: "gifts-intro" },
            React.createElement("div", { className: "gifts-intro-copy" },
                React.createElement("span", { className: "eyebrow" }, "A SMALL THANK YOU, EVERY QUARTER"),
                React.createElement("h1", null,
                    "Beyond the screen.",
                    React.createElement("br", null),
                    React.createElement("em", null, "Into your next story.")),
                React.createElement("p", null,
                    "A community is made by the people who return.",
                    React.createElement("br", null),
                    "Here is a little space for possibility."),
                React.createElement("div", { className: "gifts-flags" },
                    React.createElement("span", null,
                        React.createElement(Icon, { name: "ticket", size: 16 }),
                        "One free entry"),
                    React.createElement("span", null,
                        React.createElement(Icon, { name: "shield", size: 16 }),
                        "No purchase"),
                    React.createElement("span", null, c.title))),
            React.createElement("div", { className: "quarter-stamp" },
                React.createElement("span", null, "FAN HUB"),
                React.createElement("strong", null, c.id.split("-")[1]),
                React.createElement("span", null,
                    c.id.split("-")[0],
                    " / MEMBER APPRECIATION"))),
        React.createElement("div", { className: "giveaway-disclosure" },
            React.createElement(Icon, { name: "info", size: 18 }),
            React.createElement("p", null,
                React.createElement("strong", null, "Demonstration campaign."),
                " Travel and cinema prizes are illustrative proposals. No sponsor, live promotion or actual prize entitlement is claimed.")),
        React.createElement("div", { className: "gifts-tabs" },
            React.createElement("div", { role: "group", "aria-label": "Quarterly gifts sections" }, [
                ["prizes", "This quarter"],
                ["entry", "My entry"],
                ["results", "Results & record"],
                ["rules", "How it works"],
            ].map(([id, label]) => (React.createElement("button", { key: id, className: tab === id ? "active" : "", "aria-pressed": tab === id, onClick: () => setTab(id) }, label)))),
            archive.length > 1 && (React.createElement("label", null,
                React.createElement("span", { className: "sr-only" }, "Campaign archive"),
                React.createElement("select", { value: selected || c.id, onChange: (e) => setSelected(e.target.value) }, archive.map((a) => (React.createElement("option", { key: a.id, value: a.id }, a.title)))))),
            React.createElement("span", { className: "quarter-state " + c.status },
                React.createElement("span", { className: "live-dot" }),
                c.status === "drawn"
                    ? "Result recorded"
                    : c.status === "locked"
                        ? "Entries locked"
                        : open
                            ? "Open for demo entries"
                            : "Entries closed")),
        tab === "prizes" && (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "gifts-layout" },
                React.createElement("section", { className: "prizes-grid", "aria-label": "Illustrative quarterly prizes" }, c.prizes.map((p) => (React.createElement("article", { key: p.id, className: "prize-card prize-" + p.rank },
                    React.createElement(PrizeArt, { prize: p }),
                    React.createElement("div", { className: "prize-info" },
                        React.createElement("span", { className: "prize-rank" },
                            "0",
                            p.rank,
                            " ",
                            React.createElement("span", null,
                                "/",
                                " ",
                                p.rank === 1
                                    ? "FIRST PRIZE"
                                    : p.rank === 2
                                        ? "SECOND PRIZE"
                                        : "THIRD PRIZE")),
                        React.createElement("h2", null, p.title),
                        React.createElement("p", null, p.subtitle),
                        React.createElement("small", null, p.kind === "seoul"
                            ? "Final itinerary, visa conditions and inclusions are not defined in this prototype."
                            : p.kind === "dalat"
                                ? "Dates, accommodation and transport are subject to a future approved prize specification."
                                : "Cinema, screening and validity must be specified before a live campaign.")))))),
                React.createElement("aside", { className: "entry-rail" },
                    React.createElement("div", { className: "entry-card" },
                        React.createElement("span", { className: "eyebrow" }, "YOUR NEXT CHAPTER"),
                        React.createElement("h2", null,
                            "A single entry.",
                            React.createElement("br", null),
                            "Equal possibilities."),
                        React.createElement("p", null, "No points to chase. No extra entries for posting or liking. Just one free entry per eligible account."),
                        React.createElement("span", { className: "countdown-label" }, "ENTRIES CLOSE IN"),
                        React.createElement(Countdown, { end: c.closesAt }),
                        c.myEntry ? (React.createElement("div", { className: "entry-success" },
                            React.createElement(Icon, { name: "check", size: 20 }),
                            React.createElement("strong", null, "Your demo entry is recorded."),
                            React.createElement("code", null, c.myEntry.ticket),
                            React.createElement("button", { onClick: () => setTab("entry") },
                                "View my ticket",
                                React.createElement(Icon, { name: "arrow", size: 16 })))) : (React.createElement(Button, { disabled: !open || user?.role === "admin", onClick: () => {
                                if (!user) {
                                    navigate("/login?next=/giveaways");
                                    return;
                                }
                                setAgree(false);
                                setAge(false);
                                setJoin(true);
                            } },
                            !open
                                ? "Entries are closed"
                                : user?.role === "admin"
                                    ? "Promoters do not enter"
                                    : "Enter this quarter",
                            React.createElement(Icon, { name: "arrow", size: 17 }))),
                        React.createElement("div", { className: "entry-meta" },
                            React.createElement("span", null, "Entries recorded"),
                            React.createElement("strong", null, c.entryCount)),
                        React.createElement("div", { className: "entry-meta" },
                            React.createElement("span", null, "Draw date (ICT)"),
                            React.createElement("strong", null, format(c.drawAt))),
                        React.createElement("button", { className: "small-link", onClick: () => setTab("rules") },
                            "Read the participation rules",
                            React.createElement(Icon, { name: "arrow", size: 15 }))),
                    React.createElement("div", { className: "entry-aside-note" },
                        React.createElement(Icon, { name: "book", size: 21 }),
                        React.createElement("p", null, "The draw happens on the server in connected mode. The interface only reveals the recorded result.")))),
            React.createElement("div", { className: "quarter-steps" },
                React.createElement("div", null,
                    React.createElement("span", null, "01"),
                    React.createElement("h3", null, "Make yourself at home."),
                    React.createElement("p", null, "Use an active member account. No payment is required.")),
                React.createElement("div", null,
                    React.createElement("span", null, "02"),
                    React.createElement("h3", null, "Choose to take part."),
                    React.createElement("p", null, "Read the rules and record one entry for the quarter.")),
                React.createElement("div", null,
                    React.createElement("span", null, "03"),
                    React.createElement("h3", null, "Return for the result."),
                    React.createElement("p", null, "Check the published ticket codes and the draw record."))))),
        tab === "entry" && (React.createElement("section", { className: "my-entry-section" }, !user ? (React.createElement(Empty, { icon: "ticket", title: "A place for your next chapter.", description: "Sign in to view your own quarterly entry. Other members' private details are never shown." },
            React.createElement(Link, { to: "/login?next=/giveaways", className: "btn btn-primary" }, "Sign in"))) : c.myEntry ? (React.createElement("div", { className: "member-ticket" },
            React.createElement("div", null,
                React.createElement("span", { className: "eyebrow" }, "FAN HUB / MEMBER ENTRY"),
                React.createElement("h2", null, c.title),
                React.createElement("p", null, "One person. One free entry. No purchase."),
                React.createElement("code", null, c.myEntry.ticket),
                React.createElement("span", null,
                    "Recorded ",
                    format(c.myEntry.joinedAt),
                    " ICT")),
            React.createElement("aside", null,
                React.createElement(Icon, { name: "ticket", size: 46 }),
                React.createElement("strong", null, "DEMO"),
                React.createElement("span", null, c.winners.some((w) => w.ticket === c.myEntry?.ticket)
                    ? "Selected in the demo draw"
                    : c.status === "drawn"
                        ? "Not selected this time"
                        : "Entry recorded")))) : (React.createElement(Empty, { icon: "ticket", title: "Your ticket is waiting.", description: "Read the rules, then choose to enter. Likes and comments never change the number of entries." },
            React.createElement(Button, { onClick: () => setTab("prizes") }, "Explore this quarter"))))),
        tab === "results" && (React.createElement("section", { className: "results-section" },
            React.createElement("div", { className: "results-heading" },
                React.createElement("span", { className: "eyebrow" }, "THIS QUARTER / THE DRAW RECORD"),
                React.createElement("h2", null, c.status === "drawn"
                    ? "The result is recorded."
                    : "The next chapter is still unwritten."),
                React.createElement("p", null, c.status === "drawn"
                    ? "Public results show random ticket codes, not email addresses or real names."
                    : "Results will appear after entries are locked and an administrator completes the demo draw.")),
            c.status === "drawn" ? (React.createElement("div", { className: "winner-grid" }, c.prizes.map((p) => {
                const w = c.winners.find((w) => w.prizeId === p.id);
                return (React.createElement("article", { key: p.id },
                    React.createElement("span", { className: "eyebrow" },
                        "PRIZE 0",
                        p.rank),
                    React.createElement(Icon, { name: "ticket", size: 30 }),
                    React.createElement("h3", null, p.title),
                    React.createElement("code", null, w?.ticket || "Not allocated"),
                    React.createElement("small", null, w
                        ? "Selected demo ticket / no real prize"
                        : "Fewer eligible entries than available prizes")));
            }))) : (React.createElement("div", { className: "waiting-result" },
                React.createElement("span", { className: "quarter-state" }, c.status === "locked"
                    ? "Snapshot locked"
                    : "Awaiting entry close"),
                React.createElement("strong", null,
                    format(c.drawAt),
                    " ICT"),
                React.createElement("span", null, "No winner has been selected."))),
            React.createElement("details", { className: "draw-record" },
                React.createElement("summary", null,
                    "Inspect the draw record",
                    React.createElement(Icon, { name: "shield", size: 18 })),
                React.createElement("div", null,
                    React.createElement("p", null,
                        React.createElement("strong", null, "Method:"),
                        " HMAC-SHA256 rank of unique tickets, without replacement. Each account can receive at most one prize."),
                    React.createElement("label", null,
                        "Seed commitment",
                        React.createElement("code", null, c.seedCommitment)),
                    React.createElement("label", null,
                        "Frozen entry-list hash",
                        React.createElement("code", null, c.snapshotHash || "Published after the snapshot is locked")),
                    React.createElement("label", null,
                        "Revealed seed",
                        React.createElement("code", null, c.seedReveal || "Published after the draw")),
                    !!c.snapshot.length && (React.createElement("details", null,
                        React.createElement("summary", null,
                            "Public snapshot (",
                            c.snapshot.length,
                            " tickets)"),
                        React.createElement("pre", null, c.snapshot.join("\n")))),
                    c.seedReveal && (React.createElement(Button, { variant: "secondary", onClick: () => void checkProof() },
                        "Verify record consistency",
                        React.createElement(Icon, { name: "check", size: 17 }))),
                    verify && React.createElement("p", { role: "status" }, verify),
                    React.createElement("p", { className: "small muted" }, "This verifies the record's internal consistency, not independence from the operator. A live campaign needs an approved process, external oversight and durable audit storage. Browser-demo data is editable by its owner."),
                    React.createElement("h3", null, "Campaign activity"),
                    c.audit
                        .filter((a) => !a.event.includes("entry-recorded"))
                        .map((a, i) => (React.createElement("p", { className: "audit-line", key: i },
                        a.event,
                        React.createElement("span", null,
                            format(a.at),
                            " ICT")))))))),
        tab === "rules" && (React.createElement("section", { className: "giveaway-rules" },
            React.createElement("span", { className: "eyebrow" },
                "PROTOTYPE RULES / ",
                c.termsVersion),
            React.createElement("h2", null, "Clear rules. No hidden mechanics."),
            React.createElement("p", null,
                React.createElement("strong", null, "Nature of this build."),
                " This is a free, non-commercial demonstration. It does not take payment, sell tickets, promise a real trip or collect passport details."),
            React.createElement("p", null,
                React.createElement("strong", null, "Eligibility proposal."),
                " One active, email-verified member account per person; adults aged 18 or over. Promoter/admin accounts do not participate. Age confirmation is self-declared in this prototype and is not identity verification."),
            React.createElement("p", null,
                React.createElement("strong", null, "Entry window."),
                " ",
                format(c.opensAt),
                " to",
                " ",
                format(c.closesAt),
                " ICT (closing instant excluded). Your entry is recorded only after you explicitly accept the rules. Every entry has equal weight; activity, likes and posting frequency add no entries."),
            React.createElement("p", null,
                React.createElement("strong", null, "Selection."),
                " The entry list is locked before the draw. Ticket codes are ranked using the committed random seed and the frozen list. Highest-ranked available tickets receive first, second and third prize, one prize per ticket. A repeated draw request returns the same saved result."),
            React.createElement("p", null,
                React.createElement("strong", null, "Odds."),
                " With N eligible unique entries and up to three prizes, a ticket's chance of receiving any prize under the specified random mechanism is min(3,N)/N. The final N is known only after the list is frozen. This is a mathematical description, not a certified fairness claim."),
            React.createElement("p", null,
                React.createElement("strong", null, "Rewards and claims."),
                " All three rewards are illustrative. A live campaign must define the organizer, budget, prize value, itinerary, visa/insurance/tax allocation, delivery dates, claim deadline, disputes, and any alternate-winner procedure before accepting entries. There is no live prize-claim or fulfillment feature here."),
            React.createElement("p", null,
                React.createElement("strong", null, "Privacy."),
                " Only ticket codes are published. Do not enter sensitive information. The browser preview remains local; the Flask extension mode stores data in the configured database."),
            React.createElement("p", null,
                React.createElement("strong", null, "Before going live."),
                " A responsible organizer must review applicable promotion, privacy and tax requirements. Free entry is not, on its own, a determination that no regulatory process applies. Real campaigns remain disabled in this build."))),
        user?.role === "admin" && (React.createElement("section", { className: "draw-admin" },
            React.createElement("div", null,
                React.createElement("span", { className: "eyebrow" }, "ADMIN / DEMONSTRATION CONTROLS"),
                React.createElement("h3", null, "Test the quarterly flow, without awarding a real prize."),
                React.createElement("p", null, "Only the demo may be closed early. The draw cannot be rerolled, and winners cannot be chosen by an administrator.")),
            React.createElement("div", null,
                React.createElement(Button, { variant: "secondary", disabled: busy || c.status !== "open" || !c.entryCount, onClick: () => setConfirmFreeze(true) }, "Lock demo entries"),
                React.createElement(Button, { disabled: busy || c.status !== "locked", onClick: () => setConfirmDraw(true) },
                    "Record demo draw",
                    React.createElement(Icon, { name: "arrow", size: 16 }))))),
        React.createElement("p", { className: "giveaway-runtime" }, serverMode
            ? "Connected Flask extension / server-side entry and draw storage"
            : "Browser-only simulation / not a secure or legally approved promotion"),
        React.createElement(Modal, { open: join, onClose: () => setJoin(false), title: "One entry. Your choice." },
            React.createElement("p", { className: "muted" },
                "You are entering ",
                c.title,
                ". The travel and cinema rewards are illustrative only."),
            React.createElement("div", { className: "join-rules" },
                React.createElement("label", { className: "check-row" },
                    React.createElement("input", { type: "checkbox", checked: agree, onChange: (e) => setAgree(e.target.checked) }),
                    "I have read and accept the demo rules. I understand no real prize is awarded."),
                React.createElement("label", { className: "check-row" },
                    React.createElement("input", { type: "checkbox", checked: age, onChange: (e) => setAge(e.target.checked) }),
                    "I confirm I am at least 18 and am not entering with multiple accounts.")),
            React.createElement("small", null, "In the browser preview, eligibility checks are simulated. A live service must verify eligibility on the server."),
            React.createElement("div", { className: "modal-actions" },
                React.createElement(Button, { variant: "secondary", onClick: () => setJoin(false) }, "Not now"),
                React.createElement(Button, { busy: busy, disabled: !agree || !age, onClick: async () => {
                        if (await run(() => gateway.enter(user, c.id, agree && age), "Your free demo entry is recorded."))
                            setJoin(false);
                    } },
                    "Record my entry",
                    React.createElement(Icon, { name: "ticket", size: 16 })))),
        React.createElement(Modal, { open: confirmFreeze, onClose: () => setConfirmFreeze(false), title: "Lock this demo's entry list?" },
            React.createElement("p", null, "New entries will stop. This action cannot be undone in the UI. Existing tickets will become the public, fixed snapshot."),
            React.createElement(Button, { busy: busy, onClick: async () => {
                    if (await run(() => gateway.freeze(user, c.id), "Demo entry list locked.")) {
                        setConfirmFreeze(false);
                        setTab("results");
                    }
                } }, "Confirm snapshot lock")),
        React.createElement(Modal, { open: confirmDraw, onClose: () => setConfirmDraw(false), title: "Record the demo draw once?" },
            React.createElement("p", null, "The server in connected mode selects and saves the result. This does not award real travel or cinema prizes. No reroll is available."),
            React.createElement(Button, { busy: busy, onClick: async () => {
                    if (await run(() => gateway.draw(user, c.id), "Demo result recorded.")) {
                        setConfirmDraw(false);
                        setTab("results");
                    }
                } }, "Confirm demo draw"))));
}
