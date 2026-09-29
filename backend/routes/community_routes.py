from flask import Blueprint, jsonify, request

from crud.community_crud import (
    get_posts,
    create_post,
    add_comment
)


community_bp = Blueprint("community", __name__, url_prefix="/api/community")

@community_bp.route("/bookmarks", methods=["GET"], strict_slashes=False)
def get_community_bookmarks():
    return jsonify([])

@community_bp.route("/", methods=["GET"], strict_slashes=False)
def feed():
    posts = get_posts()
    return jsonify({
        "posts": [
           {
                "id": str(p.id),
                "authorId": str(p.user_id),
                "authorName": "Fan Hub User",
                "title": p.title,
                "subject": p.subject,
                "body": p.body,
                "topic": p.topic,
                "format": p.format,
                "mediaUrl": p.media_url,
                "spoiler": p.spoiler,
                "rating": p.rating,
                "status": p.status,
                "createdAt": p.created_at.isoformat() if p.created_at else None,
                "version": 1
            }
            for p in posts
        ],
        "comments": [],
        "reactions": []
    })



@community_bp.route(
    "/posts",
    methods=["POST"]
)
def create():
    data=request.json
    post=create_post(data)
    return jsonify({
        "message":"created",
        "id":post.id
    }),201
@community_bp.route(
    "/posts/<int:id>/comments",
    methods=["POST"]
)
def comment(id):
    data=request.json
    comment=add_comment(
        id,
        data["user_id"],
        data["body"]
    )
    return jsonify({
        "id":comment.id
    }),201