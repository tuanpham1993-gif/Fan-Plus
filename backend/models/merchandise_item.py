from datetime import datetime
from extensions import db

class MerchandiseItem(db.Model):
    __tablename__ = 'merchandise_items'

    item_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id'), nullable=False)
    character_id = db.Column(db.Integer, db.ForeignKey('characters.character_id', ondelete='SET NULL'), nullable=True)
    name = db.Column(db.String(200), nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    tag = db.Column(db.String(50), nullable=True)
    is_upcoming = db.Column(db.Boolean, default=False)
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # def to_dict(self):
    #     return {
    #         'item_id': self.item_id,
    #         'category_id': self.category_id,
    #         'character_id': self.character_id,
    #         'name': self.name,
    #         'image_url': self.image_url,
    #         'tag': self.tag,
    #         'is_upcoming': self.is_upcoming,
    #         'view_count': self.view_count,
    #         'created_at': self.created_at.isoformat() if self.created_at else None
    #     }
