from models.contentreaction import ContentReaction
from extensions import db

def create_reaction(user_id,content_id,reaction_type):
    reaction = ContentReaction(user_id=user_id,content_id=content_id,reaction_type=reaction_type)

    db.session.add(reaction)
    db.session.commit()
    db.session.refresh(reaction)

    return reaction

def get_reaction_by_user_content(user_id, content_id):
    return ContentReaction.query.filter_by(
        user_id=user_id,
        content_id=content_id
    ).first()

def create_or_update_reaction(
    user_id,
    content_id,
    reaction_type
):
    reaction = get_reaction_by_user_content(
        user_id=user_id,
        content_id=content_id
    )

    if reaction:
        reaction.reaction_type = reaction_type
    else:
        reaction = ContentReaction(
            user_id=user_id,
            content_id=content_id,
            reaction_type=reaction_type
        )
        db.session.add(reaction)

    db.session.commit()
    return reaction