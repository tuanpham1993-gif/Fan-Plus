from pathlib import Path
from uuid import uuid4
from hashlib import sha256
import base64,re
from flask import Flask,g,request,session,jsonify,send_from_directory
from flask_wtf.csrf import CSRFError
from sqlalchemy.exc import IntegrityError,SQLAlchemyError
from pydantic import ValidationError
from werkzeug.exceptions import HTTPException
from .config import config_from_env
from .db import init_db
from .extensions import csrf,limiter
from .common.errors import DomainError
from .services.auth import resolve_session

def build_app(config_override=None):
    app=Flask(__name__,static_folder=None,instance_path=str(Path(__file__).resolve().parents[1]/"instance"))
    app.config.from_mapping(config_from_env())
    if config_override:app.config.update(config_override)
    init_db(app)

    @app.before_request
    def request_context():
        g.request_id=str(uuid4())
        g.db=app.extensions["db_sessions"]()
        # Static requests and public health do not need a user query.
        g.actor=resolve_session(g.db,session.get("sid")) if request.path.startswith("/api/v1/") and session.get("sid") else None

    csrf.init_app(app)
    limiter.init_app(app)
    from .api import auth,catalog,resources,me,events,feedback,admin,health
    for module in (auth,catalog,resources,me,events,feedback,admin,health):app.register_blueprint(module.bp)
    from .cli import register_commands
    register_commands(app)

    @app.teardown_request
    def close_session(error=None):
        db=g.pop("db",None)
        if db is not None:db.close() # rolls back any uncommitted transaction

    def failure(code,message,status,fields=None):
        if hasattr(g,"db"):g.db.rollback()
        return jsonify({"error":{"code":code,"message":message,"fields":fields or {}},"request_id":getattr(g,"request_id",str(uuid4()))}),status

    @app.errorhandler(DomainError)
    def domain_error(e):return failure(e.code,e.message,e.status,e.fields)
    @app.errorhandler(ValidationError)
    def validation_error(e):
        # Do not echo submitted values (especially passwords and tokens).
        fields={".".join(map(str,x["loc"])):x["msg"] for x in e.errors(include_input=False,include_context=False,include_url=False)}
        return failure("VALIDATION_ERROR","Check the request fields.",422,fields)
    @app.errorhandler(CSRFError)
    def csrf_error(e):return failure("CSRF_INVALID","Refresh the CSRF token and try again.",400)
    @app.errorhandler(IntegrityError)
    def conflict(e):return failure("CONFLICT","The record conflicts with existing data.",409)
    @app.errorhandler(HTTPException)
    def http_error(e):return failure("HTTP_"+str(e.code),e.name,e.code or 500)
    @app.errorhandler(SQLAlchemyError)
    def database_error(e):
        app.logger.error("Database operation failed request_id=%s",getattr(g,"request_id","unknown"))
        return failure("SERVICE_UNAVAILABLE","The database is temporarily unavailable.",503)
    @app.errorhandler(Exception)
    def unexpected(e):
        app.logger.error("Unexpected server error request_id=%s type=%s",getattr(g,"request_id","unknown"),type(e).__name__)
        return failure("INTERNAL_ERROR","The request could not be completed.",500)

    static=Path(app.config["FRONTEND_DIST"]).resolve()
    hashes=[]
    if (static/"index.html").is_file():
        html=(static/"index.html").read_text()
        for script in re.findall(r'<script type="importmap">(.*?)</script>',html,re.S):
            hashes.append("'sha256-"+base64.b64encode(sha256(script.encode()).digest()).decode()+"'")
    csp="default-src 'self'; script-src 'self' "+" ".join(hashes)+"; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https:; frame-src https://www.openstreetmap.org; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"

    @app.after_request
    def security_headers(response):
        response.headers["X-Request-ID"]=getattr(g,"request_id","")
        response.headers["X-Content-Type-Options"]="nosniff"
        response.headers["Referrer-Policy"]="same-origin"
        response.headers["X-Frame-Options"]="DENY"
        response.headers["Permissions-Policy"]="geolocation=(self), camera=(), microphone=()"
        response.headers["Content-Security-Policy"]=csp
        if request.path.startswith("/api/"):response.headers["Cache-Control"]="no-store"
        if app.config["APP_ENV"]=="production":response.headers["Strict-Transport-Security"]="max-age=31536000"
        return response

    @app.get("/",defaults={"path":""})
    @app.get("/<path:path>")
    def frontend(path):
        if path=="api" or path.startswith("api/"):raise DomainError("NOT_FOUND","API endpoint was not found.",404)
        target=(static/path).resolve()
        if not target.is_relative_to(static):raise DomainError("NOT_FOUND","File was not found.",404)
        if target.is_file():return send_from_directory(static,path,conditional=True)
        if Path(path).suffix:raise DomainError("NOT_FOUND","File was not found.",404)
        if not (static/"index.html").is_file():raise DomainError("FRONTEND_NOT_BUILT","Build the frontend or run its separate preview.",503)
        return send_from_directory(static,"index.html")
    return app
