import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=True)
    articles: Mapped[list["Article"]] = relationship("Article", back_populates="user")


class Article(Base):
    __tablename__ = "articles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    url: Mapped[str] = mapped_column(String, index=True)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    date_read = mapped_column(DateTime)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    user: Mapped["User"] = relationship("User", back_populates="articles")

    __table_args__ = (UniqueConstraint("url", "user_id", name="_url_user_uc"),)
