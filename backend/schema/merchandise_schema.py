import os

ALLOWED_TAGS = {"Limited Edition", "Pre-Order", "Collectible"}
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
MAX_IMAGE_SIZE = 2 * 1024 * 1024  # 2MB

def validate_merchandise_data(data, is_update=False):
    errors = []
    
    if not is_update or "name" in data:
        name = data.get("name")
        if not name or not str(name).strip():
            errors.append("Merchandise name is required and cannot be empty.")

    if not is_update or "category_id" in data:
        category_id = data.get("category_id")
        if category_id is None:
            errors.append("Category ID is required.")
        else:
            try:
                int(category_id)
            except (ValueError, TypeError):
                errors.append("Category ID must be an integer.")

    if "character_id" in data and data["character_id"] is not None:
        try:
            int(data["character_id"])
        except (ValueError, TypeError):
            errors.append("Character ID must be an integer or null.")

    if "tag" in data and data["tag"] is not None and str(data["tag"]).strip() != "":
        if data["tag"] not in ALLOWED_TAGS:
            errors.append("Invalid tag. Allowed tags: Limited Edition, Pre-Order, Collectible.")

    if "is_upcoming" in data and data["is_upcoming"] is not None:
        if not isinstance(data["is_upcoming"], bool):
            if str(data["is_upcoming"]).lower() in ["true", "false"]:
                pass
            else:
                errors.append("is_upcoming must be a boolean.")

    if "image_url" in data and data["image_url"]:
        clean_url = str(data["image_url"]).split('?')[0].split('#')[0]
        ext = os.path.splitext(clean_url)[1].lower()
        if ext and ext not in ALLOWED_IMAGE_EXTENSIONS:
            errors.append("Invalid image extension. Allowed: .jpg, .jpeg, .png, .webp")

    return errors
