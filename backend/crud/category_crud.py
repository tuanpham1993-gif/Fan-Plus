from extensions import db

from models.category import Category
from models.character import Character
from models.merchandise_item import MerchandiseItem




def get_all_categories(search=None):

    query = Category.query

    

    if search is not None and str(search).strip():

        search_term = f"%{str(search).strip()}%"

        query = query.filter(
            Category.name.ilike(search_term)
        )

   

    return query.order_by(
        Category.name.asc()
    ).all()



def create_category(
    name,
    description=None
):



    name = str(name or "").strip()

    if not name:

        return None, "Category name is required.", 400

 

    existing = Category.query.filter(
        Category.name.ilike(name)
    ).first()

    if existing is not None:

        return None, "Category name already exists.", 409



    category = Category(
        name=name,
        description=description
    )

    db.session.add(category)
    db.session.commit()
    db.session.refresh(category)

    return category, None, 201




def update_category(
    category_id,
    data
):

    category = db.session.get(
        Category,
        category_id
    )

    if category is None:

        return None, "Category not found.", 404


    if "name" in data:

        name = str(
            data["name"] or ""
        ).strip()

        if not name:

            return None, "Category name cannot be empty.", 400

   

        duplicate = Category.query.filter(
            Category.name.ilike(name),
            Category.category_id != category_id
        ).first()

        if duplicate is not None:

            return None, "Category name already exists.", 409

        category.name = name



    if "description" in data:

        category.description = data["description"]


    db.session.commit()
    db.session.refresh(category)

    return category, None, 200




def delete_category(category_id):

    category = db.session.get(
        Category,
        category_id
    )

    if category is None:

        return None, "Category not found.", 404

    has_character = Character.query.filter_by(
        category_id=category_id
    ).first()

    has_merchandise = MerchandiseItem.query.filter_by(
        category_id=category_id
    ).first()

    if has_character or has_merchandise:

        return (
            None,
            "Cannot delete category that is currently assigned to characters or merchandise.",
            409
        )

    db.session.delete(category)
    db.session.commit()

    return category, None, 200