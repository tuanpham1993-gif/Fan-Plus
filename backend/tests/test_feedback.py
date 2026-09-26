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

def test_create_feedback_success(client):
    client.post('/api/auth/register', json={
        'name': 'Feedback User',
        'email': 'fb@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'fb@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    token = login_res.json['access_token']

    res = client.post('/api/feedback', json={
        'type': 'bug',
        'content': 'Không thể thay đổi ảnh đại diện'
    }, headers={'Authorization': f'Bearer {token}'})

    assert res.status_code == 201
    assert res.json['feedback']['type'] == 'bug'
    assert res.json['feedback']['content'] == 'Không thể thay đổi ảnh đại diện'

def test_create_feedback_unauthenticated(client):
    res = client.post('/api/feedback', json={
        'type': 'bug',
        'content': 'Unauthenticated feedback'
    })
    assert res.status_code == 401

def test_create_feedback_invalid_type(client):
    client.post('/api/auth/register', json={
        'name': 'Feedback User 2',
        'email': 'fb2@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'fb2@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    token = login_res.json['access_token']

    res = client.post('/api/feedback', json={
        'type': 'invalid_type',
        'content': 'Test content'
    }, headers={'Authorization': f'Bearer {token}'})

    assert res.status_code == 400

def test_create_feedback_empty_content(client):
    client.post('/api/auth/register', json={
        'name': 'Feedback User 3',
        'email': 'fb3@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'fb3@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    token = login_res.json['access_token']

    res = client.post('/api/feedback', json={
        'type': 'suggestion',
        'content': '   '
    }, headers={'Authorization': f'Bearer {token}'})

    assert res.status_code == 400
