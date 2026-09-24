from models.content import Content
from extensions import db

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
    category_id=None, title=None, content_type=None,
    skip=0, limit=20,
    sort_by="created_at", sort_order="desc"):

    query = build_content_query(category_id=category_id,title=title,content_type=content_type,)

    total = query.count()

    if sort_by == "created_at":
        column = Content.created_at
    else:
        column = Content.updated_at

    if sort_order == "desc":
        query = query.order_by(column.desc())
    else:
        query = query.order_by(column.asc())

    contents = query.offset(skip).limit(limit).all()

    return contents, total

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