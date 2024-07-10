from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship

from .db import Base

# Association table for many-to-many relationship between users and articles
user_articles = Table(
    "user_articles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("article_id", Integer, ForeignKey("articles.id"), primary_key=True),
    Column("date_read", DateTime, default=datetime.utcnow),  # Track when the article was read
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    articles = relationship("Article", secondary=user_articles, back_populates="users")


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    read = Column(Boolean, default=False)
    date_read = Column(DateTime, default=datetime.utcnow)
    users = relationship("User", secondary=user_articles, back_populates="articles")
