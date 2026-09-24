from pathlib import Path
import json
from flask import Blueprint,g,current_app
from sqlalchemy import text
from .helpers import ok
bp=Blueprint("health",__name__)
@bp.get("/api/v1/health/live")
def live():return ok({"status":"alive","framework":"Flask"})
@bp.get("/api/v1/health/ready")
def ready():
    g.db.execute(text("SELECT 1"))
    return ok({"status":"ready","database":g.db.bind.dialect.name})
@bp.get("/api/v1/openapi.json")
def openapi():
    source=Path(__file__).resolve().parents[2]/"openapi.json"
    return current_app.response_class(source.read_text(),mimetype="application/json")
