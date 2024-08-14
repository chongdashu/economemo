from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Article

from .api import ArticleCreate, ArticleResponse, ArticleUpdateDateRead, ArticleUpdateLastAccessed

router = APIRouter()


@router.post("/articles/", response_model=ArticleResponse)
def create_article(
    article: ArticleCreate,
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    db_article = db.query(Article).filter(Article.url == article.url, Article.user_id == user_id).first()

    if db_article:
        db_article.date_last_accessed = article.date_last_accessed or datetime.utcnow()
        if article.date_read:
            db_article.date_read = article.date_read
    else:
        db_article = Article(
            url=article.url,
            date_first_accessed=article.date_first_accessed or datetime.utcnow(),
            date_last_accessed=article.date_last_accessed or datetime.utcnow(),
            date_read=article.date_read,
            user_id=user_id,
        )
        db.add(db_article)

    db.commit()
    db.refresh(db_article)
    return db_article


@router.patch("/articles/{article_id}/access", response_model=ArticleResponse)
def update_article_last_accessed(
    article_id: int,
    article_update: ArticleUpdateLastAccessed,
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    db_article = db.query(Article).filter(Article.id == article_id, Article.user_id == user_id).first()

    if db_article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    db_article.date_last_accessed = article_update.date_last_accessed

    db.commit()
    db.refresh(db_article)
    return db_article


@router.patch("/articles/{article_id}/read", response_model=ArticleResponse)
def update_article_date_read(
    article_id: int,
    article_update: ArticleUpdateDateRead,
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    db_article = db.query(Article).filter(Article.id == article_id, Article.user_id == user_id).first()

    if db_article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    db_article.date_read = article_update.date_read
    if article_update.date_read is not None:
        db_article.date_last_accessed = article_update.date_read
    else:
        # If marking as unread, update date_last_accessed to current time
        db_article.date_last_accessed = datetime.utcnow()

    db.commit()
    db.refresh(db_article)
    return db_article


@router.get("/articles/", response_model=list[ArticleResponse])
def read_articles(
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")
    articles = db.query(Article).filter(Article.user_id == user_id).all()
    return articles


@router.get("/articles/by-url", response_model=list[ArticleResponse])
def read_article_by_url(
    url: str = Query(...),
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")
    articles = db.query(Article).filter(Article.url == url, Article.user_id == user_id).all()
    return articles
