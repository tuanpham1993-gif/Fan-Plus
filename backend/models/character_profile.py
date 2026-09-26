from datetime import datetime
from extensions import db

class CharacterProfile(db.Model):
    __tablename__ = 'character_profiles'

    character_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    bio = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    merchandise_items = db.relationship('MerchandiseItem', backref='character', lazy=True)

    def to_dict(self):
        return {
            'character_id': self.character_id,
            'category_id': self.category_id,
            'name': self.name,
            'bio': self.bio,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
