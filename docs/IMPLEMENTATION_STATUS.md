# Implementation status - do not confuse source with acceptance

Legend: implemented service = executable business logic tested directly with SQLite; authored route = Flask endpoint source, not HTTP-tested here; local UI = active browser simulator, not API integration.

| Domain | Local UI | Backend model/service | Authored Flask routes | Remaining work |
|---|---|---|---|---|
| Registration/login/logout | Yes, simulated | Hashing, session/token lifecycle tested | Yes | Install/runtime test; replace local auth; delivery monitoring |
| Email verification/reset | Local handoff/reset simulation | Single-use, expiring, purpose-bound tokens tested | Yes | Wire fragment token UI; mail outbox/retries; real SMTP verification |
| Profile/name/bio | Yes | User model | GET/PATCH | Favorites/settings/avatar routes and wiring |
| Preferences | Yes | Tables for settings/categories/fandoms | Not yet | Persist preferences with owner-scoped validation |
| Dashboard | Yes | Counts only | Counts endpoint | Recent activity writes/readout, favorites, recommendation integration |
| Search/content read | Yes | Public filters, joined DTO, pagination tested | Yes | DTO adapters; live DB indexing/EXPLAIN; extended metadata |
| Admin resource write | Yes | Create/update/archive, version conflict tested | Yes | Typed subtype editors, media assignment, full screen integration |
| Category/fandom/tag admin | Yes, local category CRUD | Catalog models; read routes | Read only | Write validation, restriction on deleting referenced taxonomy |
| Character/merchandise detail | Yes | Shared resource + subtype models | Generic resource only | Typed nested DTOs/editors, release feed API |
| Media/gallery/audio/video | Yes, local files | Media and resource-media models | Not yet | Secure upload, approved URLs, transcoding/streaming/object storage |
| Bookmark/private notes | Yes | Owner-scoped services tested | Yes | Async collection UI, server-only privacy tests on real HTTP |
| Ratings | Yes | Unique vote and DB value constraint tested | Yes | Screen wiring; allowed-rateable-kind decision |
| Fan submissions | Yes | Pending and ownership rules tested | Yes | Screen wiring; edit/resubmit design if added |
| Moderation | Yes | Atomic publish/reject, versioning, no self-review tested | Yes | Real concurrent MySQL tests and notifications |
| Events/list/nearby/ICS | Yes, with simulated GPS tests | Time validation, distance filtering and ICS tested | Read/create/ICS | Update/archive/cancel endpoints, real map/GPS acceptance |
| Upcoming releases | Yes | Model | Not yet | Feed DTO, date precision and regional display |
| Feedback | Yes | Create/list/resolve | Yes | Anti-abuse/real integration and user-facing support workflow |
| User suspension | Yes | Revokes server sessions | PATCH | User-list UI API and operator recovery procedures |
| Usage analytics | Local illustrative stats | Admin counts only | Overview counts | Active-user definition, event ingestion, retention and measured analytics |
| Assistant/FAQ | Local keyword matching | FAQ/chat/source tables only | Not yet | Optional server FAQ; RAG only after core acceptance |
| Files/deployment | Portable UI works | WSGI/Docker config authored | Not executed | Live Flask/MySQL/Redis/SMTP/container and HTTPS tests |

## Test boundaries

SQLite constraint and migration success is not proof of MySQL compatibility, collation, transaction isolation or simultaneous-write behavior. Sequential repeat/version tests are not load tests. Flask routes were compile-checked but not executed here. One pytest module is explicitly skipped, containing the future Flask HTTP checks.

The frontend has 49 Node tests and 19 Chromium harness groups in the recorded run. The backend has 61 passing tests and one skipped module. Do not add these into a claim of a fully tested integrated system.

## SRS constraints preserved

Eight categories, media, submissions/moderation, discovery, events and access features remain in scope. Optional AI is not substituted for required features. No cart/order/payment code is planned. SQLite, local role gates, fabricated rating fixtures and keyword chat are clearly development aids, not a completed compliance claim.
