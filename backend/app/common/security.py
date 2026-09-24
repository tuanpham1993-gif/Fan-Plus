from hashlib import sha256
from secrets import token_urlsafe
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)
# A dummy hash keeps unknown-user logins on the password verification path.
_DUMMY = hasher.hash(token_urlsafe(32))
def hash_password(password: str) -> str:
    return hasher.hash(password)
def verify_password(encoded: str | None, password: str) -> bool:
    try:
        result = hasher.verify(encoded or _DUMMY, password)
        return bool(result and encoded)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False
def new_token() -> tuple[str,str]:
    raw = token_urlsafe(32)
    return raw, token_digest(raw)
def token_digest(raw: str) -> str:
    return sha256(raw.encode("utf-8")).hexdigest()
