from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ArticleCreate(BaseModel):
    url: str
    read: bool = False
    date_read: datetime | None = None


class ArticleUpdate(BaseModel):
    read: bool
    date_read: datetime | None = None


class ArticleResponse(BaseModel):
    id: int
    url: str
    read: bool
    date_read: datetime | None

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    email: str | None = None
    uuid: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str | None = None
    articles: list[ArticleResponse] = []

    model_config = ConfigDict(from_attributes=True)
