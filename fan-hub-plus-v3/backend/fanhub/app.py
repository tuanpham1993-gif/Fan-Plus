"""Flask application factory. Run this on one origin with the bundled frontend."""
from __future__ import annotations
import hmac, os, secrets
from pathlib import Path
from functools import wraps
from datetime import timedelta
from flask import Flask, Blueprint, jsonify, request, session, g, send_from_directory, Response
from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from werkzeug.exceptions import HTTPException
from .models import database, Base, AuthSession, Campaign, Knowledge
from . import core, security, lore


def build_app(config=None):
    root = Path(__file__).resolve().parents[2]
    app = Flask(__name__, static_folder=None)
    app.config.update(SECRET_KEY=os.environ.get('SECRET_KEY', ''), DATABASE_URL=os.environ.get('DATABASE_URL', 'sqlite:///fanhub-demo.db'), SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE='Lax', SESSION_COOKIE_SECURE=os.environ.get('COOKIE_SECURE') == '1', PERMANENT_SESSION_LIFETIME=timedelta(hours=8), MAX_CONTENT_LENGTH=65536, LORE_MODE=os.environ.get('LORE_MODE', 'extractive'), OPENAI_API_KEY=os.environ.get('OPENAI_API_KEY', ''), OPENAI_MODEL=os.environ.get('OPENAI_MODEL', ''), DEMO_VERIFY_REGISTRATION=os.environ.get('DEMO_VERIFY_REGISTRATION') == '1', FRONTEND_DIST=str(root / 'frontend' / 'dist'), TRUSTED_HOSTS=['localhost', '127.0.0.1', '[::1]'])
    if os.environ.get('TRUSTED_HOSTS'):
        app.config['TRUSTED_HOSTS'] = os.environ['TRUSTED_HOSTS'].split(',')
    if config:
        app.config.update(config)
    if len(app.config['SECRET_KEY']) < 32:
        raise RuntimeError('Set SECRET_KEY to at least 32 random characters. No insecure fallback is provided.')
    engine, factory = database(app.config['DATABASE_URL'])
    app.extensions['db_factory'] = factory
    app.extensions['db_engine'] = engine
    mode = app.config['LORE_MODE']
    if mode not in ('extractive', 'openai'):
        raise RuntimeError('LORE_MODE must be extractive or openai.')
    provider = lore.ResponsesProvider(app.config['OPENAI_API_KEY'], app.config['OPENAI_MODEL']) if mode == 'openai' else None
    api = Blueprint('api', __name__, url_prefix='/api/v1')

    def csrf():
        if 'csrf' not in session:
            session['csrf'] = secrets.token_urlsafe(32)
        return session['csrf']

    @app.before_request
    def prepare():
        g.request_id = secrets.token_hex(8)
        if not request.path.startswith('/api/'):
            return
        if request.method in {'POST', 'PUT', 'PATCH', 'DELETE'}:
            supplied = request.headers.get('X-CSRFToken', '')
            if not session.get('csrf') or not hmac.compare_digest(supplied, session['csrf']):
                raise core.Fault('The security token expired. Refresh this page.', 403)
        # Do not trust X-Forwarded-For from arbitrary callers.
        limited = request.method != 'GET' or request.path.endswith('/lore/history')
        if limited:
            with factory.begin() as ratelimit_db:
                key = request.remote_addr or 'unknown'
                security.consume_rate(ratelimit_db, 'all:' + key, 120)
                if '/lore/messages' in request.path:
                    security.consume_rate(ratelimit_db, 'lore-minute:' + key, 10)
                    security.consume_rate(ratelimit_db, 'lore-day:' + key, 100, 86400)
                if '/auth/' in request.path:
                    security.consume_rate(ratelimit_db, 'auth:' + key, 15)
        g.db = factory()
        g.user = security.user_for_session(g.db, session.get('sid'))

    @app.after_request
    def headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Request-ID'] = getattr(g, 'request_id', '')
        if request.path.startswith('/api/'):
            response.headers['Cache-Control'] = 'no-store'
        return response

    @app.teardown_request
    def close(_):
        db = getattr(g, 'db', None)
        if db:
            db.rollback(); db.close()

    def data():
        d = request.get_json(silent=True)
        if not isinstance(d, dict):
            raise core.Fault('A JSON object is required.')
        return d

    def result(value):
        g.db.commit()
        return jsonify(data=value)

    def owner():
        if g.user:
            return core.sha('user:' + g.user.id)
        if 'chat_visitor' not in session:
            session['chat_visitor'] = secrets.token_urlsafe(32)
        return core.sha('visitor:' + session['chat_visitor'])

    @app.errorhandler(Exception)
    def errors(exc):
        db = getattr(g, 'db', None)
        if db:
            db.rollback()
        if isinstance(exc, core.Fault):
            message, status = str(exc), exc.status
        elif isinstance(exc, IntegrityError):
            message, status = 'This operation conflicts with existing data. Refresh and retry.', 409
        elif isinstance(exc, HTTPException):
            message, status = exc.name, exc.code
        else:
            app.logger.error('Request %s failed (%s)', getattr(g, 'request_id', ''), type(exc).__name__)
            message, status = 'The request could not be completed.', 500
        return jsonify(error={'message': message, 'requestId': getattr(g, 'request_id', '')}), status

    @api.get('/health')
    def health():
        return result({'status': 'ok', 'service': 'Flask extensions', 'livePrizesEnabled': False})

    @api.get('/auth/csrf')
    def csrf_route():
        return result({'token': csrf()})

    @api.get('/auth/me')
    def me():
        return result({'user': core.public_user(g.user)})

    @api.post('/auth/register')
    def register():
        u = security.register(g.db, data(), app.config['DEMO_VERIFY_REGISTRATION'])
        return result({'user': core.public_user(u), 'verification': 'demo-auto-verified' if u.verified else 'administrator-verification-required', 'emailSent': False})

    @api.post('/auth/login')
    def login():
        u, token = security.login(g.db, data())
        if session.get('sid'):
            g.db.execute(delete(AuthSession).where(AuthSession.token_hash == core.sha(session['sid'])))
        g.db.commit()
        session.clear(); session['sid'] = token; session['csrf'] = secrets.token_urlsafe(32); session.permanent = True
        return jsonify(data={'user': core.public_user(u)})

    @api.post('/auth/logout')
    def logout():
        if session.get('sid'):
            g.db.execute(delete(AuthSession).where(AuthSession.token_hash == core.sha(session['sid'])))
        g.db.commit(); session.clear()
        return jsonify(data={'ok': True})

    @api.get('/community')
    def community():
        return result(core.social(g.db, g.user))

    @api.post('/community/posts')
    def new_post():
        return result(core.save_post(g.db, g.user, data()))

    @api.patch('/community/posts/<post_id>')
    def edit_post(post_id):
        return result(core.save_post(g.db, g.user, data(), post_id))

    @api.delete('/community/posts/<post_id>')
    def remove_post(post_id):
        return result(core.remove_post(g.db, g.user, post_id))

    @api.post('/community/posts/<post_id>/moderate')
    def review(post_id):
        return result(core.moderate(g.db, g.user, post_id, data()))

    @api.put('/community/posts/<post_id>/reaction')
    def reaction(post_id):
        return result(core.react(g.db, g.user, post_id, data()))

    @api.post('/community/posts/<post_id>/comments')
    def comment(post_id):
        return result(core.comment(g.db, g.user, post_id, data()))

    @api.delete('/community/comments/<comment_id>')
    def remove_comment(comment_id):
        return result(core.remove_comment(g.db, g.user, comment_id))

    @api.post('/community/posts/<post_id>/reports')
    def report(post_id):
        return result(core.report(g.db, g.user, post_id, data()))

    @api.patch('/community/reports/<report_id>')
    def resolve_report(report_id):
        return result(core.resolve_report(g.db, g.user, report_id, data()))

    @api.get('/giveaways')
    def campaigns():
        rows = g.db.scalars(select(Campaign).order_by(Campaign.id.desc())).all()
        return result([{'id': c.id, 'title': c.title, 'status': c.status} for c in rows])

    @api.get('/giveaways/<campaign_id>')
    def campaign(campaign_id):
        return result(core.public_campaign(g.db, g.user, campaign_id))

    @api.post('/giveaways/<campaign_id>/entries')
    def enter(campaign_id):
        return result(core.enter(g.db, g.user, campaign_id, data()))

    @api.post('/giveaways/<campaign_id>/freeze')
    def freeze(campaign_id):
        core.fields(data(), set())
        return result(core.freeze(g.db, g.user, campaign_id))

    @api.post('/giveaways/<campaign_id>/draw')
    def draw(campaign_id):
        core.fields(data(), set())
        return result(core.draw(g.db, g.user, campaign_id))

    @api.get('/lore/status')
    def lore_status():
        return result({'mode': 'openai' if provider else 'extractive-server', 'providerCallVerified': False})

    @api.post('/lore/messages')
    def lore_message():
        return result(lore.ask(g.db, owner(), data(), provider))

    @api.get('/lore/history')
    def lore_history():
        return result(lore.history(g.db, owner()))

    @api.delete('/lore/history')
    def lore_clear():
        return result(lore.clear(g.db, owner()))

    @api.get('/lore/sources/<source_id>')
    def lore_source(source_id):
        d = g.db.get(Knowledge, source_id)
        if not d or d.status != 'published':
            raise core.Fault('Source not found.', 404)
        return result(lore.document(d))

    app.register_blueprint(api)

    @app.get('/runtime.js')
    def runtime():
        return Response('window.FANHUB_RUNTIME = Object.freeze({api:true});', mimetype='text/javascript', headers={'Cache-Control': 'no-store'})

    @app.get('/')
    @app.get('/<path:path>')
    def frontend(path=''):
        folder = Path(app.config['FRONTEND_DIST']).resolve()
        target = (folder / path).resolve()
        if path.startswith('api/'):
            raise core.Fault('API endpoint not found.', 404)
        if path and target.is_relative_to(folder) and target.is_file():
            return send_from_directory(folder, path)
        if '.' in Path(path).name:
            raise core.Fault('File not found.', 404)
        return send_from_directory(folder, 'index.html')

    return app
