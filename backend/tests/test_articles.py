import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User
from app.server import app, get_db

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
    assert response.json()["read"]


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


def test_mark_article_as_unread(test_user):
    # Create and mark an article as read
    create_response = client.post(
        "/articles/",
        headers={"User-Id": test_user.id},
        json={
            "url": "http://example.com/article3",
            "read": True,
            "date_read": "2023-12-01T00:00:00Z",
        },
    )
    article_id = create_response.json()["id"]

    # Mark the article as unread
    response = client.patch(
        f"/articles/{article_id}",
        headers={"User-Id": test_user.id},
        json={
            "read": False,
            "date_read": None,
        },
    )
    assert response.status_code == 200
    assert not response.json()["read"]
    assert response.json()["date_read"] is None


def test_mark_article_as_read_when_already_read(test_user):
    # Create and mark an article as read
    create_response = client.post(
        "/articles/",
        headers={"User-Id": test_user.id},
        json={
            "url": "http://example.com/article4",
            "read": True,
            "date_read": "2023-12-01T00:00:00Z",
        },
    )
    article_id = create_response.json()["id"]

    # Mark the article as read again
    response = client.patch(
        f"/articles/{article_id}",
        headers={"User-Id": test_user.id},
        json={
            "read": True,
            "date_read": "2023-12-01T00:00:00Z",
        },
    )
    assert response.status_code == 200
    assert response.json()["read"]


def test_mark_article_as_unread_when_already_unread(test_user):
    # Create an article but don't mark it as read
    create_response = client.post(
        "/articles/",
        headers={"User-Id": test_user.id},
        json={
            "url": "http://example.com/article5",
            "read": False,
            "date_read": None,
        },
    )
    article_id = create_response.json()["id"]

    # Mark the article as unread again
    response = client.patch(
        f"/articles/{article_id}",
        headers={"User-Id": test_user.id},
        json={
            "read": False,
            "date_read": None,
        },
    )
    assert response.status_code == 200
    assert not response.json()["read"]
    assert response.json()["date_read"] is None


def test_mark_article_as_read_when_already_unread(test_user):
    # Create an article and mark it as unread
    create_response = client.post(
        "/articles/",
        headers={"User-Id": test_user.id},
        json={
            "url": "http://example.com/article6",
            "read": False,
            "date_read": None,
        },
    )
    article_id = create_response.json()["id"]

    # Mark the article as read
    response = client.patch(
        f"/articles/{article_id}",
        headers={"User-Id": test_user.id},
        json={
            "read": True,
            "date_read": "2023-12-01T00:00:00Z",
        },
    )
    assert response.status_code == 200
    assert response.json()["read"]
    assert response.json()["date_read"] == "2023-12-01T00:00:00"
