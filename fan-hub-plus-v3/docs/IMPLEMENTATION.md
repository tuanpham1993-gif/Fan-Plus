# Implementation and integration boundaries

## UI layout

The top-level navigation adds Community and Quarterly Gifts. Ask Lore is a named button in the header, not a constantly floating ornament. Desktop Lore opens a 460 px right-hand native dialog; the page remains in place behind a dimmed backdrop. Mobile uses the available full height. The separate `/assistant` workspace supports longer reading. Native dialog focus/Escape behavior is retained, and reduced-motion preferences are respected.

Community uses a main reading column and a narrower guidance rail. Under smaller breakpoints the feed becomes one column; secondary cards move below the conversation. Posts are plain text, not arbitrary HTML. SVG icons represent actions, with text and accessible labels. Prize cards use CSS illustrations; no external travel photography or implied sponsorship is used.

The interface language remains English to match the supplied V1. Source notes can be Vietnamese; the optional model is instructed to answer in the current question's language. The frontend does not contain a complete internationalization framework.

## Runtime boundary

`features/http.ts` chooses one transport once at startup. `features/gateway.ts` exposes the same asynchronous methods for local simulation and server requests. `public/runtime.js` selects the browser preview. Flask's `/runtime.js` selects HTTP mode. Keys never belong in that file.

Routes, services and SQLAlchemy models are separated in the Flask implementation. All writes validate JSON field names, lengths and values. Actor identity comes from a signed HttpOnly cookie containing an opaque server-session token. The database stores its hash and expiry. Client-supplied author IDs and roles are rejected. Same-origin requests use a session-bound CSRF token. Passwords use salted PBKDF2-HMAC-SHA256 in the extension backend; the V1 browser password verifier remains a demonstration and must not be copied into server authentication.

The current extension endpoints are listed in `backend/API_ROUTES.md`. Responses are wrapped as `{data: ...}`; errors as `{error: {message, requestId}}`. New extension payloads use camelCase to match the existing UI. Unknown fields are rejected instead of silently assigning model properties.

## Relational model: 14 tables

| Table | Main purpose and constraint |
|---|---|
| users | Account identity, unique normalized email, role, verification and suspension |
| auth_sessions | Hash of opaque token, account foreign key, expiry |
| community_posts | Author, review metadata, status and version |
| community_comments | Post, author, optional parent, hidden state |
| community_reactions | Composite primary key `(post_id,user_id)`; one like/love |
| community_reports | Private report queue, target and resolution |
| audit_events | Moderation and campaign event records |
| giveaway_campaigns | One quarter ID, timings, terms, immutable committed seed and state |
| giveaway_prizes | Ranked prizes, unique campaign/rank |
| giveaway_entries | Unique campaign/account; unpredictable public ticket |
| giveaway_winners | Unique campaign/account and ticket; one rank per campaign |
| knowledge_documents | Approved editorial notes, aliases, spoiler metadata, provenance |
| chat_messages | Pseudonymous owner scope, answer/source records |
| rate_buckets | Atomic rate counter per hashed request scope/window |

Audit rows are ordinary database records in this kit, not tamper-proof external records. Role and foreign-key checks are covered in service tests, but production concurrency/load testing on MySQL is still required. The initial baseline is not a migration strategy for an existing installation.

## Social workflow

`pending -> published | rejected`; author edits return to `pending` and increment the version. Moderation requires the expected version and an independent administrator. A conditional database update prevents stale approval. Remove and report-hide are soft hiding operations. Removed comment text is replaced in public responses; existing one-level replies remain attached.

Reaction PUT requests are idempotent: another PUT of `like` leaves one like, and `heart` replaces that same user's like. An empty kind removes the reaction. Users do not acquire additional giveaway entries through these interactions.

The starter server returns a bounded feed snapshot (up to 250 posts and 2,000 comments), then the UI filters and shows six posts at a time. This is appropriate for a small demonstration, **not cursor-based production pagination or a live social feed**. No WebSocket notifications, follow graph, upload pipeline, automatic content moderation or full account data export/erasure workflow is claimed.

## Operational gates before public deployment

Run actual Flask HTTP tests, native-browser tests, MySQL constraints/concurrency tests and a complete npm build. Replace sample accounts and secrets. Remove automatic demo verification. Add real email verification/reset, a reviewed privacy policy, deletion/export controls and backup restoration. Review cookie Secure/HTTPS configuration, trusted hosts, CSP, reverse-proxy trust and distributed abuse controls. The API does not trust arbitrary `X-Forwarded-For` headers.

The request limiter is a modest database-backed demonstration control, not full bot/Sybil prevention. The model call is synchronous and has a timeout; it occupies a WSGI worker while running. Queueing, streaming, cancellation billing semantics, multi-worker load behavior and an operational cost budget need evaluation before broad use.

Use `python manage.py prune` on an operator-managed schedule to remove old conversations (30 days), expired sessions and rate buckets. Reading the UI does not itself run that job. Giveaway audit/entry retention must be decided with the campaign's privacy/legal requirements; the kit does not delete those records automatically.

The backend is a separate V3 extension baseline. Existing V2 tables and services have not been migrated. The old V1 catalog services remain browser demonstrations. This distinction is also visible on the UI and Privacy page.
