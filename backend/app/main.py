from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from .db import engine, SessionLocal, database
from .models import Base, Article
from pydantic import BaseModel
from typing import List
from datetime import datetime

Base.metadata.create_all(bind=engine)

app = FastAPI()

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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.post("/articles/", response_model=ArticleResponse)
def create_article(article: ArticleCreate, db: Session = Depends(get_db)):
    db_article = Article(**article.dict())
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

@app.get("/articles/", response_model=List[ArticleResponse])
def read_articles(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    articles = db.query(Article).offset(skip).limit(limit).all()
    return articles
