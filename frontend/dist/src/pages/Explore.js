import React, { useEffect, useMemo, useState } from "react";
import { useLocation, navigate } from "../lib/router.js";
import { Button, Icon, PageHeading, Crumbs, ContentCard, Empty, Notice, Skeleton, typeLabels, } from "../components/ui.js";
import { useCatalogPage } from "../features/catalog/hooks.js";
import { isFandomCategoryId } from "../shared/catalog/taxonomy.js";
function positiveInt(value, fallback) {
    const parsed = Number.parseInt(value || "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
export default function Explore({ mode = "explore" }) {
    const { params, pathname, search } = useLocation();
    const [q, setQ] = useState(params.get("q") || "");
    const [list, setList] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    useEffect(() => setQ(params.get("q") || ""), [search]);
    const query = useMemo(() => {
        const requestedCategory = params.get("category");
        const type = mode === "media"
            ? params.get("type") || "video,audio,gallery"
            : mode === "characters"
                ? "character"
                : mode === "showcase"
                    ? "merchandise"
                    : params.get("type") || undefined;
        const requestedSort = params.get("sort_by") || params.get("sort") || "latest";
        const sortBy = ["latest", "popular", "az"].includes(requestedSort)
            ? requestedSort
            : "latest";
        return {
            q: params.get("q") || undefined,
            category: isFandomCategoryId(requestedCategory) ? requestedCategory : undefined,
            fandom: params.get("fandom") || undefined,
            type,
            genre: params.get("genre") || undefined,
            year: params.get("year") || undefined,
            popular: params.get("popular") === "true",
            sortBy,
            page: positiveInt(params.get("page"), 1),
            pageSize: 9,
        };
    }, [search, mode]);
    const { categories, page: result, loading, error, categoryWarning } = useCatalogPage(query);
    const update = (key, value) => {
        const next = new URLSearchParams(search);
        value ? next.set(key, value) : next.delete(key);
        if (key === "sort_by")
            next.delete("sort");
        if (key !== "page")
            next.delete("page");
        navigate(pathname + (next.size ? `?${next.toString()}` : ""));
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
    const genres = result.facets?.genres?.length
        ? result.facets.genres
        : [...new Set(result.items.map((content) => content.genre))].sort();
    const fandoms = result.facets?.fandoms?.length
        ? result.facets.fandoms
        : [...new Set(result.items.map((content) => content.fandom))].sort();
    const years = result.facets?.years?.length ? result.facets.years : [2026, 2025, 2024];
    const active = [
        ["q", query.q || ""],
        ["category", query.category || ""],
        ["fandom", query.fandom || ""],
        ["genre", query.genre || ""],
        ["year", query.year || ""],
        ["popular", query.popular ? "true" : ""],
        ...(mode === "explore" && query.type ? [["type", query.type]] : []),
    ].filter(([, value]) => Boolean(value));
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
            React.createElement("form", { onSubmit: (event) => {
                    event.preventDefault();
                    update("q", q.trim());
                }, className: "search-box" },
                React.createElement(Icon, { name: "search" }),
                React.createElement("input", { value: q, onChange: (event) => setQ(event.target.value), "aria-label": "Search content", placeholder: "Search stories, characters, fandoms..." }),
                React.createElement(Button, { type: "submit", className: "btn-small" },
                    "Search ",
                    React.createElement(Icon, { name: "arrow", size: 15 }))),
            React.createElement(Button, { variant: "secondary", className: "filter-mobile", onClick: () => setFiltersOpen((state) => !state), "aria-expanded": filtersOpen },
                React.createElement(Icon, { name: "filter" }),
                "Filters")),
        React.createElement("div", { className: "category-tabs", role: "group", "aria-label": "Filter by category" },
            React.createElement("button", { className: !query.category ? "active" : "", onClick: () => update("category", "") }, "All worlds"),
            categories.map((category) => (React.createElement("button", { key: category.id, onClick: () => update("category", category.id), className: query.category === category.id ? "active" : "" },
                React.createElement(Icon, { name: category.icon, size: 15 }),
                category.name)))),
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
                    React.createElement("select", { "aria-label": "Fandom filter", value: query.fandom || "", onChange: (event) => update("fandom", event.target.value) },
                        React.createElement("option", { value: "" }, "All fandoms"),
                        fandoms.map((fandom) => (React.createElement("option", { key: fandom }, fandom))))),
                React.createElement("label", { className: "field" },
                    React.createElement("span", null, "Genre"),
                    React.createElement("select", { "aria-label": "Genre filter", value: query.genre || "", onChange: (event) => update("genre", event.target.value) },
                        React.createElement("option", { value: "" }, "All genres"),
                        genres.map((genre) => (React.createElement("option", { key: genre }, genre))))),
                React.createElement("label", { className: "field" },
                    React.createElement("span", null, "Release year"),
                    React.createElement("select", { "aria-label": "Release year filter", value: query.year || "", onChange: (event) => update("year", event.target.value) },
                        React.createElement("option", { value: "" }, "Any year"),
                        years.map((year) => (React.createElement("option", { key: year }, year))))),
                ["explore", "media"].includes(mode) && (React.createElement("label", { className: "field" },
                    React.createElement("span", null, "Content type"),
                    React.createElement("select", { "aria-label": "Content type filter", value: params.get("type") || "", onChange: (event) => update("type", event.target.value) },
                        React.createElement("option", { value: "" },
                            "All ",
                            mode === "media" ? "media" : "types"),
                        Object.entries(typeLabels)
                            .filter(([key]) => mode !== "media" || ["video", "audio", "gallery"].includes(key))
                            .map(([key, label]) => (React.createElement("option", { key: key, value: key }, label)))))),
                React.createElement("label", { className: "check-row" },
                    React.createElement("input", { type: "checkbox", checked: Boolean(query.popular), onChange: (event) => update("popular", event.target.checked ? "true" : "") }),
                    "Popular picks only"),
                React.createElement("div", { className: "filter-note" },
                    React.createElement(Icon, { name: "shield", size: 20 }),
                    React.createElement("strong", null, "Explore at your pace."),
                    React.createElement("p", null, "Spoiler warnings help you choose what to read. Change reading preferences in the header."))),
            React.createElement("div", { className: "explore-results" },
                React.createElement("div", { className: "results-toolbar" },
                    React.createElement("p", { role: "status" },
                        React.createElement("strong", null, loading ? "..." : result.total),
                        " ",
                        result.total === 1 ? "discovery" : "discoveries",
                        React.createElement("span", null, " in this collection")),
                    React.createElement("div", null,
                        React.createElement("select", { "aria-label": "Sort content", value: query.sortBy || "latest", onChange: (event) => update("sort_by", event.target.value) },
                            React.createElement("option", { value: "latest" }, "Latest first"),
                            React.createElement("option", { value: "popular" }, "Most popular"),
                            React.createElement("option", { value: "az" }, "A to Z")),
                        React.createElement("div", { className: "view-toggle" },
                            React.createElement("button", { "aria-label": "Grid view", "aria-pressed": !list, onClick: () => setList(false), className: !list ? "active" : "" },
                                React.createElement(Icon, { name: "grid", size: 16 })),
                            React.createElement("button", { "aria-label": "List view", "aria-pressed": list, onClick: () => setList(true), className: list ? "active" : "" },
                                React.createElement(Icon, { name: "list", size: 18 }))))),
                categoryWarning && (React.createElement(Notice, null,
                    "Category metadata could not be loaded from the API. The canonical eight-category SRS taxonomy is shown instead. ",
                    categoryWarning)),
                active.length > 0 && (React.createElement("div", { className: "active-filters" }, active.map(([key, value]) => (React.createElement("button", { className: "chip", key: key, onClick: () => update(key, "") },
                    key,
                    ": ",
                    value,
                    React.createElement(Icon, { name: "close", size: 12 })))))),
                loading ? (React.createElement(Skeleton, { cards: 6 })) : error ? (React.createElement(Empty, { title: "Catalog data is not available yet.", description: error },
                    React.createElement(Button, { onClick: () => { setQ(""); navigate(pathname); } }, "Clear filters"))) : result.total ? (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: `card-grid ${list ? "list-view" : ""}` }, result.items.map((content) => (React.createElement(ContentCard, { key: content.id, content: content })))),
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
                    React.createElement(Button, { onClick: () => { setQ(""); navigate(pathname); } }, "Clear all filters")))))));
}
