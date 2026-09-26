from datetime import datetime
from extensions import db

class Merchandise(db.Model):
    __tablename__ = 'merchandise'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    price = db.Column(db.Float, nullable=False)
    image = db.Column(db.String(500), default='')
    category = db.Column(db.String(100), default='Figures')
    stock = db.Column(db.Integer, default=50)
    rating = db.Column(db.Float, default=4.8)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': float(self.price),
            'image': self.image or 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600',
            'category': self.category,
            'stock': self.stock,
            'rating': float(self.rating),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
