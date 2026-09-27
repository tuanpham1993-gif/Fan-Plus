> ARCHIVE: original V1 notes, not the current V3 implementation status. See ../../../docs/IMPLEMENTATION.md.

# Proposed backend integration contract - NOT an implemented API

`src/services/http.ts` contains only a small subset of this proposal. It is not wired into the delivered UI. Agree this contract with the backend owners before implementing it. Naming can be adapted consistently to an existing approved backend rather than creating duplicate APIs.

## Conventions

Base `/api/v1`; JSON; ISO-8601 timestamps; string resource ids; bounded page size; server-side role and ownership checks. Public content queries return published resources only. Error body `{ "code": "VALIDATION_ERROR", "message": "...", "fieldErrors": { "title": "..." }, "requestId": "..." }`. Use appropriate 400/401/403/404/409/422/429 codes consistently. A successful delete can return 204. The partial client currently handles message/detail but not every fieldErrors case.

Use server-issued session cookies with HttpOnly, Secure on HTTPS and an appropriate SameSite policy. Add CSRF protection on state-changing endpoints. A session cookie is not enough by itself to solve CSRF. Rotate/revoke sessions according to login/logout/password-reset policy. Never put live authentication tokens or LLM keys in localStorage or VITE_* variables. Backend password hashing is not the simulator's SHA-256 verifier.

## Routes and authorization

| Method / resource | Access | Contract notes |
|---|---|---|
| POST /auth/register | Public, throttled | Name/email/password; validation and verification workflow |
| POST /auth/login | Public, throttled | Set server session; return safe user DTO, never password/hash |
| POST /auth/logout | Current session | Invalidate session, clear cookie |
| GET /auth/me | Member | Current user's safe DTO |
| POST /auth/forgot-password | Public, throttled | Generic response, send real one-time token email |
| POST /auth/reset-password | Token, throttled | Expiring, hashed-at-rest single-use token; session policy |
| POST /auth/verify-email | Token | Verification without user-controlled role assignment |
| POST /auth/resend-verification | Appropriate policy | Throttled, avoid account enumeration |
| PATCH /users/me | Member | Allowlist fields; no role/suspension mass assignment |
| POST /users/me/avatar | Member | MIME + decoded image + size validation; storage lifecycle |
| GET /categories, /fandoms | Public | Distinct taxonomies |
| GET /contents | Public | q/category/fandom/type/genre/year/popular/sort/page/pageSize |
| GET /contents/:id | Public if published | Safe content DTO; prevent draft leaks |
| GET /releases | Public | Category/type/date range filters; explicit release timezone |
| GET /bookmarks | Member, own only | Paginated resource summaries + own notes |
| POST /bookmarks | Member | `{contentId}`; unique (user_id, resource_id), idempotent conflict policy |
| PATCH /bookmarks/:id | Owner | `{note}` with length limit |
| DELETE /bookmarks/:id | Owner | Delete own bookmark, not another user's |
| PUT /contents/:id/my-rating | Member | Integer 1-5; unique (user_id, resource_id); return aggregate |
| POST /contents/:id/view | Controlled anonymous/member | Dedupe/abuse policy; do not count raw UI rerenders |
| POST /feedback | Policy-defined visitor/member | type=bug/suggestion/query; throttled |
| GET /events | Public | City, date range, category, page filters |
| GET /events/nearby | Public, throttled | Valid lat/lng/radiusKm; bounded radius and result limit |
| GET /events/:id | Public | UTC timestamps + venue timezone; validated ticket URL |
| POST /submissions | Member | Only author-owned draft input; creates pending status |
| GET /submissions/mine | Member | Only current user's submissions/status/reason |
| GET /admin/submissions | Administrator | Moderation queue, paging/filtering |
| POST /admin/submissions/:id/decision | Administrator | approve/reject + reason; transactional publish + audit; reject repeat decisions |
| POST/PATCH/DELETE /admin/contents[/id] | Administrator | Validate taxonomy, type, URLs, publication; safe file handling |
| POST/PATCH/DELETE /admin/categories[/id] | Administrator | Restrict deletion when referenced |
| POST/PATCH/DELETE /admin/events[/id] | Administrator | End after start, coordinates, timezone, external links |
| GET /admin/users | Administrator | Paginated minimal user info |
| PATCH /admin/users/:id/status | Administrator | Audit suspension; protect final admin/account recovery |
| GET/PATCH /admin/feedback[/id] | Administrator | Resolution workflow and retention |
| CRUD /admin/faqs | Administrator | Approved FAQ source records |
| GET /admin/analytics | Administrator | Define period, active users, distinct views, query volume |
| POST /chat/sessions/:id/messages | Optional, owner/session policy | Return grounded answer DTO and source records; limits, no browser model key |
| GET /chat/sessions/:id/messages | Owner | History pagination and retention |
| DELETE /chat/sessions/:id | Owner | Delete history according to retention policy |

## Example page DTO

```json
{
  "items": [{"id":"c01","title":"...","categoryId":"anime","fandom":"Neon Horizon","type":"article","status":"published"}],
  "total":24,
  "page":1,
  "pageSize":9,
  "pageCount":3
}
```

The truncated item above illustrates the envelope, not all required Content fields. Align the final DTO with `src/domain/types.ts`, or introduce a validated mapping layer. Do not pretend a type assertion validates untrusted JSON at runtime.

## Proposed relational model

User -> UserCategoryPreference / UserFandomPreference. Category and Fandom are separate. Resource is the common bookmarkable identity with category, fandom, type, title, publication status, timestamps and source provenance. Article, Character, Media and Merchandise can use one-to-one typed detail tables. Genre/Tag can use join tables.

Bookmark(user_id FK, resource_id FK, note, created_at), UNIQUE(user_id, resource_id). Rating(user_id FK, resource_id FK, value), UNIQUE(user_id, resource_id), CHECK value 1..5. This is safer than an arbitrary item_type/item_id pair that cannot enforce the target with an ordinary single FK. The supplied SRS explicitly permits a different schema from its examples.

Event has city/venue/coordinates/start/end/timezone/category/source/ticket URL. Submission has author/status/reviewer/reason/reviewed_at and optional published_resource_id. Moderation and publication should be one transaction. Add AuditLog, PasswordResetToken, EmailVerificationToken and Session as needed by the chosen auth framework. Do not store anonymous visitors as fake registered User rows merely to satisfy a Visitor enum.

SQL Server has its own concrete type/constraint semantics; the conceptual ENUM/BOOLEAN/JSON labels from a sketch are not a portable CREATE TABLE script. Generate and inspect real migrations for the chosen database, including Unicode text support and referential actions.

## Integration sequence

1. Implement auth/me + public taxonomy/content queries. Replace broad demo loading with role-scoped resource queries; keep the mock behind a clear development boundary.
2. Connect explorer/detail, then own bookmarks/notes/ratings/profile. Test loading, cancellation, 401, 403, 404, empty and conflict states.
3. Connect submission/moderation and editorial CRUD. Confirm pending/draft resources never leak through public endpoints.
4. Connect events/feedback/release data. Verify dates, geolocation denied/unavailable paths and real HTTPS map behavior.
5. Add actual email, uploads, analytics and security tests. Only then enable optional AI.

## Optional grounded assistant

First implement FAQ/content retrieval on a small approved corpus. If semantic retrieval is needed, record source_id, fandom_id, canon/adaptation, entity_id, spoiler_level, publication state, license and updated_at with every chunk. Filter before retrieval/context construction and return structured source ids/links. Treat retrieved text as data, not instructions. Add no-evidence fallback, retrieval relevance checks, citation verification, model timeout, rate limits and deletion/reindex behavior.

Do not assume RAG guarantees factual correctness or that a category filter resolves same-named characters in different universes. Do not crawl arbitrary wiki content without reviewing permissions, license and provenance. A small curated corpus is a better first demonstration than a large unreviewed scrape. Evaluate unit logic separately from retrieval quality and end-to-end answers.
