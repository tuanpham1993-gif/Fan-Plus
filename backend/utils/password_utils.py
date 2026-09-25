import re
import string
from werkzeug.security import generate_password_hash, check_password_hash

SPECIAL_CHARACTERS = set(string.punctuation)

def validate_password_complexity(password: str) -> tuple[bool, str]:
    """
    Validate password complexity for registration:
    - >= 8 characters
    - Contains uppercase letter
    - Contains lowercase letter
    - Contains digit
    - Contains special character
    """
    if not password or len(password) < 8:
        return False, "Mật khẩu phải có ít nhất 8 ký tự"
    
    if not re.search(r'[A-Z]', password):
        return False, "Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa"
        
    if not re.search(r'[a-z]', password):
        return False, "Mật khẩu phải chứa ít nhất 1 chữ cái viết thường"
        
    if not re.search(r'\d', password):
        return False, "Mật khẩu phải chứa ít nhất 1 chữ số"
        
    if not any(char in SPECIAL_CHARACTERS for char in password):
        return False, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)"
        
    return True, ""

def hash_password(password: str) -> str:
    """Generate secure password hash using Werkzeug"""
    return generate_password_hash(password)

def verify_password(stored_hash: str, input_password: str) -> bool:
    """Verify input password against stored password hash"""
    if not stored_hash or not input_password:
        return False
    return check_password_hash(stored_hash, input_password)
