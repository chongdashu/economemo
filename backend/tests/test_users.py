import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import Mock

client = TestClient(app)


def test_create_user_with_email(mock_supabase):
    mock_supabase.auth.admin.invite_user_by_email.return_value = Mock(
        user=Mock(id="new-user-id")
    )
    mock_supabase.table().insert().execute.return_value = Mock(
        data=[{"id": "new-user-id", "email": "newuser@example.com"}]
    )

    response = client.post("/users/", json={"email": "newuser@example.com"})
    assert response.status_code == 200
    assert response.json()["email"] == "newuser@example.com"


def test_create_user_with_existing_email(mock_supabase):
    mock_supabase.auth.admin.invite_user_by_email.side_effect = Exception(
        "User already exists"
    )

    response = client.post("/users/", json={"email": "existinguser@example.com"})
    assert response.status_code == 500
    assert "User already exists" in response.json()["detail"]


def test_login_nonexistent_user(mock_supabase):
    mock_supabase.table().select().eq().execute.return_value = Mock(data=[])

    response = client.post("/login/", json={"email": "nonexistentuser@example.com"})
    assert response.status_code == 404
    assert "User not found" in response.json()["detail"]


def test_login_existing_user(mock_supabase):
    mock_supabase.table().select().eq().execute.return_value = Mock(
        data=[{"id": "existing-user-id", "email": "testloginuser@example.com"}]
    )

    response = client.post("/login/", json={"email": "testloginuser@example.com"})
    assert response.status_code == 200
    assert response.json()["email"] == "testloginuser@example.com"
