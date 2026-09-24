from sqlalchemy import select, update
from app.models import FanSubmission, Resource, ModerationAction, AuditLog, utcnow, iso
from app.common.errors import DomainError
from .policy import require_member, require_admin
from .catalog import validate_references, slugify

def submission_dto(s):
    return {"id":s.id,"author_id":s.author_id,"category_id":s.category_id,"fandom_id":s.fandom_id,"title":s.title,"body_markdown":s.body_markdown,"status":s.status,"rejection_reason":s.rejection_reason,"version":s.version,"created_at":iso(s.created_at)}

def submit_story(db,actor,payload):
    require_member(actor);validate_references(db,payload.category_id,payload.fandom_id)
    record=FanSubmission(author_id=actor.id,**payload.model_dump(exclude={"ownership_confirmed"}),status="pending")
    db.add(record);db.flush();return submission_dto(record)

def list_submissions(db,actor,query,*,admin=False):
    from math import ceil
    from sqlalchemy import func
    require_admin(actor) if admin else require_member(actor)
    conditions=[] if admin else [FanSubmission.author_id==actor.id]
    total=db.scalar(select(func.count()).select_from(FanSubmission).where(*conditions)) or 0
    records=db.scalars(select(FanSubmission).where(*conditions).order_by(FanSubmission.created_at.desc(),FanSubmission.id).offset((query.page-1)*query.page_size).limit(query.page_size)).all()
    return [submission_dto(x) for x in records],{"page":query.page,"page_size":query.page_size,"total":total,"total_pages":ceil(total/query.page_size)}

def decide_submission(db,actor,submission_id,payload,request_id=None):
    require_admin(actor)
    record=db.get(FanSubmission,submission_id)
    if not record:raise DomainError("NOT_FOUND","Submission was not found.",404)
    if record.author_id==actor.id:raise DomainError("SELF_REVIEW","Ask another administrator to review your submission.",403)
    target="approved" if payload.decision=="approve" else "rejected"
    result=db.execute(update(FanSubmission).where(FanSubmission.id==record.id,FanSubmission.status=="pending",FanSubmission.version==payload.expected_version).values(status=target,version=payload.expected_version+1,rejection_reason=payload.reason if target=="rejected" else ""),execution_options={"synchronize_session":False})
    if result.rowcount!=1:raise DomainError("VERSION_CONFLICT","This submission has already changed. Reload it.",409)
    resource_id=None
    if target=="approved":
        validate_references(db,record.category_id,record.fandom_id)
        resource=Resource(title=record.title,slug=slugify(record.title),summary=record.body_markdown[:350],body_markdown=record.body_markdown,kind="article",category_id=record.category_id,fandom_id=record.fandom_id,author_id=record.author_id,status="published",published_at=utcnow(),submission_id=record.id)
        db.add(resource);db.flush();resource_id=resource.id
    db.add(ModerationAction(submission_id=record.id,reviewer_id=actor.id,decision=target,reason=payload.reason))
    db.add(AuditLog(actor_id=actor.id,action="submission."+target,target_type="submission",target_id=record.id,request_id=request_id,details={"resource_id":resource_id}))
    return {"submission_id":record.id,"status":target,"version":payload.expected_version+1,"resource_id":resource_id}
