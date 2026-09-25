import React, { useEffect, useMemo, useState } from "react";
import { useLocation, navigate } from "../lib/router.js";
import { useApp } from "../lib/store.js";
import { Button, Icon, PageHeading, Crumbs, ContentCard, Empty, Notice, typeLabels, } from "../components/ui.js";
import { filterContents } from "../domain/logic.js";
export default function Explore({ mode = "explore" }) {
    const { db } = useApp();
    const { params, pathname, search } = useLocation();
    const [q, setQ] = useState(params.get("q") || ""), [list, setList] = useState(false), [filtersOpen, setFiltersOpen] = useState(false);
    useEffect(() => setQ(params.get("q") || ""), [search]);
    const filter = Object.fromEntries(params.entries());
    if (mode === "media")
        filter.type = params.get("type") || "video,audio,gallery";
    if (mode === "characters")
        filter.type = "character";
    if (mode === "showcase")
        filter.type = "merchandise";
    const result = useMemo(() => filterContents(db?.contents || [], filter), [db, search, mode]);
    if (!db)
        return null;
    const update = (key, value) => {
        const p = new URLSearchParams(search);
        value ? p.set(key, value) : p.delete(key);
        if (key !== "page")
            p.delete("page");
        navigate(pathname + (p.size ? "?" + p.toString() : ""));
    };
    const title = mode === "media"
        ? "The media room"
        : mode === "characters"
            ? "The characters we connect with"
            : mode === "showcase"
                ? "Objects from other worlds"
                : "Find your next obsession";
    const desc = mode === "showcase"
        ? "A curated collection of fictional collectibles. Made to discover, not to purchase."
        : mode === "media"
            ? "A little motion, a little sound, and a lot of imagination."
            : "Eight categories. A thousand ways to get curious. Start with what you love.";
    const genres = [
        ...new Set(db.contents.filter((c) => c.status === "published").map((c) => c.genre)),
    ].sort(), fandoms = [
        ...new Set(db.contents
            .filter((c) => c.status === "published")
            .map((c) => c.fandom)),
    ].sort();
    const active = Object.entries(filter).filter(([k, v]) => v &&
        k !== "page" &&
        k !== "sort" &&
        !(mode !== "explore" && k === "type"));
    return (React.createElement(React.Fragment, null,
        React.createElement(Crumbs, { items: [
                {
                    label: mode === "explore"
                        ? "Explore"
                        : mode === "showcase"
                            ? "Showcase"
                            : mode === "media"
                                ? "Media room"
                                : "Characters",
                },
            ] }),
        React.createElement(PageHeading, { eyebrow: "THE DISCOVERY DESK", title: title, description: desc }),
        mode === "showcase" && (React.createElement(Notice, null, "No cart, checkout, payments or orders. All objects and release information in this prototype are fictional concepts.")),
        React.createElement("div", { className: "explore-search" },
            React.createElement("form", { onSubmit: (e) => {
                    e.preventDefault();
                    update("q", q.trim());
                }, className: "search-box" },
                React.createElement(Icon, { name: "search" }),
                React.createElement("input", { value: q, onChange: (e) => setQ(e.target.value), "aria-label": "Search content", placeholder: "Search stories, characters, fandoms..." }),
                React.createElement(Button, { type: "submit", className: "btn-small" },
                    "Search ",
                    React.createElement(Icon, { name: "arrow", size: 15 }))),
            React.createElement(Button, { variant: "secondary", className: "filter-mobile", onClick: () => setFiltersOpen((s) => !s), "aria-expanded": filtersOpen },
                React.createElement(Icon, { name: "filter" }),
                "Filters")),
        React.createElement("div", { className: "category-tabs", role: "group", "aria-label": "Filter by category" },
            React.createElement("button", { className: !filter.category ? "active" : "", onClick: () => update("category", "") }, "All worlds"),
            db.categories.map((c) => (React.createElement("button", { key: c.id, onClick: () => update("category", c.id), className: filter.category === c.id ? "active" : "" },
                React.createElement(Icon, { name: c.icon, size: 15 }),
                c.name)))),
        React.createElement("div", { className: "explore-layout" },
            React.createElement("aside", { className: `filter-panel ${filtersOpen ? "open" : ""}` },
                React.createElement("div", { className: "filter-panel-heading" },
                    React.createElement("h2", null,
                        React.createElement(Icon, { name: "filter", size: 17 }),
                        "Refine your world"),
                    React.createElement("button", { className: "small-link", onClick: () => {
                            setQ("");
                            navigate(pathname);
                        } }, "Reset")),
                React.createElement("label", { className: "field" },
                    React.createElement("span", null, "Fandom"),
                    React.createElement("select", { "aria-label": "Fandom filter", value: filter.fandom || "", onChange: (e) => update("fandom", e.target.value) },
                        React.createElement("option", { value: "" }, "All fandoms"),
                        fandoms.map((f) => (React.createElement("option", { key: f }, f))))),
                React.createElement("label", { className: "field" },
                    React.createElement("span", null, "Genre"),
                    React.createElement("select", { "aria-label": "Genre filter", value: filter.genre || "", onChange: (e) => update("genre", e.target.value) },
                        React.createElement("option", { value: "" }, "All genres"),
                        genres.map((g) => (React.createElement("option", { key: g }, g))))),
                React.createElement("label", { className: "field" },
                    React.createElement("span", null, "Release year"),
                    React.createElement("select", { "aria-label": "Release year filter", value: filter.year || "", onChange: (e) => update("year", e.target.value) },
                        React.createElement("option", { value: "" }, "Any year"),
                        [2026, 2025, 2024].map((y) => (React.createElement("option", { key: y }, y))))),
                ["explore", "media"].includes(mode) && (React.createElement("label", { className: "field" },
                    React.createElement("span", null, "Content type"),
                    React.createElement("select", { "aria-label": "Content type filter", value: params.get("type") || "", onChange: (e) => update("type", e.target.value) },
                        React.createElement("option", { value: "" },
                            "All ",
                            mode === "media" ? "media" : "types"),
                        Object.entries(typeLabels)
                            .filter(([k]) => mode !== "media" ||
                            ["video", "audio", "gallery"].includes(k))
                            .map(([k, v]) => (React.createElement("option", { key: k, value: k }, v)))))),
                React.createElement("label", { className: "check-row" },
                    React.createElement("input", { type: "checkbox", checked: filter.popular === "true", onChange: (e) => update("popular", e.target.checked ? "true" : "") }),
                    "Popular picks only"),
                React.createElement("div", { className: "filter-note" },
                    React.createElement(Icon, { name: "shield", size: 20 }),
                    React.createElement("strong", null, "Explore at your pace."),
                    React.createElement("p", null, "Spoiler warnings help you choose what to read. Change reading preferences in the header."))),
            React.createElement("div", { className: "explore-results" },
                React.createElement("div", { className: "results-toolbar" },
                    React.createElement("p", { role: "status" },
                        React.createElement("strong", null, result.total),
                        " ",
                        result.total === 1 ? "discovery" : "discoveries",
                        React.createElement("span", null, " in this collection")),
                    React.createElement("div", null,
                        React.createElement("select", { "aria-label": "Sort content", value: filter.sort || "latest", onChange: (e) => update("sort", e.target.value) },
                            React.createElement("option", { value: "latest" }, "Latest first"),
                            React.createElement("option", { value: "popular" }, "Most popular"),
                            React.createElement("option", { value: "az" }, "A to Z")),
                        React.createElement("div", { className: "view-toggle" },
                            React.createElement("button", { "aria-label": "Grid view", "aria-pressed": !list, onClick: () => setList(false), className: !list ? "active" : "" },
                                React.createElement(Icon, { name: "grid", size: 16 })),
                            React.createElement("button", { "aria-label": "List view", "aria-pressed": list, onClick: () => setList(true), className: list ? "active" : "" },
                                React.createElement(Icon, { name: "list", size: 18 }))))),
                active.length > 0 && (React.createElement("div", { className: "active-filters" }, active.map(([key, value]) => (React.createElement("button", { className: "chip", key: key, onClick: () => update(key, "") },
                    key,
                    ": ",
                    value,
                    React.createElement(Icon, { name: "close", size: 12 })))))),
                result.total ? (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: `card-grid ${list ? "list-view" : ""}` }, result.items.map((c) => (React.createElement(ContentCard, { key: c.id, content: c })))),
                    React.createElement("nav", { className: "pagination", "aria-label": "Results pages" },
                        React.createElement(Button, { variant: "secondary", disabled: result.page === 1, onClick: () => update("page", String(result.page - 1)) }, "Previous"),
                        React.createElement("span", null,
                            "Page ",
                            result.page,
                            " of ",
                            result.pageCount),
                        React.createElement(Button, { variant: "secondary", disabled: result.page === result.pageCount, onClick: () => update("page", String(result.page + 1)) },
                            "Next ",
                            React.createElement(Icon, { name: "arrow", size: 15 }))))) : (React.createElement(Empty, { title: "No worlds found. Yet.", description: "Try another search or clear a filter. Your next discovery could be just around the corner." },
                    React.createElement(Button, { onClick: () => {
                            setQ("");
                            navigate(pathname);
                        } }, "Clear all filters")))))));
}
