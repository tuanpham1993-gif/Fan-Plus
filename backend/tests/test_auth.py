import pytest
from app import create_app
from extensions import db

TEST_CAPTCHA = "PASSED_TEST_TOKEN"

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.session.remove()
            db.drop_all()

def test_register_success(client):
    res = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'test@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    assert res.status_code == 201
    assert res.json['user']['email'] == 'test@gmail.com'

def test_register_duplicate_email(client):
    client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'duplicate@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    res = client.post('/api/auth/register', json={
        'name': 'Test User 2',
        'email': 'duplicate@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    assert res.status_code == 409
    assert res.json['message'] == 'Email đã tồn tại'

def test_login_success(client):
    client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'login@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    res = client.post('/api/auth/login', json={
        'email': 'login@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    assert res.status_code == 200
    assert 'access_token' in res.json
    assert 'refresh_token' in res.json

def test_logout_without_refresh_token(client):
    res = client.post('/api/auth/logout')
    assert res.status_code == 200
    assert res.json['message'] == 'Đăng xuất thành công'
