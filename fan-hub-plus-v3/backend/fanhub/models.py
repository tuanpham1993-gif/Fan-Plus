"""Relational extension schema. MySQL is the target; SQLite is a local demo option."""
from __future__ import annotations
from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Integer, JSON, String, Text, UniqueConstraint, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
import uuid
from datetime import datetime, timezone


def uid() -> str:
    return str(uuid.uuid4())


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='microseconds').replace('+00:00', 'Z')


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = 'users'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(12), default='member')
    suspended: Mapped[bool] = mapped_column(Boolean, default=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[str] = mapped_column(String(32), default=now)
    __table_args__ = (CheckConstraint("role IN ('member','admin')"),)


class AuthSession(Base):
    __tablename__ = 'auth_sessions'
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    expires_at: Mapped[str] = mapped_column(String(32))


class Post(Base):
    __tablename__ = 'community_posts'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    author_id: Mapped[str] = mapped_column(ForeignKey('users.id'), index=True)
    title: Mapped[str] = mapped_column(String(140))
    subject: Mapped[str] = mapped_column(String(100))
    body: Mapped[str] = mapped_column(Text)
    topic: Mapped[str] = mapped_column(String(12), index=True)
    spoiler: Mapped[bool] = mapped_column(Boolean, default=False)
    rating: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(12), default='pending', index=True)
    reason: Mapped[str] = mapped_column(String(500), default='')
    version: Mapped[int] = mapped_column(Integer, default=1)
    sample: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[str] = mapped_column(String(32), default=now, index=True)
    __table_args__ = (CheckConstraint("topic IN ('anime','movies','music')"), CheckConstraint('rating BETWEEN 0 AND 5'), CheckConstraint("status IN ('pending','published','rejected','hidden')"))


class Comment(Base):
    __tablename__ = 'community_comments'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    post_id: Mapped[str] = mapped_column(ForeignKey('community_posts.id'), index=True)
    author_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    parent_id: Mapped[str | None] = mapped_column(ForeignKey('community_comments.id'), nullable=True)
    body: Mapped[str] = mapped_column(Text)
    hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[str] = mapped_column(String(32), default=now)


class Reaction(Base):
    __tablename__ = 'community_reactions'
    post_id: Mapped[str] = mapped_column(ForeignKey('community_posts.id'), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'), primary_key=True)
    kind: Mapped[str] = mapped_column(String(8))
    __table_args__ = (CheckConstraint("kind IN ('like','heart')"),)


class Report(Base):
    __tablename__ = 'community_reports'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    post_id: Mapped[str] = mapped_column(ForeignKey('community_posts.id'), index=True)
    comment_id: Mapped[str | None] = mapped_column(ForeignKey('community_comments.id'), nullable=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    reason: Mapped[str] = mapped_column(String(500))
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[str] = mapped_column(String(32), default=now)


class Audit(Base):
    __tablename__ = 'audit_events'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    actor_id: Mapped[str | None] = mapped_column(ForeignKey('users.id'), nullable=True)
    target: Mapped[str] = mapped_column(String(80), index=True)
    event: Mapped[str] = mapped_column(String(80))
    detail: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[str] = mapped_column(String(32), default=now)


class Campaign(Base):
    __tablename__ = 'giveaway_campaigns'
    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    title: Mapped[str] = mapped_column(String(80))
    opens_at: Mapped[str] = mapped_column(String(32))
    closes_at: Mapped[str] = mapped_column(String(32))
    draw_at: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(12), default='open')
    demo: Mapped[bool] = mapped_column(Boolean, default=True)
    terms_version: Mapped[str] = mapped_column(String(40))
    private_seed: Mapped[str] = mapped_column(String(64))
    seed_commitment: Mapped[str] = mapped_column(String(64))
    snapshot: Mapped[list | None] = mapped_column(JSON, nullable=True)
    snapshot_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    seed_reveal: Mapped[str | None] = mapped_column(String(64), nullable=True)
    __table_args__ = (CheckConstraint("status IN ('open','locked','drawn')"),)


class Prize(Base):
    __tablename__ = 'giveaway_prizes'
    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    campaign_id: Mapped[str] = mapped_column(ForeignKey('giveaway_campaigns.id'))
    rank: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(100))
    subtitle: Mapped[str] = mapped_column(String(200))
    kind: Mapped[str] = mapped_column(String(12))
    __table_args__ = (UniqueConstraint('campaign_id', 'rank'),)


class Entry(Base):
    __tablename__ = 'giveaway_entries'
    ticket: Mapped[str] = mapped_column(String(32), primary_key=True)
    campaign_id: Mapped[str] = mapped_column(ForeignKey('giveaway_campaigns.id'), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    joined_at: Mapped[str] = mapped_column(String(32), default=now)
    terms_version: Mapped[str] = mapped_column(String(40))
    __table_args__ = (UniqueConstraint('campaign_id', 'user_id'),)


class Winner(Base):
    __tablename__ = 'giveaway_winners'
    campaign_id: Mapped[str] = mapped_column(ForeignKey('giveaway_campaigns.id'), primary_key=True)
    rank: Mapped[int] = mapped_column(Integer, primary_key=True)
    prize_id: Mapped[str] = mapped_column(ForeignKey('giveaway_prizes.id'))
    ticket: Mapped[str] = mapped_column(ForeignKey('giveaway_entries.ticket'))
    user_id: Mapped[str] = mapped_column(ForeignKey('users.id'))
    __table_args__ = (UniqueConstraint('campaign_id', 'user_id'), UniqueConstraint('campaign_id', 'ticket'), UniqueConstraint('prize_id'))


class Knowledge(Base):
    __tablename__ = 'knowledge_documents'
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    topic: Mapped[str] = mapped_column(String(100), index=True)
    aliases: Mapped[list] = mapped_column(JSON)
    body: Mapped[str] = mapped_column(Text)
    spoiler_level: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(12), default='draft')
    source_label: Mapped[str] = mapped_column(String(500))
    sample: Mapped[bool] = mapped_column(Boolean, default=False)
    related_path: Mapped[str | None] = mapped_column(String(250), nullable=True)
    __table_args__ = (CheckConstraint("status IN ('draft','published')"), CheckConstraint('spoiler_level >= 0'))


class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    owner_hash: Mapped[str] = mapped_column(String(64), index=True)
    role: Mapped[str] = mapped_column(String(12))
    text: Mapped[str] = mapped_column(Text)
    sources: Mapped[list] = mapped_column(JSON, default=list)
    mode: Mapped[str] = mapped_column(String(40), default='')
    created_at: Mapped[str] = mapped_column(String(32), default=now)


class RateBucket(Base):
    __tablename__ = 'rate_buckets'
    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    minute: Mapped[int] = mapped_column(Integer, primary_key=True)
    count: Mapped[int] = mapped_column(Integer, default=0)


def database(url: str):
    engine = create_engine(url, pool_pre_ping=True, **({'connect_args': {'check_same_thread': False, 'timeout': 15}} if url.startswith('sqlite') else {}))
    if url.startswith('sqlite'):
        @event.listens_for(engine, 'connect')
        def sqlite_foreign_keys(connection, _):
            connection.execute('PRAGMA foreign_keys=ON')
    return engine, sessionmaker(engine, expire_on_commit=False)
