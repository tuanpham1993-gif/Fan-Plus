from flask import Blueprint, request, jsonify

from schema.bookmark import (
    BookmarkCreate,
    BookmarkResponse
)

from crud.bookmark import (
    get_bookmark,
    get_bookmarks_by_user,
    create_bookmark,
    delete_bookmark
)

bookmark_bp = Blueprint(
    "bookmark",
    __name__,
    url_prefix="/bookmarks"
)

# POST /bookmarks
@bookmark_bp.post("")
def create_bookmark_api():
    # Temporary:
    # replace this with authenticated user later
    user_id = 2

    data = BookmarkCreate.model_validate(
        request.get_json()
    )

    bookmark = create_bookmark(
        user_id=user_id,
        content_id=data.content_id
    )

    return jsonify(
        BookmarkResponse
        .model_validate(bookmark)
        .model_dump(mode="json")
    ), 201

# GET /bookmarks
@bookmark_bp.get("")
def get_bookmarks_api():

    # Temporary:
    # replace this with authenticated user later
    user_id = 1

    skip = request.args.get(
        "skip",
        default=0,
        type=int
    )

    limit = request.args.get(
        "limit",
        default=20,
        type=int
    )

    bookmarks = get_bookmarks_by_user(
        user_id=user_id,
        skip=skip,
        limit=limit
    )

    return jsonify([
        BookmarkResponse
        .model_validate(bookmark)
        .model_dump(mode="json")
        for bookmark in bookmarks
    ]), 200

# GET /bookmarks/<content_id>
@bookmark_bp.get("/<int:content_id>")
def get_bookmark_api(content_id):

    # Temporary:
    user_id = 1

    bookmark = get_bookmark(
        user_id=user_id,
        content_id=content_id
    )

    if bookmark is None:
        return jsonify({
            "bookmarked": False
        }), 200

    return jsonify({
        "bookmarked": True,
        "bookmark": BookmarkResponse
            .model_validate(bookmark)
            .model_dump(mode="json")
    }), 200

# DELETE /bookmarks/<content_id>
@bookmark_bp.delete("/<int:content_id>")
def delete_bookmark_api(content_id):

    # Temporary:
    # replace this with authenticated user later
    user_id = 1

    bookmark = delete_bookmark(
        user_id=user_id,
        content_id=content_id
    )

    if bookmark is None:
        return jsonify({
            "message": "Bookmark not found"
        }), 404

    return jsonify({
        "message": "Bookmark deleted successfully"
    }), 200
