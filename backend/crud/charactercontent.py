from models.charactercontent import CharacterContent
from extensions import db


def get_character_content(content_id,character_id):
    return CharacterContent.query.filter_by(content_id=content_id,character_id=character_id).first()


def get_characters_by_content(content_id):
    return (CharacterContent.query.filter(CharacterContent.content_id == content_id).all())


def get_contents_by_character(character_id):
    return (CharacterContent.query.filter(CharacterContent.character_id == character_id).all()
    )


def add_character_to_content(
    content_id,character_id
):
    character_content = CharacterContent(content_id=content_id,character_id=character_id)

    db.session.add(character_content)
    db.session.commit()
    db.session.refresh(character_content)

    return character_content


def remove_character_from_content(
    content_id,
    character_id
):
    character_content = get_character_content(
        content_id,
        character_id
    )

    if character_content is None:
        return None

    db.session.delete(character_content)
    db.session.commit()

    return character_content