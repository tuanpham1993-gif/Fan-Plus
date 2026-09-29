import os
import re
import pymysql

from flask import Flask, jsonify, send_from_directory

from config import Config
from extensions import db, jwt, cors
from routes import register_blueprints
from seed import seed_database

AVATAR_UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads", "avatars"))


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


def create_app(testing=False):

    app = Flask(__name__)

    app.config.from_object(Config)

    if testing:
        app.config["SQLALCHEMY_DATABASE_URI"] = Config.SQLITE_DB_URI
        print("Database Driver: SQLite (Test mode active)")
    else:
        use_mysql = check_mysql_connection(Config.MYSQL_DB_URI)

        if use_mysql:
            app.config["SQLALCHEMY_DATABASE_URI"] = Config.MYSQL_DB_URI
            print("Database Driver: MySQL (Live MySQL server connected)")
        else:
            app.config["SQLALCHEMY_DATABASE_URI"] = Config.SQLITE_DB_URI
            print("Database Driver: SQLite (Local Fallback mode active)")

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True}

    db.init_app(app)
    jwt.init_app(app)

    cors.init_app(
        app,
        resources={r"/api/*": {"origins": "*"}}
    )

    from routes.category import category_bp
    from routes.character import character_bp
    from routes.merchandise import merchandise_bp
    from routes.community_routes import community_bp 
    app.register_blueprint(category_bp)
    app.register_blueprint(character_bp)
    app.register_blueprint(merchandise_bp)
    app.register_blueprint(community_bp)
    register_blueprints(app)

    with app.app_context():
        try:
            db.create_all()

        except Exception as err:
            print(f"Database init warning: {err}")

    @app.route("/uploads/<path:filename>", methods=["GET"])
    def uploaded_file(filename):
        return send_from_directory(
            os.path.join(os.getcwd(), "uploads"),
            filename
        )

    @app.route("/api/uploads/avatars/<filename>", methods=["GET"])
    def uploaded_avatar(filename):
        if not re.fullmatch(r"u\d+-[0-9a-fA-F]+\.(png|jpe?g|webp)", filename):
            return jsonify({"message": "Ảnh không tồn tại hoặc không hợp lệ"}), 404

        try:
            return send_from_directory(AVATAR_UPLOAD_DIR, filename)
        except Exception:
            return jsonify({"message": "Ảnh không tồn tại hoặc không hợp lệ"}), 404

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