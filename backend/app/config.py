import os
import secrets
from pathlib import Path
from datetime import timedelta
ROOT = Path(__file__).resolve().parents[1]

def config_from_env():
    mode=os.getenv("APP_ENV","development")
    production=mode=="production"
    secret=os.getenv("SECRET_KEY")
    database_url=os.getenv("DATABASE_URL", "sqlite:///"+str(ROOT/"instance"/"fanhub-dev.db"))
    if production:
        if not secret or len(secret)<32:raise RuntimeError("Production SECRET_KEY must contain at least 32 random characters")
        if not database_url.startswith("mysql+pymysql://"):raise RuntimeError("Production profile requires the chosen MySQL database")
        if not os.getenv("RATELIMIT_STORAGE_URI","").startswith("redis://"):raise RuntimeError("Configure shared Redis rate limiting for production")
        if not os.getenv("PUBLIC_BASE_URL","").startswith("https://"):raise RuntimeError("PUBLIC_BASE_URL must use HTTPS in production")
        if not os.getenv("TRUSTED_HOSTS"):raise RuntimeError("Set TRUSTED_HOSTS in production")
    return {
        "APP_ENV":mode,"SECRET_KEY":secret or secrets.token_hex(32),"DATABASE_URL":database_url,
        "SESSION_COOKIE_NAME":"fanhub_session","SESSION_COOKIE_HTTPONLY":True,"SESSION_COOKIE_SECURE":production,"SESSION_COOKIE_SAMESITE":"Lax","PERMANENT_SESSION_LIFETIME":timedelta(hours=8),"SESSION_REFRESH_EACH_REQUEST":False,
        "REQUIRE_EMAIL_VERIFICATION":True,"WTF_CSRF_ENABLED":True,"WTF_CSRF_TIME_LIMIT":timedelta(hours=1),
        "MAX_CONTENT_LENGTH":1024*1024,"MAX_FORM_MEMORY_SIZE":64*1024,"MAX_FORM_PARTS":20,
        "RATELIMIT_STORAGE_URI":os.getenv("RATELIMIT_STORAGE_URI","memory://"),"RATELIMIT_DEFAULT":"120 per minute","RATELIMIT_HEADERS_ENABLED":True,
        "PUBLIC_BASE_URL":os.getenv("PUBLIC_BASE_URL","http://127.0.0.1:5000").rstrip("/"),
        "TRUSTED_HOSTS":[h.strip() for h in os.getenv("TRUSTED_HOSTS","localhost,127.0.0.1").split(",") if h.strip()],
        "FRONTEND_DIST":os.getenv("FRONTEND_DIST",str(ROOT.parent/"frontend"/"dist")),
        "SMTP_HOST":os.getenv("SMTP_HOST",""),"SMTP_PORT":int(os.getenv("SMTP_PORT","587")),"SMTP_USER":os.getenv("SMTP_USER",""),"SMTP_PASSWORD":os.getenv("SMTP_PASSWORD",""),"MAIL_FROM":os.getenv("MAIL_FROM","noreply@example.com"),
        "DEV_MAILBOX":not production,"MAILBOX_PATH":str(ROOT/"instance"/"dev-mailbox"),
        "TESTING":False,"DEBUG":False,
    }
