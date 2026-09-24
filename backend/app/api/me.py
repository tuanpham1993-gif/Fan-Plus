from flask import Blueprint,g
from sqlalchemy import select,func
from app.models import Bookmark,FanSubmission,Activity,UserCategory,UserFandom,UserSetting,Resource
from app.schemas.requests import ProfileInput,PageQuery,BookmarkInput,SubmissionInput
from app.services import auth,library,moderation
from .helpers import body,query,ok,commit,authenticated
bp=Blueprint("me",__name__,url_prefix="/api/v1/me")
@bp.get("/profile")
@authenticated
def profile():return ok(auth.user_dto(g.actor))
@bp.patch("/profile")
@authenticated
def update_profile():
    payload=body(ProfileInput);g.actor.display_name=payload.display_name;g.actor.bio=payload.bio
    return commit(auth.user_dto(g.actor))
@bp.get("/dashboard")
@authenticated
def dashboard():
    return ok({"user":auth.user_dto(g.actor),"bookmark_count":g.db.scalar(select(func.count()).select_from(Bookmark).where(Bookmark.user_id==g.actor.id)),"submission_count":g.db.scalar(select(func.count()).select_from(FanSubmission).where(FanSubmission.author_id==g.actor.id))})
@bp.get("/bookmarks")
@authenticated
def bookmarks():
    items,meta=library.list_bookmarks(g.db,g.actor,query(PageQuery));return ok(items,meta=meta)
@bp.put("/bookmarks/<resource_id>")
@authenticated
def save_bookmark(resource_id):return commit(library.save_bookmark(g.db,g.actor,resource_id,body(BookmarkInput).note))
@bp.delete("/bookmarks/<resource_id>")
@authenticated
def remove_bookmark(resource_id):library.remove_bookmark(g.db,g.actor,resource_id);return commit(status=204)
@bp.get("/submissions")
@authenticated
def submissions():
    items,meta=moderation.list_submissions(g.db,g.actor,query(PageQuery));return ok(items,meta=meta)
@bp.post("/submissions")
@authenticated
def submit_story():return commit(moderation.submit_story(g.db,g.actor,body(SubmissionInput)),status=201)
