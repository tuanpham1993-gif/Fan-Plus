from extensions import db
from models.category import Category
from models.character import Character
from models.merchandise_item import MerchandiseItem


ALLOWED_TAGS = {
    "Limited Edition",
    "Pre-Order",
    "Collectible"
}


# =========================================================
# GET ONE MERCHANDISE
# =========================================================

def get_merchandise(item_id, increment_view=False):

    item = db.session.get(
        MerchandiseItem,
        item_id
    )

    if item and increment_view:
        item.view_count += 1

        db.session.commit()
        db.session.refresh(item)

    return item


# =========================================================
# GET MERCHANDISE LIST
# =========================================================

def get_merchandise_list(
    category_id=None,
    character_id=None,
    tag=None,
    is_upcoming=None,
    page=1,
    limit=10
):

    query = MerchandiseItem.query

    # Filter category
    if category_id is not None:
        query = query.filter(
            MerchandiseItem.category_id == category_id
        )

    # Filter character
    if character_id is not None:
        query = query.filter(
            MerchandiseItem.character_id == character_id
        )

    # Filter tag
    if tag:
        query = query.filter(
            MerchandiseItem.tag == tag
        )

    # Filter upcoming
    if is_upcoming is not None:

        if isinstance(is_upcoming, str):
            is_upcoming = (
                is_upcoming.lower() == "true"
            )
        else:
            is_upcoming = bool(is_upcoming)

        query = query.filter(
            MerchandiseItem.is_upcoming == is_upcoming
        )

    pagination = (
        query
        .order_by(
            MerchandiseItem.created_at.desc()
        )
        .paginate(
            page=max(1, page),
            per_page=max(1, limit),
            error_out=False
        )
    )

    return (
        pagination.items,
        pagination.total,
        pagination.pages
    )


# =========================================================
# CREATE MERCHANDISE
# =========================================================

def create_merchandise(
    name,
    image_url=None,
    category_id=None,
    character_id=None,
    tag=None,
    is_upcoming=False
):

    # Check category
    category = db.session.get(
        Category,
        category_id
    )

    if category is None:
        return None, "Category not found.", 404

    # Check character
    if character_id is not None:

        character = db.session.get(
            Character,
            character_id
        )

        if character is None:
            return None, "Character not found.", 404

        # Character and merchandise
        # must belong to the same category
        if character.category_id != category_id:
            return (
                None,
                "Character category does not match merchandise category.",
                400
            )

    # Validate tag
    if tag and str(tag).strip():

        tag = str(tag).strip()

        if tag not in ALLOWED_TAGS:
            return (
                None,
                "Invalid tag. Allowed tags: "
                "Limited Edition, Pre-Order, Collectible.",
                400
            )

    else:
        tag = None

    # Convert is_upcoming
    if isinstance(is_upcoming, str):
        is_upcoming = (
            is_upcoming.lower() == "true"
        )
    else:
        is_upcoming = bool(is_upcoming)

    # Validate name
    name = str(name or "").strip()

    if not name:
        return (
            None,
            "Merchandise name is required.",
            400
        )

    # Create item
    item = MerchandiseItem(
        name=name,
        category_id=category_id,
        character_id=character_id,
        image_url=image_url,
        tag=tag,
        is_upcoming=is_upcoming,
        view_count=0
    )

    db.session.add(item)
    db.session.commit()
    db.session.refresh(item)

    return item, None, 201


# =========================================================
# UPDATE MERCHANDISE
# =========================================================

def update_merchandise(
    item_id,
    name=None,
    image_url=None,
    category_id=None,
    character_id=None,
    tag=None,
    is_upcoming=None
):

    item = get_merchandise(item_id)

    if item is None:
        return None, "Merchandise not found.", 404

    # -----------------------------------------
    # Category
    # -----------------------------------------

    target_category_id = (
        category_id
        if category_id is not None
        else item.category_id
    )

    category = db.session.get(
        Category,
        target_category_id
    )

    if category is None:
        return None, "Category not found.", 404

    # -----------------------------------------
    # Character
    # -----------------------------------------

    target_character_id = (
        character_id
        if character_id is not None
        else item.character_id
    )

    if target_character_id is not None:

        character = db.session.get(
            Character,
            target_character_id
        )

        if character is None:
            return None, "Character not found.", 404

        if character.category_id != target_category_id:
            return (
                None,
                "Character category does not match merchandise category.",
                400
            )

    # -----------------------------------------
    # Name
    # -----------------------------------------

    if name is not None:

        name = str(name).strip()

        if not name:
            return (
                None,
                "Merchandise name cannot be empty.",
                400
            )

        item.name = name

    # -----------------------------------------
    # Image
    # -----------------------------------------

    if image_url is not None:
        item.image_url = image_url

    # -----------------------------------------
    # Tag
    # -----------------------------------------

    if tag is not None:

        tag = str(tag).strip()

        if tag:

            if tag not in ALLOWED_TAGS:
                return (
                    None,
                    "Invalid tag. Allowed tags: "
                    "Limited Edition, Pre-Order, Collectible.",
                    400
                )

            item.tag = tag

        else:
            item.tag = None

    # -----------------------------------------
    # Is upcoming
    # -----------------------------------------

    if is_upcoming is not None:

        if isinstance(is_upcoming, str):
            item.is_upcoming = (
                is_upcoming.lower() == "true"
            )
        else:
            item.is_upcoming = bool(is_upcoming)

    # -----------------------------------------
    # Category & Character
    # -----------------------------------------

    item.category_id = target_category_id
    item.character_id = target_character_id

    db.session.commit()
    db.session.refresh(item)

    return item, None, 200


# =========================================================
# DELETE MERCHANDISE
# =========================================================

def delete_merchandise(item_id):

    item = get_merchandise(item_id)

    if item is None:
        return None, "Merchandise not found.", 404

    db.session.delete(item)
    db.session.commit()

    return item, None, 200