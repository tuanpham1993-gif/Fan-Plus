from models.community import CommunityPost, CommunityComment
from extensions import db

def get_posts():
    return CommunityPost.query.order_by(CommunityPost.created_at.desc()).all()

def create_post(data):
    post = CommunityPost(
        user_id=data["user_id"],
        title=data["title"],
        subject=data.get("subject"),
        body=data["body"],
        topic=data.get("topic"),
        format=data.get("format", "post"),
        media_url=data.get("media_url"),
        spoiler=data.get("spoiler", False),
        rating=data.get("rating", 0)
    )
    db.session.add(post)
    db.session.commit()
    return post

def add_comment(post_id, user_id, body):
    comment = CommunityComment(
        post_id=post_id,
        user_id=user_id,
        body=body
    )
    db.session.add(comment)
    db.session.commit()
    return comment