import uuid
from datetime import datetime
from extensions import db
from models import User, RefreshToken

def get_user_by_email(email):
    return db.session.query(User).filter_by(email=email).first()

def get_user_by_id(user_id):
    return db.session.query(User).get(user_id)

def get_user_by_reset_token(reset_token):
    if not reset_token:
        return None
    return db.session.query(User).filter_by(reset_token=reset_token).first()

def create_user(name, email, password_hash, role='user', status='active'):
    user = User(
        name=name,
        email=email,
        password_hash=password_hash,
        role=role,
        status=status
    )
    db.session.add(user)
    db.session.commit()
    return user

def create_password_reset_token(user):
    reset_token = str(uuid.uuid4())
    user.reset_token = reset_token
    db.session.commit()
    return reset_token

def update_user_password(user, new_password_hash):
    user.password_hash = new_password_hash
    user.reset_token = None
    db.session.commit()
    return user

def get_refresh_token_record(token_str):
    return db.session.query(RefreshToken).filter_by(token=token_str).first()

def revoke_refresh_token_record(token_record):
    if token_record and token_record.revoked_at is None:
        token_record.revoked_at = datetime.utcnow()
        db.session.commit()
    return token_record
