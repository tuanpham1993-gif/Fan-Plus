from sqlalchemy import String, Text, Integer, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, Identified, Timestamped
class FAQ(Identified, Timestamped, Base):
    __tablename__ = "faqs"
    question: Mapped[str] = mapped_column(String(300))
    answer: Mapped[str] = mapped_column(Text)
    published: Mapped[bool] = mapped_column(Boolean, default=False)
class ChatThread(Identified, Timestamped, Base):
    __tablename__ = "chat_threads"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(120), default="New conversation")
class ChatMessage(Identified, Timestamped, Base):
    __tablename__ = "chat_messages"
    __table_args__ = (UniqueConstraint("thread_id", "client_message_id"),)
    thread_id: Mapped[str] = mapped_column(ForeignKey("chat_threads.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(12))
    body: Mapped[str] = mapped_column(Text)
    client_message_id: Mapped[str | None] = mapped_column(String(36))
    model_label: Mapped[str | None] = mapped_column(String(100))
class MessageSource(Base):
    __tablename__ = "message_sources"
    message_id: Mapped[str] = mapped_column(ForeignKey("chat_messages.id", ondelete="CASCADE"), primary_key=True)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True)
    resource_version: Mapped[int] = mapped_column(Integer)
