"""Server-side password/session helpers. No bearer token in browser storage."""
import hashlib, hmac, secrets, time
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, update, delete
from sqlalchemy.exc import IntegrityError
from .models import User, AuthSession, RateBucket, Verification
from .core import Fault, text, fields, sha, PROFILE_CATEGORIES

# Known disposable / throwaway email domains. Registration with these is rejected
# so accounts cannot be created with junk addresses that will never receive mail.
DISPOSABLE_EMAIL_DOMAINS = {
    'mailinator.com', '10minutemail.com', '10minutemail.net', 'guerrillamail.com',
    'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de', 'sharklasers.com',
    'yopmail.com', 'yopmail.fr', 'yopmail.net', 'trashmail.com', 'trash-mail.com',
    'tempmail.com', 'temp-mail.org', 'tempmail.net', 'tempinbox.com', 'throwawaymail.com',
    'getnada.com', 'dispostable.com', 'maildrop.cc', 'mintemail.com', 'mailnesia.com',
    'fakeinbox.com', 'spamgourmet.com', 'discard.email', 'moakt.com', 'emailondeck.com',
    '33mail.com', 'mytemp.email', 'mohmal.com', 'mail-temporaire.fr', 'einrot.com',
    'jetable.org', 'spam4.me', 'mailcatch.com', 'anonbox.net', 'inboxbear.com',
}


def otp_code():
    return f'{secrets.randbelow(1_000_000):06d}'


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
    fields(data, {'name', 'email', 'password', 'favoriteCategories'})
    name = text(data.get('name'), 2, 80, 'Name')
    email = text(data.get('email'), 5, 254, 'Email').lower()
    if '@' not in email or '.' not in email.rsplit('@', 1)[-1] or any(c.isspace() for c in email):
        raise Fault('Enter a valid email address.')
    domain = email.rsplit('@', 1)[-1]
    if domain in DISPOSABLE_EMAIL_DOMAINS:
        raise Fault('Disposable or throwaway email addresses cannot be used. Use a real inbox you can verify.')
    password = text(data.get('password'), 12, 128, 'Password')
    categories = data.get('favoriteCategories', [])
    if not isinstance(categories, list) or not all(isinstance(c, str) and c in PROFILE_CATEGORIES for c in categories):
        raise Fault('Choose your favorite categories from the list.')
    if db.scalar(select(User.id).where(User.email == email)):
        raise Fault('Registration cannot be completed with these details.', 409)
    u = User(name=name, email=email, password_hash=password_hash(password), role='member', verified=demo_verify, favorite_categories=categories)
    db.add(u); db.flush()
    return u


def issue_verification(db, user):
    db.execute(update(Verification).where(Verification.user_id == user.id, Verification.consumed.is_(False)).values(consumed=True))
    code = otp_code()
    expiry = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat().replace('+00:00', 'Z')
    db.add(Verification(user_id=user.id, code_hash=sha(code), expires_at=expiry))
    return code


def verify_email(db, user, code):
    if user.verified:
        return
    code = text(code, 6, 6, 'Verification code')
    v = db.scalar(select(Verification).where(Verification.user_id == user.id, Verification.consumed.is_(False)).order_by(Verification.created_at.desc()))
    if not v or datetime.fromisoformat(v.expires_at.replace('Z', '+00:00')) <= datetime.now(timezone.utc):
        raise Fault('This verification code has expired. Request a new one.')
    if v.attempts >= 5:
        raise Fault('Too many incorrect attempts. Request a new code.', 429)
    v.attempts += 1
    if not hmac.compare_digest(sha(code), v.code_hash):
        raise Fault('That code is incorrect.')
    v.consumed = True
    user.verified = True


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
