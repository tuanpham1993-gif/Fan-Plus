from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import MetaData, String, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

NAMING = {"ix": "ix_%(table_name)s_%(column_0_name)s", "uq": "uq_%(table_name)s_%(column_0_name)s", "ck": "ck_%(table_name)s_%(constraint_name)s", "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s", "pk": "pk_%(table_name)s"}
def utcnow() -> datetime:
    # Persist UTC without a zone because MySQL DATETIME does not retain tzinfo.
    return datetime.now(timezone.utc).replace(tzinfo=None)
def uid() -> str:
    return str(uuid4())
def iso(value):
    return value.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z") if value else None
class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING)
class Identified:
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
class Timestamped:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
