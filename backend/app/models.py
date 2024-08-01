import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str | None = None


class Article(BaseModel):
    id: int | None = None
    url: str
    read: bool
    date_read: datetime | None = None
    user_id: str
