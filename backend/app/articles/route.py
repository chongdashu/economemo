from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import Config
from app.db import get_db
from app.models import Article

from .api import ArticleMarkRead, ArticleResponse, ArticleUpdateLastAccessed

router = APIRouter()


@router.patch("/articles/{article_id}/read", response_model=ArticleResponse)
def update_article_date_read(
    article_id: int,
    article_update: ArticleMarkRead,
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    db_article = db.query(Article).filter(Article.id == article_id, Article.user_id == user_id).first()

    if db_article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    now = datetime.now(UTC)

    db_article.date_read = now if article_update.read else None
    db_article.date_last_accessed = now

    db.commit()
    db.refresh(db_article)
    return db_article


@router.get("/articles/all", response_model=list[ArticleResponse])
def get_user_articles(
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")
    articles = db.query(Article).filter(Article.user_id == user_id).all()
    return articles


@router.get("/articles/", response_model=list[ArticleResponse])
def get_user_article_by_url(
    url: str = Query(...),
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")
    articles = db.query(Article).filter(Article.url == url, Article.user_id == user_id).all()
    return articles


@router.post("/articles/access", response_model=ArticleResponse)
def post_article_access(
    payload: ArticleUpdateLastAccessed,
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    if not Config.SupportedSites.is_supported(payload.url):
        raise HTTPException(status_code=400, detail="Unsupported website")

    db_article = db.query(Article).filter(Article.url == payload.url, Article.user_id == user_id).first()
    now = datetime.now(UTC)

    if not db_article:
        if payload.create_if_not_exist:
            db_article = Article(
                user_id=user_id,
                url=payload.url,
                date_first_accessed=now,
                date_last_accessed=now,
            )
            db.add(db_article)
        else:
            raise HTTPException(status_code=404, detail="Article not found")
    else:
        db_article.date_last_accessed = now

    db.commit()
    db.refresh(db_article)

    return db_article
