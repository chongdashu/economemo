from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ArticleUpdateLastAccessed(BaseModel):
    url: str
    create_if_not_exist: bool = False


class ArticleMarkRead(BaseModel):
    read: bool


class ArticleResponse(BaseModel):
    id: int
    url: str
    date_first_accessed: datetime
    date_last_accessed: datetime
    date_read: datetime | None

    model_config = ConfigDict(from_attributes=True)
