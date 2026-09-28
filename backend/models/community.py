from datetime import datetime
from extensions import db

class CommunityPost(db.Model):
    __tablename__ = "community_posts"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(255))
    body = db.Column(db.Text, nullable=False)
    topic = db.Column(db.String(100))
    format = db.Column(db.String(50), default="post")
    media_url = db.Column(db.String(500))
    spoiler = db.Column(db.Boolean, default=False)
    rating = db.Column(db.Float, default=0)
    status = db.Column(db.String(50), default="published")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CommunityComment(db.Model):
    __tablename__ = "community_comments"
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('community_posts.id'), nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CommunityReaction(db.Model):
    __tablename__ = "community_reactions"
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('community_posts.id'), nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    type = db.Column(db.String(50), nullable=False) # like, dislike