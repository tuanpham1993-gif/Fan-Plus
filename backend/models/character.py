from datetime import datetime
from extensions import db

class Character(db.Model):
    __tablename__ = 'characters'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    anime_fandom = db.Column(db.String(120), nullable=False)
    role_type = db.Column(db.String(80), default='Protagonist')
    bio = db.Column(db.Text, default='')
    avatar = db.Column(db.String(500), default='')
    banner = db.Column(db.String(500), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    contents = db.relationship('Content', backref='character', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'anime_fandom': self.anime_fandom,
            'role_type': self.role_type,
            'bio': self.bio,
            'avatar': self.avatar or 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            'banner': self.banner or 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
