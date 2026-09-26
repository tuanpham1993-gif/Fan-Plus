from flask import Blueprint, request, jsonify
from middleware.auth_middleware import admin_required, token_required
from flask import Blueprint, request, jsonify, g
from schema.review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse
)

from crud.review import (
    get_review,
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


@review_bp.post("")
@token_required
def create_review_api():
    user_id = g.current_user.id

    data = ReviewCreate.model_validate(
        request.get_json()
    )
    data.user_id = user_id

    review = create_review(
        user_id=data.user_id,
        content_id=data.content_id,
        rating=data.rating,
        comment=data.comment
    )

    return jsonify(
        ReviewResponse
        .model_validate(review)
        .model_dump(mode="json")
    ), 201


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
    
    data = ReviewUpdate.model_validate(
        request.get_json()
    )

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
    review = delete_review(review_id)

    if review is None:
        return jsonify({
            "message": "Review not found"
        }), 404

    return jsonify({
        "message": "Review deleted successfully"
    }), 200