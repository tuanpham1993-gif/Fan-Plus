# Flask extension HTTP routes

Extracted from actual route declarations. Source presence is not HTTP-test certification.

| Method | Endpoint | Handler |
|---|---|---|
| GET | `/api/v1/health` | `health` |
| GET | `/api/v1/auth/csrf` | `csrf_route` |
| GET | `/api/v1/auth/me` | `me` |
| POST | `/api/v1/auth/register` | `register` |
| POST | `/api/v1/auth/login` | `login` |
| POST | `/api/v1/auth/logout` | `logout` |
| GET | `/api/v1/community` | `community` |
| POST | `/api/v1/community/posts` | `new_post` |
| PATCH | `/api/v1/community/posts/<post_id>` | `edit_post` |
| DELETE | `/api/v1/community/posts/<post_id>` | `remove_post` |
| POST | `/api/v1/community/posts/<post_id>/moderate` | `review` |
| PUT | `/api/v1/community/posts/<post_id>/reaction` | `reaction` |
| POST | `/api/v1/community/posts/<post_id>/comments` | `comment` |
| DELETE | `/api/v1/community/comments/<comment_id>` | `remove_comment` |
| POST | `/api/v1/community/posts/<post_id>/reports` | `report` |
| PATCH | `/api/v1/community/reports/<report_id>` | `resolve_report` |
| GET | `/api/v1/giveaways` | `campaigns` |
| GET | `/api/v1/giveaways/<campaign_id>` | `campaign` |
| POST | `/api/v1/giveaways/<campaign_id>/entries` | `enter` |
| POST | `/api/v1/giveaways/<campaign_id>/freeze` | `freeze` |
| POST | `/api/v1/giveaways/<campaign_id>/draw` | `draw` |
| GET | `/api/v1/lore/status` | `lore_status` |
| POST | `/api/v1/lore/messages` | `lore_message` |
| GET | `/api/v1/lore/history` | `lore_history` |
| DELETE | `/api/v1/lore/history` | `lore_clear` |
| GET | `/api/v1/lore/sources/<source_id>` | `lore_source` |


## Community post payload

`POST /api/v1/community/posts` and `PATCH /api/v1/community/posts/<post_id>` accept the existing title/subject/body/rating/spoiler fields plus:

- `topic`: `soundtrack | anime | gaming | movies | tv | kpop | comic | manga | cosplay`
- `format`: `post | video | soundtrack`
- `mediaUrl`: empty for `post`; required for `video` and `soundtrack`. The current implementation accepts a direct `https://...` URL (without embedded credentials) or a local `/media/...` path.

Member-created or member-edited content is saved as `pending` for administrator moderation. Admin-authored content is published immediately. The moderation endpoint remains for pending member submissions and still performs role/version checks.

All mutations require a session-bound `X-CSRFToken`. Retrieve `{data:{token:...}}` from `/auth/csrf`. Identity is checked server-side. Admin moderation, freeze and draw require admin role. Public reads and anonymous source-grounded chat are available without member login.

Responses use `{data:...}` and failures use `{error:{message,requestId}}`. Rate-limited calls return 429. Most fields use the camelCase frontend types in `src/features/types.ts`. Request examples are in `src/features/gateway.ts`.
