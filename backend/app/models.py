import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from .db import Base


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    articles = relationship("Article", back_populates="user")


class Article(Base):
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, index=True)
    read = Column(Boolean, default=False)
    date_read = Column(DateTime)
    user_id = Column(String, ForeignKey("users.id"))
    user = relationship("User", back_populates="articles")

    __table_args__ = (UniqueConstraint("url", "user_id", name="_url_user_uc"),)
