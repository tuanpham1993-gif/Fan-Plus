def validate_character_data(data, is_update=False):
    data = data or {}
    if not is_update:
        name = data.get('name', '').strip()
        anime_fandom = data.get('anime_fandom', '').strip()
        if not name or not anime_fandom:
            return False, 'Name and anime/fandom are required'
    return True, None
