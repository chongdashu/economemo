from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .db import SessionLocal, engine, database
from .models import Base, User, Article
from pydantic import BaseModel
from datetime import datetime
from typing import List
import uuid

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow CORS for the Chrome extension and the Economist website
origins = [
    "chrome-extension://kecpficpeakaepppkojkcgffmlcpgmlj",
    "https://www.economist.com",
    "https://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ArticleCreate(BaseModel):
    url: str
    read: bool = False
    date_read: datetime = datetime.utcnow()


class ArticleResponse(BaseModel):
    id: int
    url: str
    read: bool
    date_read: datetime

    class Config:
        orm_mode = True


class UserCreate(BaseModel):
    email: str | None = None
    uuid: str = None


class UserResponse(BaseModel):
    id: str
    email: str | None = None
    articles: List[ArticleResponse] = []

    class Config:
        orm_mode = True


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(email=user.email) if user.email else User(id=user.uuid)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/login/", response_model=UserResponse)
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="User not found")
    return db_user


@app.post("/articles/", response_model=ArticleResponse)
def create_article(
    article: ArticleCreate,
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    print(f"create_article: user_id={user_id}")
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")
    db_article = Article(**article.dict(), user_id=user_id)
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article


@app.get("/articles/", response_model=List[ArticleResponse])
def read_articles(
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    print(f"read_articles: user_id={user_id}")
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")
    articles = db.query(Article).filter(Article.user_id == user_id).all()
    return articles


@app.get("/articles/by-url", response_model=List[ArticleResponse])
def read_article_by_url(
    url: str = Query(...),
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    print(url, user_id)
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")
    articles = db.query(Article).filter(Article.url == url, Article.user_id == user_id).all()
    return articles


@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
