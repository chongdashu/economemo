import pytest
from fastapi.testclient import TestClient
from app.main import app, get_db
from app.db import SessionLocal, engine
from app.models import Base, User, Article
from sqlalchemy.orm import Session

Base.metadata.create_all(bind=engine)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def db_session():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture(scope="module")
def test_user(db_session: Session):
    user = User(email="testuser@example.com")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_create_article(client: TestClient, test_user: User):
    response = client.post(
        "/articles/",
        json={
            "url": "http://example.com",
            "read": True,
            "date_read": "2023-12-01T00:00:00Z",
        },
        cookies={"user_id": test_user.id},
    )
    assert response.status_code == 200
    assert response.json()["url"] == "http://example.com"
    assert response.json()["read"] is True


def test_read_articles(client: TestClient, test_user: User):
    response = client.get("/articles/", cookies={"user_id": test_user.id})
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert response.json()[0]["url"] == "http://example.com"
    assert response.json()[0]["read"] is True
