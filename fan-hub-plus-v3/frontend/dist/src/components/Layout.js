import { LoreDock, LoreFab, openLore } from "../features/Lore.js";
import { serverMode } from "../features/http.js";
import React, { useEffect, useState } from "react";
import { Link, navigate, useLocation } from "../lib/router.js";
import { useApp } from "../lib/store.js";
import { repository } from "../services/repository.js";
import { Icon, Button, Modal } from "./ui.js";
export function Logo() {
    return (React.createElement(Link, { to: "/", className: "brand", "aria-label": "Fan Hub Plus home" },
        React.createElement("span", null,
            "fan",
            React.createElement("span", { className: "brand-light" }, "hub"),
            React.createElement("sup", null, "+"))));
}
const nav = [
    ["/", "Discover"],
    ["/explore", "Explore"],
    ["/community", "Community"],
    ["/events", "Events"],
    ["/giveaways", "Quarterly gifts"],
];
export default function Layout({ children }) {
    const { pathname } = useLocation();
    const { user, db, theme, toggleTheme, fontScale, setFontScale, spoilerSafe, toggleSpoilers, notices, perform, } = useApp();
    const [menu, setMenu] = useState(false), [search, setSearch] = useState(false), [q, setQ] = useState("");
    useEffect(() => {
        setMenu(false);
        const el = document.getElementById("main");
        el?.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: "instant" });
    }, [pathname]);
    useEffect(() => {
        const key = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setSearch((s) => !s);
            }
        };
        window.addEventListener("keydown", key);
        return () => window.removeEventListener("keydown", key);
    }, []);
    const navLinks = nav.map(([to, label]) => (React.createElement(Link, { key: to, to: to, "aria-current": pathname === to ? "page" : undefined, className: pathname === to ? "active" : "" }, label)));
    return (React.createElement(React.Fragment, null,
        React.createElement("a", { className: "skip-link", href: "#main" }, "Skip to content"),
        React.createElement("div", { className: "demo-strip" },
            React.createElement("span", null,
                React.createElement("span", { className: "live-dot" }),
                serverMode
                    ? "Flask-connected extensions"
                    : "Interactive preview",
                " ",
                React.createElement("span", { className: "strip-separator" }, "/"),
                " Sample content and illustrative rewards"),
            React.createElement(Link, { to: "/privacy" },
                "About this demo ",
                React.createElement(Icon, { name: "arrow", size: 12 }))),
        React.createElement("header", { className: "site-header" },
            React.createElement("div", { className: "header-inner" },
                React.createElement(Logo, null),
                React.createElement("nav", { className: "desktop-nav", "aria-label": "Main navigation" }, navLinks),
                React.createElement("div", { className: "header-tools" },
                    React.createElement("button", { className: "lore-header-button", onClick: () => openLore() },
                        React.createElement(Icon, { name: "chat", size: 17 }),
                        React.createElement("span", null, "Ask Lore")),
                    React.createElement("button", { className: "search-trigger", onClick: () => setSearch(true), "aria-label": "Search all worlds" },
                        React.createElement(Icon, { name: "search", size: 18 }),
                        React.createElement("span", null, "Find your world"),
                        React.createElement("kbd", null, "Ctrl K")),
                    React.createElement("button", { className: "icon-btn theme-toggle", onClick: toggleTheme, "aria-label": theme === "dark"
                            ? "Switch to light theme"
                            : "Switch to dark theme" },
                        React.createElement(Icon, { name: theme === "dark" ? "sun" : "moon" })),
                    React.createElement("details", { className: "preferences" },
                        React.createElement("summary", { className: "icon-btn", "aria-label": "Reading preferences" },
                            React.createElement(Icon, { name: "filter" })),
                        React.createElement("div", { className: "preferences-panel" },
                            React.createElement("strong", null, "Make yourself comfortable"),
                            React.createElement("label", null,
                                "Text size",
                                React.createElement("select", { value: fontScale, onChange: (e) => setFontScale(Number(e.target.value)) },
                                    React.createElement("option", { value: 1 }, "100% - Default"),
                                    React.createElement("option", { value: 1.125 }, "112.5% - Large"),
                                    React.createElement("option", { value: 1.25 }, "125% - Larger"))),
                            React.createElement("label", { className: "check-row" },
                                React.createElement("input", { type: "checkbox", checked: spoilerSafe, onChange: toggleSpoilers }),
                                "Spoiler-safe reading"),
                            React.createElement("small", null, "Preferences are saved on this device."))),
                    user ? (React.createElement("details", { className: "account-menu" },
                        React.createElement("summary", { className: "avatar", "aria-label": "Account menu" }, user.avatar ? (React.createElement("img", { src: user.avatar, alt: "" })) : (user.name.slice(0, 2).toUpperCase())),
                        React.createElement("div", null,
                            React.createElement("strong", null, user.name),
                            React.createElement(Link, { to: "/dashboard" }, "Dashboard"),
                            React.createElement(Link, { to: "/collection" }, "My collection"),
                            React.createElement(Link, { to: "/profile" }, "Profile"),
                            user.role === "admin" && (React.createElement(Link, { to: "/admin" }, "Catalog admin (V1 demo)")),
                            React.createElement("button", { onClick: async () => {
                                    await perform(() => repository.logout());
                                    navigate("/");
                                } }, "Sign out")))) : (React.createElement(Link, { to: "/login", className: "btn btn-small btn-primary desktop-signin" },
                        "Sign in ",
                        React.createElement(Icon, { name: "arrow", size: 15 }))),
                    React.createElement("button", { className: "icon-btn mobile-menu-button", onClick: () => setMenu(true), "aria-label": "Open navigation" },
                        React.createElement(Icon, { name: "menu" }))))),
        React.createElement("main", { id: "main", className: "main-container", tabIndex: -1 }, children),
        React.createElement("footer", { className: "site-footer" },
            React.createElement("div", { className: "footer-top" },
                React.createElement("div", { className: "footer-brand" },
                    React.createElement(Logo, null),
                    React.createElement("p", null,
                        "All your worlds.",
                        React.createElement("br", null),
                        "One place to belong."),
                    React.createElement("span", { className: "footer-caption" }, "Built for curiosity. Made for fans.")),
                React.createElement("div", null,
                    React.createElement("h2", null, "Discover"),
                    React.createElement(Link, { to: "/explore" }, "All worlds"),
                    React.createElement(Link, { to: "/characters" }, "Characters"),
                    React.createElement(Link, { to: "/media" }, "Media room"),
                    React.createElement(Link, { to: "/events" }, "Events & calendar"),
                    React.createElement(Link, { to: "/releases" }, "Upcoming releases")),
                React.createElement("div", null,
                    React.createElement("h2", null, "Your space"),
                    React.createElement(Link, { to: "/dashboard" }, "Dashboard"),
                    React.createElement(Link, { to: "/collection" }, "My collection"),
                    React.createElement(Link, { to: "/community" }, "Community conversations"),
                    React.createElement(Link, { to: "/submit" }, "Submit a catalog story"),
                    React.createElement(Link, { to: "/feedback" }, "Send feedback")),
                React.createElement("div", null,
                    React.createElement("h2", null, "Fan Hub Plus"),
                    React.createElement(Link, { to: "/assistant" }, "Lore Master"),
                    React.createElement(Link, { to: "/giveaways" }, "Quarterly gifts"),
                    React.createElement(Link, { to: "/showcase" }, "Collectible showcase"),
                    React.createElement(Link, { to: "/sitemap" }, "Sitemap"),
                    React.createElement(Link, { to: "/privacy" }, "Privacy & demo notes"),
                    React.createElement(Link, { to: "/admin" }, "Editorial workspace"))),
            React.createElement("div", { className: "footer-bottom" },
                React.createElement("span", null, "Fan Hub Plus / Learning prototype / 2026"),
                React.createElement("span", null, "Showcase only. No purchases or payments."))),
        React.createElement(LoreDock, null),
        React.createElement(LoreFab, null),
        React.createElement("div", { className: "toast-stack", "aria-live": "polite" }, notices.map((n) => (React.createElement("div", { key: n.id, role: n.kind === "error" ? "alert" : "status", className: `toast toast-${n.kind}` },
            React.createElement(Icon, { name: n.kind === "error" ? "info" : "check", size: 19 }),
            n.message)))),
        React.createElement(Modal, { open: menu, onClose: () => setMenu(false), title: "Your next universe" },
            React.createElement("nav", { className: "mobile-nav", "aria-label": "Mobile navigation" },
                navLinks,
                React.createElement(Link, { to: "/media" }, "Media room"),
                React.createElement(Link, { to: "/characters" }, "Characters"),
                React.createElement(Link, { to: "/collection" }, "My collection"),
                React.createElement(Link, { to: "/profile" }, "Profile & preferences"),
                React.createElement("div", { className: "mobile-reading" },
                    React.createElement("strong", null, "Reading comfort"),
                    React.createElement("label", { className: "field" },
                        React.createElement("span", null, "Mobile text size"),
                        React.createElement("select", { value: fontScale, onChange: (e) => setFontScale(Number(e.target.value)) },
                            React.createElement("option", { value: 1 }, "100% - Default"),
                            React.createElement("option", { value: 1.125 }, "112.5% - Large"),
                            React.createElement("option", { value: 1.25 }, "125% - Larger"))),
                    React.createElement(Button, { variant: "secondary", onClick: toggleTheme },
                        "Use ",
                        theme === "dark" ? "light" : "dark",
                        " theme",
                        " ",
                        React.createElement(Icon, { name: theme === "dark" ? "sun" : "moon", size: 17 })),
                    React.createElement("label", { className: "check-row" },
                        React.createElement("input", { type: "checkbox", checked: spoilerSafe, onChange: toggleSpoilers }),
                        "Spoiler-safe reading")),
                user?.role === "admin" && (React.createElement(Link, { to: "/admin" }, "Editorial workspace")),
                user ? (React.createElement(Button, { variant: "secondary", onClick: async () => {
                        await perform(() => repository.logout());
                        setMenu(false);
                        navigate("/");
                    } },
                    "Sign out ",
                    React.createElement(Icon, { name: "logout", size: 17 }))) : (React.createElement(Link, { className: "btn btn-primary", to: "/login" }, "Sign in")))),
        React.createElement(Modal, { open: search, onClose: () => setSearch(false), title: "Where will curiosity take you?" },
            React.createElement("form", { onSubmit: (e) => {
                    e.preventDefault();
                    setSearch(false);
                    navigate("/explore?q=" + encodeURIComponent(q.trim()));
                } },
                React.createElement("label", { className: "sr-only", htmlFor: "global-search" }, "Search all content"),
                React.createElement("div", { className: "search-box" },
                    React.createElement(Icon, { name: "search" }),
                    React.createElement("input", { autoFocus: true, id: "global-search", value: q, onChange: (e) => setQ(e.target.value), placeholder: "Stories, fandoms, characters..." }),
                    React.createElement("button", { type: "submit", className: "icon-btn", "aria-label": "Search" },
                        React.createElement(Icon, { name: "arrow" })))),
            React.createElement("p", { className: "subtle-label" }, "JUMP INTO A WORLD"),
            React.createElement("div", { className: "chip-list" }, db?.categories.map((c) => (React.createElement("button", { key: c.id, className: "chip", onClick: () => {
                    setSearch(false);
                    navigate("/explore?category=" + c.id);
                } },
                React.createElement(Icon, { name: c.icon, size: 15 }),
                c.name)))))));
}
