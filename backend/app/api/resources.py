from flask import Blueprint,g
from app.schemas.requests import SearchQuery,RatingInput
from app.services import catalog,library
from .helpers import query,body,ok,commit,authenticated
bp=Blueprint("resources",__name__,url_prefix="/api/v1/resources")
@bp.get("")
def index():
    items,meta=catalog.list_resources(g.db,query(SearchQuery));return ok(items,meta=meta)
@bp.get("/<resource_id>")
def detail(resource_id):return ok(catalog.get_public_resource(g.db,resource_id))
@bp.put("/<resource_id>/rating")
@authenticated
def rating(resource_id):return commit(library.rate_resource(g.db,g.actor,resource_id,body(RatingInput).value))
