import pytest

from app import app


@pytest.fixture
def client():
    """Create a test client without starting the live server."""
    app.config["TESTING"] = True

    with app.test_client() as test_client:
        yield test_client


def test_homepage_loads(client):
    """Check that the homepage responds successfully."""
    response = client.get("/")

    assert response.status_code in (200, 302)


def test_chat_rejects_invalid_json(client):
    """Check that invalid JSON does not produce a successful chat response."""
    response = client.post(
        "/api/chat",
        data="this is not valid JSON",
        content_type="application/json",
    )

    assert response.status_code >= 400
