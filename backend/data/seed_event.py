from datetime import datetime

from extensions import db
from models import Event, Content


def seed_events():
    events = [
        {
            "content_title": "Anime Festival 2026",
            "location_name": "Saigon Exhibition and Convention Center",
            "city": "Ho Chi Minh City",
            "latitude": 10.7298,
            "longitude": 106.7218,
            "start_time": datetime(2026, 10, 10, 9, 0),
            "end_time": datetime(2026, 10, 10, 18, 0),
            "register_url": "https://example.com/anime-festival-2026",
        },
        {
            "content_title": "Gaming Community Meetup",
            "location_name": "Nguyen Hue Walking Street",
            "city": "Ho Chi Minh City",
            "latitude": 10.7740,
            "longitude": 106.7030,
            "start_time": datetime(2026, 11, 15, 14, 0),
            "end_time": datetime(2026, 11, 15, 17, 0),
            "register_url": "https://example.com/gaming-meetup",
        },
    ]

    for item in events:

        content = Content.query.filter_by(
            title=item["content_title"]
        ).first()

        if not content:
            print(
                f"Content '{item['content_title']}' not found. "
                f"Skipping event."
            )
            continue

        if content.content_type != "EVENT":
            print(
                f"Content '{item['content_title']}' is not "
                f"an EVENT. Skipping."
            )
            continue

        existing_event = Event.query.filter_by(
            content_id=content.id
        ).first()

        if existing_event:
            continue

        event = Event(
            content_id=content.id,
            location_name=item["location_name"],
            city=item["city"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            start_time=item["start_time"],
            end_time=item["end_time"],
            register_url=item["register_url"],
        )

        db.session.add(event)

    db.session.commit()