import pytest
from sqlalchemy import select,func
from app.models import Resource,FanSubmission,ModerationAction,AuditLog
from app.schemas.requests import SubmissionInput,DecisionInput,PageQuery
from app.services import moderation
from app.common.errors import DomainError

def submit(db,actor):
    return moderation.submit_story(db,actor,SubmissionInput(title="An original submission",category_id="anime",body_markdown="An original observation about fan culture. "*5,ownership_confirmed=True))

def test_pending_never_public_and_owner_list(db,people):
    item=submit(db,people["alice"]);db.commit()
    assert item["status"]=="pending" and db.scalar(select(func.count()).select_from(Resource))==0
    assert moderation.list_submissions(db,people["bob"],PageQuery())[1]["total"]==0

def test_approval_atomic_and_exactly_one_resource(db,people):
    item=submit(db,people["alice"]);db.commit()
    result=moderation.decide_submission(db,people["admin"],item["id"],DecisionInput(decision="approve",expected_version=1));db.commit()
    resource=db.get(Resource,result["resource_id"])
    assert resource.author_id=="alice" and resource.status=="published"
    assert db.scalar(select(func.count()).select_from(ModerationAction))==1
    assert db.scalar(select(func.count()).select_from(AuditLog))==1
    with pytest.raises(DomainError):moderation.decide_submission(db,people["admin"],item["id"],DecisionInput(decision="approve",expected_version=1))
    assert db.scalar(select(func.count()).select_from(Resource))==1

def test_caller_rollback_restores_approval(db,people):
    item=submit(db,people["alice"]);db.commit()
    moderation.decide_submission(db,people["admin"],item["id"],DecisionInput(decision="approve",expected_version=1))
    db.rollback()
    assert db.get(FanSubmission,item["id"]).status=="pending"
    assert db.scalar(select(func.count()).select_from(Resource))==0
    assert db.scalar(select(func.count()).select_from(ModerationAction))==0

def test_rejection_no_resource(db,people):
    item=submit(db,people["alice"]);db.commit()
    moderation.decide_submission(db,people["admin"],item["id"],DecisionInput(decision="reject",expected_version=1,reason="Please provide a verifiable source."));db.commit()
    assert db.get(FanSubmission,item["id"]).status=="rejected"
    assert db.scalar(select(func.count()).select_from(Resource))==0

def test_cannot_self_review(db,people):
    item=submit(db,people["admin"]);db.commit()
    with pytest.raises(DomainError) as e:moderation.decide_submission(db,people["admin"],item["id"],DecisionInput(decision="approve",expected_version=1))
    assert e.value.code=="SELF_REVIEW"
