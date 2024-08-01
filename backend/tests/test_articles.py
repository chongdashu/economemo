import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import Mock

client = TestClient(app)


@pytest.fixture(scope="function")
def test_user():
    return {"id": "test-uuid", "email": "test@example.com"}


def test_create_article(mock_supabase, test_user):
    mock_supabase.table().select().eq().eq().execute.return_value = Mock(data=[])
    mock_supabase.table().insert().execute.return_value = Mock(
        data=[
            {
                "id": 1,
                "url": "http://example.com/article1",
                "read": True,
                "date_read": "2023-12-01T00:00:00Z",
                "user_id": test_user["id"],
            }
        ]
    )

    response = client.post(
        "/articles/",
        headers={"User-Id": test_user["id"]},
        json={
            "url": "http://example.com/article1",
            "read": True,
            "date_read": "2023-12-01T00:00:00Z",
        },
    )
    assert response.status_code == 200
    assert response.json()["url"] == "http://example.com/article1"
    assert response.json()["read"]


def test_read_articles(mock_supabase, test_user):
    mock_supabase.table().select().eq().execute.return_value = Mock(
        data=[
            {
                "id": 1,
                "url": "http://example.com/article1",
                "read": True,
                "date_read": "2023-12-01T00:00:00Z",
                "user_id": test_user["id"],
            }
        ]
    )

    response = client.get("/articles/", headers={"User-Id": test_user["id"]})
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) == 1


def test_read_article_by_url(mock_supabase, test_user):
    mock_supabase.table().select().eq().eq().execute.return_value = Mock(
        data=[
            {
                "id": 2,
                "url": "http://example.com/article2",
                "read": True,
                "date_read": "2023-12-01T00:00:00Z",
                "user_id": test_user["id"],
            }
        ]
    )

    response = client.get(
        "/articles/by-url?url=http://example.com/article2",
        headers={"User-Id": test_user["id"]},
    )
    assert response.status_code == 200
    articles = response.json()
    assert isinstance(articles, list)
    assert len(articles) > 0
    assert articles[0]["url"] == "http://example.com/article2"


def test_mark_article_as_unread(mock_supabase, test_user):
    mock_supabase.table().update().eq().eq().execute.return_value = Mock(
        data=[
            {
                "id": 3,
                "url": "http://example.com/article3",
                "read": False,
                "date_read": None,
                "user_id": test_user["id"],
            }
        ]
    )

    response = client.patch(
        "/articles/3",
        headers={"User-Id": test_user["id"]},
        json={
            "read": False,
            "date_read": None,
        },
    )
    assert response.status_code == 200
    assert not response.json()["read"]
    assert response.json()["date_read"] is None


def test_mark_article_as_read_when_already_read(mock_supabase, test_user):
    mock_supabase.table().update().eq().eq().execute.return_value = Mock(
        data=[
            {
                "id": 4,
                "url": "http://example.com/article4",
                "read": True,
                "date_read": "2023-12-01T00:00:00Z",
                "user_id": test_user["id"],
            }
        ]
    )

    response = client.patch(
        "/articles/4",
        headers={"User-Id": test_user["id"]},
        json={
            "read": True,
            "date_read": "2023-12-01T00:00:00Z",
        },
    )
    assert response.status_code == 200
    assert response.json()["read"]
    assert response.json()["date_read"] == "2023-12-01T00:00:00Z"


def test_mark_article_as_unread_when_already_unread(mock_supabase, test_user):
    mock_supabase.table().update().eq().eq().execute.return_value = Mock(
        data=[
            {
                "id": 5,
                "url": "http://example.com/article5",
                "read": False,
                "date_read": None,
                "user_id": test_user["id"],
            }
        ]
    )

    response = client.patch(
        "/articles/5",
        headers={"User-Id": test_user["id"]},
        json={
            "read": False,
            "date_read": None,
        },
    )
    assert response.status_code == 200
    assert not response.json()["read"]
    assert response.json()["date_read"] is None


def test_mark_article_as_read_when_already_unread(mock_supabase, test_user):
    mock_supabase.table().update().eq().eq().execute.return_value = Mock(
        data=[
            {
                "id": 6,
                "url": "http://example.com/article6",
                "read": True,
                "date_read": "2023-12-01T00:00:00Z",
                "user_id": test_user["id"],
            }
        ]
    )

    response = client.patch(
        "/articles/6",
        headers={"User-Id": test_user["id"]},
        json={
            "read": True,
            "date_read": "2023-12-01T00:00:00Z",
        },
    )
    assert response.status_code == 200
    assert response.json()["read"]
    assert response.json()["date_read"] == "2023-12-01T00:00:00Z"


def test_article_not_found(mock_supabase, test_user):
    mock_supabase.table().update().eq().eq().execute.return_value = Mock(data=[])

    response = client.patch(
        "/articles/999",
        headers={"User-Id": test_user["id"]},
        json={
            "read": True,
            "date_read": "2023-12-01T00:00:00Z",
        },
    )
    assert response.status_code == 404
    assert "Article not found" in response.json()["detail"]
