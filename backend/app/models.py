import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=True)

    # Relationships
    articles: Mapped[list["Article"]] = relationship("Article", back_populates="user")
    streak: Mapped["Streak"] = relationship("Streak", uselist=False, back_populates="user")


class Article(Base):
    __tablename__ = "articles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    url: Mapped[str] = mapped_column(String, index=True)
    date_first_accessed: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    date_last_accessed: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    date_read: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="articles")

    # Constraints
    __table_args__ = (UniqueConstraint("url", "user_id", name="_url_user_uc"),)


class Streak(Base):
    __tablename__ = "streaks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_read_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    streak_days: Mapped[str] = mapped_column(String, default="0000000")  # Represents last 7 days

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="streak")
