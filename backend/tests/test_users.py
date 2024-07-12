def test_create_user(client):
    response = client.post(
        "/users/", json={"username": "testuser", "email": "testuser@example.com"}
    )
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"
    assert response.json()["email"] == "testuser@example.com"


def test_read_users(client):
    response = client.get("/users/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
