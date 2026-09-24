-- Fan Hub Plus MySQL 8.4 schema reference, generated from SQLAlchemy metadata.

-- Reviewed as DDL only, not executed against MySQL in the authoring environment.

-- Prefer alembic upgrade head; do not apply this file on top of migrated tables.

-- Python creates UUIDs/timestamps/default values; raw inserts must supply required values.

CREATE DATABASE IF NOT EXISTS fanhub CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

USE fanhub;


CREATE TABLE categories (
	slug VARCHAR(50) NOT NULL, 
	name VARCHAR(80) NOT NULL, 
	description TEXT NOT NULL, 
	sort_order INTEGER NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	CONSTRAINT pk_categories PRIMARY KEY (id), 
	CONSTRAINT uq_categories_slug UNIQUE (slug), 
	CONSTRAINT uq_categories_name UNIQUE (name)
)

;


CREATE TABLE fandoms (
	slug VARCHAR(100) NOT NULL, 
	name VARCHAR(120) NOT NULL, 
	description TEXT NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	CONSTRAINT pk_fandoms PRIMARY KEY (id), 
	CONSTRAINT uq_fandoms_slug UNIQUE (slug)
)

;


CREATE TABLE faqs (
	question VARCHAR(300) NOT NULL, 
	answer TEXT NOT NULL, 
	published BOOL NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	CONSTRAINT pk_faqs PRIMARY KEY (id)
)

;


CREATE TABLE genres (
	name VARCHAR(80) NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	CONSTRAINT pk_genres PRIMARY KEY (id), 
	CONSTRAINT uq_genres_name UNIQUE (name)
)

;


CREATE TABLE media_assets (
	owner_id VARCHAR(36), 
	kind VARCHAR(12) NOT NULL, 
	storage_key VARCHAR(255) NOT NULL, 
	mime_type VARCHAR(100) NOT NULL, 
	byte_size INTEGER NOT NULL, 
	alt_text VARCHAR(300) NOT NULL, 
	source_url VARCHAR(1000), 
	attribution VARCHAR(300) NOT NULL, 
	license_label VARCHAR(120) NOT NULL, 
	approved BOOL NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	CONSTRAINT pk_media_assets PRIMARY KEY (id), 
	CONSTRAINT ck_media_assets_kind CHECK (kind IN ('image','video','audio','caption')), 
	CONSTRAINT ck_media_assets_byte_size CHECK (byte_size >= 0), 
	CONSTRAINT uq_media_assets_storage_key UNIQUE (storage_key)
)

;


CREATE TABLE tags (
	name VARCHAR(80) NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	CONSTRAINT pk_tags PRIMARY KEY (id), 
	CONSTRAINT uq_tags_name UNIQUE (name)
)

;


CREATE TABLE users (
	email VARCHAR(254) NOT NULL, 
	display_name VARCHAR(80) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	`role` VARCHAR(16) NOT NULL, 
	bio TEXT NOT NULL, 
	verified_at DATETIME, 
	suspended_at DATETIME, 
	avatar_media_id VARCHAR(36), 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	CONSTRAINT pk_users PRIMARY KEY (id), 
	CONSTRAINT ck_users_role CHECK (role IN ('member','admin')), 
	CONSTRAINT uq_users_email UNIQUE (email)
)

;


CREATE TABLE audit_logs (
	actor_id VARCHAR(36), 
	action VARCHAR(80) NOT NULL, 
	target_type VARCHAR(80) NOT NULL, 
	target_id VARCHAR(36), 
	request_id VARCHAR(36), 
	details JSON NOT NULL, 
	created_at DATETIME NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	CONSTRAINT pk_audit_logs PRIMARY KEY (id), 
	CONSTRAINT fk_audit_logs_actor_id_users FOREIGN KEY(actor_id) REFERENCES users (id) ON DELETE SET NULL
)

;

CREATE INDEX ix_audit_logs_actor_id ON audit_logs (actor_id);

CREATE INDEX ix_audit_logs_created_at ON audit_logs (created_at);


CREATE TABLE auth_sessions (
	token_hash VARCHAR(64) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	expires_at DATETIME NOT NULL, 
	revoked_at DATETIME, 
	CONSTRAINT pk_auth_sessions PRIMARY KEY (token_hash), 
	CONSTRAINT fk_auth_sessions_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)

;

CREATE INDEX ix_auth_sessions_expires_at ON auth_sessions (expires_at);

CREATE INDEX ix_auth_sessions_user_id ON auth_sessions (user_id);


CREATE TABLE chat_threads (
	user_id VARCHAR(36) NOT NULL, 
	title VARCHAR(120) NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	CONSTRAINT pk_chat_threads PRIMARY KEY (id), 
	CONSTRAINT fk_chat_threads_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)

;

CREATE INDEX ix_chat_threads_user_id ON chat_threads (user_id);


CREATE TABLE fan_submissions (
	author_id VARCHAR(36) NOT NULL, 
	category_id VARCHAR(36) NOT NULL, 
	fandom_id VARCHAR(36), 
	title VARCHAR(180) NOT NULL, 
	body_markdown TEXT NOT NULL, 
	status VARCHAR(16) NOT NULL, 
	rejection_reason VARCHAR(1000) NOT NULL, 
	version INTEGER NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	CONSTRAINT pk_fan_submissions PRIMARY KEY (id), 
	CONSTRAINT ck_fan_submissions_status CHECK (status IN ('pending','approved','rejected')), 
	CONSTRAINT fk_fan_submissions_author_id_users FOREIGN KEY(author_id) REFERENCES users (id) ON DELETE RESTRICT, 
	CONSTRAINT fk_fan_submissions_category_id_categories FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE RESTRICT, 
	CONSTRAINT fk_fan_submissions_fandom_id_fandoms FOREIGN KEY(fandom_id) REFERENCES fandoms (id) ON DELETE RESTRICT
)

;

CREATE INDEX ix_submissions_queue ON fan_submissions (status, created_at);


CREATE TABLE fandom_categories (
	fandom_id VARCHAR(36) NOT NULL, 
	category_id VARCHAR(36) NOT NULL, 
	CONSTRAINT pk_fandom_categories PRIMARY KEY (fandom_id, category_id), 
	CONSTRAINT fk_fandom_categories_fandom_id_fandoms FOREIGN KEY(fandom_id) REFERENCES fandoms (id) ON DELETE CASCADE, 
	CONSTRAINT fk_fandom_categories_category_id_categories FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE CASCADE
)

;


CREATE TABLE feedback (
	user_id VARCHAR(36), 
	kind VARCHAR(16) NOT NULL, 
	message TEXT NOT NULL, 
	status VARCHAR(16) NOT NULL, 
	resolution_note TEXT NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	CONSTRAINT pk_feedback PRIMARY KEY (id), 
	CONSTRAINT ck_feedback_kind CHECK (kind IN ('bug','suggestion','query')), 
	CONSTRAINT ck_feedback_status CHECK (status IN ('open','in_progress','resolved')), 
	CONSTRAINT fk_feedback_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE SET NULL
)

;


CREATE TABLE one_time_tokens (
	user_id VARCHAR(36) NOT NULL, 
	purpose VARCHAR(24) NOT NULL, 
	token_hash VARCHAR(64) NOT NULL, 
	expires_at DATETIME NOT NULL, 
	used_at DATETIME, 
	created_at DATETIME NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	CONSTRAINT pk_one_time_tokens PRIMARY KEY (id), 
	CONSTRAINT ck_one_time_tokens_purpose CHECK (purpose IN ('verify_email','reset_password')), 
	CONSTRAINT fk_one_time_tokens_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	CONSTRAINT uq_one_time_tokens_token_hash UNIQUE (token_hash)
)

;

CREATE INDEX ix_one_time_tokens_user_id ON one_time_tokens (user_id);


CREATE TABLE user_categories (
	user_id VARCHAR(36) NOT NULL, 
	category_id VARCHAR(36) NOT NULL, 
	CONSTRAINT pk_user_categories PRIMARY KEY (user_id, category_id), 
	CONSTRAINT fk_user_categories_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	CONSTRAINT fk_user_categories_category_id_categories FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE CASCADE
)

;


CREATE TABLE user_fandoms (
	user_id VARCHAR(36) NOT NULL, 
	fandom_id VARCHAR(36) NOT NULL, 
	CONSTRAINT pk_user_fandoms PRIMARY KEY (user_id, fandom_id), 
	CONSTRAINT fk_user_fandoms_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	CONSTRAINT fk_user_fandoms_fandom_id_fandoms FOREIGN KEY(fandom_id) REFERENCES fandoms (id) ON DELETE CASCADE
)

;


CREATE TABLE user_settings (
	user_id VARCHAR(36) NOT NULL, 
	theme VARCHAR(8) NOT NULL, 
	font_scale NUMERIC(4, 1) NOT NULL, 
	spoiler_safe BOOL NOT NULL, 
	CONSTRAINT pk_user_settings PRIMARY KEY (user_id), 
	CONSTRAINT ck_user_settings_theme CHECK (theme IN ('light','dark','system')), 
	CONSTRAINT ck_user_settings_font_scale CHECK (font_scale IN (100,112.5,125)), 
	CONSTRAINT fk_user_settings_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)

;


CREATE TABLE chat_messages (
	thread_id VARCHAR(36) NOT NULL, 
	`role` VARCHAR(12) NOT NULL, 
	body TEXT NOT NULL, 
	client_message_id VARCHAR(36), 
	model_label VARCHAR(100), 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	CONSTRAINT pk_chat_messages PRIMARY KEY (id), 
	CONSTRAINT uq_chat_messages_thread_id UNIQUE (thread_id, client_message_id), 
	CONSTRAINT fk_chat_messages_thread_id_chat_threads FOREIGN KEY(thread_id) REFERENCES chat_threads (id) ON DELETE CASCADE
)

;

CREATE INDEX ix_chat_messages_thread_id ON chat_messages (thread_id);


CREATE TABLE moderation_actions (
	submission_id VARCHAR(36) NOT NULL, 
	reviewer_id VARCHAR(36) NOT NULL, 
	decision VARCHAR(16) NOT NULL, 
	reason VARCHAR(1000) NOT NULL, 
	created_at DATETIME NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	CONSTRAINT pk_moderation_actions PRIMARY KEY (id), 
	CONSTRAINT fk_moderation_actions_submission_id_fan_submissions FOREIGN KEY(submission_id) REFERENCES fan_submissions (id) ON DELETE RESTRICT, 
	CONSTRAINT fk_moderation_actions_reviewer_id_users FOREIGN KEY(reviewer_id) REFERENCES users (id) ON DELETE RESTRICT
)

;

CREATE INDEX ix_moderation_actions_submission_id ON moderation_actions (submission_id);


CREATE TABLE resources (
	slug VARCHAR(160) NOT NULL, 
	title VARCHAR(180) NOT NULL, 
	summary VARCHAR(600) NOT NULL, 
	body_markdown TEXT NOT NULL, 
	kind VARCHAR(20) NOT NULL, 
	category_id VARCHAR(36) NOT NULL, 
	fandom_id VARCHAR(36), 
	author_id VARCHAR(36) NOT NULL, 
	cover_media_id VARCHAR(36), 
	status VARCHAR(16) NOT NULL, 
	published_at DATETIME, 
	release_year INTEGER, 
	has_spoilers BOOL NOT NULL, 
	spoiler_level INTEGER NOT NULL, 
	source_url VARCHAR(1000), 
	version INTEGER NOT NULL, 
	submission_id VARCHAR(36), 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	CONSTRAINT pk_resources PRIMARY KEY (id), 
	CONSTRAINT ck_resources_kind CHECK (kind IN ('article','character','video','audio','gallery','merchandise','event')), 
	CONSTRAINT ck_resources_status CHECK (status IN ('draft','published','archived')), 
	CONSTRAINT ck_resources_release_year CHECK (release_year IS NULL OR (release_year >= 1900 AND release_year <= 2100)), 
	CONSTRAINT ck_resources_version CHECK (version > 0), 
	CONSTRAINT fk_resources_fandom_id_fandom_categories FOREIGN KEY(fandom_id, category_id) REFERENCES fandom_categories (fandom_id, category_id) ON DELETE RESTRICT, 
	CONSTRAINT uq_resources_slug UNIQUE (slug), 
	CONSTRAINT fk_resources_category_id_categories FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE RESTRICT, 
	CONSTRAINT fk_resources_author_id_users FOREIGN KEY(author_id) REFERENCES users (id) ON DELETE RESTRICT, 
	CONSTRAINT fk_resources_cover_media_id_media_assets FOREIGN KEY(cover_media_id) REFERENCES media_assets (id) ON DELETE RESTRICT, 
	CONSTRAINT uq_resources_submission_id UNIQUE (submission_id), 
	CONSTRAINT fk_resources_submission_id_fan_submissions FOREIGN KEY(submission_id) REFERENCES fan_submissions (id) ON DELETE RESTRICT
)

;

CREATE INDEX ix_resources_category_kind ON resources (category_id, kind, status);

CREATE INDEX ix_resources_public_feed ON resources (status, published_at, id);


CREATE TABLE activities (
	user_id VARCHAR(36) NOT NULL, 
	resource_id VARCHAR(36) NOT NULL, 
	day DATE NOT NULL, 
	created_at DATETIME NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	CONSTRAINT pk_activities PRIMARY KEY (id), 
	CONSTRAINT uq_activities_user_id UNIQUE (user_id, resource_id, day), 
	CONSTRAINT fk_activities_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	CONSTRAINT fk_activities_resource_id_resources FOREIGN KEY(resource_id) REFERENCES resources (id) ON DELETE CASCADE
)

;


CREATE TABLE bookmarks (
	user_id VARCHAR(36) NOT NULL, 
	resource_id VARCHAR(36) NOT NULL, 
	note TEXT NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	CONSTRAINT pk_bookmarks PRIMARY KEY (id), 
	CONSTRAINT uq_bookmarks_user_id UNIQUE (user_id, resource_id), 
	CONSTRAINT fk_bookmarks_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	CONSTRAINT fk_bookmarks_resource_id_resources FOREIGN KEY(resource_id) REFERENCES resources (id) ON DELETE CASCADE
)

;

CREATE INDEX ix_bookmarks_user_created ON bookmarks (user_id, created_at);


CREATE TABLE character_profiles (
	resource_id VARCHAR(36) NOT NULL, 
	display_name VARCHAR(120) NOT NULL, 
	continuity VARCHAR(120) NOT NULL, 
	biography_markdown TEXT NOT NULL, 
	CONSTRAINT pk_character_profiles PRIMARY KEY (resource_id), 
	CONSTRAINT fk_character_profiles_resource_id_resources FOREIGN KEY(resource_id) REFERENCES resources (id) ON DELETE CASCADE
)

;


CREATE TABLE event_details (
	resource_id VARCHAR(36) NOT NULL, 
	city VARCHAR(100) NOT NULL, 
	venue VARCHAR(255) NOT NULL, 
	latitude NUMERIC(9, 6) NOT NULL, 
	longitude NUMERIC(9, 6) NOT NULL, 
	starts_at DATETIME NOT NULL, 
	ends_at DATETIME NOT NULL, 
	timezone_name VARCHAR(64) NOT NULL, 
	ticket_url VARCHAR(1000), 
	cancelled BOOL NOT NULL, 
	CONSTRAINT pk_event_details PRIMARY KEY (resource_id), 
	CONSTRAINT ck_event_details_time_range CHECK (ends_at > starts_at), 
	CONSTRAINT ck_event_details_latitude CHECK (latitude >= -90 AND latitude <= 90), 
	CONSTRAINT ck_event_details_longitude CHECK (longitude >= -180 AND longitude <= 180), 
	CONSTRAINT fk_event_details_resource_id_resources FOREIGN KEY(resource_id) REFERENCES resources (id) ON DELETE CASCADE
)

;

CREATE INDEX ix_event_city_start ON event_details (city, starts_at);


CREATE TABLE merchandise_items (
	resource_id VARCHAR(36) NOT NULL, 
	maker VARCHAR(120) NOT NULL, 
	edition VARCHAR(100) NOT NULL, 
	official_url VARCHAR(1000), 
	CONSTRAINT pk_merchandise_items PRIMARY KEY (resource_id), 
	CONSTRAINT fk_merchandise_items_resource_id_resources FOREIGN KEY(resource_id) REFERENCES resources (id) ON DELETE CASCADE
)

;


CREATE TABLE message_sources (
	message_id VARCHAR(36) NOT NULL, 
	resource_id VARCHAR(36) NOT NULL, 
	resource_version INTEGER NOT NULL, 
	CONSTRAINT pk_message_sources PRIMARY KEY (message_id, resource_id), 
	CONSTRAINT fk_message_sources_message_id_chat_messages FOREIGN KEY(message_id) REFERENCES chat_messages (id) ON DELETE CASCADE, 
	CONSTRAINT fk_message_sources_resource_id_resources FOREIGN KEY(resource_id) REFERENCES resources (id) ON DELETE CASCADE
)

;


CREATE TABLE ratings (
	user_id VARCHAR(36) NOT NULL, 
	resource_id VARCHAR(36) NOT NULL, 
	value INTEGER NOT NULL, 
	updated_at DATETIME NOT NULL, 
	CONSTRAINT pk_ratings PRIMARY KEY (user_id, resource_id), 
	CONSTRAINT ck_ratings_value CHECK (value >= 1 AND value <= 5), 
	CONSTRAINT fk_ratings_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	CONSTRAINT fk_ratings_resource_id_resources FOREIGN KEY(resource_id) REFERENCES resources (id) ON DELETE CASCADE
)

;


CREATE TABLE resource_genres (
	resource_id VARCHAR(36) NOT NULL, 
	genre_id VARCHAR(36) NOT NULL, 
	CONSTRAINT pk_resource_genres PRIMARY KEY (resource_id, genre_id), 
	CONSTRAINT fk_resource_genres_resource_id_resources FOREIGN KEY(resource_id) REFERENCES resources (id) ON DELETE CASCADE, 
	CONSTRAINT fk_resource_genres_genre_id_genres FOREIGN KEY(genre_id) REFERENCES genres (id) ON DELETE RESTRICT
)

;


CREATE TABLE resource_media (
	resource_id VARCHAR(36) NOT NULL, 
	media_id VARCHAR(36) NOT NULL, 
	position INTEGER NOT NULL, 
	CONSTRAINT pk_resource_media PRIMARY KEY (resource_id, media_id), 
	CONSTRAINT fk_resource_media_resource_id_resources FOREIGN KEY(resource_id) REFERENCES resources (id) ON DELETE CASCADE, 
	CONSTRAINT fk_resource_media_media_id_media_assets FOREIGN KEY(media_id) REFERENCES media_assets (id) ON DELETE RESTRICT
)

;


CREATE TABLE resource_tags (
	resource_id VARCHAR(36) NOT NULL, 
	tag_id VARCHAR(36) NOT NULL, 
	CONSTRAINT pk_resource_tags PRIMARY KEY (resource_id, tag_id), 
	CONSTRAINT fk_resource_tags_resource_id_resources FOREIGN KEY(resource_id) REFERENCES resources (id) ON DELETE CASCADE, 
	CONSTRAINT fk_resource_tags_tag_id_tags FOREIGN KEY(tag_id) REFERENCES tags (id) ON DELETE RESTRICT
)

;


CREATE TABLE upcoming_releases (
	resource_id VARCHAR(36) NOT NULL, 
	release_date DATE NOT NULL, 
	region VARCHAR(80) NOT NULL, 
	date_precision VARCHAR(12) NOT NULL, 
	source_url VARCHAR(1000), 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	CONSTRAINT pk_upcoming_releases PRIMARY KEY (id), 
	CONSTRAINT fk_upcoming_releases_resource_id_resources FOREIGN KEY(resource_id) REFERENCES resources (id) ON DELETE CASCADE
)

;

CREATE INDEX ix_release_date ON upcoming_releases (release_date, resource_id);

ALTER TABLE media_assets ADD CONSTRAINT fk_media_assets_owner_id_users FOREIGN KEY(owner_id) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE users ADD CONSTRAINT fk_users_avatar_media_id_media_assets FOREIGN KEY(avatar_media_id) REFERENCES media_assets (id) ON DELETE SET NULL;
