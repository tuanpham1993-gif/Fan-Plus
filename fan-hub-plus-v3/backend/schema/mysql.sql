-- V3 EXTENSION BASELINE ONLY. No data. Apply to a new database.

CREATE TABLE chat_messages (
	id VARCHAR(36) NOT NULL, 
	owner_hash VARCHAR(64) NOT NULL, 
	`role` VARCHAR(12) NOT NULL, 
	text TEXT NOT NULL, 
	sources JSON NOT NULL, 
	mode VARCHAR(40) NOT NULL, 
	created_at VARCHAR(32) NOT NULL, 
	PRIMARY KEY (id)
)

;
CREATE INDEX ix_chat_messages_owner_hash ON chat_messages (owner_hash);

CREATE TABLE giveaway_campaigns (
	id VARCHAR(16) NOT NULL, 
	title VARCHAR(80) NOT NULL, 
	opens_at VARCHAR(32) NOT NULL, 
	closes_at VARCHAR(32) NOT NULL, 
	draw_at VARCHAR(32) NOT NULL, 
	status VARCHAR(12) NOT NULL, 
	demo BOOL NOT NULL, 
	terms_version VARCHAR(40) NOT NULL, 
	private_seed VARCHAR(64) NOT NULL, 
	seed_commitment VARCHAR(64) NOT NULL, 
	snapshot JSON, 
	snapshot_hash VARCHAR(64), 
	seed_reveal VARCHAR(64), 
	PRIMARY KEY (id), 
	CHECK (status IN ('open','locked','drawn'))
)

;

CREATE TABLE knowledge_documents (
	id VARCHAR(80) NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	topic VARCHAR(100) NOT NULL, 
	aliases JSON NOT NULL, 
	body TEXT NOT NULL, 
	spoiler_level INTEGER NOT NULL, 
	status VARCHAR(12) NOT NULL, 
	source_label VARCHAR(500) NOT NULL, 
	sample BOOL NOT NULL, 
	related_path VARCHAR(250), 
	PRIMARY KEY (id), 
	CHECK (status IN ('draft','published')), 
	CHECK (spoiler_level >= 0)
)

;
CREATE INDEX ix_knowledge_documents_topic ON knowledge_documents (topic);

CREATE TABLE rate_buckets (
	`key` VARCHAR(64) NOT NULL, 
	minute INTEGER NOT NULL, 
	count INTEGER NOT NULL, 
	PRIMARY KEY (`key`, minute)
)

;

CREATE TABLE users (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(80) NOT NULL, 
	email VARCHAR(254) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	`role` VARCHAR(12) NOT NULL, 
	suspended BOOL NOT NULL, 
	verified BOOL NOT NULL, 
	created_at VARCHAR(32) NOT NULL, 
	PRIMARY KEY (id), 
	CHECK (role IN ('member','admin')), 
	UNIQUE (email)
)

;

CREATE TABLE audit_events (
	id VARCHAR(36) NOT NULL, 
	actor_id VARCHAR(36), 
	target VARCHAR(80) NOT NULL, 
	event VARCHAR(80) NOT NULL, 
	detail JSON NOT NULL, 
	created_at VARCHAR(32) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(actor_id) REFERENCES users (id)
)

;
CREATE INDEX ix_audit_events_target ON audit_events (target);

CREATE TABLE auth_sessions (
	token_hash VARCHAR(64) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	expires_at VARCHAR(32) NOT NULL, 
	PRIMARY KEY (token_hash), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;
CREATE INDEX ix_auth_sessions_user_id ON auth_sessions (user_id);

CREATE TABLE community_posts (
	id VARCHAR(36) NOT NULL, 
	author_id VARCHAR(36) NOT NULL, 
	title VARCHAR(140) NOT NULL, 
	subject VARCHAR(100) NOT NULL, 
	body TEXT NOT NULL, 
	topic VARCHAR(12) NOT NULL, 
	spoiler BOOL NOT NULL, 
	rating INTEGER NOT NULL, 
	status VARCHAR(12) NOT NULL, 
	reason VARCHAR(500) NOT NULL, 
	version INTEGER NOT NULL, 
	sample BOOL NOT NULL, 
	created_at VARCHAR(32) NOT NULL, 
	PRIMARY KEY (id), 
	CHECK (topic IN ('anime','movies','music')), 
	CHECK (rating BETWEEN 0 AND 5), 
	CHECK (status IN ('pending','published','rejected','hidden')), 
	FOREIGN KEY(author_id) REFERENCES users (id)
)

;
CREATE INDEX ix_community_posts_status ON community_posts (status);
CREATE INDEX ix_community_posts_topic ON community_posts (topic);
CREATE INDEX ix_community_posts_author_id ON community_posts (author_id);
CREATE INDEX ix_community_posts_created_at ON community_posts (created_at);

CREATE TABLE giveaway_entries (
	ticket VARCHAR(32) NOT NULL, 
	campaign_id VARCHAR(16) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	joined_at VARCHAR(32) NOT NULL, 
	terms_version VARCHAR(40) NOT NULL, 
	PRIMARY KEY (ticket), 
	UNIQUE (campaign_id, user_id), 
	FOREIGN KEY(campaign_id) REFERENCES giveaway_campaigns (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;
CREATE INDEX ix_giveaway_entries_campaign_id ON giveaway_entries (campaign_id);

CREATE TABLE giveaway_prizes (
	id VARCHAR(40) NOT NULL, 
	campaign_id VARCHAR(16) NOT NULL, 
	`rank` INTEGER NOT NULL, 
	title VARCHAR(100) NOT NULL, 
	subtitle VARCHAR(200) NOT NULL, 
	kind VARCHAR(12) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (campaign_id, `rank`), 
	FOREIGN KEY(campaign_id) REFERENCES giveaway_campaigns (id)
)

;

CREATE TABLE community_comments (
	id VARCHAR(36) NOT NULL, 
	post_id VARCHAR(36) NOT NULL, 
	author_id VARCHAR(36) NOT NULL, 
	parent_id VARCHAR(36), 
	body TEXT NOT NULL, 
	hidden BOOL NOT NULL, 
	created_at VARCHAR(32) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(post_id) REFERENCES community_posts (id), 
	FOREIGN KEY(author_id) REFERENCES users (id), 
	FOREIGN KEY(parent_id) REFERENCES community_comments (id)
)

;
CREATE INDEX ix_community_comments_post_id ON community_comments (post_id);

CREATE TABLE community_reactions (
	post_id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	kind VARCHAR(8) NOT NULL, 
	PRIMARY KEY (post_id, user_id), 
	CHECK (kind IN ('like','heart')), 
	FOREIGN KEY(post_id) REFERENCES community_posts (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;

CREATE TABLE giveaway_winners (
	campaign_id VARCHAR(16) NOT NULL, 
	`rank` INTEGER NOT NULL, 
	prize_id VARCHAR(40) NOT NULL, 
	ticket VARCHAR(32) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	PRIMARY KEY (campaign_id, `rank`), 
	UNIQUE (campaign_id, user_id), 
	UNIQUE (campaign_id, ticket), 
	UNIQUE (prize_id), 
	FOREIGN KEY(campaign_id) REFERENCES giveaway_campaigns (id), 
	FOREIGN KEY(prize_id) REFERENCES giveaway_prizes (id), 
	FOREIGN KEY(ticket) REFERENCES giveaway_entries (ticket), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;

CREATE TABLE community_reports (
	id VARCHAR(36) NOT NULL, 
	post_id VARCHAR(36) NOT NULL, 
	comment_id VARCHAR(36), 
	user_id VARCHAR(36) NOT NULL, 
	reason VARCHAR(500) NOT NULL, 
	resolved BOOL NOT NULL, 
	created_at VARCHAR(32) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(post_id) REFERENCES community_posts (id), 
	FOREIGN KEY(comment_id) REFERENCES community_comments (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;
CREATE INDEX ix_community_reports_post_id ON community_reports (post_id);
