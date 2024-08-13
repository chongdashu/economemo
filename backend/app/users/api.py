from pydantic import BaseModel, ConfigDict

from app.articles.api import ArticleResponse


class UserCreate(BaseModel):
    email: str | None = None
    uuid: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str | None = None
    articles: list[ArticleResponse] = []

    model_config = ConfigDict(from_attributes=True)
