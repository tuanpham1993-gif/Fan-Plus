# Fan Hub Plus — Frontend / Backend Content Synchronization

## 1. Goal

Synchronize the Fan Hub Plus frontend and Flask backend around the current `Content` model.

The main goal is to remove old/demo-only fields from the frontend and make the frontend ready to consume real Flask API data.

Do **not** redesign the whole application.

Do **not** rewrite unrelated features.

Do **not** implement authentication, authorization, rating business logic, or backend business logic beyond what is necessary for the Content API contract.

Work incrementally and preserve the existing architecture.

---

# 2. Project structure

Frontend:

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend
```

Backend:

```text
D:\Python3V11Project\projectHubPlus
```

Frontend stack:

* React
* TypeScript
* Vite

Backend stack:

* Flask
* Flask-SQLAlchemy
* MySQL
* Pydantic

---

# 3. Current frontend Content model

The canonical frontend `Content` interface is:

```ts
export type ContentType =
  | "news"
  | "article"
  | "event"
  | "post";

export interface Content {
  id: string;
  title: string;
  categoryId: string;
  type: ContentType;
  description: string;
  body: string;
  image: string;
  publishedAt: string;
  rating: number;
  author: string;
  status: "published" | "pending" | "rejected";
  mediaUrl?: string;
}
```

File:

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend\src\domain\types.ts
```

Treat this as the current frontend UI contract.

Do NOT add these old fields back:

```text
fandom
genre
year
popularity
tags
duration
spoiler
sourceLabel
```

unless there is a concrete requirement elsewhere in the project.

---

# 4. Current backend Content model

The backend Content entity is conceptually:

```text
Content
├── id
├── author_id
├── category_id
├── title
├── body
├── content_type
├── status
├── created_at
└── updated_at
```

Backend content type:

```text
NEWS
ARTICLE
EVENT
POST
```

Backend status:

```text
PENDING
DONE
REJECTED
```

Frontend representation:

```text
NEWS      -> news
ARTICLE   -> article
EVENT     -> event
POST      -> post
```

and:

```text
PENDING   -> pending
DONE      -> published
REJECTED  -> rejected
```

Do this conversion in the frontend normalization layer rather than changing backend database enum values just to satisfy the frontend.

---

# 5. Architecture to preserve

The frontend catalog flow should remain:

```text
Explore.tsx
    ↓
useCatalogPage()
    ↓
catalogDataSource.contents()
    ↓
catalogApi.contents()
    ↓
HTTP GET /contents
    ↓
backend JSON
    ↓
normalizeContent()
    ↓
frontend Content
    ↓
ContentCard
```

The important separation is:

```text
Backend JSON
     ↓
normalizeContent()
     ↓
Frontend Content
     ↓
React components
```

The React components should NOT need to understand backend field names such as:

```text
category_id
content_type
created_at
author_id
```

---

# 6. Do not modify Explore.tsx unnecessarily

File:

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend\src\pages\Explore.tsx
```

The current `Explore.tsx` is already mostly correct.

It should continue to:

1. Read URL query parameters.
2. Construct `CatalogQuery`.
3. Call `useCatalogPage(query)`.
4. Render pagination.
5. Render `ContentCard`.
6. Remain independent of whether the data comes from demo data or Flask.

Do not move API logic into `Explore.tsx`.

---

# 7. Fix domain/logic.ts

File:

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend\src\domain\logic.ts
```

The old `filterContents()` currently assumes these fields exist:

```text
fandom
genre
year
popularity
tags
```

They no longer exist in `Content`.

Remove those dependencies.

The demo filter should support only information currently represented by `Content`:

```text
q
category
type
sort
page
```

Search should use fields such as:

```ts
title
description
body
```

Do not fabricate `fandom`, `genre`, `year`, or `tags`.

For sorting:

```text
latest
```

should use:

```ts
publishedAt
```

`az` should use:

```ts
title
```

For the old demo `popular` behavior, do not invent a `popularity` field.

If temporary demo behavior is necessary, use the existing `rating` field only as a temporary frontend approximation, but clearly keep it as demo behavior.

The real backend should eventually own the meaning of "popular".

---

# 8. Check and remove `recommend()` only if unused

In:

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend\src\domain\logic.ts
```

there is an old:

```ts
recommend()
```

implementation that depends on:

```text
fandom
popularity
```

Before deleting it:

Search the entire frontend source tree for:

```text
recommend(
```

and:

```text
recommend
```

If no code imports or calls it, remove the function.

If it is used, inspect the caller before changing it.

Do not break an unrelated feature just to remove old fields.

---

# 9. Fix validateContent()

Current `validateContent()` still validates:

```text
year
```

but `year` is no longer part of `Content`.

Remove the year validation.

Validation should instead cover the current Content model:

```text
title
categoryId
description
body
type
mediaUrl
```

Suggested rules:

```text
title: 3-120 characters
categoryId: required
description: minimum 12 characters
body: required
type: required
mediaUrl: local /media path or HTTPS if present
```

Keep the existing safe URL validation.

---

# 10. Fix catalog/dataSource.ts

File:

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend\src\features\catalog\dataSource.ts
```

This file should continue to provide a data-source abstraction:

```text
serverMode = true
    ↓
catalogApi
    ↓
Flask backend

serverMode = false
    ↓
demo database
```

Do not remove this abstraction.

However, the demo implementation currently accesses:

```text
content.fandom
content.genre
content.year
```

Those fields are no longer valid.

Remove or rewrite the old facet generation.

The frontend should not generate fake fandom/genre/year data when those fields are not part of the current Content model.

If the UI still requires facets, either:

1. obtain them from a dedicated backend API later, or
2. temporarily return empty facet arrays.

Do not fabricate values.

---

# 11. Fix catalog/api.ts

File:

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend\src\features\catalog\api.ts
```

This is the most important frontend API file.

`normalizeContent()` must become the translator between backend JSON and frontend `Content`.

Remove fake/default values such as:

```ts
rating: 4.8
```

```ts
duration: "5 min read"
```

```ts
spoiler: false
```

```ts
sourceLabel: "Backend Content"
```

and fake fallback images such as:

```text
https://images.unsplash.com/...
```

Do not invent backend data.

---

# 12. Expected normalizeContent() behavior

The normalization should conceptually map:

```text
Backend                         Frontend
------------------------------------------------
raw.id                      -> id
raw.title                   -> title
raw.body                    -> body
raw.category.slug           -> categoryId
raw.content_type            -> type
raw.created_at              -> publishedAt
raw.author.name             -> author
raw.status                  -> status
raw.rating.average          -> rating
raw.media[]                 -> image/mediaUrl
```

The exact implementation should support the actual backend response shape.

Do not assume that:

```ts
raw.author_id
```

is the author's display name.

If the backend only returns `author_id`, then either:

1. the backend API should include an author object/name, or
2. the frontend should display a neutral fallback such as `"Unknown author"`.

Do NOT generate:

```text
Author #123
```

because that is fake presentation data.

---

# 13. Backend API response contract

The backend `/contents` endpoint should eventually return a paginated structure similar to:

```json
{
  "items": [
    {
      "id": 1,
      "title": "Example title",
      "body": "Example body",
      "content_type": "ARTICLE",
      "status": "DONE",
      "created_at": "2026-09-26T10:30:00",
      "updated_at": "2026-09-26T10:30:00",

      "category": {
        "id": 1,
        "name": "Anime",
        "slug": "anime"
      },

      "author": {
        "id": 5,
        "name": "Example User"
      },

      "media": [
        {
          "id": 12,
          "media_url": "/uploads/content/anime/example.jpg",
          "media_type": "IMAGE"
        }
      ],

      "rating": {
        "average": 4.5,
        "count": 12
      }
    }
  ],

  "total": 27,
  "page": 1,
  "pageSize": 9,
  "pageCount": 3
}
```

This is the target API shape.

It is acceptable to adjust naming slightly if the existing Flask architecture has established conventions, but preserve the semantic information.

---

# 14. Backend must NOT return frontend-specific names

Do not force Flask to return:

```json
{
  "categoryId": "...",
  "publishedAt": "...",
  "type": "article"
}
```

just because React uses those names.

The backend can use its natural API/database representation:

```json
{
  "category": {...},
  "content_type": "ARTICLE",
  "created_at": "..."
}
```

The frontend normalization layer handles the conversion.

This keeps backend and frontend decoupled.

---

# 15. Backend Content endpoint

Inspect the existing backend structure first.

Find:

```text
Content model
Content schema
Content routes/controller
Category model/schema
Review model/schema
Bookmark model/schema
ContentMedia model/schema
Event model/schema
```

Do not create duplicate models.

The `/contents` endpoint should eventually support:

```text
GET /contents
```

with query parameters such as:

```text
q
category_id
content_type
page
page_size
sort_by
```

or equivalent existing naming.

The exact parameters should match the frontend `CatalogQuery` after synchronization.

---

# 16. Pagination

Frontend currently expects:

```ts
interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
```

The backend should therefore return real pagination metadata.

Do not make the frontend guess the total number of records if the backend can provide it.

The preferred flow is:

```text
Frontend:
page=2&page_size=9

Backend:
query DB
    ↓
calculate total
    ↓
return 9 records
    ↓
return total/page/pageSize/pageCount
```

---

# 17. Backend status filtering

For public catalog requests:

```text
DONE
```

should be treated as published content.

Normally:

```text
PENDING
REJECTED
```

should not appear in the public catalog.

Do not let the frontend convert everything to `"published"`.

The frontend should receive the real status and normalize:

```text
DONE → published
PENDING → pending
REJECTED → rejected
```

For an admin endpoint, pending/rejected content can be exposed according to the existing authorization design.

Do not implement authorization if it is outside the current task.

---

# 18. Category relationship

Current backend Content has:

```text
category_id
```

The frontend needs:

```text
categoryId
```

Prefer returning category information from the API:

```json
"category": {
  "id": 1,
  "name": "Anime",
  "slug": "anime"
}
```

Then frontend can use:

```ts
category.slug
```

as the UI category identifier.

Avoid hardcoding:

```ts
1 -> anime
2 -> gaming
3 -> movies
4 -> tv
```

inside `catalog/api.ts`.

Database IDs should not be permanently coupled to frontend taxonomy IDs.

If the existing taxonomy requires a slug, use the backend-provided slug.

---

# 19. Media

Current architecture:

```text
Content
    ↓
ContentMedia 1:N
```

Files are stored on the server filesystem.

Database stores:

```text
media_url
```

not binary file data.

The backend response should expose media information.

Example:

```json
"media": [
  {
    "id": 10,
    "media_url": "/uploads/content/anime/abc123.jpg",
    "media_type": "IMAGE"
  },
  {
    "id": 11,
    "media_url": "/uploads/content/anime/trailer.mp4",
    "media_type": "VIDEO"
  }
]
```

For a catalog card:

```text
image
```

can be populated from the first suitable image.

For content detail:

```text
media[]
```

should eventually be preserved so the page can display multiple images/videos/audio.

Do not store binary files inside the Content JSON.

---

# 20. Rating

Backend rating should eventually come from:

```text
Review
```

records.

Do not hardcode:

```ts
rating: 4.8
```

or:

```ts
average: 4.5
```

in frontend API code.

The backend can return:

```json
"rating": {
  "average": 4.5,
  "count": 12
}
```

The frontend simply displays it.

The actual Review aggregation/business logic is a later backend task.

Do not invent a fake rating algorithm.

---

# 21. ContentCard

File:

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend\src\components\ui.tsx
```

Find:

```ts
ContentCard
```

Remove references to fields that no longer exist:

```text
content.fandom
content.duration
content.spoiler
content.popularity
```

The card should use the new fields:

```text
content.title
content.description
content.image
content.type
content.rating
content.author
content.categoryId
```

Keep bookmark functionality.

Do not redesign the card unnecessarily.

---

# 22. Content type icons/labels

Current ContentType:

```text
news
article
event
post
```

Make sure `ContentCard` has labels/icons for these four values.

Do not keep the old:

```text
video
audio
character
merchandise
```

as `Content.type`.

Those are different concepts.

Media type belongs to `ContentMedia`.

For example:

```text
Content.type = article
ContentMedia.media_type = IMAGE
```

or:

```text
Content.type = event
ContentMedia.media_type = VIDEO
```

Do not mix these two concepts.

---

# 23. Important distinction: Content vs Media vs Event

Keep these concepts separate.

```text
Content
    │
    ├── ContentMedia[]
    │
    ├── Review[]
    │
    ├── Bookmark[]
    │
    ├── CharacterContent[]
    │
    └── Event (1:1 when applicable)
```

Examples:

```text
ARTICLE
    → may have images

POST
    → may have images/videos

NEWS
    → may have images

EVENT
    → has Event record
    → may have media
```

Do not make:

```text
video
audio
gallery
```

Content types.

Those describe media, not the Content itself.

---

# 24. Backend Event

Backend Event should remain associated with Content:

```text
Event 1:1 Content
```

Event-specific fields:

```text
content_id
location_name
city
latitude
longitude
start_time
end_time
register_url
```

Do not duplicate these fields into Content just to simplify the frontend.

For an event detail endpoint, return the Content plus Event information.

Example:

```json
{
  "content": {...},
  "event": {
    "id": 5,
    "location_name": "Example Hall",
    "city": "Ho Chi Minh City",
    "latitude": 10.77,
    "longitude": 106.70,
    "start_time": "...",
    "end_time": "...",
    "register_url": "..."
  }
}
```

---

# 25. Backend route design

Inspect the existing backend routes before creating new ones.

Prefer a structure conceptually like:

```text
GET /contents
GET /contents/<id>
GET /categories
```

Potential later endpoints:

```text
GET /contents/<id>/rating
POST/PUT /contents/<id>/rating
```

But do not implement unnecessary endpoints if they already exist or if they are outside the current synchronization task.

---

# 26. Query parameter synchronization

Frontend currently has:

```ts
interface CatalogQuery {
  q?: string;
  category?: FandomCategoryId;
  fandom?: string;
  type?: string;
  genre?: string;
  year?: string;
  popular?: boolean;
  sortBy?: CatalogSort;
  page?: number;
  pageSize?: number;
}
```

Because `fandom`, `genre`, and `year` are no longer part of Content, inspect all usages before deciding whether to:

1. remove them completely, or
2. keep them as future filter concepts backed by separate entities.

Do not leave dead query parameters everywhere just because they existed in the demo.

The important current filters are:

```text
q
category
type
sortBy
page
pageSize
```

The backend should support these first.

---

# 27. Do not use fake fallback content

Avoid code such as:

```ts
rating: 4.8
```

```ts
image: "https://images.unsplash.com/..."
```

```ts
author: `Author #${raw.author_id}`
```

```ts
status: "published"
```

```ts
duration: "5 min read"
```

These make the UI look populated but hide synchronization problems.

If real backend data is missing, use a neutral empty value:

```ts
rating: 0
```

```ts
image: ""
```

```ts
author: "Unknown author"
```

or let the UI show its existing empty state.

---

# 28. Preserve serverMode

Do not delete:

```ts
serverMode
```

or the data-source abstraction.

The application should remain capable of:

```text
Demo mode
    ↓
local demo DB

Server mode
    ↓
Flask API
```

This makes frontend development possible even while the backend is being built.

---

# 29. Error handling

Keep existing:

```text
ApiError
AbortController
loading
error
empty state
pagination
```

behavior.

Do not silently convert API failures into fake demo data.

If `/contents` fails:

```text
loading → false
error → displayed
```

The existing `Explore.tsx` empty/error UI should continue to work.

---

# 30. Files that should be inspected

Work through these files in this order.

### Frontend

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend\src\domain\types.ts
```

Already mostly correct.

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend\src\domain\logic.ts
```

Remove old Content fields.

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend\src\features\catalog\hooks.ts
```

Remove old fandom/popularity dependencies.

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend\src\features\catalog\dataSource.ts
```

Clean demo data-source assumptions.

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend\src\features\catalog\api.ts
```

Fix normalization and remove fake data.

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend\src\components\ui.tsx
```

Fix `ContentCard`.

```text
D:\Python3V11Project\frontback\Fan-Plus\frontend\src\pages\Explore.tsx
```

Inspect only. Avoid changes unless compilation proves they are required.

---

# 31. Search before deleting anything

Before removing old functions such as:

```text
recommend
```

search the whole frontend.

Also search for:

```text
content.fandom
content.genre
content.year
content.popularity
content.tags
content.duration
content.spoiler
```

Report all usages before deleting them.

This prevents breaking another page that still depends on the old model.

---

# 32. Backend inspection

Before modifying backend code, inspect:

```text
Content model
ContentMedia model
Event model
Review model
Bookmark model
Category model
User model
Content schema
Category schema
Content routes
Event routes
```

Determine the actual existing filenames first.

Do not create duplicate models/routes/schemas.

---

# 33. Backend response should be built from real database data

The `/contents` response should be based on:

```text
Content
Category
User/author
ContentMedia
Review
```

Do not return hardcoded demo values.

For example:

```text
Content.title
Content.body
Content.content_type
Content.status
Content.created_at
```

must come from the database.

---

# 34. Testing requirements

After changes:

### Frontend

Run:

```bash
npm run build
```

and/or:

```bash
npm run test
```

depending on the existing package scripts.

There should be no TypeScript errors caused by removed fields.

Search again for:

```text
content.fandom
content.genre
content.year
content.popularity
content.tags
content.duration
content.spoiler
```

and report remaining usages.

### Backend

Run the existing Flask tests if present.

At minimum verify:

```text
GET /contents
GET /contents/<id>
GET /categories
```

return valid JSON.

---

# 35. Final target architecture

The finished system should look like:

```text
                         Flask + MySQL
                              │
                              │
                       GET /contents
                              │
                              ▼
                    Backend API response
                              │
                              ▼
                 catalogApi.contents()
                              │
                              ▼
                     normalizeContent()
                              │
                              ▼
                    Frontend Content
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
          ContentCard                   Detail page
               │                             │
               ▼                             ▼
             React                    Media / Rating /
                                      Event information
```

And the important responsibility boundary is:

```text
BACKEND
────────────────────────────────
Database
Relationships
Pagination
Filtering
Rating aggregation
Media references
Author/category information
Status
Business data


FRONTEND
────────────────────────────────
API requests
Normalization
Loading/error states
UI rendering
Routing
Cards
Filters UI
Pagination UI
Maps/media presentation
```

Do not move database/business logic into React.

Do not make Flask return frontend-specific presentation fields when they can be normalized cleanly.

---

# 36. Important implementation rule

Before changing a file:

1. Read the whole file.
2. Search for all usages of the fields/functions being changed.
3. Make the smallest necessary change.
4. Run TypeScript/build checks.
5. Search again for stale fields.
6. Only then continue to the next file.

Do not rewrite the entire frontend.

Do not rewrite the entire backend.

The goal is **synchronization**, not architectural replacement.
