def validate_event_data(data):
    data = data or {}
    title = data.get('title', '').strip()
    location = data.get('location', '').strip()
    event_date = data.get('event_date', '').strip()

    if not title or not location or not event_date:
        return False, 'Title, location, and event_date are required'
    return True, None
