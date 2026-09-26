def validate_content_data(data, is_update=False):
    data = data or {}
    if not is_update:
        title = data.get('title', '').strip()
        summary = data.get('summary', '').strip()
        body_content = data.get('content', '').strip()
        category_id = data.get('category_id')

        if not title or not summary or not body_content or not category_id:
            return False, 'Title, summary, content body, and category_id are required'
    return True, None
