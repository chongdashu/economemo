from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ArticleCreate(BaseModel):
    url: str
    read: bool = False
    date_read: datetime | None = None


class ArticleUpdate(BaseModel):
    read: bool | None = None
    date_read: datetime | None = None


class ArticleResponse(BaseModel):
    id: int
    url: str
    read: bool
    date_read: datetime | None

    model_config = ConfigDict(from_attributes=True)


# Helper function for datetime serialization
def serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


class UserCreate(BaseModel):
    email: str | None = None
    uuid: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str | None = None
