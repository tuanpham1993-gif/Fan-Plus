import json
from datetime import date, datetime
from extensions import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar = db.Column(db.String(255), default=None, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    birthday = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    bio = db.Column(db.String(300), nullable=True)
    favorite_fandoms = db.Column(db.Text, default='', nullable=True)
    role = db.Column(db.String(20), nullable=False, default='user')
    status = db.Column(db.String(20), nullable=False, default='active')
    display_preferences = db.Column(db.String(255), default='{"theme":"dark","font_size":"medium"}')
    reset_token = db.Column(db.String(255), default=None, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    refresh_tokens = db.relationship('RefreshToken', backref='user', lazy=True, cascade='all, delete-orphan')
    feedbacks = db.relationship('Feedback', backref='user', lazy=True, cascade='all, delete-orphan')

    def get_display_preferences(self):
        try:
            return json.loads(self.display_preferences) if self.display_preferences else {"theme": "dark", "font_size": "medium"}
        except Exception:
            return {"theme": "dark", "font_size": "medium"}

    def to_dict(self):
        preferences = self.get_display_preferences()
        favorite_fandoms = [
            fandom.strip()
            for fandom in (self.favorite_fandoms or '').split(',')
            if fandom.strip()
        ]
        if not favorite_fandoms and isinstance(preferences.get('favorite_fandoms'), list):
            favorite_fandoms = preferences['favorite_fandoms']
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'avatar': self.avatar,
            'phone': self.phone,
            'birthday': self.birthday.isoformat() if self.birthday else None,
            'gender': self.gender,
            'city': self.city,
            'bio': self.bio,
            'favorite_fandoms': favorite_fandoms,
            'role': self.role,
            'status': self.status,
            'display_preferences': {k: v for k, v in preferences.items() if k != 'favorite_fandoms'},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def to_public_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'avatar': self.avatar,
        }

    def to_admin_dict(self):
        data = self.to_dict()
        for field in ('phone', 'birthday', 'gender', 'city', 'bio'):
            data.pop(field, None)
        return data

