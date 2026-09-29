from models.review import Review
from extensions import db

def get_review(review_id):
    return db.session.get(Review, review_id)

def get_review_by_user_content(user_id, content_id):
    return Review.query.filter_by(
        user_id=user_id,
        content_id=content_id
    ).first()

def count_reviews_by_content(content_id):
    return Review.query.filter(Review.content_id == content_id).count()

def get_reviews_by_content(
    content_id,
    skip=0,
    limit=20
):
    return (
        Review.query
        .filter(Review.content_id == content_id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_review(
    user_id,
    content_id,
    rating,
    comment=None
):
    review = Review(
        user_id=user_id,
        content_id=content_id,
        rating=rating,
        comment=comment
    )

    db.session.add(review)
    db.session.commit()
    db.session.refresh(review)

    return review


def update_review(
    review_id,
    rating=None,
    comment=None
):
    review = get_review(review_id)

    if review is None:
        return None

    if rating is not None:
        review.rating = rating

    if comment is not None:
        review.comment = comment

    db.session.commit()
    db.session.refresh(review)

    return review


def delete_review(review_id):
    review = get_review(review_id)

    if review is None:
        return None

    db.session.delete(review)
    db.session.commit()

    return review