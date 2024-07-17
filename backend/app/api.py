from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ArticleCreate(BaseModel):
    url: str
    read: bool = False
    date_read: Optional[datetime] = None


class ArticleUpdate(BaseModel):
    read: bool
    date_read: Optional[datetime] = None


class ArticleResponse(BaseModel):
    id: int
    url: str
    read: bool
    date_read: Optional[datetime]

    class Config:
        orm_mode = True


class UserCreate(BaseModel):
    email: Optional[str] = None
    uuid: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    articles: List[ArticleResponse] = []

    class Config:
        orm_mode = True
