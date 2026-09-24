from sqlalchemy import select, func
from math import ceil
from app.models import Feedback, AuditLog, iso
from app.common.errors import DomainError
from .policy import require_admin

def create_feedback(db,actor,payload):
    item=Feedback(user_id=actor.id if actor else None,kind=payload.kind,message=payload.message,status="open")
    db.add(item);db.flush()
    return {"id":item.id,"status":item.status}

def list_feedback(db,actor,query):
    require_admin(actor)
    total=db.scalar(select(func.count()).select_from(Feedback)) or 0
    items=db.scalars(select(Feedback).order_by(Feedback.created_at.desc(),Feedback.id).offset((query.page-1)*query.page_size).limit(query.page_size)).all()
    return [{"id":x.id,"user_id":x.user_id,"kind":x.kind,"message":x.message,"status":x.status,"created_at":iso(x.created_at)} for x in items],{"page":query.page,"page_size":query.page_size,"total":total,"total_pages":ceil(total/query.page_size)}

def resolve_feedback(db,actor,feedback_id,status,request_id=None):
    require_admin(actor)
    item=db.get(Feedback,feedback_id)
    if not item:raise DomainError("NOT_FOUND","Feedback was not found.",404)
    item.status=status
    db.add(AuditLog(actor_id=actor.id,action="feedback.status",target_type="feedback",target_id=item.id,request_id=request_id,details={"status":status}))
    return {"id":item.id,"status":status}
