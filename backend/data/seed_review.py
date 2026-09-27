from extensions import db
from models import Review, User, Content


def seed_reviews():
    reviews = [
        {
            "email": "john@fanhub.com",
            "content_title": "The Evolution of Superhero Movies",
            "rating": 5,
            "comment": "A very interesting article about how superhero movies have changed over the years.",
        },
        {
            "email": "jane@fanhub.com",
            "content_title": "Why Naruto Is Still One of the Most Popular Anime",
            "rating": 5,
            "comment": "Naruto is still one of my favorite anime. Great discussion!",
        },
        {
            "email": "mike@fanhub.com",
            "content_title": "Upcoming Games Fans Are Looking Forward To",
            "rating": 4,
            "comment": "Some exciting games are coming soon. Looking forward to them.",
        },
        {
            "email": "emily@fanhub.com",
            "content_title": "Batman: A Look at Gotham's Dark Knight",
            "rating": 4,
            "comment": "A nice overview of Batman and his character.",
        },
        {
            "email": "john@fanhub.com",
            "content_title": "What Makes K-Pop Fandom Communities Unique?",
            "rating": 4,
            "comment": "Interesting explanation of how K-Pop communities interact.",
        },
    ]

    for item in reviews:

        # Find user
        user = User.query.filter_by(
            email=item["email"]
        ).first()

        if not user:
            print(
                f"User '{item['email']}' not found. "
                f"Skipping review."
            )
            continue

        # Find content
        content = Content.query.filter_by(
            title=item["content_title"]
        ).first()

        if not content:
            print(
                f"Content '{item['content_title']}' not found. "
                f"Skipping review."
            )
            continue

        # Check if this user already reviewed this content
        existing_review = Review.query.filter_by(
            user_id=user.id,
            content_id=content.id
        ).first()

        if existing_review:
            continue

        review = Review(
            user_id=user.id,
            content_id=content.id,
            rating=item["rating"],
            comment=item["comment"]
        )

        db.session.add(review)

    db.session.commit()