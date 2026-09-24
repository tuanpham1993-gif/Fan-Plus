from flask import Blueprint,g
from sqlalchemy import select,func
from app.models import Resource,User,FanSubmission,Feedback,AuditLog,utcnow,iso
from app.schemas.requests import ResourceInput,ResourceUpdateInput,DecisionInput,PageQuery,EventInput,FeedbackStatusInput,VersionInput,SuspendInput
from app.services import catalog,moderation,events,feedback,auth
from app.common.errors import DomainError
from .helpers import body,query,ok,commit,administrator
bp=Blueprint("admin",__name__,url_prefix="/api/v1/admin")
@bp.get("/overview")
@administrator
def overview():
    return ok({"registered_users":g.db.scalar(select(func.count()).select_from(User)),"published_resources":g.db.scalar(select(func.count()).select_from(Resource).where(*catalog.public_filter())),"pending_submissions":g.db.scalar(select(func.count()).select_from(FanSubmission).where(FanSubmission.status=="pending")),"open_feedback":g.db.scalar(select(func.count()).select_from(Feedback).where(Feedback.status=="open"))})
@bp.get("/resources")
@administrator
def resources():
    from math import ceil
    q=query(PageQuery);total=g.db.scalar(select(func.count()).select_from(Resource)) or 0
    values=g.db.scalars(select(Resource).order_by(Resource.created_at.desc(),Resource.id).offset((q.page-1)*q.page_size).limit(q.page_size)).all()
    return ok([{"id":x.id,"title":x.title,"kind":x.kind,"status":x.status,"version":x.version,"updated_at":iso(x.updated_at)} for x in values],meta={"page":q.page,"page_size":q.page_size,"total":total,"total_pages":ceil(total/q.page_size)})
@bp.post("/resources")
@administrator
def create_resource():
    item=catalog.create_resource(g.db,g.actor,body(ResourceInput),g.request_id)
    return commit({"id":item.id,"version":item.version,"status":item.status},status=201)
@bp.put("/resources/<resource_id>")
@administrator
def update_resource(resource_id):
    data=body(ResourceUpdateInput);payload=ResourceInput.model_validate(data.model_dump(exclude={"expected_version"}))
    item=catalog.update_resource(g.db,g.actor,resource_id,payload,data.expected_version,g.request_id)
    return commit({"id":item.id,"version":item.version,"status":item.status})
@bp.post("/resources/<resource_id>/archive")
@administrator
def archive(resource_id):catalog.archive_resource(g.db,g.actor,resource_id,body(VersionInput).expected_version,g.request_id);return commit(status=204)
@bp.get("/submissions")
@administrator
def submissions():
    items,meta=moderation.list_submissions(g.db,g.actor,query(PageQuery),admin=True);return ok(items,meta=meta)
@bp.post("/submissions/<submission_id>/decision")
@administrator
def decision(submission_id):return commit(moderation.decide_submission(g.db,g.actor,submission_id,body(DecisionInput),g.request_id))
@bp.post("/events")
@administrator
def create_event():return commit(events.create_event(g.db,g.actor,body(EventInput),g.request_id),status=201)
@bp.get("/feedback")
@administrator
def feedback_queue():
    items,meta=feedback.list_feedback(g.db,g.actor,query(PageQuery));return ok(items,meta=meta)
@bp.patch("/feedback/<feedback_id>")
@administrator
def feedback_status(feedback_id):return commit(feedback.resolve_feedback(g.db,g.actor,feedback_id,body(FeedbackStatusInput).status,g.request_id))
@bp.patch("/users/<user_id>/suspension")
@administrator
def suspend(user_id):
    data=body(SuspendInput)
    if user_id==g.actor.id:raise DomainError("SELF_SUSPENSION","You cannot suspend your own account.",422)
    user=g.db.get(User,user_id)
    if not user:raise DomainError("NOT_FOUND","User was not found.",404)
    if user.role=="admin":raise DomainError("ADMIN_ACCOUNT","Use an audited operator procedure for administrator accounts.",403)
    user.suspended_at=utcnow() if data.suspended else None
    if data.suspended:auth.revoke_all(g.db,user.id)
    g.db.add(AuditLog(actor_id=g.actor.id,action="user.suspension",target_type="user",target_id=user.id,request_id=g.request_id,details={"suspended":data.suspended}))
    return commit({"id":user.id,"suspended":data.suspended})
