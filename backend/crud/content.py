from models.content import Content
from extensions import db
from models.contentreaction import ContentReaction
from sqlalchemy import func, case

def build_content_query(category_id=None, title=None, content_type=None):
    query = Content.query

    if category_id is not None:
        query = query.filter(Content.category_id == category_id)

    if title is not None:
        title = title.strip().lower()
        query = query.filter(db.func.lower(Content.title).like(f"%{title}%"))

    if content_type is not None:
        query = query.filter(Content.content_type == content_type)

    return query

def count_content_by_category(category_id):
    normal_content_count = (
        build_content_query(category_id=category_id).filter(
            Content.content_type.in_(["NEWS", "ARTICLE"])
            ).count()
            )

    event_count = (
        build_content_query(category_id=category_id).filter(
            Content.content_type == "EVENT"
            ).count()
            )

    return {"content_count": normal_content_count,
        "event_count": event_count}

def get_content(content_id):
    return Content.query.get(content_id)

def get_contents(
    category_id=None,
    title=None,
    content_type=None,
    skip=0,
    limit=20,
    sort_by="created_at",
    sort_order="desc"
):
    query = build_content_query(category_id=category_id,title=title,content_type=content_type)
    total = query.count()
    query = query.outerjoin(ContentReaction,ContentReaction.content_id == Content.id)

    like_count = func.sum(case((ContentReaction.reaction_type == "LIKE", 1),else_=0))

    dislike_count = func.sum(case((ContentReaction.reaction_type == "DISLIKE", 1),else_=0))

    query = query.add_columns(like_count.label("like_count"),dislike_count.label("dislike_count"))

    query = query.group_by(Content.id)
        
    if sort_by == "updated_at":
        column = Content.updated_at
    elif sort_by == "like":
        column = like_count
    else:
        column = Content.created_at

    if sort_order == "desc":
        query = query.order_by(column.desc())
    else:
        query = query.order_by(column.asc())

    contents = query.offset(skip).limit(limit).all()

    return total, contents
    

def create_content(author_id,category_id,title,body,content_type,):
    content = Content(author_id=author_id,category_id=category_id,
                      title=title,body=body,content_type=content_type)

    db.session.add(content)
    db.session.commit()
    db.session.refresh(content)

    return content

def update_content(content_id,category_id=None,title=None,body=None,content_type=None):

    content = get_content(content_id)

    if content is None:
        return None

    if category_id is not None:
        content.category_id = category_id

    if title is not None:
        content.title = title

    if body is not None:
        content.body = body

    if content_type is not None:
        content.content_type = content_type

    db.session.commit()
    db.session.refresh(content)

    return content

def delete_content(content_id):
    content = get_content(content_id)

    if content is None:
        return None

    db.session.delete(content)
    db.session.commit()

    return content