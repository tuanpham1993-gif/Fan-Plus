# ProjectHubPlus Backend API Documentation

This document summarizes all available API endpoints in `projectHubPlus/backend`, organized by blueprint / module.

---

## 📍 System / General Endpoints
Source: [app.py](file:///d:/Python3V11Project/projectHubPlus/backend/app.py)

| Method | Endpoint | Description | Query / Body Parameters | Response |
|---|---|---|---|---|
| `GET` | `/` | Health check / API status endpoint. | None | `200 OK`<br>`{"message": "Fan Hub API is running"}` |

---

## 👤 User Endpoints (`/api/users`)
Source: [routes/usertest.py](file:///d:/Python3V11Project/projectHubPlus/backend/routes/usertest.py)

| Method | Endpoint | Description | Request Body / Parameters | Response |
|---|---|---|---|---|
| `POST` | `/api/users/` | Create a new user. | JSON Body:<br>`username` (str), `email` (str) | `201 Created`<br>User Object (`id`, `username`, `email`) |

---

## 🔖 Bookmark Endpoints (`/bookmarks`)
Source: [routes/bookmark.py](file:///d:/Python3V11Project/projectHubPlus/backend/routes/bookmark.py)

| Method | Endpoint | Description | Request Body / Parameters | Response |
|---|---|---|---|---|
| `POST` | `/bookmarks` | Bookmark a content item for the user. | JSON Body:<br>`content_id` (int) | `201 Created`<br>Bookmark Object |
| `GET` | `/bookmarks` | Retrieve a paginated list of bookmarks for current user. | Query Params:<br>`skip` (default 0), `limit` (default 20) | `200 OK`<br>List of Bookmark Objects |
| `GET` | `/bookmarks/<content_id>` | Check bookmark status for a specific content item. | Path Param:<br>`content_id` (int) | `200 OK`<br>`{"bookmarked": true, "bookmark": {...}}` or `{"bookmarked": false}` |
| `DELETE` | `/bookmarks/<content_id>` | Remove a bookmark for a specific content item. | Path Param:<br>`content_id` (int) | `200 OK`<br>`{"message": "Bookmark deleted successfully"}` or `404 Not Found` |

---

## 🎭 Character Endpoints (`/characters`)
Source: [routes/character.py](file:///d:/Python3V11Project/projectHubPlus/backend/routes/character.py)

| Method | Endpoint | Description | Request Body / Parameters | Response |
|---|---|---|---|---|
| `POST` | `/characters` | Create a character entry with image upload (`multipart/form-data`). | Form Data:<br>`name` (str), `description` (str), `category_id` (int), `image` (file) | `201 Created`<br>Character Object<br>*(or `400 Bad Request` if image missing)* |
| `GET` | `/characters/<character_id>` | Get detailed information for a single character. | Path Param:<br>`character_id` (int) | `200 OK`<br>Character Object or `404 Not Found` |
| `GET` | `/characters` | Get a filtered, paginated list of characters. | Query Params:<br>`category_id` (int), `name` (str), `skip` (default 0), `limit` (default 20) | `200 OK`<br>List of Character Objects |

---

## 📦 Content Endpoints (`/contents`)
Source: [routes/content.py](file:///d:/Python3V11Project/projectHubPlus/backend/routes/content.py)

| Method | Endpoint | Description | Request Body / Parameters | Response |
|---|---|---|---|---|
| `GET` | `/contents/<content_id>` | Get content item details including attached media and associated characters. | Path Param:<br>`content_id` (int) | `200 OK`<br>Content Object + `medias` array + `characters` array |
| `POST` | `/contents` | Create a new content item with optional media uploads (`multipart/form-data`). | Form Data:<br>`category_id` (int), `title` (str), `body` (str), `content_type` (str), `media` (files list) | `201 Created`<br>Content Object + `medias` array |
| `POST` | `/contents/<content_id>/reactions` | Add or update a reaction (e.g. LIKE / DISLIKE) to a content item. | Path Param: `content_id`<br>JSON Body: `reaction_type` (str) | `201 Created`<br>Reaction object |
| `GET` | `/contents` | Get a paginated list of contents with filters, reaction counts, and linked characters. | Query Params:<br>`category_id` (int), `title` (str), `content_type` (str), `skip` (0), `limit` (20) | `200 OK`<br>`{"total": int, "items": [...]}` |
| `PATCH` | `/contents/<content_id>` | Update fields of a specific content item. | Path Param: `content_id`<br>JSON Body: optional `category_id`, `title`, `body`, `content_type` | `200 OK`<br>Updated Content Object or `404 Not Found` |
| `DELETE` | `/contents/<content_id>` | Delete a content item by ID. | Path Param:<br>`content_id` (int) | `200 OK`<br>`{"message": "Content deleted successfully"}` or `404 Not Found` |

---

## 📅 Event Endpoints (`/events`)
Source: [routes/event.py](file:///d:/Python3V11Project/projectHubPlus/backend/routes/event.py)

| Method | Endpoint | Description | Request Body / Parameters | Response |
|---|---|---|---|---|
| `GET` | `/events/<event_id>` | Get details of a specific event. | Path Param:<br>`event_id` (int) | `200 OK`<br>Event Object or `404 Not Found` |
| `GET` | `/events` | Get a filtered, sorted, paginated list of events. | Query Params:<br>`city` (str), `start_time`, `end_time`, `skip` (0), `limit` (20), `sort_by` ("start_time"), `sort_order` ("asc") | `200 OK`<br>`{"total": int, "items": [...]}` |
| `POST` | `/events` | Create a new event entry tied to a content item. | JSON Body:<br>`content_id`, `location_name`, `city`, `latitude`, `longitude`, `start_time`, `end_time`, `register_url` | `201 Created`<br>Event Object |
| `PUT` | `/events/<event_id>` | Replace / update an existing event. | Path Param: `event_id`<br>JSON Body: Event fields to update | `200 OK`<br>Updated Event Object or `404 Not Found` |
| `DELETE` | `/events/<event_id>` | Delete an event by ID. | Path Param:<br>`event_id` (int) | `200 OK`<br>`{"message": "Event deleted successfully"}` or `404 Not Found` |

---

## ⭐ Review Endpoints (`/reviews`)
Source: [routes/review.py](file:///d:/Python3V11Project/projectHubPlus/backend/routes/review.py)

| Method | Endpoint | Description | Request Body / Parameters | Response |
|---|---|---|---|---|
| `POST` | `/reviews` | Create a user review/rating for content. | JSON Body:<br>`content_id` (int), `rating` (float/int), `comment` (str) | `201 Created`<br>Review Object |
| `GET` | `/reviews/<review_id>` | Get details of a specific review. | Path Param:<br>`review_id` (int) | `200 OK`<br>Review Object or `404 Not Found` |
| `GET` | `/reviews` | Get a paginated list of reviews (optionally filtered by content ID). | Query Params:<br>`content_id` (int), `skip` (default 0), `limit` (default 20) | `200 OK`<br>List of Review Objects |
| `GET` | `/reviews/content/<content_id>` | Get paginated reviews specifically for a content item. | Path Param: `content_id`<br>Query Params: `skip` (0), `limit` (20) | `200 OK`<br>List of Review Objects |
| `PATCH` | `/reviews/<review_id>` | Update a review's rating or comment. | Path Param: `review_id`<br>JSON Body: `rating` (opt), `comment` (opt) | `200 OK`<br>Updated Review Object or `404 Not Found` |
| `DELETE` | `/reviews/<review_id>` | Delete a review by ID. | Path Param:<br>`review_id` (int) | `200 OK`<br>`{"message": "Review deleted successfully"}` or `404 Not Found` |
