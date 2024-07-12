def test_create_article(client):
    response = client.post(
        "/articles/",
        json={
            "url": "http://example.com",
            "read": True,
            "date_read": "2023-12-01T00:00:00Z",
        },
    )
    assert response.status_code == 200
    assert response.json()["url"] == "http://example.com"
    assert response.json()["read"] == True


def test_associate_user_article(client):
    user_response = client.post(
        "/users/", json={"username": "testuser2", "email": "testuser2@example.com"}
    )
    article_response = client.post(
        "/articles/",
        json={
            "url": "http://example2.com",
            "read": True,
            "date_read": "2023-12-01T00:00:00Z",
        },
    )

    user_id = user_response.json()["id"]
    article_id = article_response.json()["id"]

    response = client.post(f"/users/{user_id}/articles/{article_id}/")
    assert response.status_code == 200
    assert any(article["id"] == article_id for article in response.json()["articles"])


def test_read_articles(client):
    response = client.get("/articles/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_read_article_by_url(client):
    response = client.post(
        "/articles/",
        json={
            "url": "http://example3.com",
            "read": False,
            "date_read": "2023-12-01T00:00:00Z",
        },
    )
    assert response.status_code == 200

    response = client.get("/articles/by-url?url=http://example3.com")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert response.json()[0]["url"] == "http://example3.com"
