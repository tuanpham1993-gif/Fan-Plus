import io
import os

import pytest
import app as app_module
from app import create_app
from extensions import db
from routes import user_routes

TEST_CAPTCHA = "PASSED_TEST_TOKEN"


def make_png_bytes():
    return b'\x89PNG\r\n\x1a\n' + b'\x00' * 20


def make_jpeg_bytes():
    return b'\xff\xd8\xff\xe0\x00\x10JFIF' + b'\x00' * 20


def make_webp_bytes():
    return b'RIFF' + (b'\x00' * 8) + b'WEBP' + b'\x00' * 20


@pytest.fixture
def client(tmp_path, monkeypatch):
    avatar_dir = tmp_path / 'avatars'
    monkeypatch.setattr(app_module, 'AVATAR_UPLOAD_DIR', str(avatar_dir))
    monkeypatch.setattr(user_routes, 'AVATAR_UPLOAD_DIR', str(avatar_dir))
    app = create_app(testing=True)
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
        'avatar': 'https://example.com/avatar.jpg',
        'favorite_fandoms': ['Anime', 'Manga'],
        'display_preferences': {'favoriteCategories': ['anime']}
    }, headers={'Authorization': f'Bearer {token}'})

    assert res.status_code == 200
    assert res.json['user']['name'] == 'New Name'
    assert res.json['user']['avatar'] is None
    assert res.json['user']['favorite_fandoms'] == ['Anime', 'Manga']
    assert res.json['user']['display_preferences'] == {
        'theme': 'dark',
        'font_size': 'medium',
        'favoriteCategories': ['anime']
    }


def test_update_profile_merges_display_preferences(client):
    client.post('/api/auth/register', json={
        'name': 'Preference User',
        'email': 'preferences@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'preferences@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })

    res = client.put(
        '/api/users/me',
        json={'display_preferences': {'favoriteCategories': ['anime']}},
        headers={'Authorization': f'Bearer {login_res.json["access_token"]}'},
    )

    assert res.status_code == 200
    assert res.json['user']['display_preferences'] == {
        'theme': 'dark',
        'font_size': 'medium',
        'favoriteCategories': ['anime']
    }


@pytest.mark.parametrize(
    ('preferences', 'message'),
    [
        (['not', 'an', 'object'], 'Tùy chọn hiển thị phải là một đối tượng JSON'),
        ({'large': 'x' * 250}, 'Tùy chọn hiển thị không được vượt quá 255 ký tự'),
    ],
)
def test_update_profile_rejects_invalid_display_preferences(client, preferences, message):
    client.post('/api/auth/register', json={
        'name': 'Invalid Preference User',
        'email': 'invalid-preferences@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'invalid-preferences@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })

    res = client.put(
        '/api/users/me',
        json={'display_preferences': preferences},
        headers={'Authorization': f'Bearer {login_res.json["access_token"]}'},
    )

    assert res.status_code == 400
    assert res.json['message'] == message


def test_update_profile_normalizes_favorite_fandoms(client):
    client.post('/api/auth/register', json={
        'name': 'Fandom User',
        'email': 'fandoms@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'fandoms@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })

    res = client.put(
        '/api/users/me',
        json={'favorite_fandoms': [' Anime ', '', 'Manga', 'anime', '  ']},
        headers={'Authorization': f'Bearer {login_res.json["access_token"]}'},
    )

    assert res.status_code == 200
    assert res.json['user']['favorite_fandoms'] == ['Anime', 'Manga']


@pytest.mark.parametrize(
    ('fandoms', 'message'),
    [
        ([f'Fandom {index}' for index in range(21)], 'Chỉ được chọn tối đa 20 fandom'),
        (['x' * 81], 'Mỗi fandom không được dài quá 80 ký tự'),
        (['Fan, Club'], 'Tên fandom không được chứa dấu phẩy'),
        ('Anime', 'Danh sách fandom không hợp lệ'),
    ],
)
def test_update_profile_rejects_invalid_favorite_fandoms(client, fandoms, message):
    client.post('/api/auth/register', json={
        'name': 'Invalid Fandom User',
        'email': 'invalid-fandoms@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'invalid-fandoms@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })

    res = client.put(
        '/api/users/me',
        json={'favorite_fandoms': fandoms},
        headers={'Authorization': f'Bearer {login_res.json["access_token"]}'},
    )

    assert res.status_code == 400
    assert res.json['message'] == message


def test_change_password_and_invalidate_refresh_tokens(client):
    client.post('/api/auth/register', json={
        'name': 'Password User',
        'email': 'passuser@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'passuser@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    access_token = login_res.json['access_token']
    refresh_token = login_res.json['refresh_token']

    bad_current = client.put(
        '/api/users/me/password',
        json={'current_password': 'WrongPassword1!', 'new_password': 'NewPass123@'},
        headers={'Authorization': f'Bearer {access_token}'},
    )
    assert bad_current.status_code == 400
    assert 'Mật khẩu hiện tại không đúng' in bad_current.json['message']

    weak = client.put(
        '/api/users/me/password',
        json={'current_password': 'Password123@', 'new_password': 'weak'},
        headers={'Authorization': f'Bearer {access_token}'},
    )
    assert weak.status_code == 400

    good = client.put(
        '/api/users/me/password',
        json={'current_password': 'Password123@', 'new_password': 'NewPassword123@'},
        headers={'Authorization': f'Bearer {access_token}'},
    )
    assert good.status_code == 200

    refresh_after_change = client.post('/api/auth/refresh', json={'refresh_token': refresh_token})
    assert refresh_after_change.status_code == 401

    relogin = client.post('/api/auth/login', json={
        'email': 'passuser@gmail.com',
        'password': 'NewPassword123@',
        'captcha_token': TEST_CAPTCHA
    })
    assert relogin.status_code == 200


def test_upload_avatar_valid_and_invalid(client):
    client.post('/api/auth/register', json={
        'name': 'Avatar User',
        'email': 'avataruser@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'avataruser@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    access_token = login_res.json['access_token']

    valid = client.post(
        '/api/users/me/avatar',
        data={'avatar': (io.BytesIO(make_png_bytes()), 'avatar.png')},
        headers={'Authorization': f'Bearer {access_token}'},
    )
    assert valid.status_code == 200
    assert valid.json['user']['avatar'].startswith('/api/uploads/avatars/')

    bad_ext = client.post(
        '/api/users/me/avatar',
        data={'avatar': (io.BytesIO(b'hello world'), 'fake.txt')},
        headers={'Authorization': f'Bearer {access_token}'},
    )
    assert bad_ext.status_code == 415

    disguised = client.post(
        '/api/users/me/avatar',
        data={'avatar': (io.BytesIO(b'hello world'), 'avatar.png')},
        headers={'Authorization': f'Bearer {access_token}'},
    )
    assert disguised.status_code == 415

    big_bytes = b'\x89PNG\r\n\x1a\n' + b'0' * (2 * 1024 * 1024 + 10)
    too_big = client.post(
        '/api/users/me/avatar',
        data={'avatar': (io.BytesIO(big_bytes), 'avatar.png')},
        headers={'Authorization': f'Bearer {access_token}'},
    )
    assert too_big.status_code == 413

    filename = valid.json['user']['avatar'].split('/')[-1]
    get_file = client.get(f'/api/uploads/avatars/{filename}')
    assert get_file.status_code == 200
    assert get_file.mimetype == 'image/png'

    malicious = client.get('/api/uploads/avatars/../x')
    assert malicious.status_code == 404

    no_token = client.post('/api/users/me/avatar', data={'avatar': (io.BytesIO(make_webp_bytes()), 'avatar.webp')})
    assert no_token.status_code == 401


def test_change_password_accepts_trailing_space_and_relogin_with_exact_string(client):
    client.post('/api/auth/register', json={
        'name': 'Space User',
        'email': 'spaceuser@gmail.com',
        'password': 'Password123@ ',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'spaceuser@gmail.com',
        'password': 'Password123@ ',
        'captcha_token': TEST_CAPTCHA
    })
    assert login_res.status_code == 200
    access_token = login_res.json['access_token']

    change = client.put(
        '/api/users/me/password',
        json={'current_password': 'Password123@ ', 'new_password': 'NewPassword123@ '},
        headers={'Authorization': f'Bearer {access_token}'},
    )
    assert change.status_code == 200

    relogin = client.post('/api/auth/login', json={
        'email': 'spaceuser@gmail.com',
        'password': 'NewPassword123@ ',
        'captcha_token': TEST_CAPTCHA
    })
    assert relogin.status_code == 200


def test_update_profile_rejects_foreign_avatar_url_and_keeps_owner_file(client):
    from models.user import User

    user_b = client.post('/api/auth/register', json={
        'name': 'Owner B',
        'email': 'ownerb@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    assert user_b.status_code == 201
    client.post('/api/auth/login', json={
        'email': 'ownerb@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    owner_b = db.session.query(User).filter_by(email='ownerb@gmail.com').first()
    avatar_dir = user_routes.AVATAR_UPLOAD_DIR
    os.makedirs(avatar_dir, exist_ok=True)
    owned_name = f'u{owner_b.id}-ownerb.png'
    owned_path = os.path.join(avatar_dir, owned_name)
    with open(owned_path, 'wb') as fh:
        fh.write(make_png_bytes())
    owner_b.avatar = f'/api/uploads/avatars/{owned_name}'
    db.session.commit()

    client.post('/api/auth/register', json={
        'name': 'Owner A',
        'email': 'ownera@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_a = client.post('/api/auth/login', json={
        'email': 'ownera@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    token_a = login_a.json['access_token']

    res = client.put(
        '/api/users/me',
        json={'avatar': f'/api/uploads/avatars/{owned_name}'},
        headers={'Authorization': f'Bearer {token_a}'},
    )
    assert res.status_code == 200
    assert res.json['user']['avatar'] is None
    assert os.path.exists(owned_path)


def test_upload_avatar_second_upload_removes_first_file(client):
    client.post('/api/auth/register', json={
        'name': 'Cleanup User',
        'email': 'cleanup@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'cleanup@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    token = login_res.json['access_token']

    first = client.post(
        '/api/users/me/avatar',
        data={'avatar': (io.BytesIO(make_png_bytes()), 'first.png')},
        headers={'Authorization': f'Bearer {token}'},
    )
    first_name = first.json['user']['avatar'].split('/')[-1]
    first_path = os.path.join(user_routes.AVATAR_UPLOAD_DIR, first_name)

    second = client.post(
        '/api/users/me/avatar',
        data={'avatar': (io.BytesIO(make_jpeg_bytes()), 'second.jpg')},
        headers={'Authorization': f'Bearer {token}'},
    )
    second_name = second.json['user']['avatar'].split('/')[-1]
    second_path = os.path.join(user_routes.AVATAR_UPLOAD_DIR, second_name)

    assert first.status_code == 200
    assert second.status_code == 200
    assert not os.path.exists(first_path)
    assert os.path.exists(second_path)


def test_upload_avatar_commit_failure_keeps_old_file(client, monkeypatch):
    from models.user import User

    client.post('/api/auth/register', json={
        'name': 'Rollback User',
        'email': 'rollback@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'rollback@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    token = login_res.json['access_token']
    user = db.session.query(User).filter_by(email='rollback@gmail.com').first()
    avatar_dir = user_routes.AVATAR_UPLOAD_DIR
    os.makedirs(avatar_dir, exist_ok=True)
    old_name = f'u{user.id}-old.png'
    old_path = os.path.join(avatar_dir, old_name)
    with open(old_path, 'wb') as fh:
        fh.write(make_png_bytes())
    user.avatar = f'/api/uploads/avatars/{old_name}'
    db.session.commit()

    original_commit = db.session.commit

    def fail_commit():
        raise RuntimeError('forced commit failure')

    monkeypatch.setattr(db.session, 'commit', fail_commit)
    res = client.post(
        '/api/users/me/avatar',
        data={'avatar': (io.BytesIO(make_png_bytes()), 'new.png')},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert res.status_code == 500
    assert os.path.exists(old_path)

    expected_new_filename = os.path.basename(res.json.get('user', {}).get('avatar', '')) if isinstance(res.json, dict) else ''
    if expected_new_filename:
        assert not os.path.exists(os.path.join(avatar_dir, expected_new_filename))

    monkeypatch.setattr(db.session, 'commit', original_commit)


def test_change_password_rejects_duplicate_old_password(client):
    client.post('/api/auth/register', json={
        'name': 'Duplicate Password User',
        'email': 'dup-pass@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'dup-pass@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    token = login_res.json['access_token']

    res = client.put(
        '/api/users/me/password',
        json={'current_password': 'Password123@', 'new_password': 'Password123@'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert res.status_code == 400
    assert 'trùng' in res.json['message']


def test_remove_avatar_success_deletes_owned_file(client):
    client.post('/api/auth/register', json={
        'name': 'Remove Avatar User',
        'email': 'remove-avatar@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'remove-avatar@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    token = login_res.json['access_token']
    uploaded = client.post(
        '/api/users/me/avatar',
        data={'avatar': (io.BytesIO(make_png_bytes()), 'remove.png')},
        headers={'Authorization': f'Bearer {token}'},
    )
    filename = uploaded.json['user']['avatar'].split('/')[-1]
    avatar_path = os.path.join(user_routes.AVATAR_UPLOAD_DIR, filename)

    removed = client.delete(
        '/api/users/me/avatar',
        headers={'Authorization': f'Bearer {token}'},
    )
    profile = client.get(
        '/api/users/me',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert uploaded.status_code == 200
    assert removed.status_code == 200
    assert removed.json['user']['avatar'] is None
    assert profile.status_code == 200
    assert profile.json['user']['avatar'] is None
    assert not os.path.exists(avatar_path)


def test_remove_avatar_requires_authentication(client):
    res = client.delete('/api/users/me/avatar')
    assert res.status_code == 401


def test_remove_avatar_without_existing_avatar_succeeds(client):
    client.post('/api/auth/register', json={
        'name': 'No Avatar User',
        'email': 'no-avatar@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'no-avatar@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    res = client.delete(
        '/api/users/me/avatar',
        headers={'Authorization': f'Bearer {login_res.json["access_token"]}'},
    )
    assert res.status_code == 200
    assert res.json['user']['avatar'] is None


def test_remove_avatar_does_not_delete_another_users_file(client):
    from models.user import User

    for name, email in [('Owner', 'avatar-owner@gmail.com'), ('Other', 'avatar-other@gmail.com')]:
        client.post('/api/auth/register', json={
            'name': name,
            'email': email,
            'password': 'Password123@',
            'captcha_token': TEST_CAPTCHA
        })
    owner_login = client.post('/api/auth/login', json={
        'email': 'avatar-owner@gmail.com',
        'password': 'Password123@',
        'captcha_token': TEST_CAPTCHA
    })
    other = db.session.query(User).filter_by(email='avatar-other@gmail.com').first()
    avatar_dir = user_routes.AVATAR_UPLOAD_DIR
    os.makedirs(avatar_dir, exist_ok=True)
    other_filename = f'u{other.id}-protected.png'
    other_path = os.path.join(avatar_dir, other_filename)
    with open(other_path, 'wb') as avatar_file:
        avatar_file.write(make_png_bytes())
    owner = db.session.query(User).filter_by(email='avatar-owner@gmail.com').first()
    owner.avatar = f'/api/uploads/avatars/{other_filename}'
    db.session.commit()

    try:
        res = client.delete(
            '/api/users/me/avatar',
            headers={'Authorization': f'Bearer {owner_login.json["access_token"]}'},
        )

        assert res.status_code == 200
        assert res.json['user']['avatar'] is None
        assert os.path.exists(other_path)
    finally:
        if os.path.exists(other_path):
            os.remove(other_path)
