from extensions import db
from models.user import User
from utils.password_utils import hash_password

def seed_database():
    """Seed default admin user if database is empty"""
    try:
        if User.query.count() == 0:
            admin_user = User(
                name='Administrator',
                email='admin@fanplus.com',
                password_hash=hash_password('Admin1234@'),
                role='admin',
                status='active'
            )
            default_user = User(
                name='Nguyen Van A',
                email='user@gmail.com',
                password_hash=hash_password('User1234@'),
                role='user',
                status='active'
            )
            db.session.add_all([admin_user, default_user])
            db.session.commit()
            print("Default admin and user accounts created.")
    except Exception as e:
        print(f"Seed info: {e}")
