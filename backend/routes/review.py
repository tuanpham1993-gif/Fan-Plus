from flask import Blueprint, request, jsonify, g
from pydantic import ValidationError
from sqlalchemy import func
from extensions import db
from middleware.auth_middleware import admin_required, token_required, get_optional_user
from models.content import Content
from models.review import Review
from schema.review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse
)

from crud.review import (
    get_review,
    get_review_by_user_content,
    create_review,
    update_review,
    delete_review,
    get_reviews_by_content
)


review_bp = Blueprint(
    "review",
    __name__,
    url_prefix="/reviews"
)


def rating_summary(content_id, user=None):
    average, count = db.session.query(
        func.avg(Review.rating), func.count(Review.id)
    ).filter(Review.content_id == content_id).one()
    mine = get_review_by_user_content(user.id, content_id) if user else None
    return {
        "average": round(float(average), 1) if average is not None else 0,
        "count": int(count or 0),
        "userRating": mine.rating if mine else 0,
    }


@review_bp.post("")
@token_required
def create_review_api():
    """Create the caller's review, or update it when one already exists (one review per user and content)."""
    user_id = g.current_user.id

    try:
        data = ReviewCreate.model_validate(request.get_json(silent=True) or {})
    except ValidationError as error:
        return jsonify({
            "message": "Rating must be a whole number from 0 to 5",
            "errors": error.errors(include_url=False, include_context=False)
        }), 400

    if db.session.get(Content, data.content_id) is None:
        return jsonify({"message": "Content not found"}), 404

    existing = get_review_by_user_content(user_id, data.content_id)
    if existing is not None:
        review = update_review(existing.id, rating=data.rating, comment=data.comment)
        status = 200
    else:
        review = create_review(
            user_id=user_id,
            content_id=data.content_id,
            rating=data.rating,
            comment=data.comment
        )
        status = 201

    return jsonify({
        **ReviewResponse.model_validate(review).model_dump(mode="json"),
        "summary": rating_summary(data.content_id, g.current_user)
    }), status


@review_bp.get("/content/<int:content_id>/summary")
def get_rating_summary_api(content_id):
    return jsonify(rating_summary(content_id, get_optional_user())), 200


@review_bp.get("/<int:review_id>")
def get_review_api(review_id):
    review = get_review(review_id)

    if review is None:
        return jsonify({
            "message": "Review not found"
        }), 404

    return jsonify(
        ReviewResponse
        .model_validate(review)
        .model_dump(mode="json")
    ), 200

@review_bp.get("/content/<int:content_id>")
def get_reviews_by_content_api(content_id):
    skip = request.args.get("skip",default=0,type=int)

    limit = request.args.get("limit",default=20,type=int)

    reviews = get_reviews_by_content(
        content_id=content_id,
        skip=skip,
        limit=limit
    )

    return jsonify([
        ReviewResponse
        .model_validate(review)
        .model_dump(mode="json")
        for review in reviews
    ]), 200

@review_bp.patch("/<int:review_id>")
@token_required
def update_review_api(review_id):
    user_id = g.current_user.id
    review = get_review(review_id=review_id)

    if review is None:
        return jsonify({
            "message": "Review not found"
        }), 404

    if(user_id != review.user_id):
        return jsonify({
            "message": "Comment your reviews"
        }), 403
    
    try:
        data = ReviewUpdate.model_validate(request.get_json(silent=True) or {})
    except ValidationError as error:
        return jsonify({
            "message": "Rating must be a whole number from 0 to 5",
            "errors": error.errors(include_url=False, include_context=False)
        }), 400

    review = update_review(
        review_id=review_id,
        rating=data.rating,
        comment=data.comment
    )

    return jsonify(
        ReviewResponse
        .model_validate(review)
        .model_dump(mode="json")
    ), 200


@review_bp.delete("/<int:review_id>")
@token_required
def delete_review_api(review_id):
    review = get_review(review_id)

    if review is None:
        return jsonify({
            "message": "Review not found"
        }), 404

    if review.user_id != g.current_user.id and g.current_user.role != "admin":
        return jsonify({
            "message": "You can only delete your own review"
        }), 403

    delete_review(review_id)

    return jsonify({
        "message": "Review deleted successfully"
    }), 200