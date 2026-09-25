from flask import Flask

from extensions import db
from routes.content import content_bp
from routes.character import character_bp
from routes.bookmark import bookmark_bp
from routes.event import event_bp
from routes.review import review_bp


def create_app():
    app = Flask(__name__)

    # Database configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://root:@localhost:3306/fanhub"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    
    # Register routes
    app.register_blueprint(content_bp)
    app.register_blueprint(character_bp)
    app.register_blueprint(bookmark_bp)
    app.register_blueprint(event_bp)
    app.register_blueprint(review_bp)

    with app.app_context(): 
        db.create_all()
    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)