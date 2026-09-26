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

def test_get_profile_authenticated(client):
    client.post('/api/auth/register', json={
        'name': 'Profile User',
        'email': 'profile@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'profile@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    token = login_res.json['access_token']

    res = client.get('/api/users/me', headers={'Authorization': f'Bearer {token}'})
    assert res.status_code == 200
    assert res.json['user']['email'] == 'profile@gmail.com'

def test_get_profile_unauthenticated(client):
    res = client.get('/api/users/me')
    assert res.status_code == 401

def test_update_profile(client):
    client.post('/api/auth/register', json={
        'name': 'Old Name',
        'email': 'update@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'update@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    token = login_res.json['access_token']

    res = client.put('/api/users/me', json={
        'name': 'New Name',
        'avatar': 'https://example.com/avatar.jpg'
    }, headers={'Authorization': f'Bearer {token}'})

    assert res.status_code == 200
    assert res.json['user']['name'] == 'New Name'
    assert res.json['user']['avatar'] == 'https://example.com/avatar.jpg'
