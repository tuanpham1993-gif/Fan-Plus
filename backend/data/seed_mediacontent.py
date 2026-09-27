from extensions import db
from models import ContentMedia, Content


def seed_content_media():
    medias = [
        {
            "content_title": "Why Naruto Is Still One of the Most Popular Anime",
            "media_type": "IMAGE",
            "media_url": "uploads/content/anime/naruto.jpg",
            "display_order": 1,
        },
        {
            "content_title": "Why Naruto Is Still One of the Most Popular Anime",
            "media_type": "VIDEO",
            "media_url": "uploads/content/anime/naruto-trailer.mp4",
            "display_order": 2,
        },
        {
            "content_title": "Upcoming Games Fans Are Looking Forward To",
            "media_type": "IMAGE",
            "media_url": "uploads/content/gaming/upcoming-games.jpg",
            "display_order": 1,
        },
        {
            "content_title": "The Evolution of Superhero Movies",
            "media_type": "IMAGE",
            "media_url": "uploads/content/movies/superhero-movies.jpg",
            "display_order": 1,
        },
        {
            "content_title": "Batman: A Look at Gotham's Dark Knight",
            "media_type": "IMAGE",
            "media_url": "uploads/content/comics/batman.jpg",
            "display_order": 1,
        },
        {
            "content_title": "K-Pop Fandom Communities",
            "media_type": "AUDIO",
            "media_url": "uploads/content/kpop/fandom-discussion.mp3",
            "display_order": 1,
        },
    ]

    for item in medias:

        content = Content.query.filter_by(
            title=item["content_title"]
        ).first()

        if not content:
            print(
                f"Content '{item['content_title']}' not found. "
                f"Skipping media."
            )
            continue

        existing_media = ContentMedia.query.filter_by(
            content_id=content.id,
            media_url=item["media_url"]
        ).first()

        if existing_media:
            continue

        media = ContentMedia(
            content_id=content.id,
            media_type=item["media_type"],
            media_url=item["media_url"],
            display_order=item["display_order"]
        )

        db.session.add(media)

    db.session.commit()