from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ArticleCreate(BaseModel):
    url: str
    date_first_accessed: datetime | None = None
    date_last_accessed: datetime | None = None
    date_read: datetime | None = None


class ArticleUpdateLastAccessed(BaseModel):
    url: str
    create_if_not_exist: bool = False


class ArticleUpdateDateRead(BaseModel):
    date_read: datetime | None = None
    create_if_not_exists: bool = False


class ArticleResponse(BaseModel):
    id: int
    url: str
    date_first_accessed: datetime
    date_last_accessed: datetime
    date_read: datetime | None

    model_config = ConfigDict(from_attributes=True)
