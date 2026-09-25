from models.contentreaction import ContentReaction
from extensions import db

def create_reaction(user_id,content_id,reaction_type):
    reaction = ContentReaction(user_id=user_id,content_id=content_id,reaction_type=reaction_type)

    db.session.add(reaction)
    db.session.commit()
    db.session.refresh(reaction)

    return reaction
