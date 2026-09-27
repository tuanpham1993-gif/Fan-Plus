> ARCHIVE: original V1 notes, not the current V3 implementation status. See ../../../docs/IMPLEMENTATION.md.

# Developer architecture notes

## Actual implementation, not a proposed technology list

React 19.1.1, TypeScript source, native CSS design tokens, browser History API, native dialog/media/geolocation, and a local async repository simulator. No Tailwind, Bootstrap, shadcn/ui, TanStack Query, Leaflet, React Router, LlamaIndex or vector database is installed. The source npm toolchain is Vite 7.1.3; the shipped portable preview uses pre-transpiled ES modules and an included React runtime.

The visual direction is an editorial discovery hub: charcoal surfaces, warm orange actions, eight individually identified worlds, generous typography and original fictional cover art. English interface copy follows the English SRS and can be reviewed for an international demonstration. This is not a completed multilingual/i18n implementation.

## Source map

| Path | Responsibility | Proposed group owner |
|---|---|---|
| src/main.tsx, App.tsx | Root, route map, lazy pages, error boundary | Hoa + Tuan |
| src/components/Layout.tsx | Header, footer, search dialog, appearance, mobile navigation | Hoa |
| src/components/ui.tsx | Reusable buttons, labelled fields, cards, dialogs, gates, notices | Hoa |
| src/styles.css | Tokens, responsive layouts, light/dark, font scaling, motion | Hoa |
| src/domain/types.ts | Shared frontend DTOs | Tam + Tuan |
| src/domain/seed.ts | Explicitly fictional fixtures | Tam + content owners |
| src/domain/logic.ts | Pure filtering, recommendation, distance, ICS, validation | Tam + Khoi |
| src/services/repository.ts | Browser-only simulator; replace with real API boundaries | Tuan |
| src/services/http.ts | Partial proposed HTTP client, NOT wired | Tuan + all feature owners |
| src/lib/store.tsx | Demo database/identity, appearance and notifications | Tuan + Hoa |
| src/lib/router.tsx | Small custom History router with injectable test port | Hoa |
| src/pages/Home.tsx, Explore.tsx | Discovery and filtering | Hoa |
| src/pages/Detail.tsx | Article/character/media/showcase details | Thang |
| src/pages/Events.tsx, Releases.tsx | Event/calendar/consent and cross-category releases | Thang; API by Tam |
| src/pages/Auth.tsx | Login/register/reset and verification handoff | Khoi; API by Tuan |
| src/pages/Account.tsx | Dashboard, collection/notes, profile, submission, feedback | Khoi |
| src/pages/Admin.tsx | Moderation, editorial CRUD, events, users, feedback, FAQ | Phuc |
| src/pages/Assistant.tsx | Local keyword guide, not an LLM | Tuan + Khoi only after core |
| src/pages/Utility.tsx | Sitemap, privacy/demo disclosure, 404 | Hoa |

Names above are a proposed rebalance, not an edit to the supplied workbook. The tasksheet originally assigns many user/event/chat responsibilities to Khoi; moving event UI to Thang and event API to Tam reduces this bottleneck.

## State and navigation

Explorer filters live in URL query parameters, so combinations can be shared and restored through browser navigation. Session identity is isolated to a tab in demo mode. The demo database is persisted as one local JSON object. Shared UI updates use AppProvider.perform with error notices and refreshed state.

This one-object store is intentionally a prototype shortcut. Do not copy it into a backend endpoint that exposes every user, feedback message and unpublished submission. Real integration needs per-resource queries, role-scoped data, mutation invalidation, pagination, request cancellation and authoritative backend validation. TanStack Query and a standard router are reasonable next steps if their installation and learning fit the schedule; neither is a prerequisite to run this package.

## Content identity

The frontend represents every bookmarkable type with a common Content id. This avoids broken polymorphic references in the browser model. For SQL, prefer a Resource table plus typed detail tables; the bookmark FK targets Resource. Category is Anime/Gaming/etc; fandom is a particular fictional universe. They are different concepts.

Demo articles use plain text and a tiny safe Markdown-like renderer. HTML is not executed. Do not replace it with raw innerHTML for untrusted submissions. Use a constrained rich-text model or sanitization before rendering actual external content. Very long chapter/timeline authoring and rich-text editing still need expansion.

## Demo vs production boundaries

- Route guards and mock actor checks improve UX; they are not security.
- Spoiler blur/reveal protects the reading experience, not confidential data. The body already exists in the local database. Real spoiler-aware AI must filter retrieval before sending context to a model.
- Discovery recommendations are deterministic scores based on interests and existing interactions. They are not a trained hybrid recommender.
- The assistant matches local published catalog/FAQ material; it is not RAG or semantic search.
- Original demo metrics must not be presented as real audience analytics.
- Native geolocation is requested by an explicit button; the coordinates remain in component memory. Map loading is separate, with consent and an external-provider notice.
- Calendar/time displays intentionally use Asia/Ho_Chi_Minh. Backend events should store UTC plus venue timezone.

## Accessibility and interaction checklist

Native buttons/links, labels, modal accessible names, focus-visible styles, skip link, main focus on navigation, reduced-motion CSS, accessible search, clear error/empty/loading states, and 100-125% font controls are implemented. A full WCAG audit, screen-reader review, contrast audit, keyboard-only all-flow review and browser zoom to 200% remain to be performed. Passing no-overflow tests is not equivalent to accessibility certification.

## Production architecture recommendation

If the team has not committed to a backend: React/TypeScript frontend + Django/DRF + MySQL is a defensible SRS-aligned Python option. Keep SQL Server if the group already has expertise and deployment tooling. FastAPI is not listed in the supplied SRS; get written confirmation before choosing it. Do not change an already working approved backend merely for fashion.

Start with one API application and one relational database. Add an optional retrieval/LLM service only after all required flows work. Use same-origin deployment where possible, server sessions, CSRF validation and secrets only on the server. Add Docker Compose for reproducible backend/database startup later; this frontend package does not include a fake working backend Compose stack.
