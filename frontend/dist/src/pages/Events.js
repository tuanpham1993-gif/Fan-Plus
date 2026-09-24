import React, { useMemo, useState } from 'react';
import { useApp } from '../lib/store.js';
import { Link, useLocation, navigate } from '../lib/router.js';
import { distanceKm, calendarFile, safeExternalUrl } from '../domain/logic.js';
import { Icon, Button, Crumbs, PageHeading, Notice, Empty, downloadFile } from '../components/ui.js';
const date = (s, opts = { dateStyle: 'medium' }) => new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(s));
export default function Events({ id }) {
    const { db, notify } = useApp();
    const { params } = useLocation();
    const [view, setView] = useState('list'), [geo, setGeo] = useState(null), [geoBusy, setGeoBusy] = useState(false), [geoError, setGeoError] = useState(''), [onlineMap, setOnlineMap] = useState(false), [selected, setSelected] = useState('e1'), [month, setMonth] = useState(new Date(Date.UTC(2026, 9, 1)));
    const city = params.get('city') || '', radius = Number(params.get('radius') || 0);
    const events = useMemo(() => { const items = (db?.events || []).filter(e => !city || e.city === city).map(e => ({ ...e, distance: geo ? distanceKm(geo, e) : null })).filter(e => !geo || !radius || e.distance <= radius); return items.sort((a, b) => geo ? a.distance - b.distance : Date.parse(a.startsAt) - Date.parse(b.startsAt)); }, [db, city, geo, radius]);
    if (!db)
        return null;
    const update = (key, value) => { const p = new URLSearchParams(params); value ? p.set(key, value) : p.delete(key); navigate('/events' + (p.size ? '?' + p : '')); };
    const locate = () => {
        if (!navigator.geolocation) {
            setGeoError('Geolocation is unavailable. Please select a city.');
            return;
        }
        setGeoBusy(true);
        setGeoError('');
        navigator.geolocation.getCurrentPosition(p => { setGeo({ lat: p.coords.latitude, lng: p.coords.longitude }); setGeoBusy(false); update('city', ''); notify('Events are sorted by distance. Your coordinates are not saved.', 'info'); }, err => { setGeoBusy(false); setGeoError(err.code === 1 ? 'Location permission was denied. You can still browse by city.' : 'Location could not be determined. Try again or choose a city.'); }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
    };
    if (id) {
        const event = db.events.find(e => e.id === id);
        if (!event)
            return React.createElement(Empty, { title: "Event not found", description: "This event may have been removed." },
                React.createElement(Link, { className: "btn btn-primary", to: "/events" }, "Browse events"));
        return React.createElement(React.Fragment, null,
            React.createElement(Crumbs, { items: [{ label: 'Events', to: '/events' }, { label: event.title }] }),
            React.createElement("div", { className: "event-detail" },
                React.createElement("img", { src: event.image, alt: "Original event concept artwork", width: "1280", height: "900" }),
                React.createElement("div", null,
                    React.createElement("span", { className: "eyebrow" }, "A FICTIONAL COMMUNITY EVENT"),
                    React.createElement("h1", null, event.title),
                    React.createElement("p", null, event.description),
                    React.createElement("div", { className: "event-detail-facts" },
                        React.createElement("p", null,
                            React.createElement(Icon, { name: "calendar" }),
                            date(event.startsAt)),
                        React.createElement("p", null,
                            React.createElement(Icon, { name: "clock" }),
                            date(event.startsAt, { timeStyle: 'short' }),
                            " - ",
                            date(event.endsAt, { timeStyle: 'short' }),
                            " (Asia/Ho_Chi_Minh)"),
                        React.createElement("p", null,
                            React.createElement(Icon, { name: "pin" }),
                            event.venue,
                            ", ",
                            event.city)),
                    React.createElement(Button, { onClick: () => downloadFile('fanhub-demo-' + event.id + '.ics', calendarFile(event), 'text/calendar;charset=utf-8') },
                        React.createElement(Icon, { name: "download", size: 18 }),
                        "Add demo event to calendar"),
                    event.ticketUrl && safeExternalUrl(event.ticketUrl) ? React.createElement("a", { className: "btn btn-secondary", href: safeExternalUrl(event.ticketUrl), target: "_blank", rel: "noopener noreferrer" },
                        "Visit organizer's ticket page ",
                        React.createElement(Icon, { name: "external", size: 16 })) : React.createElement("p", { className: "caption" }, "No real tickets are available for this fictional event."),
                    React.createElement(Notice, null, "Do not travel to this location based on the demo. Event name, venue and schedule are test data."))),
            React.createElement(Link, { className: "text-link", to: '/events?city=' + encodeURIComponent(event.city) },
                "More events in ",
                event.city,
                React.createElement(Icon, { name: "arrow", size: 17 })));
    }
    const mapEvent = events.find(e => e.id === selected) || events[0];
    const days = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate(), offset = (month.getUTCDay() + 6) % 7;
    const marker = mapEvent ? `${mapEvent.lat},${mapEvent.lng}` : '';
    const bbox = mapEvent ? `${mapEvent.lng - .055},${mapEvent.lat - .035},${mapEvent.lng + .055},${mapEvent.lat + .035}` : '';
    return React.createElement(React.Fragment, null,
        React.createElement(Crumbs, { items: [{ label: 'Events' }] }),
        React.createElement(PageHeading, { eyebrow: "BEYOND THE SCREEN", title: "Find your people.", description: "The best part of a fandom? Sharing it. Discover gatherings, workshops and worlds close to you." },
            React.createElement(Button, { variant: "secondary", busy: geoBusy, onClick: locate },
                React.createElement(Icon, { name: "pin", size: 17 }),
                geo ? 'Refresh my location' : 'Use my location')),
        React.createElement(Notice, null, "All events below are fictional test data. Location is requested only when you choose it, kept in memory and never saved. Online maps contact OpenStreetMap only after you load them."),
        geoError && React.createElement("div", { className: "form-error", role: "alert" }, geoError),
        React.createElement("div", { className: "event-toolbar" },
            React.createElement("div", null,
                React.createElement("label", { className: "sr-only", htmlFor: "city" }, "Filter events by city"),
                React.createElement("select", { id: "city", value: city, onChange: e => update('city', e.target.value) },
                    React.createElement("option", { value: "" }, "All cities"),
                    [...new Set(db.events.map(e => e.city))].map(c => React.createElement("option", { key: c }, c))),
                geo && React.createElement(React.Fragment, null,
                    React.createElement("select", { "aria-label": "Distance radius", value: radius, onChange: e => update('radius', e.target.value) },
                        React.createElement("option", { value: 0 }, "Any distance"),
                        React.createElement("option", { value: 25 }, "Within 25 km"),
                        React.createElement("option", { value: 100 }, "Within 100 km"),
                        React.createElement("option", { value: 500 }, "Within 500 km")),
                    React.createElement("button", { className: "small-link", onClick: () => { setGeo(null); update('radius', ''); } }, "Forget location"))),
            React.createElement("div", { className: "segmented", role: "group", "aria-label": "Event view" }, [['list', 'list', 'List'], ['calendar', 'calendar', 'Calendar'], ['map', 'pin', 'Map']].map(([v, icon, label]) => React.createElement("button", { key: v, className: view === v ? 'active' : '', "aria-pressed": view === v, onClick: () => setView(v) },
                React.createElement(Icon, { name: icon, size: 16 }),
                label)))),
        view === 'list' && (events.length ? React.createElement("div", { className: "event-list" }, events.map(e => React.createElement("article", { className: "event-card", key: e.id },
            React.createElement("img", { src: e.image, alt: "", width: "280", height: "180" }),
            React.createElement("div", { className: "event-date" },
                React.createElement("strong", null, date(e.startsAt, { day: '2-digit' })),
                React.createElement("span", null, date(e.startsAt, { month: 'short' }))),
            React.createElement("div", { className: "event-card-body" },
                React.createElement("span", { className: "eyebrow" },
                    db.categories.find(c => c.id === e.categoryId)?.name,
                    " / DEMO EVENT"),
                React.createElement("h2", null,
                    React.createElement(Link, { to: '/events/' + e.id }, e.title)),
                React.createElement("p", null, e.description),
                React.createElement("div", { className: "event-meta" },
                    React.createElement("span", null,
                        React.createElement(Icon, { name: "pin", size: 14 }),
                        e.city),
                    React.createElement("span", null,
                        React.createElement(Icon, { name: "clock", size: 14 }),
                        date(e.startsAt, { timeStyle: 'short' }),
                        " GMT+7"),
                    e.distance !== null && React.createElement("span", null,
                        e.distance.toFixed(1),
                        " km away"))),
            React.createElement(Link, { className: "icon-btn event-arrow", "aria-label": 'View ' + e.title, to: '/events/' + e.id },
                React.createElement(Icon, { name: "arrow" }))))) : React.createElement(Empty, { icon: "pin", title: "No events in this orbit", description: "Try another city or a larger distance radius." },
            React.createElement(Button, { onClick: () => { setGeo(null); navigate('/events'); } }, "Reset event filters"))),
        view === 'calendar' && React.createElement("div", { className: "calendar-panel" },
            React.createElement("div", { className: "calendar-header" },
                React.createElement(Button, { variant: "ghost", onClick: () => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1))) }, "Previous month"),
                React.createElement("h2", null, new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(month)),
                React.createElement(Button, { variant: "ghost", onClick: () => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1))) }, "Next month")),
            React.createElement("p", { className: "caption" }, "Event dates shown in Asia/Ho_Chi_Minh (GMT+7)."),
            React.createElement("div", { className: "calendar-grid" },
                ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => React.createElement("div", { className: "calendar-weekday", key: d }, d)),
                Array.from({ length: offset }, (_, i) => React.createElement("div", { key: 'empty' + i, className: "calendar-day calendar-blank" })),
                Array.from({ length: days }, (_, i) => { const key = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`; return React.createElement("div", { className: "calendar-day", key: key },
                    React.createElement("span", null, i + 1),
                    events.filter(e => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(e.startsAt)) === key).map(e => React.createElement(Link, { to: '/events/' + e.id, key: e.id }, e.title))); }))),
        view === 'map' && React.createElement("div", { className: "map-layout" },
            React.createElement("div", { className: "map-list" }, events.map(e => React.createElement("button", { key: e.id, onClick: () => setSelected(e.id), className: mapEvent?.id === e.id ? 'active' : '' },
                React.createElement("strong", null, e.title),
                React.createElement("span", null, e.city)))),
            React.createElement("div", { className: "map-canvas" }, !mapEvent ? React.createElement(Empty, { title: "No events to map", description: "Choose another city or remove the distance filter." }) : onlineMap ? React.createElement(React.Fragment, null,
                React.createElement("iframe", { title: 'OpenStreetMap location of ' + mapEvent.title, src: `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`, loading: "lazy", referrerPolicy: "strict-origin-when-cross-origin" }),
                React.createElement("div", { className: "map-caption" },
                    React.createElement("span", null,
                        "Fictional venue / ",
                        mapEvent.city),
                    React.createElement(Link, { to: '/events/' + mapEvent.id },
                        "View event ",
                        React.createElement(Icon, { name: "arrow", size: 15 })))) : React.createElement("div", { className: "map-consent" },
                React.createElement(Icon, { name: "globe", size: 54 }),
                React.createElement("h2", null, "Your next connection, mapped."),
                React.createElement("p", null, "Load a live OpenStreetMap for the selected fictional event. Your browser will contact an external map provider."),
                React.createElement(Button, { onClick: () => setOnlineMap(true) },
                    "Load online map ",
                    React.createElement(Icon, { name: "external", size: 16 })),
                React.createElement("small", null, "Internet required. Event list and calendar work offline.")))));
}
