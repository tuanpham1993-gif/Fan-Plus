from extensions import db
from models import User
from werkzeug.security import generate_password_hash


def seed_users():
    users = [
        {
            "name": "Admin User",
            "email": "admin@fanhub.com",
            "password": "12345678Aa@",
            "role": "admin",
            "status": "active",
        },
        {
            "name": "John Doe",
            "email": "john@fanhub.com",
            "password": "12345678Aa@",
            "role": "user",
            "status": "active",
        },
        {
            "name": "Jane Smith",
            "email": "jane@fanhub.com",
            "password": "12345678Aa@",
            "role": "user",
            "status": "active",
        },
        {
            "name": "Mike Nguyen",
            "email": "mike@fanhub.com",
            "password": "12345678Aa@",
            "role": "user",
            "status": "active",
        },
        {
            "name": "Emily Tran",
            "email": "emily@fanhub.com",
            "password": "12345678Aa@",
            "role": "user",
            "status": "active",
        },
    ]

    for item in users:
        existing_user = User.query.filter_by(email=item["email"]).first()

        if existing_user:
            continue

        user = User(
            name=item["name"],
            email=item["email"],
            password_hash=generate_password_hash(item["password"]),
            role=item["role"],
            status=item["status"],
        )

        db.session.add(user)

    db.session.commit()