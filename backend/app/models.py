from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from .db import Base


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    read = Column(Boolean, default=False)
    date_read = Column(DateTime, default=datetime.utcnow)
