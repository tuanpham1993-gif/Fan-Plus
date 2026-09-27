from extensions import db
from models import Content, User, Category


def seed_contents():
    contents = [
        {
            "author": "john@fanhub.com",
            "category": "Anime",
            "title": "Why Naruto Is Still One of the Most Popular Anime",
            "body": (
                "Naruto remains one of the most recognizable anime series. "
                "Its story, characters, and long-running influence have made "
                "it popular among anime fans around the world."
            ),
            "content_type": "ARTICLE",
            "status": "DONE",
        },
        {
            "author": "jane@fanhub.com",
            "category": "Gaming",
            "title": "Upcoming Games Fans Are Looking Forward To",
            "body": (
                "Several upcoming games have attracted attention from the "
                "gaming community. Fans are especially interested in new "
                "gameplay systems, worlds, and characters."
            ),
            "content_type": "NEWS",
            "status": "DONE",
        },
        {
            "author": "mike@fanhub.com",
            "category": "Movies",
            "title": "The Evolution of Superhero Movies",
            "body": (
                "Superhero movies have changed significantly over the years, "
                "from standalone stories to large interconnected cinematic "
                "universes."
            ),
            "content_type": "ARTICLE",
            "status": "DONE",
        },
        {
            "author": "emily@fanhub.com",
            "category": "Comics",
            "title": "Batman: A Look at Gotham's Dark Knight",
            "body": (
                "Batman is one of the most iconic characters in comic book "
                "history. His stories often explore crime, justice, and the "
                "relationship between Bruce Wayne and Gotham City."
            ),
            "content_type": "POST",
            "status": "PENDING",
        },
        {
            "author": "john@fanhub.com",
            "category": "K-Pop",
            "title": "What Makes K-Pop Fandom Communities Unique?",
            "body": (
                "K-Pop fandoms have developed large online communities where "
                "fans share news, discuss artists, and participate in events."
            ),
            "content_type": "POST",
            "status": "DONE",
        },
        {
            "author": "john@fanhub.com",
            "category": "Anime",
            "title": "Anime Festival 2026",
            "body": (
                "An anime community event featuring cosplay, "
                "merchandise, games, and fan activities."
            ),
            "content_type": "EVENT",
            "status": "DONE",
        },
        {
            "author": "jane@fanhub.com",
            "category": "Gaming",
            "title": "Gaming Community Meetup",
            "body": (
                "A community meetup for gamers to connect, "
                "play games, and discuss upcoming releases."
            ),
            "content_type": "EVENT",
            "status": "DONE",
        },
    ]

    for item in contents:

        # Find author
        author = User.query.filter_by(
            email=item["author"]
        ).first()

        if not author:
            print(
                f"User '{item['author']}' not found. "
                f"Skipping '{item['title']}'."
            )
            continue

        # Find category
        category = Category.query.filter_by(
            name=item["category"]
        ).first()

        if not category:
            print(
                f"Category '{item['category']}' not found. "
                f"Skipping '{item['title']}'."
            )
            continue

        # Check if content already exists
        existing_content = Content.query.filter_by(
            title=item["title"],
            author_id=author.id
        ).first()

        if existing_content:
            continue

        content = Content(
            author_id=author.id,
            category_id=category.category_id,
            title=item["title"],
            body=item["body"],
            content_type=item["content_type"],
            status=item["status"]
        )

        db.session.add(content)

    db.session.commit()