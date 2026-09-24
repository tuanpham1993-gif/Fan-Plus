# API examples and endpoint index

These examples illustrate the authored Flask source. They have not been replayed through a live Flask server in this authoring environment. The backend uses a separate database from the current UI simulator.

## Envelope

Successful paginated resource read:

```json
{
  "data": [{"id":"c01","title":"An original story","kind":"article","version":1}],
  "meta": {"page":1,"page_size":12,"total":24,"total_pages":2},
  "request_id": "example-request-id"
}
```

The object above is shortened for readability. The complete resource DTO is built in app/services/catalog.py. The value 24 is an illustrative count, not a live statistic.

Failure:

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "This submission has already changed. Reload it.",
    "fields": {}
  },
  "request_id": "example-request-id"
}
```

## Authentication

First GET `/api/v1/auth/csrf` and retain the response cookie. Its data.csrf_token must be sent as `X-CSRFToken` on POST/PUT/PATCH/DELETE. Login takes:

```json
{"email":"fan@fanhub.demo","password":"FanHubDemo!26"}
```

These credentials work only after the local backend seed command. The browser's demo account database is unrelated. A successful login rotates authentication and CSRF state; discard the old CSRF token and fetch a new one. Do not extract an authentication token into localStorage.

## Explore

```text
GET /api/v1/resources?category_id=anime&kind=article&release_year=2026&sort=latest&page=1&page_size=12
```

Supported sorting: latest, popular, az. Popular currently means most bookmarked, then rating count, with deterministic tie-breaking. It is not the frontend's seeded popularity score or a learned recommendation model.

## Bookmark/note

```text
PUT /api/v1/me/bookmarks/c01
```

```json
{"note":"Return to the visual-design section later."}
```

No user_id is accepted. The server uses the authenticated actor. Repeating the desired state does not create duplicate bookmarks. Deleting the current user's bookmark uses DELETE at the same resource path.

## Rating

```text
PUT /api/v1/resources/c01/rating
```

```json
{"value":5}
```

Values are strict integers 1-5; strings/booleans/fractions are rejected. Each user has one rating per resource. Whether every resource kind should be rateable is a product decision to finalize before screen integration.

## Submission and moderation

```text
POST /api/v1/me/submissions
```

```json
{
  "title":"An original view of a fictional world",
  "category_id":"anime",
  "fandom_id":null,
  "body_markdown":"An original article of at least one hundred characters, with a clear observation and material the author has the right to submit.",
  "ownership_confirmed":true
}
```

Only an administrator can post the review decision. The id below is the submission id returned by the server:

```text
POST /api/v1/admin/submissions/{submission_id}/decision
```

```json
{"decision":"approve","expected_version":1,"reason":""}
```

For rejection, reason must contain at least 10 nonblank characters. A repeated/stale decision returns 409. Do not immediately retry it as if it were a networking error. Reload and show the current state.

## Admin resource update

```text
PUT /api/v1/admin/resources/{resource_id}
```

```json
{
  "title":"Revised story title",
  "summary":"A revised summary that is sufficiently descriptive.",
  "body_markdown":"The revised original content.",
  "kind":"article",
  "category_id":"anime",
  "fandom_id":null,
  "cover_media_id":null,
  "release_year":2026,
  "has_spoilers":false,
  "status":"published",
  "expected_version":1
}
```

This is a full update payload, not partial PATCH. The resource kind cannot change through this operation. The server increments version. Public GET never exposes drafts/future publication even to an admin; use the admin workflow.

## Events

```text
GET /api/v1/events?latitude=10.7769&longitude=106.7009&radius_km=25&page=1&page_size=12
GET /api/v1/events?city=Hanoi
GET /api/v1/events/{event_id}/calendar.ics
```

Latitude and longitude must be supplied together. Times use ISO 8601 and explicit offsets on input and Z on output. The original frontend's events are fictional. Do not advertise their links as real public events. Redact GPS coordinates from access logs.

## Endpoint index

The following index is generated from the authored OpenAPI file; the contract is not a statement of successful HTTP execution.

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/admin/overview` | admin |
| GET | `/api/v1/admin/resources` | admin |
| POST | `/api/v1/admin/resources` | admin |
| PUT | `/api/v1/admin/resources/{resource_id}` | admin |
| POST | `/api/v1/admin/resources/{resource_id}/archive` | admin |
| GET | `/api/v1/admin/submissions` | admin |
| POST | `/api/v1/admin/submissions/{submission_id}/decision` | admin |
| POST | `/api/v1/admin/events` | admin |
| GET | `/api/v1/admin/feedback` | admin |
| PATCH | `/api/v1/admin/feedback/{feedback_id}` | admin |
| PATCH | `/api/v1/admin/users/{user_id}/suspension` | admin |
| GET | `/api/v1/auth/csrf` | Public / CSRF for writes |
| POST | `/api/v1/auth/register` | Public / CSRF for writes |
| POST | `/api/v1/auth/login` | Public / CSRF for writes |
| POST | `/api/v1/auth/logout` | Public / CSRF for writes |
| GET | `/api/v1/auth/me` | member |
| POST | `/api/v1/auth/verify-email` | Public / CSRF for writes |
| POST | `/api/v1/auth/verification-email` | Public / CSRF for writes |
| POST | `/api/v1/auth/forgot-password` | Public / CSRF for writes |
| POST | `/api/v1/auth/reset-password` | Public / CSRF for writes |
| GET | `/api/v1/categories` | Public / CSRF for writes |
| GET | `/api/v1/fandoms` | Public / CSRF for writes |
| GET | `/api/v1/genres` | Public / CSRF for writes |
| GET | `/api/v1/tags` | Public / CSRF for writes |
| GET | `/api/v1/events` | Public / CSRF for writes |
| GET | `/api/v1/events/{event_id}` | Public / CSRF for writes |
| GET | `/api/v1/events/{event_id}/calendar.ics` | Public / CSRF for writes |
| POST | `/api/v1/feedback` | Public / CSRF for writes |
| GET | `/api/v1/health/live` | Public / CSRF for writes |
| GET | `/api/v1/health/ready` | Public / CSRF for writes |
| GET | `/api/v1/openapi.json` | Public / CSRF for writes |
| GET | `/api/v1/me/profile` | member |
| PATCH | `/api/v1/me/profile` | member |
| GET | `/api/v1/me/dashboard` | member |
| GET | `/api/v1/me/bookmarks` | member |
| PUT | `/api/v1/me/bookmarks/{resource_id}` | member |
| DELETE | `/api/v1/me/bookmarks/{resource_id}` | member |
| GET | `/api/v1/me/submissions` | member |
| POST | `/api/v1/me/submissions` | member |
| GET | `/api/v1/resources` | Public / CSRF for writes |
| GET | `/api/v1/resources/{resource_id}` | Public / CSRF for writes |
| PUT | `/api/v1/resources/{resource_id}/rating` | member |
