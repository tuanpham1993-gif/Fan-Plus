from sqlalchemy import String, Text, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, Identified, Timestamped
class Category(Identified, Timestamped, Base):
    __tablename__ = "categories"
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
class Fandom(Identified, Timestamped, Base):
    __tablename__ = "fandoms"
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
class FandomCategory(Base):
    __tablename__ = "fandom_categories"
    fandom_id: Mapped[str] = mapped_column(ForeignKey("fandoms.id", ondelete="CASCADE"), primary_key=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True)
class Genre(Identified, Base):
    __tablename__ = "genres"
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
class Tag(Identified, Base):
    __tablename__ = "tags"
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
