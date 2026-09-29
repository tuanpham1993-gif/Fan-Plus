from extensions import db
from models import ContentReaction, User, Content


def seed_content_reactions():
    reactions = [
        {
            "email": "john@fanhub.com",
            "content_title": "Why Naruto Is Still One of the Most Popular Anime",
            "reaction_type": "LIKE",
        },
        {
            "email": "jane@fanhub.com",
            "content_title": "Why Naruto Is Still One of the Most Popular Anime",
            "reaction_type": "LIKE",
        },
        {
            "email": "mike@fanhub.com",
            "content_title": "Upcoming Games Fans Are Looking Forward To",
            "reaction_type": "LIKE",
        },
        {
            "email": "emily@fanhub.com",
            "content_title": "The Evolution of Superhero Movies",
            "reaction_type": "DISLIKE",
        },
        {
            "email": "john@fanhub.com",
            "content_title": "Batman: A Look at Gotham's Dark Knight",
            "reaction_type": "LIKE",
        },
    ]

    for item in reactions:

        user = User.query.filter_by(
            email=item["email"]
        ).first()

        if not user:
            print(
                f"User '{item['email']}' not found. "
                f"Skipping reaction."
            )
            continue

        content = Content.query.filter_by(
            title=item["content_title"]
        ).first()

        if not content:
            print(
                f"Content '{item['content_title']}' not found. "
                f"Skipping reaction."
            )
            continue

        existing_reaction = ContentReaction.query.filter_by(
            user_id=user.id,
            content_id=content.id
        ).first()

        if existing_reaction:
            continue

        reaction = ContentReaction(
            user_id=user.id,
            content_id=content.id,
            reaction_type=item["reaction_type"]
        )

        db.session.add(reaction)

    db.session.commit()