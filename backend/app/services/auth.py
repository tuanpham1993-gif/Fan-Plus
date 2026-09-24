from datetime import timedelta
from sqlalchemy import select, update
from app.models import User, UserSetting, AuthSession, OneTimeToken, AuditLog, utcnow
from app.common.errors import DomainError
from app.common.security import hash_password, verify_password, new_token, token_digest

def register(db, payload):
    email = payload.email.strip().casefold()
    if db.scalar(select(User.id).where(User.email == email)):
        raise DomainError("EMAIL_UNAVAILABLE", "This email cannot be used for a new account.", 409)
    user = User(email=email, display_name=payload.display_name.strip(), password_hash=hash_password(payload.password), role="member")
    db.add(user); db.flush()
    db.add(UserSetting(user_id=user.id))
    return user

def issue_session(db, email, password, *, require_verified=True, lifetime_hours=8):
    user = db.scalar(select(User).where(User.email == email.strip().casefold()))
    if not verify_password(user.password_hash if user else None, password):
        raise DomainError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401)
    if user.suspended_at:
        raise DomainError("ACCOUNT_SUSPENDED", "This account is suspended.", 403)
    if require_verified and not user.verified_at:
        raise DomainError("EMAIL_NOT_VERIFIED", "Verify your email before signing in.", 403)
    raw, digest = new_token()
    db.add(AuthSession(token_hash=digest, user_id=user.id, expires_at=utcnow() + timedelta(hours=lifetime_hours)))
    return user, raw

def resolve_session(db, raw):
    if not raw or not isinstance(raw, str) or len(raw) > 200:
        return None
    record = db.get(AuthSession, token_digest(raw))
    if not record or record.revoked_at or record.expires_at <= utcnow():
        return None
    user = db.get(User, record.user_id)
    return user if user and not user.suspended_at else None

def revoke_session(db, raw):
    if raw:
        db.execute(update(AuthSession).where(AuthSession.token_hash == token_digest(raw)).values(revoked_at=utcnow()))

def revoke_all(db, user_id):
    db.execute(update(AuthSession).where(AuthSession.user_id == user_id, AuthSession.revoked_at.is_(None)).values(revoked_at=utcnow()))

def issue_one_time(db, user, purpose):
    raw, digest = new_token()
    minutes = 30 if purpose == "reset_password" else 24 * 60
    # Superseding a link invalidates older, unused links of the same purpose.
    db.execute(update(OneTimeToken).where(OneTimeToken.user_id == user.id, OneTimeToken.purpose == purpose, OneTimeToken.used_at.is_(None)).values(used_at=utcnow()))
    db.add(OneTimeToken(user_id=user.id, purpose=purpose, token_hash=digest, expires_at=utcnow() + timedelta(minutes=minutes)))
    return raw

def consume_one_time(db, raw, purpose):
    now = utcnow()
    token = db.scalar(select(OneTimeToken).where(OneTimeToken.token_hash == token_digest(raw), OneTimeToken.purpose == purpose))
    if not token:
        raise DomainError("INVALID_TOKEN", "This link is invalid or expired.", 400)
    result = db.execute(update(OneTimeToken).where(OneTimeToken.id == token.id, OneTimeToken.used_at.is_(None), OneTimeToken.expires_at > now).values(used_at=now), execution_options={"synchronize_session": False})
    if result.rowcount != 1:
        raise DomainError("INVALID_TOKEN", "This link is invalid or expired.", 400)
    return db.get(User, token.user_id)

def verify_email(db, raw):
    user = consume_one_time(db, raw, "verify_email")
    user.verified_at = utcnow()
    return user

def reset_password(db, raw, password):
    user = consume_one_time(db, raw, "reset_password")
    user.password_hash = hash_password(password)
    revoke_all(db, user.id)
    db.add(AuditLog(actor_id=user.id, action="password.reset", target_type="user", target_id=user.id, details={}))
    return user

def user_dto(user):
    return {"id":user.id, "email":user.email, "display_name":user.display_name, "role":user.role, "bio":user.bio, "email_verified":bool(user.verified_at)}
