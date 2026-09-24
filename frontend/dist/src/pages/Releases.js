import React, { useState } from 'react';
import { useApp } from '../lib/store.js';
import { Link } from '../lib/router.js';
import { PageHeading, Crumbs, Notice, Icon, Empty } from '../components/ui.js';
export default function Releases() {
    const { db } = useApp();
    const [category, setCategory] = useState('');
    if (!db)
        return null;
    const releases = db.contents.filter(c => c.status === 'published' && c.releaseDate && (!category || c.categoryId === category)).sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
    return React.createElement(React.Fragment, null,
        React.createElement(Crumbs, { items: [{ label: 'Release calendar' }] }),
        React.createElement(PageHeading, { eyebrow: "SOMETHING TO LOOK FORWARD TO", title: "The next chapter.", description: "A cross-fandom release calendar for stories, screens, games and collectibles." }),
        React.createElement(Notice, null, "These are fictional October 2026 release fixtures, not current entertainment news or real pre-orders. Dates are supplied by demo content editors."),
        React.createElement("div", { className: "category-tabs", "aria-label": "Filter releases" }, [{ id: '', name: 'All worlds' }, ...db.categories].map(c => React.createElement("button", { type: "button", key: c.id, className: c.id === category ? 'active' : '', onClick: () => setCategory(c.id), "aria-pressed": c.id === category }, c.name))),
        React.createElement("div", { className: "release-timeline" }, releases.length ? releases.map(c => React.createElement("article", { className: "release-row", key: c.id },
            React.createElement("div", { className: "release-date" },
                React.createElement("span", null, new Date(c.releaseDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })),
                React.createElement("strong", null, c.releaseDate?.slice(8)),
                React.createElement("small", null, c.releaseDate?.slice(0, 4))),
            React.createElement("img", { src: c.image, alt: "" }),
            React.createElement("div", null,
                React.createElement("span", { className: "eyebrow" },
                    db.categories.find(x => x.id === c.categoryId)?.name,
                    " / ",
                    c.fandom),
                React.createElement("h2", null,
                    React.createElement(Link, { to: '/content/' + c.id }, c.title)),
                React.createElement("p", { className: "muted" }, c.description),
                React.createElement("div", { className: "tag-list" }, c.tags.map(t => React.createElement("span", { key: t, className: "tag" }, t)))),
            React.createElement(Link, { to: '/content/' + c.id, className: "icon-btn", "aria-label": 'View ' + c.title },
                React.createElement(Icon, { name: "arrow" })))) : React.createElement(Empty, { icon: "calendar", title: "No release fixtures in this category", description: "Try another world or add a release date in the admin content editor." })));
}
