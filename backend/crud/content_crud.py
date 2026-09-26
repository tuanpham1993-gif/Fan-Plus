import re
from extensions import db
from models.content import Content
from models.category import Category

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

def get_contents(category_id=None, category_slug=None, search_q='', sort_by='newest', featured_only=False):
    query = Content.query

    if category_id:
        query = query.filter(Content.category_id == category_id)
    elif category_slug:
        cat = Category.query.filter_by(slug=category_slug).first()
        if cat:
            query = query.filter(Content.category_id == cat.id)

    if search_q:
        pattern = f"%{search_q}%"
        query = query.filter(
            (Content.title.ilike(pattern)) | 
            (Content.summary.ilike(pattern)) |
            (Content.tags.ilike(pattern))
        )

    if featured_only:
        query = query.filter(Content.featured == True)

    if sort_by == 'oldest':
        query = query.order_by(Content.created_at.asc())
    elif sort_by == 'popular':
        query = query.order_by(Content.view_count.desc(), Content.created_at.desc())
    else:
        query = query.order_by(Content.created_at.desc())

    return query.all()

def get_content_by_id(content_id):
    return db.session.query(Content).get(content_id)

def increment_content_views(content):
    content.view_count += 1
    db.session.commit()
    return content

def get_related_contents(category_id, current_content_id, limit=3):
    return Content.query.filter(
        Content.category_id == category_id,
        Content.id != current_content_id
    ).order_by(Content.created_at.desc()).limit(limit).all()

def create_content(title, summary, content_body, category_id, author_id, character_id=None, cover_image='', featured=False, tags=''):
    slug = generate_unique_slug(title)
    new_content = Content(
        title=title,
        slug=slug,
        summary=summary,
        content=content_body,
        cover_image=cover_image or 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
        category_id=category_id,
        character_id=character_id if character_id else None,
        author_id=author_id,
        featured=featured,
        tags=tags
    )
    db.session.add(new_content)
    db.session.commit()
    return new_content

def update_content(content, data):
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
    return content

def delete_content(content):
    db.session.delete(content)
    db.session.commit()
    return True
