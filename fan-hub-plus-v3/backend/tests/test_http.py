"""Executed only when Flask and its runtime dependencies are installed."""
import pytest
pytest.importorskip('flask', reason='Flask runtime unavailable in this build environment; HTTP integration not certified.')
from fanhub import create_app
from fanhub.models import Base
from manage import seed_demo

@pytest.fixture
def client(tmp_path):
    app = create_app({'TESTING': True, 'SECRET_KEY': 'test-secret-' * 8, 'DATABASE_URL': 'sqlite:///' + str(tmp_path / 'http.db')})
    Base.metadata.create_all(app.extensions['db_engine'])
    with app.extensions['db_factory'].begin() as db:
        seed_demo(db)
    return app.test_client()


def token(client):
    return client.get('/api/v1/auth/csrf').json['data']['token']


def test_csrf_required(client):
    assert client.post('/api/v1/auth/login', json={'email': 'fan@fanhub.demo', 'password': 'FanHubDemo!26'}).status_code == 403


def test_cookie_identity_and_logout(client):
    r = client.post('/api/v1/auth/login', json={'email': 'fan@fanhub.demo', 'password': 'FanHubDemo!26'}, headers={'X-CSRFToken': token(client)})
    assert r.status_code == 200 and r.json['data']['user']['role'] == 'member'
    assert 'HttpOnly' in r.headers.get('Set-Cookie', '')
    assert client.get('/api/v1/auth/me').json['data']['user']['id'] == 'u-member'
    assert client.post('/api/v1/auth/logout', json={}, headers={'X-CSRFToken': token(client)}).status_code == 200
    assert client.get('/api/v1/auth/me').json['data']['user'] is None


def test_api_shape_and_source(client):
    assert len(client.get('/api/v1/community').json['data']['posts']) == 3
    assert client.get('/api/v1/lore/sources/gojo-limitless').json['data']['sample'] is True
    assert client.get('/runtime.js').status_code == 200


def test_anonymous_cannot_mutate(client):
    r = client.put('/api/v1/community/posts/post-city/reaction', json={'kind': 'heart'}, headers={'X-CSRFToken': token(client)})
    assert r.status_code == 401
