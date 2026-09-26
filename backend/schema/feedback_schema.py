ALLOWED_FEEDBACK_TYPES = ['bug', 'suggestion', 'query']

def validate_feedback_data(data):
    data = data or {}
    fb_type = data.get('type', '').strip().lower()
    content = data.get('content', '').strip()

    if not fb_type or fb_type not in ALLOWED_FEEDBACK_TYPES:
        return False, 'Loại phản hồi không hợp lệ. Chỉ chấp nhận: bug, suggestion, query'

    if not content:
        return False, 'Nội dung phản hồi không được để trống'

    if len(content) > 5000:
        return False, 'Nội dung phản hồi vượt quá độ dài tối đa (5000 ký tự)'

    return True, None
