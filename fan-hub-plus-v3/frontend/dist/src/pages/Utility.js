import React from "react";
import { useApp } from "../lib/store.js";
import { Link } from "../lib/router.js";
import { PageHeading, Icon, Empty, Crumbs, Notice } from "../components/ui.js";
const groups = [
    {
        title: "Discover",
        links: [
            ["/", "Home"],
            ["/explore", "All discoveries"],
            ["/media", "Multimedia center"],
            ["/characters", "Character profiles"],
            ["/showcase", "Merchandise showcase"],
            ["/releases", "Release calendar"],
            ["/events", "Events, calendar and map"],
            ["/community", "Community conversations"],
            ["/giveaways", "Quarterly gifts"],
        ],
    },
    {
        title: "Your workspace",
        links: [
            ["/dashboard", "Personal dashboard"],
            ["/collection", "Bookmarks and private notes"],
            ["/profile", "Profile and reading preferences"],
            ["/submit", "Submit a fan story"],
        ],
    },
    {
        title: "Help and access",
        links: [
            ["/assistant", "Lore Master workspace"],
            ["/feedback", "Feedback and FAQs"],
            ["/privacy", "Demo privacy information"],
            ["/login", "Sign in"],
            ["/register", "Register"],
            ["/forgot-password", "Password reset"],
            ["/verify-email", "Email verification handoff"],
        ],
    },
    {
        title: "Administration",
        links: [
            ["/admin", "Admin overview"],
            ["/admin?tab=content", "Content and media"],
            ["/admin?tab=categories", "Categories"],
            ["/admin?tab=events", "Events"],
            ["/admin?tab=submissions", "Fan review queue"],
            ["/admin?tab=users", "User management"],
            ["/admin?tab=feedback", "Feedback management"],
            ["/admin?tab=knowledge", "Knowledge base"],
        ],
    },
];
export default function Utility({ mode }) {
    const { db } = useApp();
    if (mode === "sitemap")
        return (React.createElement(React.Fragment, null,
            React.createElement(Crumbs, { items: [{ label: "Sitemap" }] }),
            React.createElement(PageHeading, { eyebrow: "EVERY PATH THROUGH THE UNIVERSE", title: "Find your way.", description: "A complete navigation map. Personal pages require sign-in and editorial tools require the demo administrator." }),
            React.createElement("div", { className: "sitemap-grid" }, groups.map((g) => (React.createElement("section", { className: "panel", key: g.title },
                React.createElement("h2", null, g.title),
                g.links.map(([to, label]) => (React.createElement(Link, { className: "sitemap-link", to: to, key: to },
                    label,
                    React.createElement(Icon, { name: "arrow", size: 15 })))))))),
            React.createElement("section", { className: "panel" },
                React.createElement("h2", null, "Browse by category"),
                React.createElement("div", { className: "tag-list" }, db?.categories.map((c) => (React.createElement(Link, { to: "/explore?category=" + c.id, key: c.id, className: "tag" }, c.name)))))));
    if (mode === "privacy")
        return (React.createElement(React.Fragment, null,
            React.createElement(Crumbs, { items: [{ label: "Demo privacy" }] }),
            React.createElement(PageHeading, { eyebrow: "CLEAR BOUNDARIES, BETTER TRUST", title: "Your data in this preview.", description: "This is an implementation note for the frontend prototype, not a production privacy policy." }),
            React.createElement("article", { className: "panel prose" },
                React.createElement("h2", null, "V3: two clearly separated modes"),
                React.createElement("p", null, "The Node preview stores community posts, reactions, comments, entries and Lore history on this device. In connected Flask mode, these three new modules and account authentication use the server database. The original V1 catalog tools remain local demonstrations. Browser state is never a trusted authorization source for Flask."),
                React.createElement("p", null, "The Lore provider is optional. If enabled by the operator, the current question, up to two previous user questions and retrieved editorial excerpts are sent to the configured AI provider. No email, password or prize entry list is sent to the model. Responses API requests use store=false; this does not, by itself, define the provider's complete retention policy. Server chat records are capped at 40 messages per identity; the operator must schedule the 30-day pruning command. Anonymous history uses a pseudonymous session; signed-in history is private to that account."),
                React.createElement("h2", null, "What stays on this browser"),
                React.createElement("p", null, "Profile edits, bookmarks, notes, ratings, fan stories, feedback, administrator edits and conversation history are stored in localStorage. A demo identity and demo password verifiers are stored in sessionStorage. Anyone with access to this browser or its developer tools can inspect or alter this data. Do not use a real password or enter private information."),
                React.createElement("h2", null, "What leaves this browser"),
                React.createElement("p", null, "In browser-preview mode, core browsing uses local files and makes no AI or backend requests. The connected extension mode is described above. If you explicitly enable the online map, the browser loads OpenStreetMap and sends ordinary network metadata such as your IP address to that provider. An organizer link opens the supplied external HTTPS website. Images you upload as a demo avatar are resized locally and are not uploaded to a server."),
                React.createElement("h2", null, "Location permission"),
                React.createElement("p", null, "Location is requested only when you press the nearby-events button. Coordinates remain in the current page's memory. They are not saved in the demo database. Denying permission leaves the city filter and calendar available. The map is centered on the selected fictional event, not your precise GPS position."),
                React.createElement("h2", null, "Reset and deletion"),
                React.createElement("p", null, "Use Clear conversation for the current Lore history. Profile > Reset all demo data resets the original V1 catalog records only. To reset all V3 browser features, clear this site's browser storage. Server-side campaigns cannot be reset from the browser; this deliberately prevents rerolling a recorded result. Theme and font preferences remain. Clearing site storage in your browser also removes them. Deleted content is removed from related local bookmarks, ratings and reading history."),
                React.createElement("h2", null, "Before a public launch"),
                React.createElement("p", null, "The team must implement and validate server authorization, secure sessions, CSRF protection, verification and reset emails, data retention, consent controls, abuse prevention and a privacy policy that matches the deployed system. Local route guards are not security controls."),
                React.createElement(Notice, null, "Original fictional universes, illustrations, audio and event examples in this package are development fixtures. The Gojo note is explicitly labeled as an unverified illustrative lore example. There is no store, payment gateway or real event ticket inventory."))));
    return (React.createElement(Empty, { icon: "globe", title: "This world is still uncharted.", description: "The page does not exist, or this discovery is no longer available. Let's get you back to familiar ground." },
        React.createElement(Link, { className: "btn btn-primary", to: "/" },
            "Back to discovery ",
            React.createElement(Icon, { name: "arrow", size: 17 }))));
}
