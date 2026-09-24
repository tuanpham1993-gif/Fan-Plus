# Frontend-to-Flask integration plan

## One source of truth per mode

The current React store receives an entire local Database object. A secure API must **not** offer an equivalent GET /database endpoint exposing users, private notes, submissions and chat history. Refactor into resource queries and mutations. Keep the mock repository behind an explicit development adapter; never enable it as a fallback after a failed real login or mutation.

A useful boundary is a domain-specific hook plus DTO validator per module. Translate snake_case to frontend names in one adapter, not inside each component. Preserve request_id in error reporting. Abort stale searches. A failed save must retain the form state and show an error instead of pretending success.

## Mapping

| Screen/module | API source | Field decisions |
|---|---|---|
| Home/Explore | GET /resources + /categories | summary -> description; kind -> type; category_id -> categoryId; rating_average -> rating; numeric popularity fixture is removed |
| Content detail | GET /resources/{id} | body_markdown -> body; typed character/media/merch fields still to add |
| Login/current user | POST /auth/login; GET /auth/me | display_name -> name; role from authenticated response, never a form field |
| Logout | POST /auth/logout | Clear client user/cache only after success; clear CSRF cache |
| Collection | GET /me/bookmarks; PUT/DELETE resource path | Join public metadata only; server owns user_id; preserve unavailable items and own notes |
| Fan submission | POST /me/submissions | Resolve free-text fandom to a catalog id or explicitly no fandom; include ownership_confirmed |
| Moderation | GET /admin/submissions; POST decision | Send expected_version; show 409 conflict, reload queue and do not double-publish |
| Events/map/calendar | GET /events and /events/{id} | starts_at/ends_at are UTC with Z; timezone_name drives display; latitude/longitude are numeric |
| Feedback | POST /feedback | kind is bug/suggestion/query; authenticated author is derived server-side |
| Profile | GET/PATCH /me/profile | Current route is name/bio only; do not silently drop preferences or avatar |
| Admin editor | POST/PUT /admin/resources; POST archive | Include version on write; body type cannot change after creation |
| Assistant | Local only for now | No server endpoint yet; label accordingly |

## Password/session sequence

1. Fetch `/api/v1/auth/csrf`, retain the token in JavaScript memory and accept the HttpOnly session cookie.
2. Submit login with JSON and X-CSRFToken. Backend authenticates the password, creates a new random sid and revokes the replaced sid.
3. Clear the old CSRF cache. Fetch a fresh token before the next mutation, because login rotates the Flask session contents.
4. Query `/auth/me` at application startup. A 401 yields the signed-out UI; never fall back to a remembered admin role.
5. On logout/reset, clear protected caches and reinitialize CSRF. Do not retain private data in persistent client storage.

A cookie is signed, not encrypted, and must not contain passwords or private profile objects. The opaque sid is protected by the cookie's HttpOnly/Secure/SameSite configuration and checked against its server-side digest/expiry/revocation row.

## Recommended implementation slices

Slice 1: auth/current user -> public Explore/detail. Done only when refresh and logout reflect actual server state.

Slice 2: bookmarks/notes/rating -> verify with two users in separate browser contexts; the second user must not read the first user's note even by changing IDs.

Slice 3: submit -> pending queue -> approve -> public content. Test duplicate clicks, stale versions and rollback on publication failure.

Slice 4: event list/nearby/ICS -> event admin update/cancel; real device permission allow/deny and timezone edges.

Slice 5: complete typed content/media, preferences, taxonomy CRUD, upcoming releases and measured analytics. Only then begin optional AI.

## Development origins

Vite's development server has a /api proxy. This lets browser requests remain same-origin instead of adding permissive CORS. The portable Node server is for UI preview only and does not proxy Flask. For a deployed build, use Flask/WSGI or a trusted reverse proxy on one origin for the static frontend and /api.

The delivered HTTP client initializes CSRF and uses the correct Flask routes; it is not itself a complete adapter implementation. Do not advertise API mode until all used screens have a defined remote behavior.
