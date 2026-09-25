# Community moderation + media/category upgrade

This revision extends the existing Community workflow without changing the overall visual language.

## Added

- Nine user-facing categories: **Soundtrack, Anime, Gaming, Movies, TV Shows, K-pop, Comic, Manga, Cosplay**.
- Three content types in **Write a post**: **Post**, **Video**, **Soundtrack**.
- Video/audio playback inside published posts and the composer preview.
- Member submissions and member edits remain **pending** until an administrator publishes or rejects them.
- Administrator-authored posts and edits publish immediately.
- Admin workspace shortcut opens the Community **Review queue** directly.
- Existing published posts keep comments/replies/reactions/reporting.
- Browser demo data migrates legacy `music` category records to `soundtrack`.

## Media safety boundary

The current implementation accepts direct `https://...` media URLs or local `/media/...` paths. It intentionally does **not** provide arbitrary file upload, storage, transcoding or HTML/embed-code execution.

## Backend schema/API

`community_posts` now stores `content_type` and `media_url`, with database checks for the expanded topics and post types. API post payloads use camelCase `format` and `mediaUrl`, matching the frontend types.

## Verification completed

- Backend service tests: **50 passed, 1 skipped**.
- Frontend Node feature tests: **71 passed**.
- Frontend UI harness: **13 groups passed**, including the updated Community composer.
- Portable TypeScript build: **28 modules transpiled**.

A normal Vite/npm production build was not run in this environment because the npm dependencies were not available from the local cache/network. Functional, backend and portable-build checks above completed successfully.
