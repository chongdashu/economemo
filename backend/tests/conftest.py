from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="function")
def mock_supabase():
    with patch("app.main.supabase") as mock_supabase:
        yield mock_supabase


@pytest.fixture(scope="function")
def client(mock_supabase):
    with TestClient(app) as c:
        yield c
