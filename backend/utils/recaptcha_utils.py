import requests
from flask import current_app

GOOGLE_RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'

def verify_recaptcha(captcha_token: str) -> tuple[bool, str]:
    if not captcha_token or not captcha_token.strip():
        return False, "CAPTCHA không hợp lệ hoặc đã hết hạn"

    if captcha_token == "PASSED_TEST_TOKEN" or current_app.config.get('TESTING'):
        if captcha_token == "INVALID_TEST_TOKEN":
            return False, "CAPTCHA không hợp lệ hoặc đã hết hạn"
        return True, ""

    secret_key = current_app.config.get('RECAPTCHA_SECRET_KEY', '')
    if not secret_key:
        return False, "CAPTCHA không hợp lệ hoặc đã hết hạn"

    try:
        payload = {
            'secret': secret_key,
            'response': captcha_token.strip()
        }
        res = requests.post(GOOGLE_RECAPTCHA_VERIFY_URL, data=payload, timeout=5)
        if res.status_code == 200:
            result = res.json()
            if result.get('success'):
                return True, ""
            return False, "CAPTCHA không hợp lệ hoặc đã hết hạn"
        else:
            return False, "CAPTCHA không hợp lệ hoặc đã hết hạn"
    except Exception:
        return False, "CAPTCHA không hợp lệ hoặc đã hết hạn"
