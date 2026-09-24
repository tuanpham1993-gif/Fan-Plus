import os
from pathlib import Path
import click
from flask import current_app
from sqlalchemy import select, delete
from app.models import User, AuthSession, OneTimeToken, AuditLog, utcnow
from app.common.security import hash_password

def register_commands(app):
    @app.cli.command("seed-demo")
    def seed_demo():
        """Load fictional, local-only demo data after alembic upgrade head."""
        if current_app.config["APP_ENV"] == "production":
            raise click.ClickException("Demo seeding is disabled in production.")
        from app.services.seed import seed_demo_data
        with current_app.extensions["db_sessions"]() as db:
            result = seed_demo_data(db, os.getenv("DEMO_PASSWORD", "FanHubDemo!26"))
            db.commit()
        click.echo(result)

    @app.cli.command("create-admin")
    @click.option("--email", prompt=True)
    @click.option("--name", prompt=True)
    @click.password_option(confirmation_prompt=True)
    def create_admin(email, name, password):
        """Create an explicitly authorized administrator; never promotes an existing account."""
        from app.schemas.requests import RegisterInput
        from app.services.auth import register
        payload = RegisterInput(email=email, display_name=name, password=password)
        with current_app.extensions["db_sessions"]() as db:
            actor = register(db, payload)
            actor.role = "admin"
            actor.verified_at = utcnow()
            db.add(AuditLog(actor_id=actor.id, action="operator.admin_created", target_type="user", target_id=actor.id, details={"channel":"authorized_cli"}))
            db.commit()
        click.echo("Administrator created. Password was not logged.")

    @app.cli.command("prune-auth")
    def prune_auth():
        """Delete expired sessions and one-time tokens. Schedule externally, once per day."""
        with current_app.extensions["db_sessions"]() as db:
            a = db.execute(delete(AuthSession).where(AuthSession.expires_at < utcnow()))
            b = db.execute(delete(OneTimeToken).where(OneTimeToken.expires_at < utcnow()))
            db.commit()
        click.echo(f"Deleted {a.rowcount} sessions and {b.rowcount} expired tokens.")
