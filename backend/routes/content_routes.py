from flask import Blueprint, request, jsonify
from extensions import db
from models import Content, Category, User, Bookmark
from flask_jwt_extended import jwt_required, get_jwt_identity, jwt_required
import re
import uuid

content_bp = Blueprint('content', __name__, url_prefix='/api/contents')

def is_admin(user_id):
    u = User.query.get(int(user_id))
    return u and u.role and u.role.name == 'Admin'

def generate_unique_slug(title, content_id=None):
    base_slug = re.sub(r'[^\w\s-]', '', title.lower().strip())
    base_slug = re.sub(r'[\s_-]+', '-', base_slug) or 'content'
    slug = base_slug
    counter = 1
    query = Content.query.filter_by(slug=slug)
    if content_id:
        query = query.filter(Content.id != content_id)
    while query.first():
        slug = f"{base_slug}-{counter}"
        counter += 1
        query = Content.query.filter_by(slug=slug)
        if content_id:
            query = query.filter(Content.id != content_id)
    return slug

@content_bp.route('', methods=['GET'])
def get_contents():
    category_id = request.args.get('category_id', type=int)
    category_slug = request.args.get('category_slug')
    search_q = request.args.get('q', '').strip()
    sort_by = request.args.get('sort', 'newest') # newest, oldest, popular
    featured_only = request.args.get('featured', type=bool)

    query = Content.query

    # Filter by category
    if category_id:
        query = query.filter(Content.category_id == category_id)
    elif category_slug:
        cat = Category.query.filter_by(slug=category_slug).first()
        if cat:
            query = query.filter(Content.category_id == cat.id)

    # Search filter
    if search_q:
        pattern = f"%{search_q}%"
        query = query.filter(
            (Content.title.ilike(pattern)) | 
            (Content.summary.ilike(pattern)) |
            (Content.tags.ilike(pattern))
        )

    # Featured filter
    if featured_only:
        query = query.filter(Content.featured == True)

    # Sorting logic
    if sort_by == 'oldest':
        query = query.order_by(Content.created_at.asc())
    elif sort_by == 'popular':
        query = query.order_by(Content.view_count.desc(), Content.created_at.desc())
    else:
        # Default: newest
        query = query.order_by(Content.created_at.desc())

    contents = query.all()
    return jsonify({
        'count': len(contents),
        'contents': [c.to_dict(include_full=False) for c in contents]
    }), 200


@content_bp.route('/<int:content_id>', methods=['GET'])
def get_content_detail(content_id):
    content = Content.query.get(content_id)
    if not content:
        return jsonify({'error': 'Content not found'}), 404

    # Increment view count
    content.view_count += 1
    db.session.commit()

    # Get related content in same category
    related = Content.query.filter(
        Content.category_id == content.category_id,
        Content.id != content.id
    ).order_by(Content.created_at.desc()).limit(3).all()

    return jsonify({
        'content': content.to_dict(include_full=True),
        'related': [r.to_dict(include_full=False) for r in related]
    }), 200


@content_bp.route('', methods=['POST'])
@jwt_required()
def create_content():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    title = data.get('title', '').strip()
    summary = data.get('summary', '').strip()
    body_content = data.get('content', '').strip()
    category_id = data.get('category_id')
    character_id = data.get('character_id')
    cover_image = data.get('cover_image', '').strip()
    featured = bool(data.get('featured', False))
    tags = data.get('tags', '').strip()

    if not title or not summary or not body_content or not category_id:
        return jsonify({'error': 'Title, summary, content body, and category_id are required'}), 400

    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Invalid category'}), 400

    slug = generate_unique_slug(title)

    new_content = Content(
        title=title,
        slug=slug,
        summary=summary,
        content=body_content,
        cover_image=cover_image or 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
        category_id=category_id,
        character_id=character_id if character_id else None,
        author_id=user.id,
        featured=featured,
        tags=tags
    )

    db.session.add(new_content)
    db.session.commit()

    return jsonify({'message': 'Content published successfully', 'content': new_content.to_dict()}), 201


@content_bp.route('/<int:content_id>', methods=['PUT'])
@jwt_required()
def update_content(content_id):
    current_user_id = get_jwt_identity()
    content = Content.query.get(content_id)
    if not content:
        return jsonify({'error': 'Content not found'}), 404

    # Allow update if author or admin
    if content.author_id != int(current_user_id) and not is_admin(current_user_id):
        return jsonify({'error': 'Permission denied'}), 403

    data = request.get_json() or {}
    if 'title' in data and data['title'].strip():
        content.title = data['title'].strip()
        content.slug = generate_unique_slug(content.title, content_id=content.id)
    if 'summary' in data:
        content.summary = data['summary'].strip()
    if 'content' in data:
        content.content = data['content'].strip()
    if 'category_id' in data:
        content.category_id = int(data['category_id'])
    if 'character_id' in data:
        content.character_id = int(data['character_id']) if data['character_id'] else None
    if 'cover_image' in data:
        content.cover_image = data['cover_image'].strip()
    if 'featured' in data:
        content.featured = bool(data['featured'])
    if 'tags' in data:
        content.tags = data['tags'].strip()

    db.session.commit()
    return jsonify({'message': 'Content updated successfully', 'content': content.to_dict()}), 200


@content_bp.route('/<int:content_id>', methods=['DELETE'])
@jwt_required()
def delete_content(content_id):
    current_user_id = get_jwt_identity()
    content = Content.query.get(content_id)
    if not content:
        return jsonify({'error': 'Content not found'}), 404

    if content.author_id != int(current_user_id) and not is_admin(current_user_id):
        return jsonify({'error': 'Permission denied'}), 403

    db.session.delete(content)
    db.session.commit()
    return jsonify({'message': 'Content deleted successfully'}), 200
