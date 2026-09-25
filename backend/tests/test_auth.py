import pytest
from app import create_app
from extensions import db
from models.user import User

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
    assert 'password' not in res.json['user']

def test_register_invalid_captcha(client):
    res = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'invalidcaptcha@gmail.com',
        'password': 'Password123@',
        'captcha_token': 'INVALID_TEST_TOKEN'
    })
    assert res.status_code == 400
    assert res.json['message'] == 'CAPTCHA không hợp lệ hoặc đã hết hạn'

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

def test_register_invalid_password(client):
    res = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'weak@gmail.com',
        'password': '123',
        'captcha_token': TEST_CAPTCHA
    })
    assert res.status_code == 400

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

def test_login_invalid_captcha(client):
    client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'logincaptcha@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    res = client.post('/api/auth/login', json={
        'email': 'logincaptcha@gmail.com',
        'password': 'Password123@',
        'captcha_token': 'INVALID_TEST_TOKEN'
    })
    assert res.status_code == 400
    assert res.json['message'] == 'CAPTCHA không hợp lệ hoặc đã hết hạn'

def test_login_wrong_password(client):
    client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'login2@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    res = client.post('/api/auth/login', json={
        'email': 'login2@gmail.com',
        'password': 'WrongPassword123@',
        'captcha_token': TEST_CAPTCHA
    })
    assert res.status_code == 401

def test_refresh_token_success(client):
    client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'refresh@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'refresh@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    refresh_token = login_res.json['refresh_token']
    
    res = client.post('/api/auth/refresh', json={'refresh_token': refresh_token})
    assert res.status_code == 200
    assert 'access_token' in res.json

def test_logout_revoke_refresh_token(client):
    client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'logout@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'logout@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    refresh_token = login_res.json['refresh_token']

    logout_res = client.post('/api/auth/logout', json={'refresh_token': refresh_token})
    assert logout_res.status_code == 200

    refresh_res = client.post('/api/auth/refresh', json={'refresh_token': refresh_token})
    assert refresh_res.status_code == 401
