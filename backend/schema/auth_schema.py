import re
from utils.password_utils import validate_password_complexity
from utils.recaptcha_utils import verify_recaptcha

def validate_register_data(data):
    data = data or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    captcha_token = data.get('captcha_token', '').strip()

    if not name or not email or not password:
        return False, 'Please enter your Name, Email and Password'

    if captcha_token:
        is_captcha_valid, captcha_err = verify_recaptcha(captcha_token)
        if not is_captcha_valid:
            return False, captcha_err

    email_regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(email_regex, email):
        return False, 'Invalid email format'

    is_valid_pw, pw_error = validate_password_complexity(password)
    if not is_valid_pw:
        return False, pw_error

    return True, None

def validate_login_data(data):
    data = data or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    # captcha_token = data.get('captcha_token', '').strip()

    if not email or not password:
        return False, 'Please enter your Email and Password'

    # if captcha_token:
    #     is_captcha_valid, captcha_err = verify_recaptcha(captcha_token)
    #     if not is_captcha_valid:
    #         return False, captcha_err

    return True, None

def validate_forgot_password_data(data):
    data = data or {}
    email = data.get('email', '').strip().lower()
    if not email:
        return False, 'Please enter your Email to recover your password'
    email_regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(email_regex, email):
        return False, 'Invalid email format'
    return True, None

def validate_reset_password_data(data):
    data = data or {}
    reset_token = data.get('reset_token', '').strip()
    new_password = data.get('new_password', '')

    if not reset_token or not new_password:
        return False, 'Please enter the Confirmation Code (Reset Token) and a new Password'

    is_valid_pw, pw_error = validate_password_complexity(new_password)
    if not is_valid_pw:
        return False, pw_error

    return True, None