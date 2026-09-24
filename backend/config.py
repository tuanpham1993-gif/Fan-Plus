import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'fan-hub-plus-super-secret-key-2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'fan-hub-plus-jwt-secret-key-2026')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Primary DB URI from .env (e.g. MySQL)
    MYSQL_DB_URI = os.getenv('DATABASE_URL', 'mysql+pymysql://root:rootpassword@localhost:3306/fan_hub_plus')
    SQLITE_DB_URI = 'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'fan_hub_plus.db')
    
    # We will test MySQL connection dynamically or default to MYSQL_DB_URI
    SQLALCHEMY_DATABASE_URI = MYSQL_DB_URI