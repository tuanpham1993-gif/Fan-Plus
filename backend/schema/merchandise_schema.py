def validate_merchandise_data(data):
    data = data or {}
    name = data.get('name', '').strip()
    price = data.get('price')

    if not name or price is None:
        return False, 'Name and price are required'
    return True, None
