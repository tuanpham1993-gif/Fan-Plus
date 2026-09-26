from .auth_routes import auth_bp
from .user_routes import user_bp
from .admin_routes import admin_bp
from .feedback_routes import feedback_bp

from routes.content import content_bp
from routes.character import character_bp
from routes.bookmark import bookmark_bp
from routes.event import event_bp
from routes.review import review_bp


def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(feedback_bp)
    
    app.register_blueprint(content_bp)
    app.register_blueprint(character_bp)
    app.register_blueprint(bookmark_bp)
    app.register_blueprint(event_bp)
    app.register_blueprint(review_bp)
