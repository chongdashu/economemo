import os
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.api import ArticleCreate, ArticleResponse, ArticleUpdate, UserCreate, UserResponse
from app.db import SessionLocal, database, engine
from app.models import Article, Base, User

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Get the environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "dev").lower()

if ENVIRONMENT == "local":
    CORS_ORIGINS = [
        "http://localhost:3000",
        "https://127.0.0.1:8000",
    ]
else:
    # For non-local environments, use the DOMAIN env var
    domain = os.getenv("DOMAIN")
    if domain:
        CORS_ORIGINS = [f"https://{domain}"]
    else:
        raise ValueError("DOMAIN environment variable is not set for non-local environment")

CHROME_EXTENSION_IDS = os.getenv("ALLOWED_EXTENSION_IDS", "").split(",")

CORS_ORIGINS.extend([f"chrome-extension://{chrome_extension_id}" for chrome_extension_id in CHROME_EXTENSION_IDS])

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    if user.email:
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
    db_user = User(email=user.email) if user.email else User(id=user.uuid)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/login/", response_model=UserResponse)
def login(user: UserCreate, db: Session = Depends(get_db)):
    if not user.email:
        raise HTTPException(status_code=400, detail="Email is required")
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.post("/articles/", response_model=ArticleResponse)
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


@app.patch("/articles/{article_id}", response_model=ArticleResponse)
def update_article(
    article_id: int,
    article: ArticleUpdate,
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    db_article = db.query(Article).filter(Article.id == article_id, Article.user_id == user_id).first()

    if db_article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    db_article.date_last_accessed = article.date_last_accessed or datetime.utcnow()
    db_article.date_read = article.date_read  # This will set to None if article.date_read is None

    db.commit()
    db.refresh(db_article)
    return db_article


@app.get("/articles/", response_model=list[ArticleResponse])
def read_articles(
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")
    articles = db.query(Article).filter(Article.user_id == user_id).all()
    return articles


@app.get("/articles/by-url", response_model=list[ArticleResponse])
def read_article_by_url(
    url: str = Query(...),
    user_id: str = Header(None, alias="User-Id"),
    db: Session = Depends(get_db),
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")
    articles = db.query(Article).filter(Article.url == url, Article.user_id == user_id).all()
    return articles


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()


app.router.lifespan_context = lifespan
