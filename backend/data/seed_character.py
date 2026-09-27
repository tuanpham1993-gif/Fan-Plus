from extensions import db
from models import Character, Category


def seed_characters():
    characters = [
        {
            "name": "Naruto Uzumaki",
            "bio": "The main protagonist of Naruto and a ninja from the Hidden Leaf Village.",
            "category": "Anime",
            "image_url": "uploads/characters/2/",
        },
        {
            "name": "Monkey D. Luffy",
            "bio": "The captain of the Straw Hat Pirates and the main protagonist of One Piece.",
            "category": "Anime",
            "image_url": "uploads/characters/3/",
        },
        {
            "name": "Mario",
            "bio": "A famous video game character created by Nintendo.",
            "category": "Gaming",
            "image_url": "uploads/characters/2/",
        },
        {
            "name": "Batman",
            "bio": "A superhero from DC Comics who protects Gotham City.",
            "category": "Comics",
            "image_url": "uploads/characters/4/",
        },
        {
            "name": "Iron Man",
            "bio": "A Marvel superhero whose real identity is Tony Stark.",
            "category": "Comics",
            "image_url": "uploads/characters/3/",
        },
    ]

    for item in characters:

        # Find category by name
        category = Category.query.filter_by(
            name=item["category"]
        ).first()

        if not category:
            print(
                f"Category '{item['category']}' not found. "
                f"Skipping {item['name']}."
            )
            continue

        # Check whether character already exists
        existing_character = Character.query.filter_by(
            name=item["name"],
            category_id=category.category_id
        ).first()

        if existing_character:
            continue

        character = Character(
            name=item["name"],
            bio=item["bio"],
            image_url=item["image_url"],
            category_id=category.category_id
        )

        db.session.add(character)

    db.session.commit()