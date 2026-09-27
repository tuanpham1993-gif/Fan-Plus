from extensions import db
from models import Feedback, User


def seed_feedbacks():
    feedbacks = [
        {
            "email": "john@fanhub.com",
            "type": "suggestion",
            "content": "It would be useful to have a dark mode for the website.",
            "status": "resolved",
        },
        {
            "email": "jane@fanhub.com",
            "type": "bug",
            "content": "The character image does not load on the character detail page.",
            "status": "pending",
        },
        {
            "email": "mike@fanhub.com",
            "type": "query",
            "content": "How can I register for an upcoming event?",
            "status": "resolved",
        },
        {
            "email": "emily@fanhub.com",
            "type": "suggestion",
            "content": "Please add more filtering options to the content search.",
            "status": "pending",
        },
    ]

    for item in feedbacks:

        user = User.query.filter_by(
            email=item["email"]
        ).first()

        if not user:
            print(
                f"User '{item['email']}' not found. "
                f"Skipping feedback."
            )
            continue

        existing_feedback = Feedback.query.filter_by(
            user_id=user.id,
            content=item["content"]
        ).first()

        if existing_feedback:
            continue

        feedback = Feedback(
            user_id=user.id,
            type=item["type"],
            content=item["content"],
            status=item["status"]
        )

        db.session.add(feedback)

    db.session.commit()