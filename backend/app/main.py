from datetime import datetime
from typing import List

from fastapi import Cookie, Depends, FastAPI, HTTPException
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
origins = [
    "https://www.economist.com",
    "chrome-extension://kecpficpeakaepppkojkcgffmlcpgmlj",
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
    email: str


class UserResponse(BaseModel):
    id: str
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
    db_user = User(email=user.email)
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
def create_article(article: ArticleCreate, user_id: str = Cookie(None), db: Session = Depends(get_db)):
    db_article = Article(**article.dict(), user_id=user_id)
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article


@app.get("/articles/", response_model=List[ArticleResponse])
def read_articles(user_id: str = Cookie(None), db: Session = Depends(get_db)):
    articles = db.query(Article).filter(Article.user_id == user_id).all()
    return articles
