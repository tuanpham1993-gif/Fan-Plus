"""Server-side password/session helpers. No bearer token in browser storage."""
import hashlib, hmac, secrets, time
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, update, delete
from sqlalchemy.exc import IntegrityError
from .models import User, AuthSession, RateBucket
from .core import Fault, text, fields, sha


def password_hash(password):
    salt = secrets.token_hex(16)
    iterations = 600000
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), iterations).hex()
    return f'pbkdf2_sha256${iterations}${salt}${digest}'


def verify_password(password, encoded):
    try:
        algorithm, count, salt, digest = encoded.split('$')
        if algorithm != 'pbkdf2_sha256' or not 600000 <= int(count) <= 1000000:
            return False
        actual = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), int(count)).hex()
        return hmac.compare_digest(actual, digest)
    except (ValueError, TypeError):
        return False


def register(db, data, demo_verify=False):
    fields(data, {'name', 'email', 'password'})
    name = text(data.get('name'), 2, 80, 'Name')
    email = text(data.get('email'), 5, 254, 'Email').lower()
    if '@' not in email or '.' not in email.rsplit('@', 1)[-1] or any(c.isspace() for c in email):
        raise Fault('Enter a valid email address.')
    password = text(data.get('password'), 12, 128, 'Password')
    if db.scalar(select(User.id).where(User.email == email)):
        raise Fault('Registration cannot be completed with these details.', 409)
    u = User(name=name, email=email, password_hash=password_hash(password), role='member', verified=demo_verify)
    db.add(u); db.flush()
    return u


DUMMY_HASH = password_hash('not-a-real-login-secret')


def login(db, data):
    fields(data, {'email', 'password'})
    email = text(data.get('email'), 1, 254, 'Email').lower()
    password = text(data.get('password'), 1, 128, 'Password')
    u = db.scalar(select(User).where(User.email == email))
    valid = verify_password(password, u.password_hash if u else DUMMY_HASH)
    if not u or not valid or u.suspended:
        raise Fault('The email or password is incorrect.', 401)
    token = secrets.token_urlsafe(32)
    expiry = (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat().replace('+00:00', 'Z')
    db.add(AuthSession(token_hash=sha(token), user_id=u.id, expires_at=expiry))
    return u, token


def user_for_session(db, token):
    if not token:
        return None
    s = db.get(AuthSession, sha(token))
    if not s or datetime.fromisoformat(s.expires_at.replace('Z', '+00:00')) <= datetime.now(timezone.utc):
        return None
    u = db.get(User, s.user_id)
    return None if not u or u.suspended else u


def consume_rate(db, raw_key, limit=30, window=60, at=None):
    slot = int(at or time.time()) // window
    key = sha(raw_key + ':' + str(window))
    # Create missing buckets using a savepoint; a concurrent insert cannot reset count.
    if db.get(RateBucket, (key, slot)) is None:
        try:
            with db.begin_nested():
                db.add(RateBucket(key=key, minute=slot, count=0)); db.flush()
        except IntegrityError:
            pass
    changed = db.execute(update(RateBucket).where(RateBucket.key == key, RateBucket.minute == slot, RateBucket.count < limit).values(count=RateBucket.count + 1)).rowcount
    if changed != 1:
        raise Fault('Too many requests. Please pause and try again.', 429)
