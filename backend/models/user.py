import json
from datetime import datetime
from extensions import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar = db.Column(db.String(255), default=None, nullable=True)
    role = db.Column(db.String(20), nullable=False, default='user')
    status = db.Column(db.String(20), nullable=False, default='active')
    favorite_fandoms = db.Column(db.String(255), default='')
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
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'avatar': self.avatar,
            'role': self.role,
            'status': self.status,
            'favorite_fandoms': [f.strip() for f in self.favorite_fandoms.split(',')] if self.favorite_fandoms else [],
            'display_preferences': self.get_display_preferences(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
