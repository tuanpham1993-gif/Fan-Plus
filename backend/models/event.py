from datetime import datetime
from extensions import db

class Event(db.Model):
    __tablename__ = 'events'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    location = db.Column(db.String(200), nullable=False)
    event_date = db.Column(db.String(100), nullable=False)
    banner = db.Column(db.String(500), default='')
    organizer = db.Column(db.String(120), default='Fan Hub Plus Team')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'location': self.location,
            'event_date': self.event_date,
            'banner': self.banner or 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
            'organizer': self.organizer,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
