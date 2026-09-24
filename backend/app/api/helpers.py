from functools import wraps
from flask import g, request, jsonify
from pydantic import ValidationError
from app.common.errors import DomainError
from app.services.policy import require_member, require_admin

def body(schema):
    if not request.is_json:raise DomainError("JSON_REQUIRED","Send application/json.",415)
    data=request.get_json(silent=False)
    if not isinstance(data,dict):raise DomainError("INVALID_BODY","Send a JSON object.",422)
    return schema.model_validate(data)
def query(schema):
    # Repeated query keys are rejected instead of silently choosing one value.
    if any(len(request.args.getlist(k))>1 for k in request.args):
        raise DomainError("DUPLICATE_QUERY_KEY","Do not repeat query parameters.",422)
    return schema.model_validate(request.args.to_dict())
def ok(data=None,*,status=200,meta=None):
    if status==204:return "",204
    result={"data":data,"request_id":g.request_id}
    if meta is not None:result["meta"]=meta
    return jsonify(result),status

def commit(data=None,*,status=200):
    g.db.commit()
    return ok(data,status=status)
def authenticated(fn):
    @wraps(fn)
    def wrapped(*args,**kwargs):
        require_member(g.actor)
        return fn(*args,**kwargs)
    return wrapped

def administrator(fn):
    @wraps(fn)
    def wrapped(*args,**kwargs):
        require_admin(g.actor)
        return fn(*args,**kwargs)
    return wrapped
