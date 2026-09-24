from flask import Blueprint,g
from app.extensions import limiter
from app.schemas.requests import FeedbackInput
from app.services.feedback import create_feedback
from .helpers import body,commit
bp=Blueprint("feedback",__name__,url_prefix="/api/v1/feedback")
@bp.post("")
@limiter.limit("10 per hour")
def feedback():return commit(create_feedback(g.db,g.actor,body(FeedbackInput)),status=201)
