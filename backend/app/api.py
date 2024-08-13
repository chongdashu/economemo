from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ArticleCreate(BaseModel):
    url: str
    date_first_accessed: datetime | None = None
    date_last_accessed: datetime | None = None
    date_read: datetime | None = None


class ArticleUpdate(BaseModel):
    date_last_accessed: datetime | None = None
    date_read: datetime | None = None


class ArticleResponse(BaseModel):
    id: int
    url: str
    date_first_accessed: datetime
    date_last_accessed: datetime
    date_read: datetime | None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: str | None = None
    uuid: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str | None = None
    articles: list[ArticleResponse] = []

    model_config = ConfigDict(from_attributes=True)
