import os
import pymysql

from flask import Flask, jsonify

from config import Config
from extensions import db, jwt, cors
from routes import register_blueprints
from seed import seed_database

# ==========================================
# Check MySQL connection
# ==========================================

def check_mysql_connection(uri):
    try:
        user_pass_host = uri.split("://")[1].split("/")[0]
        user_pass, host_port = user_pass_host.split("@")
        user, password = user_pass.split(":")

        if ":" in host_port:
            host, port = host_port.split(":")
            port = int(port)
        else:
            host = host_port
            port = 3306

        conn = pymysql.connect(
            host=host,  
            user=user,
            password=password,
            port=port,
            connect_timeout=2
        )

        conn.close()
        return True

    except Exception:
        return False


# ==========================================
# Create Flask application
# ==========================================

def create_app():

    app = Flask(__name__)

    # ==========================================
    # Configuration
    # ==========================================

    app.config.from_object(Config)

    # ==========================================
    # Database configuration
    # ==========================================

    use_mysql = check_mysql_connection(Config.MYSQL_DB_URI)

    if use_mysql:
        app.config["SQLALCHEMY_DATABASE_URI"] = Config.MYSQL_DB_URI
        print("Database Driver: MySQL (Live MySQL server connected)")
    else:
        app.config["SQLALCHEMY_DATABASE_URI"] = Config.SQLITE_DB_URI
        print("Database Driver: SQLite (Local Fallback mode active)")

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # ==========================================
    # Initialize extensions
    # ==========================================

    db.init_app(app)
    jwt.init_app(app)

    cors.init_app(
        app,
        resources={r"/api/*": {"origins": "*"}}
    )

    # ==========================================
    # Register main routes
    # ==========================================

    # Các route hiện tại của origin/tam
    from routes.category import category_bp
    from routes.character import character_bp
    from routes.merchandise import merchandise_bp

    app.register_blueprint(category_bp)
    app.register_blueprint(character_bp)
    app.register_blueprint(merchandise_bp)

    # ==========================================
    # Register other routes
    # ==========================================

    # Các route của HEAD
    register_blueprints(app)

    # ==========================================
    # Create database tables
    # ==========================================

    with app.app_context():
        try:
            db.create_all()

            # seed_database()
            # print("Database initialized and seeded successfully!")

        except Exception as err:
            print(f"Database init warning: {err}")

    # ==========================================
    # Health check
    # ==========================================

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "app": "Fan Hub API",
            "version": "1.0.0",
            "database": app.config[
                "SQLALCHEMY_DATABASE_URI"
            ].split("://")[0]
        }), 200

    # ==========================================
    # Error handlers
    # ==========================================

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            "error": "Resource not found"
        }), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({
            "error": "Internal server error"
        }), 500

    return app


app = create_app()


if __name__ == "__main__":

    port = int(os.getenv("PORT", 5000))

    print(f"Starting Fan Hub Backend on port {port}...")

    app.run(
        host="0.0.0.0",
        port=port,
        debug=True
    )