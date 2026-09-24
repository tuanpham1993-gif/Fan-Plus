# Fan Hub Plus - Flask backend engineering blueprint

## 1. Decision and scope

Use a **modular monolith**: one Flask application, one relational source of truth, and separate business modules inside the codebase. This keeps deployment and transaction boundaries understandable for this project while permitting isolated service tests. It is a recommended design for this kit, not a universal claim that one architecture is best for every team.

Flask is the web framework. React/TypeScript remains the frontend. SQLAlchemy 2 is used directly for relational persistence; Alembic manages schema history. Pydantic validates JSON/query input. Flask-WTF supplies CSRF integration, Flask-Limiter rate limits and Argon2 handles password hashing. MySQL 8.4 is the target database. SQLite is limited to development/tests. Redis is a production rate-limit dependency, not a second source of user/content truth.

The SRS examples allow a custom schema rather than requiring their illustrative table layout. A Resource supertype is introduced to preserve a real foreign key for bookmarks across articles, characters, multimedia and merchandise. Checkout, orders and payment integrations are excluded. Chat remains an optional extension after the required workflows are complete.

### Architecture boundaries

```text
Browser: React components, per-domain query hooks and DTO adapters
                |
      HTTPS / same-origin /api/v1
                |
Flask application factory + middleware and extension initialization
                |
Blueprint route -> input schema -> policy -> business service
                |                            |
           JSON envelope                SQLAlchemy Session
                                             |
                                      MySQL transaction

Optional, later: queue worker -> mail outbox / media processing / AI indexing
Optional, later: retrieval provider -> source-filtered context -> LLM
```

Do not copy a FastAPI router/dependency pattern and merely rename its imports. This implementation uses Flask Blueprints, request context, response handlers and its extension lifecycle. There is no ASGI/uvicorn requirement.

## 2. Code structure and responsibilities

```text
backend/
  wsgi.py                       Dotenv loading and WSGI app entry
  app/
    __init__.py                 Public create_app function
    factory.py                  Assemble app, routes, errors and response headers
    config.py                   Environment profiles and production guards
    extensions.py               Unbound CSRF and rate-limit instances
    db.py                       Engine, connection pool and request Session factory
    cli.py                      Demo seed, explicit admin creation, token pruning
    api/                        HTTP boundary only
      auth.py                   CSRF, accounts, sessions, verification/reset
      catalog.py                Public taxonomy reads
      resources.py              Public content and rating endpoints
      me.py                     Current-user profile, bookmarks, submissions
      events.py                 List/detail/nearby search and calendar export
      feedback.py               Feedback intake
      admin.py                  Authorized editorial/moderation operations
      health.py                 Liveness, DB readiness, OpenAPI JSON
      helpers.py                Body/query parsing, policy decorators, envelopes
    schemas/requests.py         Allowed fields, enums, lengths and cross-field rules
    services/                   Business rules and transaction-participating operations
      auth.py                   Hash/token/session lifecycle
      catalog.py                Public visibility, search, references and versioned writes
      library.py                Owner-scoped bookmark/note and rating operations
      moderation.py             Pending/review/publish/reject transaction
      events.py                 UTC, distance, query bounds, ICS escaping/folding
      feedback.py               Intake and admin resolution
      policy.py                 Membership/admin checks
      seed.py                   Explicit original local fixtures
    models/                     31 mapped tables; see generated dictionary
    common/                     Domain errors and security primitives
    integrations/mail.py        Development mailbox or SMTP adapter
  migrations/                   Versioned DDL, no create_all at app startup
  schema/mysql.sql              Reference schema, alternative to migrations
  openapi.json                  Authored HTTP contract
  seed/demo.json                Original fictional examples
  tests/                        Unit/service/integrity/migration and gated HTTP tests
```

Routes validate transport details and map domain failures to HTTP responses. Services implement rules and may flush, but **must not commit** independently. The request boundary commits a complete business operation. Models do not send mail, call an LLM or access Flask request globals. External I/O belongs in integration adapters; durable work should move to an outbox/worker before production use.

A generic repository layer that only forwards SQLAlchemy calls is deliberately not added. The services use SQLAlchemy clearly and can be tested without importing Flask. Add a separate persistence adapter only when a real boundary or multiple implementations justify it.

## 3. Relational data design

See DATA_DICTIONARY.md for every column, primary key, foreign key, unique/check constraint and explicit index. There are 31 tables in the current model, grouped as follows.

Identity: users, user_settings, user_categories, user_fandoms, auth_sessions, one_time_tokens. A visitor is unauthenticated request state, not a persisted Visitor role. Public registration produces a member only. Avatar is a reference to an approved media asset, never an arbitrary executable file.

Taxonomy: categories, fandoms, fandom_categories, genres, tags. A fandom may appear in both Anime and Manga, so it is not forced into exactly one category. A composite relationship validates each resource's selected fandom/category pair.

Catalog: resources, resource_genres, resource_tags, character_profiles, merchandise_items, event_details, upcoming_releases. Resource contains shared identity, title, summary, editorial body, visibility, author and version. Specialized detail records use the same resource id as their primary/foreign key. The current generic resource routes do not yet assemble all subtype fields; that work is explicit in the status matrix.

Media: media_assets, resource_media. Media holds ownership, MIME type, storage key, byte size, approval and license/source attribution. ResourceMedia preserves ordered galleries without copying the same asset. The seed uses original SVGs as trusted assets; **user-uploaded SVG is not enabled**.

Engagement: bookmarks, ratings, activities, feedback. A unique user/resource bookmark prevents duplicates. Notes belong to the current user. A rating has one row per user/resource and a database range check. Activity is day-deduplicated per user/resource; ingestion and active-user analytics are not implemented yet.

Moderation: fan_submissions, moderation_actions, audit_logs. A submission is not a published resource. Approval creates at most one resource through a unique submission_id. Audit metadata is intentionally generic and is not reused as a substitute for enforceable bookmark foreign keys.

Assistant extension: faqs, chat_threads, chat_messages, message_sources. These tables reserve a source-aware, owner-scoped history design; no server assistant endpoint currently uses them. A vector index is a rebuildable derivative of approved content, not the only copy of knowledge.

### Integrity and indexes

Database checks cover role/status/kind, rating range, content release year/version, event coordinates/time order, reading preferences, media size and token purpose. FK constraints preserve valid owners/resources/taxonomy. Use RESTRICT for editorial references where hard deletion would break history; archive resources rather than deleting their private notes or audit trail indiscriminately.

Important query indexes include public resource status/published_at/id; category/kind/status; event city/start; submission queue status/created; owner bookmark creation; token/session expiry and ownership. The current search uses escaped substring matching, which is reasonable as a transparent small-data baseline but is not a scalable full-text index. Add MySQL FULLTEXT or a dedicated search adapter only after examining actual query plans and Vietnamese/tokenization needs.

UUID-like string identifiers avoid integer assumptions; short fixture ids such as c01 are only demonstration data. Datetimes are normalized to naive UTC internally for MySQL DATETIME and serialized with Z at the API boundary. Event timezone_name retains the IANA display timezone. Reading size is stored as a numeric percentage (100, 112.5, 125).

Python/ORM defaults are not SQL server defaults. Raw SQL insert scripts must populate required UUIDs, timestamps and defaulted non-null fields themselves, or the team must deliberately add equivalent server defaults in a future migration.

## 4. API and response contract

All business endpoints use /api/v1. Use snake_case consistently in JSON. Unknown input fields are rejected instead of being silently assigned to models. JSON body size is bounded. Query pages are 1-based, page_size is 1-50 and sort values are allowlisted. Duplicate query keys are rejected.

Success responses carry data and request_id, with meta for paginated lists. Error responses carry a stable code, user-safe message, field errors and request_id. Validation errors must not echo passwords, tokens or the full submitted body. A 204 has no JSON body. Calendar responses are text/calendar, not wrapped JSON.

Authentication is represented as an HttpOnly cookie security scheme in OpenAPI. Every unsafe same-origin operation, including login/register/forgot-password, requires the CSRF header. Administrator operations require both authentication and server-side role checks. Ownership is derived from the current actor, never a user_id supplied in a bookmark form.

Read API_EXAMPLES.md for payloads and INTEGRATION_PLAN.md for frontend mapping. OpenAPI includes the actual 42 authored operations, not speculative endpoints. Per-operation response data schemas are not all fully specialized yet; the envelope is described, and that contract refinement is part of integration acceptance.

## 5. Session, password and email flows

Registration validates and normalizes the email, hashes the password with Argon2, creates a member and issues a purpose-specific one-time verification token. The current email shape validator is intentionally simple; successful delivery/verification is the ownership check. Display names are trimmed without trimming passwords.

Login checks the password, suspension and verified state. It produces a random opaque token. Only its SHA-256 digest is stored in auth_sessions. SHA-256 here hashes a high-entropy random token, **not a user's password**. The Flask-signed session cookie contains the sid plus CSRF state, not an entire user profile or password. Resolve the role and suspension state from the database on each authenticated request.

The configured session lifetime is an absolute eight hours. A successful login revokes the previous sid and rotates cookie/CSRF state. Logout revokes the server row. Suspension or password reset revokes all rows for that user. A token whose digest is absent, expired or revoked fails authentication even when an old cookie still exists.

Reset links expire after 30 minutes; verification links after 24 hours. Only token digests, purpose, expiry and used_at are stored in the token table. Issuing a newer link invalidates older unused links of the same purpose. A conditional UPDATE consumes it once and rejects replay. Expired/used links share a generic invalid-link response.

Development mail goes to private .eml files, never an API response. Production SMTP is synchronous in this scaffold. The generic forgot-password message does not eliminate timing differences between existing and missing users. Before production, introduce a durable restricted-access mail outbox, retries, delivery monitoring, abuse budgets and timing-resistant enqueue behavior. Do not claim full anti-enumeration or guaranteed email delivery for this scaffold.

Cookies use HttpOnly and SameSite=Lax; production also requires Secure and HTTPS. CSRF is a separate protection, not replaced by SameSite. No access token is stored in localStorage. The app does not offer broad CORS. In development, Vite proxies /api; in deployment, serve static files and API on one origin.

## 6. Authorization matrix

| Operation | Visitor | Member | Admin |
|---|---|---|---|
| Read published content/taxonomy/events | Yes | Yes | Yes |
| View draft/archived content through public endpoints | No | No | No; use admin route |
| Manage own profile/bookmarks/notes | No | Own records | Own records |
| Submit original fan content | No | Yes | Yes, but cannot self-review |
| Inspect another member's private notes | No | No | No endpoint granted for this |
| Create/edit/archive published resources | No | No | Yes |
| Review submissions and feedback queue | No | No | Yes |
| Change own role through a profile request | No | No | No |
| Suspend a normal account | No | No | Yes; not self/admin accounts |
| Chat history | Not implemented | Planned owner-only | Planned own history, not blanket access |

The current blueprint does not introduce a Moderator role. Add one only with a specific permission matrix, migration and tests rather than treating it as interchangeable with Admin.

## 7. Transaction and concurrency rules

A fan submission starts pending. An administrator posts approve or reject with expected_version. The service checks role, prohibits self-review and conditionally updates only a pending row with that version. A stale/duplicate decision returns 409. Approval inserts the Resource, ModerationAction and AuditLog inside the same transaction. Failure in any required insert rolls the operation back; there must not be an approved submission without its published resource.

A unique Resource.submission_id is the second guard against duplicate publication. It complements, rather than replaces, the version check. Rejection needs useful feedback. Approved/rejected rows are not silently reopened by reusing the decision route. Editing/resubmitting is a separately designed workflow, not implemented yet.

Administrative resource writes also use expected_version. The resource kind is immutable through the generic update route because changing article into character would leave invalid subtype assumptions. Archive keeps referential links and private notes; unavailable bookmark cards must not leak draft/future titles.

Bookmarks and ratings use desired-state PUT semantics and database uniqueness. A simultaneous initial insert may return a handled 409; the client can refetch and reconcile rather than replaying blindly. Sequential replay tests are not evidence of all MySQL race/isolation behavior; run concurrent integration tests against the intended database.

## 8. Location, dates and calendar behavior

Event input requires explicit timezone offsets, an IANA zone, finite valid coordinates and end after start. Ticket URLs must be HTTPS without embedded credentials. This is URL shape validation, not an endorsement of the linked provider.

Nearby search bounds candidate rows using latitude/longitude, handles date-line crossing and relaxes longitude bounds near poles. It calculates exact Haversine distances before pagination. A query producing over 2,000 candidates asks the client to narrow its city/radius rather than quietly omitting matches. This is a deliberate small-deployment bound; scale using measured geospatial indexing if needed.

The server does not persist visitor coordinates in a profile/activity table. Query URLs can still appear in web-server/proxy logs: redact precise GPS query parameters, set short retention and do not send them to analytics. The browser should ask for geolocation only after the user chooses it, retain city browsing on denial and require HTTPS outside localhost.

Calendar output uses UTC event times, escaped text, CRLF and UTF-8-aware 75-byte folding. Filenames are fixed, not interpolated from user titles. Timezone/escaping tests are present. Real calendar-app imports, daylight-saving cases and real map/GPS access still require acceptance tests.

## 9. Media and rich-text extension plan

The current scaffold does not expose uploads. Do not add a permissive upload endpoint just to make an avatar button work. The next implementation should cap file size at the proxy and Flask boundary, allowlist image/audio/video types, decode/verify real file contents, rename with generated keys, strip unnecessary metadata, and keep quarantine files outside public static directories.

For raster avatars, decode and re-encode JPEG/PNG/WebP, enforce dimensions/pixel limits and do not accept SVG/HTML from ordinary users. For media, store metadata and moderation status separately from object bytes. Publish only approved assets, retain license/source/attribution, and serve with correct MIME, nosniff, range support and controlled caching. Use temporary uploads with ownership/expiry and cleanup for abandoned drafts.

A Markdown renderer must escape raw HTML or sanitize with a carefully selected allowlist. Validate links independently and do not accept javascript/data executable links. Never return arbitrary stored HTML directly to dangerouslySetInnerHTML. Remote media fetching creates SSRF risks; avoid server-side URL fetching in the initial release, or implement a strict fetch gateway with DNS/IP/redirect checks later.

## 10. Optional assistant plan

Begin with approved FAQ and resource search. Add a source-aware assistant only after the required workflows are stable. A small reviewed corpus with refusal on insufficient sources is preferable to unrestricted scraping.

Planned retrieval metadata: resource_id, resource_version, status, category_id, fandom_id, language, continuity/adaptation, spoiler level, source URL and licensing. Filter for published/authorized documents and permitted spoiler range before generating context. Record source ids/version for each response and reindex/unpublish when editorial state changes. SQL remains the source of truth; a vector database is replaceable.

Prompt-injection controls must not rely on a single system prompt. Treat retrieved text as untrusted data, give the answerer no privileged write tools, restrict sources, enforce output/citation handling and retain user isolation. Keep provider keys only in backend configuration. Add timeouts, per-user quotas, cost limits, fallback answers and deletion/retention rules for conversations.

An async def route does not make blocking SDK calls free. Slow indexing/generation work should use the chosen worker model or bounded synchronous calls with explicit timeouts. Do not introduce Qdrant, Celery/RQ or streaming infrastructure into the mandatory path until there is a concrete need. None of these optional providers is connected in the current kit.

## 11. Deployment, testing and operational gates

Local preview is Node-only for the frontend. Flask can serve the compiled frontend plus API on one origin after dependencies are installed. A production WSGI server such as Waitress sits behind HTTPS termination. The Flask development server/debugger is not a production host. Optional Docker files here describe a local MySQL/Redis/Flask arrangement and have not been executed.

Keep SECRET_KEY stable and secret across replicas. Use a shared Redis store for rate limiting. Restrict database/Redis ports to the internal network. Separate migration credentials from runtime credentials. Do not trust forwarded headers from arbitrary clients; configure a known reverse proxy and network boundary before enabling them. Production boot guards are checks, not a security audit.

Readiness currently checks SELECT 1, not migration-head compatibility, Redis or SMTP. Add explicit schema version/service readiness checks before production orchestration. Structured logs should carry request_id, status and duration, while redacting bodies, credentials, links and precise GPS. Define audit retention, backup/restore tests, incident access and data deletion before collecting real user data.

Run unit/schema/service tests, Flask test-client tests, real MySQL integration/concurrency tests, browser-to-API tests and independent accessibility/security reviews. Test low bandwidth/media failures, logout in another tab, revoked sessions, 409 conflicts, pending content visibility, real map permission denial and failed email delivery. Evidence in this kit is scoped in TESTING.md; it is not a production-readiness certificate.

## 12. Source notes

Project requirements: supplied Fan Hub Plus SRS v1.0, sections 1.5, 1.6, 1.7, 1.8 and 1.9. Architectural choices, table extensions, bounds and module splits above are implementation proposals, not quotations from the SRS.

Primary technical references checked during preparation:
- Flask application factories: https://flask.palletsprojects.com/en/stable/patterns/appfactories/
- Flask blueprints: https://flask.palletsprojects.com/en/stable/blueprints/
- Flask security: https://flask.palletsprojects.com/en/stable/web-security/
- Flask deployment: https://flask.palletsprojects.com/en/stable/tutorial/deploy/
- Flask-WTF CSRF: https://flask-wtf.readthedocs.io/csrf.html
- SQLAlchemy session transactions: https://docs.sqlalchemy.org/en/20/orm/session_transaction.html
- OWASP password storage: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

These are engineering notes for adaptation and learning. The team must prepare its own final project report and disclose tool use according to the supplied SRS.
