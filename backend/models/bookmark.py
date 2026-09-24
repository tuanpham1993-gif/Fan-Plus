from datetime import datetime
from extensions import db

class Bookmark(db.Model):
    __tablename__ = 'bookmarks'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    content_id = db.Column(db.Integer, db.ForeignKey('contents.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'content_id', name='unique_user_bookmark'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'content_id': self.content_id,
            'content': self.content.to_dict(include_full=False) if self.content else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
