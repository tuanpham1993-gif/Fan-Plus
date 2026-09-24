from hashlib import sha256
from flask import Blueprint, g, request, session, current_app
from flask_wtf.csrf import generate_csrf
from sqlalchemy import select
from app.extensions import limiter
from app.models import User
from app.schemas.requests import RegisterInput, LoginInput, EmailInput, TokenInput, PasswordResetInput
from app.services import auth as service
from app.integrations.mail import deliver_link
from .helpers import body, ok, commit, authenticated
bp=Blueprint("auth",__name__,url_prefix="/api/v1/auth")

def login_key():
    value=request.get_json(silent=True)
    email=value.get("email","") if isinstance(value,dict) else ""
    return sha256(str(email).strip().casefold().encode()).hexdigest()

@bp.get("/csrf")
def csrf_token():
    return ok({"csrf_token":generate_csrf()})

@bp.post("/register")
@limiter.limit("5 per hour")
def register():
    user=service.register(g.db,body(RegisterInput))
    raw=service.issue_one_time(g.db,user,"verify_email")
    g.db.commit()
    deliver_link(user.email,raw,"verify_email")
    return ok({"message":"Check your email to verify your account."},status=202)

@bp.post("/login")
@limiter.limit("10 per minute")
@limiter.limit("5 per minute",key_func=login_key)
def login():
    payload=body(LoginInput)
    user,raw=service.issue_session(g.db,payload.email,payload.password,require_verified=current_app.config["REQUIRE_EMAIL_VERIFICATION"])
    service.revoke_session(g.db,session.get("sid"))
    g.db.commit()
    # Rotate authentication and CSRF state on every successful login.
    session.clear();session["sid"]=raw;session.permanent=True
    return ok(service.user_dto(user))

@bp.post("/logout")
def logout():
    service.revoke_session(g.db,session.get("sid"));g.db.commit();session.clear()
    return ok(status=204)

@bp.get("/me")
@authenticated
def me():return ok(service.user_dto(g.actor))

@bp.post("/verify-email")
@limiter.limit("10 per minute")
def verify_email():
    service.verify_email(g.db,body(TokenInput).token)
    return commit({"message":"Email verified. You can sign in."})

@bp.post("/verification-email")
@limiter.limit("5 per hour")
def request_verification():
    email=body(EmailInput).email.strip().casefold()
    user=g.db.scalar(select(User).where(User.email==email))
    if user and not user.verified_at:
        raw=service.issue_one_time(g.db,user,"verify_email");g.db.commit();deliver_link(user.email,raw,"verify_email")
    return ok({"message":"An eligible account will receive a verification link."},status=202)

@bp.post("/forgot-password")
@limiter.limit("5 per hour")
def forgot_password():
    user=g.db.scalar(select(User).where(User.email==body(EmailInput).email.strip().casefold()))
    if user and not user.suspended_at:
        raw=service.issue_one_time(g.db,user,"reset_password");g.db.commit();deliver_link(user.email,raw,"reset_password")
    return ok({"message":"An eligible account will receive a reset link."},status=202)

@bp.post("/reset-password")
@limiter.limit("10 per hour")
def reset_password():
    payload=body(PasswordResetInput)
    service.reset_password(g.db,payload.token,payload.password);g.db.commit();session.clear()
    return ok({"message":"Password changed. Sign in again on your devices."})
