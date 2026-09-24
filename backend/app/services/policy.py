from app.common.errors import DomainError

def require_member(actor):
    if actor is None:
        raise DomainError("AUTH_REQUIRED", "Sign in to continue.", 401)
    if actor.suspended_at:
        raise DomainError("ACCOUNT_SUSPENDED", "This account is suspended.", 403)
    return actor

def require_admin(actor):
    require_member(actor)
    if actor.role != "admin":
        raise DomainError("FORBIDDEN", "Administrator access is required.", 403)
    return actor
