from extensions import db
from models.character import Character

def get_all_characters():
    return Character.query.order_by(Character.name.asc()).all()

def get_character_by_id(char_id):
    return db.session.query(Character).get(char_id)

def create_character(name, anime_fandom, role_type='Protagonist', bio='', avatar='', banner=''):
    char = Character(
        name=name,
        anime_fandom=anime_fandom,
        role_type=role_type,
        bio=bio,
        avatar=avatar,
        banner=banner
    )
    db.session.add(char)
    db.session.commit()
    return char

def update_character(char, name=None, anime_fandom=None, role_type=None, bio=None, avatar=None, banner=None):
    if name is not None:
        char.name = name
    if anime_fandom is not None:
        char.anime_fandom = anime_fandom
    if role_type is not None:
        char.role_type = role_type
    if bio is not None:
        char.bio = bio
    if avatar is not None:
        char.avatar = avatar
    if banner is not None:
        char.banner = banner

    db.session.commit()
    return char

def delete_character(char):
    db.session.delete(char)
    db.session.commit()
    return True
