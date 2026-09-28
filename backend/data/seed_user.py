
from extensions import db
from models import User
from werkzeug.security import generate_password_hash
import json


def seed_users():
    users = [
        {
            "name": "Admin User",
            "email": "admin@fanhub.com",
            "password": "12345678Aa@",
            "avatar": None,
            "phone": "0900000001",
            "birthday": "1998-01-15",
            "gender": "other",
            "city": "Ho Chi Minh City",
            "bio": "Fan Hub Plus administrator.",
            "favorite_fandoms": ["Anime", "Gaming", "Movies"],
            "role": "admin",
            "status": "active",
            "display_preferences": {
                "theme": "dark",
                "font_size": "medium",
            },
        },
        {
            "name": "John Doe",
            "email": "john@fanhub.com",
            "password": "12345678Aa@",
            "avatar": None,
            "phone": "0900000002",
            "birthday": "1999-05-20",
            "gender": "male",
            "city": "Ho Chi Minh City",
            "bio": "Anime and gaming enthusiast.",
            "favorite_fandoms": ["Anime", "Gaming", "Manga"],
            "role": "user",
            "status": "active",
            "display_preferences": {
                "theme": "dark",
                "font_size": "medium",
            },
        },
        {
            "name": "Jane Smith",
            "email": "jane@fanhub.com",
            "password": "12345678Aa@",
            "avatar": None,
            "phone": "0900000003",
            "birthday": "2000-08-12",
            "gender": "female",
            "city": "Hanoi",
            "bio": "Movie, TV show, and K-Pop fan.",
            "favorite_fandoms": ["Movies", "TV Shows", "K-Pop"],
            "role": "user",
            "status": "active",
            "display_preferences": {
                "theme": "light",
                "font_size": "medium",
            },
        },
        {
            "name": "Mike Nguyen",
            "email": "mike@fanhub.com",
            "password": "12345678Aa@",
            "avatar": None,
            "phone": "0900000004",
            "birthday": "1997-11-03",
            "gender": "male",
            "city": "Da Nang",
            "bio": "Gaming and comics lover.",
            "favorite_fandoms": ["Gaming", "Comics", "Movies"],
            "role": "user",
            "status": "active",
            "display_preferences": {
                "theme": "dark",
                "font_size": "large",
            },
        },
        {
            "name": "Emily Tran",
            "email": "emily@fanhub.com",
            "password": "12345678Aa@",
            "avatar": None,
            "phone": "0900000005",
            "birthday": "2001-03-27",
            "gender": "female",
            "city": "Can Tho",
            "bio": "Cosplay, anime, and manga fan.",
            "favorite_fandoms": ["Anime", "Manga", "Cosplay"],
            "role": "user",
            "status": "active",
            "display_preferences": {
                "theme": "light",
                "font_size": "medium",
            },
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
            avatar=item["avatar"],
            phone=item["phone"],
            birthday=item["birthday"],
            gender=item["gender"],
            city=item["city"],
            bio=item["bio"],
            favorite_fandoms=json.dumps(item["favorite_fandoms"]),
            role=item["role"],
            status=item["status"],
            display_preferences=json.dumps(item["display_preferences"]),
            reset_token=None,
        )

        db.session.add(user)

    db.session.commit()
