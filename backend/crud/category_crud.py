
from extensions import db

from models.category import Category
from models.character_profile import Character
from models.merchandise_item import MerchandiseItem


# =========================================================
# GET ALL CATEGORIES
# =========================================================

def get_all_categories():

    return Category.query.order_by(
        Category.name.asc()
    ).all()


# =========================================================
# GET ONE CATEGORY
# =========================================================

def get_category(category_id):

    return db.session.get(
        Category,
        category_id
    )


# =========================================================
# CREATE CATEGORY
# =========================================================

def create_category(
    name,
    description=None
):

    # --------------------------------
    # Validate name
    # --------------------------------

    name = str(name or "").strip()

    if not name:

        return None, "Category name is required.", 400

    # --------------------------------
    # Check duplicate name
    # --------------------------------

    existing = Category.query.filter(
        Category.name.ilike(name)
    ).first()

    if existing is not None:

        return None, "Category name already exists.", 409

    # --------------------------------
    # Create category
    # --------------------------------

    category = Category(
        name=name,
        description=description
    )

    db.session.add(category)
    db.session.commit()
    db.session.refresh(category)

    return category, None, 201


# =========================================================
# UPDATE CATEGORY
# =========================================================

def update_category(
    category_id,
    data
):

    # --------------------------------
    # Get category
    # --------------------------------

    category = db.session.get(
        Category,
        category_id
    )

    if category is None:

        return None, "Category not found.", 404

    # --------------------------------
    # Update name
    # --------------------------------

    if "name" in data:

        name = str(
            data["name"] or ""
        ).strip()

        if not name:

            return None, "Category name cannot be empty.", 400

        # Check duplicate name
        duplicate = Category.query.filter(
            Category.name.ilike(name),
            Category.category_id != category_id
        ).first()

        if duplicate is not None:

            return None, "Category name already exists.", 409

        category.name = name

    # --------------------------------
    # Update description
    # --------------------------------

    if "description" in data:

        category.description = data["description"]

    # --------------------------------
    # Save changes
    # --------------------------------

    db.session.commit()
    db.session.refresh(category)

    return category, None, 200


# =========================================================
# DELETE CATEGORY
# =========================================================

def delete_category(category_id):

    # --------------------------------
    # Get category
    # --------------------------------

    category = db.session.get(
        Category,
        category_id
    )

    if category is None:

        return None, "Category not found.", 404

    # --------------------------------
    # Check characters
    # --------------------------------

    has_character = Character.query.filter_by(
        category_id=category_id
    ).first()

    # --------------------------------
    # Check merchandise
    # --------------------------------

    has_merchandise = MerchandiseItem.query.filter_by(
        category_id=category_id
    ).first()

    # --------------------------------
    # Cannot delete if category is in use
    # --------------------------------

    if has_character or has_merchandise:

        return (
            None,
            "Cannot delete category that is currently assigned to characters or merchandise.",
            409
        )

    # --------------------------------
    # Delete category
    # --------------------------------

    db.session.delete(category)
    db.session.commit()

    return category, None, 200
