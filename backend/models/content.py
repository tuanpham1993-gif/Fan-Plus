from datetime import datetime
from extensions import db

class Content(db.Model):
    __tablename__ = 'contents'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False, index=True)
    slug = db.Column(db.String(255), unique=True, nullable=False)
    summary = db.Column(db.Text, nullable=False)
    content = db.Column(db.Text, nullable=False)
    cover_image = db.Column(db.String(500), default='')
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False, index=True)
    character_id = db.Column(db.Integer, db.ForeignKey('characters.id'), nullable=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    view_count = db.Column(db.Integer, default=0, index=True)
    featured = db.Column(db.Boolean, default=False)
    tags = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    bookmarks = db.relationship('Bookmark', backref='content', lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_full=True):
        data = {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'summary': self.summary,
            'cover_image': self.cover_image or 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'category_slug': self.category.slug if self.category else None,
            'character_id': self.character_id,
            'character_name': self.character.name if self.character else None,
            'author_id': self.author_id,
            'author_name': self.author.full_name or self.author.username if self.author else 'Fan Hub Team',
            'view_count': self.view_count,
            'featured': bool(self.featured),
            'tags': [t.strip() for t in self.tags.split(',')] if self.tags else [],
            'bookmark_count': len(self.bookmarks),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_full:
            data['content'] = self.content
        return data
