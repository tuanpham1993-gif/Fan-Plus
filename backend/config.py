import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key_fan_plus_2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'change_this_secret')
    
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 15)) * 60
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 7)) * 86400
    
    RECAPTCHA_SECRET_KEY = os.getenv('RECAPTCHA_SECRET_KEY', '')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('DB_NAME', 'fanhub')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')

    MYSQL_DB_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    SQLITE_DB_URI = 'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'fan_hub.db')
    
    SQLALCHEMY_DATABASE_URI = MYSQL_DB_URI