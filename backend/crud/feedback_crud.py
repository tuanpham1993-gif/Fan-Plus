from extensions import db
from models.feedback import Feedback

def create_feedback(user_id, fb_type, content, status='pending'):
    feedback = Feedback(
        user_id=user_id,
        type=fb_type,
        content=content,
        status=status
    )
    db.session.add(feedback)
    db.session.commit()
    return feedback

def get_feedbacks(status=None):
    query = Feedback.query
    if status:
        query = query.filter_by(status=status)
    return query.order_by(Feedback.created_at.desc()).all()

def get_feedback_by_id(feedback_id):
    return db.session.query(Feedback).get(feedback_id)

def update_feedback_status(feedback, status):
    feedback.status = status
    db.session.commit()
    return feedback
