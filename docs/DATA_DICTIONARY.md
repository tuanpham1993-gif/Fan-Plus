# Data dictionary - 31 modeled tables

Generated from the SQLAlchemy model used by the initial migration. These tables are a design/scaffold; table existence does not mean all corresponding API workflows are implemented. ORM defaults are applied by Python, not necessarily by direct SQL inserts.

## activities

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| user_id | VARCHAR(36) | False | False | users.id (on delete CASCADE) |
| resource_id | VARCHAR(36) | False | False | resources.id (on delete CASCADE) |
| day | DATE | False | False | - |
| created_at | DATETIME | False | False | - |
| id | VARCHAR(36) | False | True | - |

Constraints: UNIQUE (user_id, resource_id, day).

## audit_logs

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| actor_id | VARCHAR(36) | True | False | users.id (on delete SET NULL) |
| action | VARCHAR(80) | False | False | - |
| target_type | VARCHAR(80) | False | False | - |
| target_id | VARCHAR(36) | True | False | - |
| request_id | VARCHAR(36) | True | False | - |
| details | JSON | False | False | - |
| created_at | DATETIME | False | False | - |
| id | VARCHAR(36) | False | True | - |

Indexes: ix_audit_logs_actor_id (actor_id); ix_audit_logs_created_at (created_at).

## auth_sessions

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| token_hash | VARCHAR(64) | False | True | - |
| user_id | VARCHAR(36) | False | False | users.id (on delete CASCADE) |
| created_at | DATETIME | False | False | - |
| expires_at | DATETIME | False | False | - |
| revoked_at | DATETIME | True | False | - |

Indexes: ix_auth_sessions_expires_at (expires_at); ix_auth_sessions_user_id (user_id).

## bookmarks

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| user_id | VARCHAR(36) | False | False | users.id (on delete CASCADE) |
| resource_id | VARCHAR(36) | False | False | resources.id (on delete CASCADE) |
| note | TEXT | False | False | - |
| id | VARCHAR(36) | False | True | - |
| created_at | DATETIME | False | False | - |
| updated_at | DATETIME | False | False | - |

Constraints: UNIQUE (user_id, resource_id).

Indexes: ix_bookmarks_user_created (user_id, created_at).

## categories

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| slug | VARCHAR(50) | False | False | - |
| name | VARCHAR(80) | False | False | - |
| description | TEXT | False | False | - |
| sort_order | INTEGER | False | False | - |
| id | VARCHAR(36) | False | True | - |
| created_at | DATETIME | False | False | - |
| updated_at | DATETIME | False | False | - |

Constraints: UNIQUE (slug); UNIQUE (name).

## character_profiles

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| resource_id | VARCHAR(36) | False | True | resources.id (on delete CASCADE) |
| display_name | VARCHAR(120) | False | False | - |
| continuity | VARCHAR(120) | False | False | - |
| biography_markdown | TEXT | False | False | - |

## chat_messages

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| thread_id | VARCHAR(36) | False | False | chat_threads.id (on delete CASCADE) |
| role | VARCHAR(12) | False | False | - |
| body | TEXT | False | False | - |
| client_message_id | VARCHAR(36) | True | False | - |
| model_label | VARCHAR(100) | True | False | - |
| id | VARCHAR(36) | False | True | - |
| created_at | DATETIME | False | False | - |
| updated_at | DATETIME | False | False | - |

Constraints: UNIQUE (thread_id, client_message_id).

Indexes: ix_chat_messages_thread_id (thread_id).

## chat_threads

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| user_id | VARCHAR(36) | False | False | users.id (on delete CASCADE) |
| title | VARCHAR(120) | False | False | - |
| id | VARCHAR(36) | False | True | - |
| created_at | DATETIME | False | False | - |
| updated_at | DATETIME | False | False | - |

Indexes: ix_chat_threads_user_id (user_id).

## event_details

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| resource_id | VARCHAR(36) | False | True | resources.id (on delete CASCADE) |
| city | VARCHAR(100) | False | False | - |
| venue | VARCHAR(255) | False | False | - |
| latitude | NUMERIC(9, 6) | False | False | - |
| longitude | NUMERIC(9, 6) | False | False | - |
| starts_at | DATETIME | False | False | - |
| ends_at | DATETIME | False | False | - |
| timezone_name | VARCHAR(64) | False | False | - |
| ticket_url | VARCHAR(1000) | True | False | - |
| cancelled | BOOLEAN | False | False | - |

Constraints: CHECK ends_at > starts_at; CHECK longitude >= -180 AND longitude <= 180; CHECK latitude >= -90 AND latitude <= 90.

Indexes: ix_event_city_start (city, starts_at).

## fan_submissions

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| author_id | VARCHAR(36) | False | False | users.id (on delete RESTRICT) |
| category_id | VARCHAR(36) | False | False | categories.id (on delete RESTRICT) |
| fandom_id | VARCHAR(36) | True | False | fandoms.id (on delete RESTRICT) |
| title | VARCHAR(180) | False | False | - |
| body_markdown | TEXT | False | False | - |
| status | VARCHAR(16) | False | False | - |
| rejection_reason | VARCHAR(1000) | False | False | - |
| version | INTEGER | False | False | - |
| id | VARCHAR(36) | False | True | - |
| created_at | DATETIME | False | False | - |
| updated_at | DATETIME | False | False | - |

Constraints: CHECK status IN ('pending','approved','rejected').

Indexes: ix_submissions_queue (status, created_at).

## fandom_categories

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| fandom_id | VARCHAR(36) | False | True | fandoms.id (on delete CASCADE) |
| category_id | VARCHAR(36) | False | True | categories.id (on delete CASCADE) |

## fandoms

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| slug | VARCHAR(100) | False | False | - |
| name | VARCHAR(120) | False | False | - |
| description | TEXT | False | False | - |
| id | VARCHAR(36) | False | True | - |
| created_at | DATETIME | False | False | - |
| updated_at | DATETIME | False | False | - |

Constraints: UNIQUE (slug).

## faqs

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| question | VARCHAR(300) | False | False | - |
| answer | TEXT | False | False | - |
| published | BOOLEAN | False | False | - |
| id | VARCHAR(36) | False | True | - |
| created_at | DATETIME | False | False | - |
| updated_at | DATETIME | False | False | - |

## feedback

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| user_id | VARCHAR(36) | True | False | users.id (on delete SET NULL) |
| kind | VARCHAR(16) | False | False | - |
| message | TEXT | False | False | - |
| status | VARCHAR(16) | False | False | - |
| resolution_note | TEXT | False | False | - |
| id | VARCHAR(36) | False | True | - |
| created_at | DATETIME | False | False | - |
| updated_at | DATETIME | False | False | - |

Constraints: CHECK kind IN ('bug','suggestion','query'); CHECK status IN ('open','in_progress','resolved').

## genres

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| name | VARCHAR(80) | False | False | - |
| id | VARCHAR(36) | False | True | - |

Constraints: UNIQUE (name).

## media_assets

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| owner_id | VARCHAR(36) | True | False | users.id (on delete SET NULL) |
| kind | VARCHAR(12) | False | False | - |
| storage_key | VARCHAR(255) | False | False | - |
| mime_type | VARCHAR(100) | False | False | - |
| byte_size | INTEGER | False | False | - |
| alt_text | VARCHAR(300) | False | False | - |
| source_url | VARCHAR(1000) | True | False | - |
| attribution | VARCHAR(300) | False | False | - |
| license_label | VARCHAR(120) | False | False | - |
| approved | BOOLEAN | False | False | - |
| id | VARCHAR(36) | False | True | - |
| created_at | DATETIME | False | False | - |
| updated_at | DATETIME | False | False | - |

Constraints: UNIQUE (storage_key); CHECK kind IN ('image','video','audio','caption'); CHECK byte_size >= 0.

## merchandise_items

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| resource_id | VARCHAR(36) | False | True | resources.id (on delete CASCADE) |
| maker | VARCHAR(120) | False | False | - |
| edition | VARCHAR(100) | False | False | - |
| official_url | VARCHAR(1000) | True | False | - |

## message_sources

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| message_id | VARCHAR(36) | False | True | chat_messages.id (on delete CASCADE) |
| resource_id | VARCHAR(36) | False | True | resources.id (on delete CASCADE) |
| resource_version | INTEGER | False | False | - |

## moderation_actions

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| submission_id | VARCHAR(36) | False | False | fan_submissions.id (on delete RESTRICT) |
| reviewer_id | VARCHAR(36) | False | False | users.id (on delete RESTRICT) |
| decision | VARCHAR(16) | False | False | - |
| reason | VARCHAR(1000) | False | False | - |
| created_at | DATETIME | False | False | - |
| id | VARCHAR(36) | False | True | - |

Indexes: ix_moderation_actions_submission_id (submission_id).

## one_time_tokens

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| user_id | VARCHAR(36) | False | False | users.id (on delete CASCADE) |
| purpose | VARCHAR(24) | False | False | - |
| token_hash | VARCHAR(64) | False | False | - |
| expires_at | DATETIME | False | False | - |
| used_at | DATETIME | True | False | - |
| created_at | DATETIME | False | False | - |
| id | VARCHAR(36) | False | True | - |

Constraints: CHECK purpose IN ('verify_email','reset_password'); UNIQUE (token_hash).

Indexes: ix_one_time_tokens_user_id (user_id).

## ratings

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| user_id | VARCHAR(36) | False | True | users.id (on delete CASCADE) |
| resource_id | VARCHAR(36) | False | True | resources.id (on delete CASCADE) |
| value | INTEGER | False | False | - |
| updated_at | DATETIME | False | False | - |

Constraints: CHECK value >= 1 AND value <= 5.

## resource_genres

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| resource_id | VARCHAR(36) | False | True | resources.id (on delete CASCADE) |
| genre_id | VARCHAR(36) | False | True | genres.id (on delete RESTRICT) |

## resource_media

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| resource_id | VARCHAR(36) | False | True | resources.id (on delete CASCADE) |
| media_id | VARCHAR(36) | False | True | media_assets.id (on delete RESTRICT) |
| position | INTEGER | False | False | - |

## resource_tags

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| resource_id | VARCHAR(36) | False | True | resources.id (on delete CASCADE) |
| tag_id | VARCHAR(36) | False | True | tags.id (on delete RESTRICT) |

## resources

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| slug | VARCHAR(160) | False | False | - |
| title | VARCHAR(180) | False | False | - |
| summary | VARCHAR(600) | False | False | - |
| body_markdown | TEXT | False | False | - |
| kind | VARCHAR(20) | False | False | - |
| category_id | VARCHAR(36) | False | False | fandom_categories.category_id (on delete RESTRICT); categories.id (on delete RESTRICT) |
| fandom_id | VARCHAR(36) | True | False | fandom_categories.fandom_id (on delete RESTRICT) |
| author_id | VARCHAR(36) | False | False | users.id (on delete RESTRICT) |
| cover_media_id | VARCHAR(36) | True | False | media_assets.id (on delete RESTRICT) |
| status | VARCHAR(16) | False | False | - |
| published_at | DATETIME | True | False | - |
| release_year | INTEGER | True | False | - |
| has_spoilers | BOOLEAN | False | False | - |
| spoiler_level | INTEGER | False | False | - |
| source_url | VARCHAR(1000) | True | False | - |
| version | INTEGER | False | False | - |
| submission_id | VARCHAR(36) | True | False | fan_submissions.id (on delete RESTRICT) |
| id | VARCHAR(36) | False | True | - |
| created_at | DATETIME | False | False | - |
| updated_at | DATETIME | False | False | - |

Constraints: UNIQUE (submission_id); CHECK kind IN ('article','character','video','audio','gallery','merchandise','event'); CHECK version > 0; UNIQUE (slug); CHECK status IN ('draft','published','archived'); CHECK release_year IS NULL OR (release_year >= 1900 AND release_year <= 2100).

Indexes: ix_resources_category_kind (category_id, kind, status); ix_resources_public_feed (status, published_at, id).

## tags

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| name | VARCHAR(80) | False | False | - |
| id | VARCHAR(36) | False | True | - |

Constraints: UNIQUE (name).

## upcoming_releases

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| resource_id | VARCHAR(36) | False | False | resources.id (on delete CASCADE) |
| release_date | DATE | False | False | - |
| region | VARCHAR(80) | False | False | - |
| date_precision | VARCHAR(12) | False | False | - |
| source_url | VARCHAR(1000) | True | False | - |
| id | VARCHAR(36) | False | True | - |
| created_at | DATETIME | False | False | - |
| updated_at | DATETIME | False | False | - |

Indexes: ix_release_date (release_date, resource_id).

## user_categories

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| user_id | VARCHAR(36) | False | True | users.id (on delete CASCADE) |
| category_id | VARCHAR(36) | False | True | categories.id (on delete CASCADE) |

## user_fandoms

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| user_id | VARCHAR(36) | False | True | users.id (on delete CASCADE) |
| fandom_id | VARCHAR(36) | False | True | fandoms.id (on delete CASCADE) |

## user_settings

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| user_id | VARCHAR(36) | False | True | users.id (on delete CASCADE) |
| theme | VARCHAR(8) | False | False | - |
| font_scale | NUMERIC(4, 1) | False | False | - |
| spoiler_safe | BOOLEAN | False | False | - |

Constraints: CHECK theme IN ('light','dark','system'); CHECK font_scale IN (100,112.5,125).

## users

| Column | SQLAlchemy type | Nullable | Primary key | Foreign key |
|---|---|---|---|---|
| email | VARCHAR(254) | False | False | - |
| display_name | VARCHAR(80) | False | False | - |
| password_hash | VARCHAR(255) | False | False | - |
| role | VARCHAR(16) | False | False | - |
| bio | TEXT | False | False | - |
| verified_at | DATETIME | True | False | - |
| suspended_at | DATETIME | True | False | - |
| avatar_media_id | VARCHAR(36) | True | False | media_assets.id (on delete SET NULL) |
| id | VARCHAR(36) | False | True | - |
| created_at | DATETIME | False | False | - |
| updated_at | DATETIME | False | False | - |

Constraints: CHECK role IN ('member','admin'); UNIQUE (email).

