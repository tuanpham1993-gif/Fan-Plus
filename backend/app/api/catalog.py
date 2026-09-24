from flask import Blueprint,g
from sqlalchemy import select
from app.models import Category,Fandom,Genre,Tag,FandomCategory
from .helpers import ok
bp=Blueprint("catalog",__name__,url_prefix="/api/v1")
@bp.get("/categories")
def categories():
    values=g.db.scalars(select(Category).order_by(Category.sort_order,Category.id)).all()
    return ok([{"id":x.id,"slug":x.slug,"name":x.name,"description":x.description} for x in values])
@bp.get("/fandoms")
def fandoms():
    values=g.db.scalars(select(Fandom).order_by(Fandom.name).limit(500)).all()
    return ok([{"id":x.id,"slug":x.slug,"name":x.name} for x in values])
@bp.get("/genres")
def genres():return ok([{"id":x.id,"name":x.name} for x in g.db.scalars(select(Genre).order_by(Genre.name).limit(200))])
@bp.get("/tags")
def tags():return ok([{"id":x.id,"name":x.name} for x in g.db.scalars(select(Tag).order_by(Tag.name).limit(500))])
