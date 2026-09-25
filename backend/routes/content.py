from flask import Blueprint, request, jsonify

from crud.content import (
    create_content,
    get_content,
    get_contents,
    update_content,
    delete_content
)

from schema.content import (
    ContentCreate,
    ContentUpdate,
    ContentResponse
)

content_bp = Blueprint(
    "content",
    __name__,
    url_prefix="/contents"
)

@content_bp.get("/<int:content_id>")
def get_one(content_id):
    content = get_content(content_id)

    if content is None:
        return jsonify({
            "message": "Content not found"
        }), 404

    response = ContentResponse.model_validate(content)

    return jsonify(response.model_dump()), 200

@content_bp.post("")
def create():
    data = ContentCreate.model_validate(request.json)

    #fix later
    content = create_content(author_id=1 ,category_id=data.category_id,title=data.title,body=data.body,content_type=data.content_type
    )

    response = ContentResponse.model_validate(content)

    return jsonify(response.model_dump()), 201

@content_bp.get("")
def get_list():
    category_id = request.args.get("category_id",type=int)

    title = request.args.get("title")

    content_type = request.args.get("content_type")

    skip = request.args.get("skip",default=0,type=int)

    limit = request.args.get("limit",default=20,type=int)

    total, contents = get_contents(
        category_id=category_id,
        title=title,
        content_type=content_type,
        skip=skip,
        limit=limit
    )
    return jsonify({
    "total": total,
    "items": [
        {
            **ContentResponse.model_validate(content).model_dump(),
            "like_count": like_count,
            "dislike_count": dislike_count
        }
        for content, like_count, dislike_count in contents]
    }), 200

@content_bp.patch("/<int:content_id>")
def update(content_id):
    data = ContentUpdate.model_validate(request.json)

    content = update_content(
        content_id=content_id,
        category_id=data.category_id,
        title=data.title,
        body=data.body,
        content_type=data.content_type
    )

    if content is None:
        return jsonify({
            "message": "Content not found"
        }), 404

    response = ContentResponse.model_validate(content)

    return jsonify(response.model_dump()), 200

@content_bp.delete("/<int:content_id>")
def delete(content_id):
    content = delete_content(content_id)
    if content is None:
        return jsonify({"message": "Content not found"}), 404

    return jsonify({"message": "Content deleted successfully"}), 200