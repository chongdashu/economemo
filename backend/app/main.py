from datetime import datetime
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .db import SessionLocal, database, engine
from .models import Article, Base, User


# Recreate the database tables
def recreate_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


app = FastAPI()

# Allow CORS for the Economist website
origins = ["https://www.economist.com"]

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
    username: str
    email: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    articles: List[ArticleResponse] = []

    class Config:
        orm_mode = True


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.on_event("startup")
async def startup():
    recreate_database()
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/articles/", response_model=ArticleResponse)
def create_article(article: ArticleCreate, db: Session = Depends(get_db)):
    db_article = Article(**article.dict())
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article


@app.post("/users/{user_id}/articles/{article_id}/", response_model=UserResponse)
def associate_user_article(user_id: int, article_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    db_article = db.query(Article).filter(Article.id == article_id).first()
    if db_user is None or db_article is None:
        raise HTTPException(status_code=404, detail="User or Article not found")
    db_user.articles.append(db_article)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/users/", response_model=List[UserResponse])
def read_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@app.get("/articles/", response_model=List[ArticleResponse])
def read_articles(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    articles = db.query(Article).offset(skip).limit(limit).all()
    return articles


@app.get("/articles/by-url", response_model=List[ArticleResponse])
def read_article_by_url(url: str, db: Session = Depends(get_db)):
    articles = db.query(Article).filter(Article.url == url).all()
    if not articles:
        raise HTTPException(status_code=404, detail="Article not found")
    return articles
