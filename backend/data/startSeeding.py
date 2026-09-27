from app import app

from data.seed_category import seed_categories
from data.seed_user import seed_users
from data.seed_character import seed_characters
from data.seed_content import seed_contents
from data.seed_review import seed_reviews
from data.seed_charactercontent import seed_character_contents
from data.seed_contentreaction import seed_content_reactions
from data.seed_event import seed_events
from data.seed_feedback import seed_feedbacks
from data.seed_mediacontent import seed_content_media


def run_seeding():
    with app.app_context():
        print("Starting database seeding...")

        seed_categories()
        seed_users()
        seed_characters()
        seed_contents()
        seed_reviews()
        seed_character_contents()
        seed_content_reactions()
        seed_events()
        seed_feedbacks()
        seed_content_media()

        print("Database seeding completed!")


if __name__ == "__main__":
    run_seeding()