"""Real Flask-client tests. Explicitly skipped when Flask runtime packages are unavailable."""
import pytest
pytest.importorskip("flask",reason="Flask could not be installed in the authoring environment; run after pip install -r requirements-dev.txt")
pytest.importorskip("flask_wtf")
pytest.importorskip("flask_limiter")
from app import create_app
from app.models import Base
from app.services.seed import seed_demo_data

@pytest.fixture
def client(tmp_path):
    app=create_app({"TESTING":True,"SECRET_KEY":"test-only-secret-not-for-deployment","DATABASE_URL":"sqlite://","RATELIMIT_ENABLED":False,"MAILBOX_PATH":str(tmp_path/"mail")})
    Base.metadata.create_all(app.extensions["db_engine"])
    with app.extensions["db_sessions"]() as db:
        seed_demo_data(db,"TestPassword!26");db.commit()
    return app.test_client()

def csrf(client):return client.get("/api/v1/auth/csrf").json["data"]["csrf_token"]

def login(client,email="fan@fanhub.demo"):
    return client.post("/api/v1/auth/login",json={"email":email,"password":"TestPassword!26"},headers={"X-CSRFToken":csrf(client)})

def test_csrf_enforced_on_login(client):
    response=client.post("/api/v1/auth/login",json={"email":"fan@fanhub.demo","password":"TestPassword!26"})
    assert response.status_code==400 and response.json["error"]["code"]=="CSRF_INVALID"

def test_cookie_login_and_admin_rejection(client):
    response=login(client)
    assert response.status_code==200
    assert "HttpOnly" in response.headers["Set-Cookie"] and "SameSite=Lax" in response.headers["Set-Cookie"]
    assert client.get("/api/v1/auth/me").status_code==200
    assert client.get("/api/v1/admin/overview").status_code==403

def test_csrf_rotation_and_bookmark(client):
    old=csrf(client);assert login(client).status_code==200
    assert client.put("/api/v1/me/bookmarks/c01",json={"note":"my note"},headers={"X-CSRFToken":old}).status_code==400
    assert client.put("/api/v1/me/bookmarks/c01",json={"note":"my note"},headers={"X-CSRFToken":csrf(client)}).status_code==200
    assert client.get("/api/v1/me/bookmarks").json["meta"]["total"]==1

def test_anonymous_private_route_and_unknown_api(client):
    assert client.get("/api/v1/me/profile").status_code==401
    response=client.get("/api/v1/does-not-exist")
    assert response.status_code==404 and response.is_json

def test_public_filter_limits(client):
    assert client.get("/api/v1/resources?page_size=100000").status_code==422
    assert client.get("/api/v1/resources?page=1&page=2").status_code==422
    response=client.get("/api/v1/resources")
    assert response.status_code==200 and len(response.json["data"])<=12
    assert response.headers["X-Content-Type-Options"]=="nosniff"

def test_admin_routes(client):
    assert login(client,"admin@fanhub.demo").status_code==200
    assert client.get("/api/v1/admin/overview").status_code==200
