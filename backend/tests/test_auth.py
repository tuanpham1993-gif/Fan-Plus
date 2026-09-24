from datetime import timedelta
import pytest
from sqlalchemy import select
from app.models import AuthSession,OneTimeToken,User,utcnow
from app.services import auth
from app.common.security import verify_password,token_digest
from app.common.errors import DomainError
from app.schemas.requests import RegisterInput

def test_registration_normalizes_and_forces_member(db):
    user=auth.register(db,RegisterInput(email="ALICE@Test.Example",display_name=" Alice ",password="TestPassword!26"))
    db.commit()
    assert user.email=="alice@test.example" and user.display_name=="Alice"
    assert user.role=="member" and user.verified_at is None
    assert verify_password(user.password_hash,"TestPassword!26")
    assert "TestPassword!26" not in user.password_hash

def test_duplicate_email_rejected(db,people):
    with pytest.raises(DomainError,match="email"):
        auth.register(db,RegisterInput(email="ALICE@test.example",display_name="Another",password="TestPassword!26"))

@pytest.mark.parametrize("email,password",[("missing@test.example","TestPassword!26"),("alice@test.example","wrong")])
def test_login_generic_error(db,people,email,password):
    with pytest.raises(DomainError) as exc:auth.issue_session(db,email,password)
    assert exc.value.code=="INVALID_CREDENTIALS"

def test_verification_required(db,people):
    people["alice"].verified_at=None;db.flush()
    with pytest.raises(DomainError) as exc:auth.issue_session(db,"alice@test.example","TestPassword!26")
    assert exc.value.code=="EMAIL_NOT_VERIFIED"

def test_session_hash_and_revocation(db,people):
    _,raw=auth.issue_session(db,"alice@test.example","TestPassword!26");db.commit()
    row=db.scalar(select(AuthSession))
    assert row.token_hash==token_digest(raw) and row.token_hash!=raw
    assert auth.resolve_session(db,raw).id=="alice"
    auth.revoke_session(db,raw);db.commit()
    assert auth.resolve_session(db,raw) is None

def test_expired_and_suspended_sessions(db,people):
    _,raw=auth.issue_session(db,"alice@test.example","TestPassword!26");db.flush()
    row=db.get(AuthSession,token_digest(raw));row.expires_at=utcnow()-timedelta(seconds=1);db.commit()
    assert auth.resolve_session(db,raw) is None
    row.expires_at=utcnow()+timedelta(hours=1);people["alice"].suspended_at=utcnow();db.commit()
    assert auth.resolve_session(db,raw) is None

def test_token_purpose_separation_and_replay(db,people):
    raw=auth.issue_one_time(db,people["alice"],"verify_email");db.commit()
    with pytest.raises(DomainError):auth.consume_one_time(db,raw,"reset_password")
    assert auth.verify_email(db,raw).id=="alice";db.commit()
    with pytest.raises(DomainError):auth.verify_email(db,raw)

def test_new_link_supersedes_old(db,people):
    first=auth.issue_one_time(db,people["alice"],"reset_password");db.commit()
    second=auth.issue_one_time(db,people["alice"],"reset_password");db.commit()
    with pytest.raises(DomainError):auth.consume_one_time(db,first,"reset_password")
    assert auth.consume_one_time(db,second,"reset_password").id=="alice"

def test_expired_token_rejected(db,people):
    raw=auth.issue_one_time(db,people["alice"],"reset_password");db.flush()
    db.scalar(select(OneTimeToken)).expires_at=utcnow()-timedelta(seconds=1);db.commit()
    with pytest.raises(DomainError):auth.consume_one_time(db,raw,"reset_password")

def test_reset_revokes_all_sessions(db,people):
    _,a=auth.issue_session(db,"alice@test.example","TestPassword!26")
    _,b=auth.issue_session(db,"alice@test.example","TestPassword!26");db.flush()
    raw=auth.issue_one_time(db,people["alice"],"reset_password");db.commit()
    user=auth.reset_password(db,raw,"NewPassword!26");db.commit()
    assert verify_password(user.password_hash,"NewPassword!26")
    assert not verify_password(user.password_hash,"TestPassword!26")
    assert auth.resolve_session(db,a) is None and auth.resolve_session(db,b) is None
