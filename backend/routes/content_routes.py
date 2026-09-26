from flask import Blueprint, request, jsonify, g
from crud import content_crud, category_crud
from schema.content_schema import validate_content_data
from middleware.auth_middleware import token_required

content_bp = Blueprint('content', __name__, url_prefix='/api/contents')

@content_bp.route('', methods=['GET'])
def get_contents():
    category_id = request.args.get('category_id', type=int)
    category_slug = request.args.get('category_slug')
    search_q = request.args.get('q', '').strip()
    sort_by = request.args.get('sort', 'newest')
    featured_only = request.args.get('featured', type=bool)

    contents = content_crud.get_contents(
        category_id=category_id,
        category_slug=category_slug,
        search_q=search_q,
        sort_by=sort_by,
        featured_only=featured_only
    )

    return jsonify({
        'count': len(contents),
        'contents': [c.to_dict(include_full=False) for c in contents]
    }), 200


@content_bp.route('/<int:content_id>', methods=['GET'])
def get_content_detail(content_id):
    content = content_crud.get_content_by_id(content_id)
    if not content:
        return jsonify({'error': 'Content not found'}), 404

    content_crud.increment_content_views(content)
    related = content_crud.get_related_contents(content.category_id, content.id, limit=3)

    return jsonify({
        'content': content.to_dict(include_full=True),
        'related': [r.to_dict(include_full=False) for r in related]
    }), 200


@content_bp.route('', methods=['POST'])
@token_required
def create_content():
    user = g.current_user
    data = request.get_json(silent=True) or {}
    is_valid, err_msg = validate_content_data(data, is_update=False)
    if not is_valid:
        return jsonify({'error': err_msg}), 400

    category_id = data.get('category_id')
    category = category_crud.get_category_by_id(category_id)
    if not category:
        return jsonify({'error': 'Invalid category'}), 400

    new_content = content_crud.create_content(
        title=data.get('title', '').strip(),
        summary=data.get('summary', '').strip(),
        content_body=data.get('content', '').strip(),
        category_id=category_id,
        author_id=user.id,
        character_id=data.get('character_id'),
        cover_image=data.get('cover_image', '').strip(),
        featured=bool(data.get('featured', False)),
        tags=data.get('tags', '').strip()
    )

    return jsonify({'message': 'Content published successfully', 'content': new_content.to_dict()}), 201


@content_bp.route('/<int:content_id>', methods=['PUT'])
@token_required
def update_content(content_id):
    user = g.current_user
    content = content_crud.get_content_by_id(content_id)
    if not content:
        return jsonify({'error': 'Content not found'}), 404

    if content.author_id != user.id and user.role != 'admin':
        return jsonify({'error': 'Permission denied'}), 403

    data = request.get_json(silent=True) or {}
    updated_content = content_crud.update_content(content, data)

    return jsonify({'message': 'Content updated successfully', 'content': updated_content.to_dict()}), 200


@content_bp.route('/<int:content_id>', methods=['DELETE'])
@token_required
def delete_content(content_id):
    user = g.current_user
    content = content_crud.get_content_by_id(content_id)
    if not content:
        return jsonify({'error': 'Content not found'}), 404

    if content.author_id != user.id and user.role != 'admin':
        return jsonify({'error': 'Permission denied'}), 403

    content_crud.delete_content(content)
    return jsonify({'message': 'Content deleted successfully'}), 200
