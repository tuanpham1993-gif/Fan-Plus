
from extensions import db
from models import Content, ContentMedia


def seed_content_media():
    medias = [
        {
            "content_title": "Why Naruto Is Still One of the Most Popular Anime",
            "media_type": "IMAGE",
            "media_url": "uploads/content/topic/naruto.jpg",
            "display_order": 1,
        },
        {
            "content_title": "Why Naruto Is Still One of the Most Popular Anime",
            "media_type": "IMAGE",
            "media_url": "uploads/content/topic/naruto1.jpg",
            "display_order": 2,
        },
        {
            "content_title": "Monster Hunter: A World Built Around the Hunt",
            "media_type": "IMAGE",
            "media_url": "uploads/content/game/mhw0.jpg",
            "display_order": 1,
        },
        {
            "content_title": "Monster Hunter: A World Built Around the Hunt",
            "media_type": "IMAGE",
            "media_url": "uploads/content/game/mhw1.jpg",
            "display_order": 2,
        },
        {
            "content_title": "Monster Hunter: A World Built Around the Hunt",
            "media_type": "IMAGE",
            "media_url": "uploads/content/game/mhw2.jpg",
            "display_order": 3,
        },
        {
            "content_title": "Monster Hunter: A World Built Around the Hunt",
            "media_type": "IMAGE",
            "media_url": "uploads/content/game/mhw3.jpg",
            "display_order": 4,
        },
        {
            "content_title": "Characters That Make Devil May Cry Memorable",
            "media_type": "IMAGE",
            "media_url": "uploads/content/game/dantes.jpg",
            "display_order": 1,
        },
        {
            "content_title": "Characters That Make Devil May Cry Memorable",
            "media_type": "IMAGE",
            "media_url": "uploads/content/game/nero.jpg",
            "display_order": 2,
        },
        {
            "content_title": "Characters That Make Devil May Cry Memorable",
            "media_type": "IMAGE",
            "media_url": "uploads/content/game/VergilDMC5.png",
            "display_order": 3,
        },
        {
            "content_title": "The Evolution of Superhero Movies",
            "media_type": "IMAGE",
            "media_url": "uploads/content/movie/dragonball.jpg",
            "display_order": 1,
        },
        {
            "content_title": "The Evolution of Superhero Movies",
            "media_type": "IMAGE",
            "media_url": "uploads/content/movie/images (1).jpg",
            "display_order": 2,
        },
        {
            "content_title": "Batman: A Look at Gotham's Dark Knight",
            "media_type": "IMAGE",
            "media_url": (
                "uploads/content/character/"
                "Batman_in_Justice_League_TV_series.png"
            ),
            "display_order": 1,
        },
        {
            "content_title": "Boruto and the Next Generation of Shinobi",
            "media_type": "IMAGE",
            "media_url": "uploads/content/manga/boruto1.jpg",
            "display_order": 1,
        },
        {
            "content_title": "Boruto and the Next Generation of Shinobi",
            "media_type": "IMAGE",
            "media_url": "uploads/content/manga/boruto2.jpg",
            "display_order": 2,
        },
        {
            "content_title": "What Makes K-Pop Fandom Communities Unique?",
            "media_type": "IMAGE",
            "media_url": "uploads/content/event/k1.jpg",
            "display_order": 1,
        },
        {
            "content_title": "What Makes K-Pop Fandom Communities Unique?",
            "media_type": "IMAGE",
            "media_url": "uploads/content/event/k2.jpg",
            "display_order": 2,
        },
        {
            "content_title": "What Makes K-Pop Fandom Communities Unique?",
            "media_type": "IMAGE",
            "media_url": "uploads/content/event/k3.jpg",
            "display_order": 3,
        },
        {
            "content_title": "Anime Festival 2026",
            "media_type": "IMAGE",
            "media_url": (
                "uploads/content/event/"
                "cosplay-contest-1000x625-1-750x468.jpg"
            ),
            "display_order": 1,
        },
        {
            "content_title": "Anime Festival 2026",
            "media_type": "IMAGE",
            "media_url": "uploads/content/event/g1.jpg",
            "display_order": 2,
        },
        {
            "content_title": "Anime Festival 2026",
            "media_type": "IMAGE",
            "media_url": "uploads/content/event/g2.jpg",
            "display_order": 3,
        },
        {
            "content_title": "Anime Festival 2026",
            "media_type": "IMAGE",
            "media_url": "uploads/content/event/g3.jpg",
            "display_order": 4,
        },
        {
            "content_title": "Gaming Community Meetup",
            "media_type": "IMAGE",
            "media_url": "uploads/content/event/gundam.jpg",
            "display_order": 1,
        },
    ]

    print("Seeding content media...")

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
            display_order=item["display_order"],
        )

        db.session.add(media)

    db.session.commit()

    print("Content media seeded.")