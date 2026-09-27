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
            "description": "Video games and esports."
        },
        {
            "name": "Movies",
            "description": "Movies and cinematic universes."
        },
        {
            "name": "TV Series",
            "description": "Television and streaming series."
        }
    ]

    print("Seeding categories...")

    Category.query.delete()

    for item in categories:

        db.session.add(
            Category(
                name=item["name"],
                description=item["description"]
            )
        )

    db.session.commit()

    print("Categories seeded.")