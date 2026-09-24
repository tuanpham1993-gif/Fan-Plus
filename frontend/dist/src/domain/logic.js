export const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function filterContents(contents, f, pageSize = 9) {
    const terms = normalize(f.q || '').split(/\s+/).filter(Boolean);
    const items = contents.filter(c => c.status === 'published')
        .filter(c => !f.category || c.categoryId === f.category)
        .filter(c => !f.fandom || c.fandom === f.fandom)
        .filter(c => !f.type || f.type.split(',').includes(c.type))
        .filter(c => !f.genre || c.genre === f.genre)
        .filter(c => !f.year || String(c.year) === f.year)
        .filter(c => f.popular !== 'true' || c.popularity >= 80)
        .filter(c => terms.every(t => normalize([c.title, c.fandom, c.description, ...c.tags].join(' ')).includes(t)))
        .sort((a, b) => f.sort === 'az' ? a.title.localeCompare(b.title) : f.sort === 'popular' ? b.popularity - a.popularity || a.id.localeCompare(b.id) : Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.id.localeCompare(b.id));
    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
    const requested = Number.parseInt(f.page || '1', 10);
    const page = Math.min(pageCount, Math.max(1, Number.isFinite(requested) ? requested : 1));
    return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize, pageCount };
}
export function distanceKm(a, b) {
    const rad = (x) => x * Math.PI / 180, dlat = rad(b.lat - a.lat), dlng = rad(b.lng - a.lng);
    const h = Math.sin(dlat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dlng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(Math.min(1, h)), Math.sqrt(Math.max(0, 1 - h)));
}
export function safeExternalUrl(value) {
    try {
        const u = new URL(value);
        return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
    }
    catch {
        return null;
    }
}
export function safeReturnPath(value) { return value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/dashboard'; }
export function recommend(db, user, limit = 4) {
    const saved = new Set(db.bookmarks.filter(b => b.userId === user?.id).map(b => b.contentId));
    return db.contents.filter(c => c.status === 'published' && !saved.has(c.id)).map(c => ({ content: c, reason: user?.favoriteCategories.includes(c.categoryId) ? 'Because you follow this category' : user?.favoriteFandoms.includes(c.fandom) ? 'From a fandom you follow' : 'An editorial discovery', score: c.popularity + (user?.favoriteCategories.includes(c.categoryId) ? 100 : 0) + (user?.favoriteFandoms.includes(c.fandom) ? 150 : 0) })).sort((a, b) => b.score - a.score).slice(0, limit);
}
export function validateContent(c) {
    if (!c.title || c.title.trim().length < 3 || c.title.length > 120)
        return 'Title must contain 3-120 characters.';
    if (!c.categoryId)
        return 'Choose a category.';
    if (!c.description || c.description.trim().length < 12)
        return 'Summary must contain at least 12 characters.';
    if (!Number.isInteger(c.year) || c.year < 1900 || c.year > 2100)
        return 'Year must be between 1900 and 2100.';
    if (c.mediaUrl && !c.mediaUrl.startsWith('/media/') && !safeExternalUrl(c.mediaUrl))
        return 'Media must use a local demo path or HTTPS.';
    return null;
}
export function calendarFile(event) {
    const escape = (x) => x.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const dt = (x) => new Date(x).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    // Fold on UTF-8 byte boundaries as required by RFC 5545.
    const fold = (s) => {
        let out = '', line = '', size = 0;
        for (const ch of s) {
            const len = new TextEncoder().encode(ch).length;
            if (size + len > 74) {
                out += line + '\r\n ';
                line = '';
                size = 1;
            }
            line += ch;
            size += len;
        }
        return out + line;
    };
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fan Hub Plus//Frontend Demo//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${event.id}@demo.fanhub.local`, `DTSTAMP:${dt(new Date().toISOString())}`, `DTSTART:${dt(event.startsAt)}`, `DTEND:${dt(event.endsAt)}`, `SUMMARY:${escape('[DEMO] ' + event.title)}`, `LOCATION:${escape(event.venue + ', ' + event.city)}`, `DESCRIPTION:${escape('Fictional event for frontend testing. ' + event.description)}`, 'END:VEVENT', 'END:VCALENDAR'].map(fold).join('\r\n') + '\r\n';
}
