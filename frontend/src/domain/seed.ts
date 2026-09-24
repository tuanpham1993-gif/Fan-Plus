import type { Category, Content, ContentType, Database } from './types';
export const categories: Category[] = [
    { id: 'anime', name: 'Anime', description: 'Stories beyond the ordinary', icon: 'compass', color: '#c3b0fc' },
    { id: 'gaming', name: 'Gaming', description: 'Your next great adventure', icon: 'gamepad', color: '#a7dab6' },
    { id: 'movies', name: 'Movies', description: 'Made for the big screen', icon: 'film', color: '#f3b08d' },
    { id: 'tv', name: 'TV Shows', description: 'One more episode', icon: 'tv', color: '#96c6f1' },
    { id: 'kpop', name: 'K-Pop', description: 'Feel every beat', icon: 'music', color: '#ef9dbf' },
    { id: 'comics', name: 'Comics', description: 'Every panel a possibility', icon: 'bolt', color: '#eed385' },
    { id: 'manga', name: 'Manga', description: 'A world between the pages', icon: 'book', color: '#bdd1cd' },
    { id: 'cosplay', name: 'Cosplay', description: 'Bring your world to life', icon: 'mask', color: '#dda9ef' },
];
const rows: [
    string,
    string,
    ContentType,
    string,
    string,
    string
][] = [
    ['anime', 'Neon Horizon: a city between two skies', 'article', 'Neon Horizon', 'Sci-fi', 'A quiet guide to an extraordinary city, its unlikely friendships and the art of beginning again.'],
    ['gaming', 'Skybound: the art of getting beautifully lost', 'video', 'Skybound', 'Adventure', 'Explore floating islands and the little details that turn a game into a place you call home.'],
    ['kpop', 'Orbit Nine: behind the midnight stage', 'gallery', 'Orbit Nine', 'Music', 'A visual exploration of stage design, color and the collective energy of a fictional pop group.'],
    ['movies', 'After the Last Star: a visual field guide', 'article', 'After the Last Star', 'Sci-fi', 'From warm desert light to silent space stations: explore the visual language of a new world.'],
    ['anime', 'Meet Aki, the keeper of small promises', 'character', 'Neon Horizon', 'Slice of life', 'Get to know the mapmaker who notices everything that a restless city forgets.'],
    ['gaming', 'The Skybound field notebook', 'merchandise', 'Skybound', 'Adventure', 'A concept collectible for explorers. Discover the details, materials and story behind the design.'],
    ['tv', 'The Lantern House: where should you begin?', 'article', 'The Lantern House', 'Fantasy', 'Your spoiler-light introduction to a house with a different story behind every door.'],
    ['comics', 'Paper Worlds: drawing a universe in six panels', 'gallery', 'Paper Worlds', 'Adventure', 'Follow the pencils, inks and final panels of an original comic-world concept.'],
    ['manga', 'Cloud Letters: why the quiet chapters matter', 'article', 'Cloud Letters', 'Slice of life', 'A reading companion to ordinary moments, honest conversations and an unforgettable summer.'],
    ['cosplay', 'From sketch to silhouette: a maker diary', 'article', 'Atelier Aurora', 'Creative', 'Learn how a fictional costume evolves through sketches, safe materials and thoughtful details.'],
    ['kpop', 'Orbit Radio: a minute of midnight', 'audio', 'Orbit Nine', 'Music', 'An original synthesized audio sample for testing the player. No commercial music is included.'],
    ['movies', 'After the Last Star: motion study', 'video', 'After the Last Star', 'Sci-fi', 'An original abstract motion sample to demonstrate a local, accessible video player.'],
    ['comics', 'Meet Nova, the courier of impossible things', 'character', 'Paper Worlds', 'Adventure', 'Character notes on curiosity, courage and a rather unreliable bicycle.'],
    ['manga', 'Cloud Letters: chapter notes collection', 'merchandise', 'Cloud Letters', 'Slice of life', 'A paper-goods concept collection. This showcase has no checkout or order processing.'],
    ['cosplay', 'Aurora workshop: shape, texture and light', 'gallery', 'Atelier Aurora', 'Creative', 'A small visual collection for makers who love the process as much as the result.'],
    ['tv', 'Inside the Lantern House: room by room', 'gallery', 'The Lantern House', 'Fantasy', 'A collection of visual mood studies for the rooms of an imaginary house.'],
    ['gaming', 'Meet Sol, cartographer of the sky', 'character', 'Skybound', 'Adventure', 'The explorer who believes that every good map should leave room for a surprise.'],
    ['kpop', 'Orbit Nine: concept light object', 'merchandise', 'Orbit Nine', 'Music', 'A fictional collectible concept with a sculpted orbital silhouette. Display only.'],
    ['anime', 'The bridge at dawn: episode notes', 'article', 'Neon Horizon', 'Sci-fi', 'A detailed discussion of the final bridge scene. Contains a marked story spoiler in this demo.'],
    ['comics', 'Paper Worlds: the color script', 'article', 'Paper Worlds', 'Creative', 'How a restricted palette can make even the smallest comic panel feel expansive.'],
    ['manga', 'Meet Mio, writer of unsent letters', 'character', 'Cloud Letters', 'Slice of life', 'Meet the quiet observer at the heart of our original slice-of-life concept.'],
    ['cosplay', 'Atelier Aurora: costume concept badge', 'merchandise', 'Atelier Aurora', 'Creative', 'A non-commercial concept collectible celebrating community craftsmanship.'],
    ['tv', 'Lantern Sessions: ambient sketch', 'audio', 'The Lantern House', 'Fantasy', 'An original ambient sound sketch, included locally for reliable media testing.'],
    ['movies', 'Meet Iris, the last observatory keeper', 'character', 'After the Last Star', 'Sci-fi', 'A profile of the fictional astronomer who chooses connection over certainty.'],
];
export const contents: Content[] = rows.map((r, i) => ({
    id: `c${String(i + 1).padStart(2, '0')}`, categoryId: r[0], title: r[1], type: r[2], fandom: r[3], genre: r[4], description: r[5],
    body: `## A world worth exploring\n\n${r[5]} This original demo entry was created for Fan Hub Plus; it is not a factual article about an existing franchise.\n\n## Look a little closer\n\nThe best fandom experiences begin with curiosity. Notice the visual motifs, the choices the characters make, and the way a small detail can connect two seemingly separate moments. Here, the world is a starting point for conversations rather than a list of facts to memorize.\n\n## Make it your own\n\nSave this entry to your collection, leave a private note, or explore another category. Every reference in this prototype points to the local demo collection. The editorial text, illustration and media will need a source and licensing review when your team replaces them with real content.`,
    image: `/art/${r[0]}.svg`, year: [3, 4, 5, 6, 7, 9, 13, 17].includes(i) ? 2026 : 2026 - (i % 3), publishedAt: new Date(Date.UTC(2026, 8, 24 - Math.floor(i / 2), 12)).toISOString(), popularity: 98 - (i * 3) % 55, rating: Number((4.9 - (i % 6) * 0.1).toFixed(1)), duration: r[2] === 'audio' ? '0:08' : r[2] === 'video' ? '0:06' : '4 min read',
    tags: r[2] === 'merchandise' ? ['Collectible', i % 2 ? 'Limited Edition' : 'Pre-Order'] : ['Editorial pick', r[4]], status: 'published', author: 'Fan Hub Studio', spoiler: i === 18,
    mediaUrl: r[2] === 'audio' ? '/media/orbit.wav' : r[2] === 'video' ? '/media/portal.webm' : undefined, sourceLabel: 'Original fictional demo content', releaseDate: ([3, 4, 5, 6, 7, 9, 13, 17].includes(i) ? '2026-10-' + String(i + 3).padStart(2, '0') : undefined),
}));
export const DEMO_PASSWORD = 'FanHubDemo!26';
export function initialDatabase(): Database {
    return {
        schemaVersion: 1, categories: structuredClone(categories), contents: structuredClone(contents),
        users: [{ id: 'u-member', name: 'Alex Morgan', email: 'fan@fanhub.demo', role: 'member', favoriteCategories: ['anime', 'gaming'], favoriteFandoms: ['Neon Horizon'], bio: 'Collecting stories and finding my next universe.', suspended: false }, { id: 'u-admin', name: 'Studio Admin', email: 'admin@fanhub.demo', role: 'admin', favoriteCategories: [], favoriteFandoms: [], bio: 'Demo editorial team', suspended: false }],
        events: [
            { id: 'e1', title: 'Between Worlds: fan gathering', city: 'Ho Chi Minh City', venue: 'District 1 - demo venue', lat: 10.7769, lng: 106.7009, startsAt: '2026-10-03T09:00:00+07:00', endsAt: '2026-10-03T16:00:00+07:00', categoryId: 'anime', description: 'An imaginary day of art, panels and conversations for fans of every universe.', image: '/art/anime.svg' },
            { id: 'e2', title: 'Skybound: community game night', city: 'Ho Chi Minh City', venue: 'District 3 - demo venue', lat: 10.783, lng: 106.686, startsAt: '2026-10-10T17:00:00+07:00', endsAt: '2026-10-10T20:00:00+07:00', categoryId: 'gaming', description: 'A fictional meetup to test event discovery and calendar export.', image: '/art/gaming.svg' },
            { id: 'e3', title: 'Paper & Ink: illustration meetup', city: 'Hanoi', venue: 'Hoan Kiem - demo venue', lat: 21.028, lng: 105.854, startsAt: '2026-10-17T10:00:00+07:00', endsAt: '2026-10-17T16:00:00+07:00', categoryId: 'comics', description: 'A fictional community gathering celebrating sequential art and visual stories.', image: '/art/comics.svg' },
            { id: 'e4', title: 'Aurora makers: cosplay workshop', city: 'Da Nang', venue: 'Hai Chau - demo venue', lat: 16.0678, lng: 108.2208, startsAt: '2026-10-24T09:00:00+07:00', endsAt: '2026-10-24T12:00:00+07:00', categoryId: 'cosplay', description: 'An imaginary workshop about costume planning and safe material choices.', image: '/art/cosplay.svg' },
        ], bookmarks: [], ratings: [], activity: [], feedback: [], submissions: [], faqs: [
            { id: 'faq1', question: 'How do I bookmark a story?', answer: 'Sign in with a demo account, then select the bookmark icon on any content card. Open My collection to add a private note.' },
            { id: 'faq2', question: 'Can I buy merchandise here?', answer: 'No. Fan Hub Plus is a merchandise showcase only. There is no checkout, payment gateway or order processing.' },
            { id: 'faq3', question: 'How do events and location work?', answer: 'Open Events, select a city or explicitly choose Use my location. Coordinates are used in memory to sort fictional events and are not saved.' },
            { id: 'faq4', question: 'Is this a real AI chatbot?', answer: 'This frontend demo uses deterministic keyword matching over local, published content and FAQs. It does not call an AI model.' },
            { id: 'faq5', question: 'How do I submit an article?', answer: 'Sign in, open Submit a story, and send your draft. The demo admin can approve or reject it. Only approved stories appear in Explore.' },
        ]
    };
}
