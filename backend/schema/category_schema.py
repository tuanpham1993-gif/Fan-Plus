def validate_category_data(data, is_update=False):
    errors = []
    if not is_update or "name" in data:
        name = data.get("name")
        if not name or not str(name).strip():
            errors.append("Name is required and cannot be empty.")
    return errors
