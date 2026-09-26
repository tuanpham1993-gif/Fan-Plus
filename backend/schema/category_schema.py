def validate_category_data(data, is_update=False):
    data = data or {}
    if not is_update:
        name = data.get('name', '').strip()
        if not name:
            return False, 'Category name is required'
    else:
        if 'name' in data and not data['name'].strip():
            return False, 'Category name cannot be empty'
    return True, None
