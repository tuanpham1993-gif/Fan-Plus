# Fan Hub Plus — Content Detail Backend Synchronization Report

## 1. Overall Purpose

The recent changes were intended to **synchronize the Content Detail page with the actual Flask backend API**.

The old frontend was still using an older/demo `Content` structure with fields such as:

* `content.image`
* `content.fandom`
* `content.description`
* `content.author` as a string
* `content.publishedAt`
* `content.categoryId`
* `content.type`
* `detail.related`

The current Flask backend does **not** return that structure.

The current backend returns:

```json
{
  "content": {
    "id": 1,
    "author_id": 2,
    "category_id": 1,
    "title": "...",
    "body": "...",
    "content_type": "ARTICLE",
    "status": "DONE",
    "created_at": "...",
    "updated_at": "...",
    "author": {
      "id": 2,
      "name": "John Doe"
    },
    "category": {
      "id": 1,
      "name": "Anime",
      "slug": "anime"
    },
    "media": [
      {
        "id": 1,
        "media_url": "uploads/content/anime/naruto.jpg",
        "media_type": "IMAGE"
      }
    ],
    "rating": {
      "average": 5.0,
      "count": 1
    }
  },
  "event": null
}
```

So the main goal was:

> Make the frontend consume the backend's real Content/ContentMedia structure instead of the old demo structure.

This was **not intended to redesign the Content Detail page**.

---

# 2. Files Changed / Discussed

## `src/domain/types.ts`

### Purpose

Updated the TypeScript domain types so they match the Flask backend.

### Important changes

Added:

```ts
export type ContentType =
  | "NEWS"
  | "ARTICLE"
  | "EVENT"
  | "POST";
```

Added:

```ts
export type ContentStatus =
  | "PENDING"
  | "DONE"
  | "REJECTED";
```

Added:

```ts
export interface ContentMedia {
  id: number;
  media_url: string;
  media_type: "IMAGE" | "VIDEO" | "AUDIO";
}
```

Added the event representation:

```ts
export interface ContentEvent {
  id: number;
  content_id: number;
  location_name: string;
  city: string;
  latitude: number;
  longitude: number;
  start_time: string | null;
  end_time: string | null;
  register_url: string | null;
}
```

The `Content` interface was changed to match the backend:

```ts
export interface Content {
  id: number;

  author_id: number;
  category_id: number;

  title: string;
  body: string;

  content_type: ContentType;
  status: ContentStatus;

  created_at: string | null;
  updated_at: string | null;

  author: {
    id: number;
    name: string;
  } | null;

  category: {
    id: number;
    name: string;
    slug: string;
  } | null;

  media: ContentMedia[];

  rating: {
    average: number;
    count: number;
  };
}
```

### Reason

The old frontend type represented the old demo database.

The new type represents the actual Flask response.

---

# 3. `src/features/catalog/api.ts`

## Purpose

This is the frontend API layer responsible for communicating with the Flask backend.

### Detail endpoint

The frontend now uses:

```ts
contentDetail: (id: string) =>
  `/contents/${encodeURIComponent(id)}`
```

which corresponds to:

```text
GET /contents/<content_id>
```

### `normalizeContent()`

The API layer converts the raw backend response into the frontend `Content` type.

For example:

```text
backend author
      ↓
content.author

backend category
      ↓
content.category

backend media
      ↓
content.media

backend rating
      ↓
content.rating
```

### Detail function

The detail request roughly does:

```ts
const res = await apiClient.get(
  CATALOG_ENDPOINTS.contentDetail(id),
  { signal }
);

const content = normalizeContent(res.content);

return {
  content,
  event: res.event ?? null,
  rating,
};
```

### Rating limitation

The backend currently provides:

```json
"rating": {
  "average": 5.0,
  "count": 1
}
```

but it does not currently provide the logged-in user's own rating.

Therefore the frontend currently defaults:

```ts
userRating: 0
```

This is **not expected to cause the Content Detail page to fail loading**.

---

# 4. `src/features/catalog/dataSource.ts`

## Purpose

This file abstracts where catalog data comes from.

There are two modes:

```text
server mode → Flask API
demo mode   → local/demo database
```

The important Content Detail code is:

```ts
detail(
  db,
  id,
  user,
  signal,
) {
  if (serverMode) {
    return catalogApi.detail(id, signal);
  }

  return Promise.resolve(
    demoContentDetail(requireDemoDb(db), id, user)
  );
}
```

### Important

The real server-mode path is already correct:

```text
Detail
  ↓
useContentDetail
  ↓
catalogDataSource.detail
  ↓
catalogApi.detail
  ↓
GET /contents/:id
```

### Demo-mode issue

The old demo implementation still returned:

```ts
{
  content,
  related,
  rating
}
```

but the new `ContentDetailPayload` does not contain `related`.

It should instead conceptually return:

```ts
{
  content,
  event: null,
  rating
}
```

This is mainly a TypeScript/demo-mode consistency issue.

It does not change the real Flask server response.

---

# 5. `src/features/catalog/hooks.ts`

## Purpose

`useContentDetail()` is responsible for loading Content Detail data.

The current flow is:

```text
Detail.tsx
    ↓
useContentDetail(id)
    ↓
catalogDataSource.detail()
    ↓
catalogApi.detail()
    ↓
GET /contents/:id
```

The hook handles:

* loading state
* API errors
* 404 handling
* request cancellation
* demo mode
* view recording

The hook itself was considered compatible with the current backend.

Therefore, **no major rewrite of this hook was intended**.

---

# 6. `src/pages/Detail.tsx`

## This was the biggest change.

The old `Detail.tsx` was written against the old/demo Content structure.

### Old fields

The old page used fields such as:

```ts
content.image
content.fandom
content.description
content.author
content.publishedAt
content.categoryId
content.type
detail.related
```

Those fields do not exist in the current backend response.

### New fields

The new Detail page uses:

```ts
content.media
content.body
content.author?.name
content.created_at
content.category_id
content.category?.name
content.content_type
content.status
content.rating
```

---

# 7. Media URL handling

The backend stores media paths such as:

```text
uploads/content/anime/naruto.jpg
```

These are relative paths.

The new Detail page added a URL resolver so the browser can turn the backend path into a usable URL.

Conceptually:

```text
uploads/content/anime/naruto.jpg
            ↓
resolved browser URL
```

The resolver also rejects unsafe URL schemes and URLs containing credentials.

### Important

This does **not** guarantee that Flask is serving the uploads directory.

If the React page renders but images/videos return `404`, the Flask static-file configuration must be checked separately.

---

# 8. Gallery

The old page used a fake gallery:

```ts
[
  content.image,
  "/art/community.svg",
  "/art/manga.svg"
]
```

The new page instead uses actual backend media:

```ts
content.media
  .filter(item => item.media_type === "IMAGE")
```

So the intended flow is:

```text
ContentMedia database rows
        ↓
Flask API
        ↓
content.media
        ↓
IMAGE media
        ↓
Detail gallery
```

---

# 9. Hero Image

The new page uses the first image from:

```ts
content.media
```

If there is no image, it falls back to:

```text
/art/community.svg
```

---

# 10. Content Type and Status

The old frontend used older values such as:

```text
draft
published
```

The backend currently uses:

```text
PENDING
DONE
REJECTED
```

The backend also defines:

```text
NEWS
ARTICLE
EVENT
POST
```

The new Detail page therefore uses:

```ts
content.content_type
content.status
```

instead of the old:

```ts
content.type
content.status === "draft"
```

---

# 11. Author and Date

### Old

The old page expected:

```ts
content.author
content.publishedAt
```

### Backend

The actual backend provides:

```ts
content.author?.name
content.created_at
```

The new page therefore uses:

```ts
const authorName =
  content.author?.name ?? "Unknown author";
```

and:

```ts
content.created_at
```

for the displayed date.

---

# 12. Rating

The new Detail page calls:

```tsx
<ContentRating
  contentId={String(content.id)}
  initial={detail.rating}
/>
```

The `String()` conversion is intentional because the current rating component/API expects a string content ID.

The backend rating summary looks like:

```json
{
  "average": 5.0,
  "count": 1
}
```

---

# 13. What Was Removed From `Detail.tsx`

This is the most important section to check because some old UI functionality was intentionally removed.

## Removed: Related Content

The old page contained:

```text
Stay a little longer
        ↓
related content cards
```

This depended on:

```ts
detail.related
```

However, the current Flask detail endpoint only returns:

```text
content
event
```

It does not return:

```text
related
```

Therefore that section was removed instead of using nonexistent data.

### Important

This was a **frontend feature removal**, not a backend requirement.

If the project still needs a "Related Content" section, it should eventually use a real backend/catalog query.

---

## Removed: Fake Gallery Items

The old page added:

```text
/art/community.svg
/art/manga.svg
```

to the gallery.

These were not backend media.

The new page uses actual `ContentMedia` records instead.

---

## Removed: Old Fandom Fields

The old page used:

```ts
content.fandom
```

The current backend does not provide a `fandom` field.

The replacement uses:

```ts
content.category?.name
```

---

## Removed: Old Description Field

The old page used:

```ts
content.description
```

The backend provides:

```ts
content.body
```

The new page therefore uses `body`.

---

## Removed: Old Published Date Field

The old page used:

```ts
content.publishedAt
```

The backend provides:

```ts
content.created_at
```

---

## Removed: Old Spoiler State

The old Detail page contained:

```ts
spoilerSafe
revealed
setRevealed()
```

The current backend Content model does not have a spoiler field.

Therefore this state was removed from the new version.

If spoiler functionality is still a real project requirement, it should be reintroduced based on an actual backend field/API rather than the old demo field.

---

# 14. What Was NOT Intentionally Changed

The goal was **not** to change:

```text
Explore
Home
Catalog
Authentication
Database
Content model
Backend Content endpoint
Global routing
```

The intended change was primarily:

```text
Backend Content API
        ↓
Frontend types/API normalization
        ↓
Content Detail UI
```

---

# 15. Potential Problems That Need Checking

If the **entire Content Detail page does not load**, the problem may be larger than the backend data mapping.

Do not immediately rewrite the entire page again.

Check these areas first.

## 1. `ContentMedia.tsx`

This is one of the most important files to inspect.

The new Detail page passes:

```tsx
<ContentMedia
  content={content}
  galleryImages={galleryImages}
  onOpenGallery={setGallery}
/>
```

If `ContentMedia.tsx` still expects the old structure:

```ts
content.image
```

or other old fields, it may cause TypeScript or runtime problems.

---

## 2. `BookmarkButton`

The new Detail page passes:

```tsx
<BookmarkButton content={content} />
```

If `BookmarkButton` still expects the old demo Content type, it may also cause errors.

---

## 3. `ContentRating`

Check whether it expects:

```text
string ID
```

or:

```text
number ID
```

The current Detail page uses:

```ts
String(content.id)
```

because the current rating API expects a string.

---

## 4. `typeLabels`

The new Detail page uses:

```ts
typeLabels[content.content_type]
```

Make sure `typeLabels` supports:

```text
NEWS
ARTICLE
EVENT
POST
```

If it still only supports old content types, this needs to be synchronized.

---

## 5. Flask media/static serving

The backend returns:

```text
uploads/content/anime/naruto.jpg
```

The frontend can resolve the URL, but Flask must actually expose that directory.

If the page loads but media does not:

```text
Browser
  ↓
/uploads/content/anime/naruto.jpg
  ↓
Flask
  ↓
404?
```

then the problem is backend static-file serving, not the Detail component.

---

## 6. Browser Console

If the **whole page is blank**, check the browser console first.

A React runtime error will usually identify the exact component that failed.

Example:

```text
Cannot read properties of undefined
```

or:

```text
Property X does not exist
```

or:

```text
Objects are not valid as a React child
```

That error is more useful than changing multiple files blindly.

---

# 16. Recommended Debugging Order

Give Antigravity this order:

```text
1. Check the browser console/runtime error.
        ↓
2. Check Detail.tsx.
        ↓
3. Check ContentMedia.tsx.
        ↓
4. Check BookmarkButton.
        ↓
5. Check ContentRating.
        ↓
6. Check typeLabels.
        ↓
7. Check GET /contents/:id response.
        ↓
8. Check Flask media/static-file serving.
```

Do **not** immediately redesign Explore/Home/catalog.

---

# 17. Important Warning About the Recent Changes

The recent Detail.tsx replacement was intended to fix the mismatch between the old frontend model and the current backend model.

However, it also removed some old demo behavior:

* related content
* fake gallery images
* fandom field
* description field
* publishedAt field
* old draft/published handling
* spoiler state

Those removals were based on the fact that these fields are not present in the current Flask Content API.

That does **not necessarily mean those product features should permanently disappear**.

If they are required features, they should be reimplemented using the current backend architecture.

---

# 18. Current Intended Architecture

```text
                    FLASK BACKEND
                         │
                         │
                  GET /contents/:id
                         │
                         ▼
                Content Detail JSON
                         │
                         ▼
                 catalogApi.detail()
                         │
                         ▼
                  normalizeContent()
                         │
                         ▼
                ContentDetailPayload
                         │
                         ▼
                 useContentDetail()
                         │
                         ▼
                    Detail.tsx
                    /    |    \
                   /     |     \
                  ▼      ▼      ▼
          ContentMedia  Rating  Bookmark
```

The important design principle is:

> The API/type layer should adapt the backend response into the frontend model. Individual UI components should then consume that consistent model.

---

# 19. File Summary

| File                                    | Purpose of Change                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/domain/types.ts`                   | Align frontend `Content`, `ContentMedia`, `ContentEvent`, status and content type with Flask |
| `src/features/catalog/api.ts`           | Normalize actual Flask response and request `/contents/:id`                                  |
| `src/features/catalog/dataSource.ts`    | Keep server-mode detail connected to Flask; fix legacy demo payload shape                    |
| `src/features/catalog/hooks.ts`         | Existing detail-fetching flow; no major intended redesign                                    |
| `src/pages/Detail.tsx`                  | Replace old demo fields with real backend fields                                             |
| `src/features/catalog/ContentMedia.tsx` | **Needs verification** against new `Content.media`                                           |
| `BookmarkButton`                        | **Needs verification** against new `Content`                                                 |
| `ContentRating`                         | **Needs verification** for ID/rating contract                                                |
| `typeLabels`                            | **Needs verification** for NEWS/ARTICLE/EVENT/POST                                           |

---

# 20. Final Goal

The final Content Detail flow should be:

```text
User opens:

/contents/1
        ↓
React Detail
        ↓
GET /contents/1
        ↓
Flask
        ↓
Content + Event
        ↓
normalizeContent()
        ↓
Detail UI
        ↓
Title
Body
Author
Category
Status
Date
Media
Rating
Bookmark
Share
Event information when applicable
```

The current task should be treated as:

> **Synchronize and debug Content Detail with the real Flask backend.**

It should **not** be treated as:

> Redesign the entire Content Detail page or change the rest of the catalog system.
