from sqlalchemy import Column, Integer, String, Boolean, DateTime
from .db import Base
from datetime import datetime

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    read = Column(Boolean, default=False)
    date_read = Column(DateTime, default=datetime.utcnow)