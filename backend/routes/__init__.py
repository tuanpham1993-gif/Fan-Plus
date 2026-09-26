from .auth_routes import auth_bp
from .user_routes import user_bp
from .admin_routes import admin_bp
from .category_routes import category_bp
from .character_routes import character_bp
from .content_routes import content_bp
from .event_routes import event_bp
from .merchandise_routes import merchandise_bp
from .bookmark_routes import bookmark_bp
from .feedback_routes import feedback_bp

def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(character_bp)
    app.register_blueprint(content_bp)
    app.register_blueprint(event_bp)
    app.register_blueprint(merchandise_bp)
    app.register_blueprint(bookmark_bp)
    app.register_blueprint(feedback_bp)
