from extensions import db
from models.category import Category

def seed_categories():
    categories = [
        {
            "name": "Anime",
            "description": "Japanese animation series and movies."
        },
        {
            "name": "Gaming",
            "description": "Video games, gaming news, and esports."
        },
        {
            "name": "Movies",
            "description": "Movies, films, and cinematic universes."
        },
        {
            "name": "TV Series",
            "description": "Television and streaming series."
        },
        {
            "name": "K-Pop",
            "description": "Korean pop music, artists, groups, and fandoms."
        },
        {
            "name": "Comics",
            "description": "Comic books, superheroes, and graphic novels."
        },
        {
            "name": "Manga",
            "description": "Japanese manga series and publications."
        },
        {
            "name": "Cosplay",
            "description": "Cosplay, costumes, conventions, and fan creations."
        }
    ]

    print("Seeding categories...")

    for item in categories:
        existing_category = Category.query.filter_by(
            name=item["name"]
        ).first()

        if existing_category:
            continue

        db.session.add(
            Category(
                name=item["name"],
                description=item["description"]
            )
        )

    db.session.commit()

    print("Categories seeded.")