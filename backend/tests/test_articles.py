import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app, get_db
from app.models import User, Article

client = TestClient(app)


@pytest.fixture(scope="function")
def test_user():
    db: Session = next(get_db())
    user = User(id="test-uuid")
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


def test_create_article(test_user):
    response = client.post(
        "/articles/",
        headers={"User-Id": test_user.id},
        json={
            "url": "http://example.com/article1",
            "read": True,
            "date_read": "2023-12-01T00:00:00Z",
        },
    )
    assert response.status_code == 200
    assert response.json()["url"] == "http://example.com/article1"
    assert response.json()["read"] == True


def test_read_articles(test_user):
    # Create an article first
    client.post(
        "/articles/",
        headers={"User-Id": test_user.id},
        json={
            "url": "http://example.com/article1",
            "read": True,
            "date_read": "2023-12-01T00:00:00Z",
        },
    )

    response = client.get("/articles/", headers={"User-Id": test_user.id})
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_read_article_by_url(test_user):
    # First, create an article
    create_response = client.post(
        "/articles/",
        headers={"User-Id": test_user.id},
        json={
            "url": "http://example.com/article2",
            "read": True,
            "date_read": "2023-12-01T00:00:00Z",
        },
    )
    article_url = create_response.json()["url"]

    # Now, test the read_article_by_url endpoint
    response = client.get(
        f"/articles/by-url?url={article_url}", headers={"User-Id": test_user.id}
    )
    assert response.status_code == 200
    articles = response.json()
    assert isinstance(articles, list)
    assert len(articles) > 0
    assert articles[0]["url"] == article_url
