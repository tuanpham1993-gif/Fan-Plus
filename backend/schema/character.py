import os

ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
MAX_IMAGE_SIZE = 2 * 1024 * 1024  # 2MB

def validate_image_file(file_obj):
    """Validates uploaded image file size and extension."""
    if not file_obj:
        return True, None
    filename = getattr(file_obj, 'filename', '')
    if not filename:
        return True, None
    
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        return False, "Invalid image extension. Allowed: .jpg, .jpeg, .png, .webp"
    
    # Check file size if available
    file_obj.seek(0, os.SEEK_END)
    size = file_obj.tell()
    file_obj.seek(0)
    if size > MAX_IMAGE_SIZE:
        return False, "Image size exceeds maximum limit of 2MB"
    
    return True, None

def validate_image_url(url_str):
    """Validates image URL or filename extension if provided."""
    if not url_str or not isinstance(url_str, str):
        return True, None
    clean_url = url_str.split('?')[0].split('#')[0]
    ext = os.path.splitext(clean_url)[1].lower()
    if ext and ext not in ALLOWED_IMAGE_EXTENSIONS:
        return False, "Invalid image extension. Allowed: .jpg, .jpeg, .png, .webp"
    return True, None

def validate_character_data(data, is_update=False):
    errors = []
    if not is_update or "name" in data:
        name = data.get("name")
        if not name or not str(name).strip():
            errors.append("Character name is required and cannot be empty.")
            
    if not is_update or "category_id" in data:
        category_id = data.get("category_id")
        if category_id is None:
            errors.append("Category ID is required.")
        else:
            try:
                int(category_id)
            except (ValueError, TypeError):
                errors.append("Category ID must be an integer.")

    if "image_url" in data and data["image_url"]:
        valid, msg = validate_image_url(data["image_url"])
        if not valid:
            errors.append(msg)
            
    return errors