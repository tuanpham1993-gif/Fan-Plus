import os
import pymysql
from flask import Flask, jsonify
from config import Config
from extensions import db, jwt, cors
from routes import register_blueprints
from seed import seed_database

def check_mysql_connection(uri):
    """Attempt a quick raw connection to check if MySQL server is up"""
    try:
        # uri format: mysql+pymysql://user:pass@host:port/dbname
        user_pass_host = uri.split('://')[1].split('/')[0]
        user_pass, host_port = user_pass_host.split('@')
        user, password = user_pass.split(':')
        if ':' in host_port:
            host, port = host_port.split(':')
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
    except Exception as e:
        return False

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Check MySQL vs SQLite fallback
    use_mysql = check_mysql_connection(Config.MYSQL_DB_URI)
    if use_mysql:
        app.config['SQLALCHEMY_DATABASE_URI'] = Config.MYSQL_DB_URI
        print("Database Driver: MySQL (Live MySQL server connected)")
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLITE_DB_URI
        print("Database Driver: SQLite (Local Fallback mode active)")

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Create tables & Seed database
    with app.app_context():
        try:
            db.create_all()
            seed_database()
            print("Database initialized and seeded successfully!")
        except Exception as err:
            print(f"Database init warning: {err}")

    # Register API blueprints
    register_blueprints(app)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'app': 'Fan Hub Plus API',
            'version': '1.0.0',
            'database': app.config['SQLALCHEMY_DATABASE_URI'].split('://')[0]
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"Starting Fan Hub Plus Flask Backend on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)