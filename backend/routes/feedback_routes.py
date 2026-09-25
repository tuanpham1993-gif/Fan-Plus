from flask import Blueprint, request, jsonify, g
from extensions import db
from models.feedback import Feedback
from middleware.auth_middleware import token_required

feedback_bp = Blueprint('feedback', __name__, url_prefix='/api/feedback')

ALLOWED_FEEDBACK_TYPES = ['bug', 'suggestion', 'query']

@feedback_bp.route('', methods=['POST'])
@token_required
def create_feedback():
    data = request.get_json() or {}
    fb_type = data.get('type', '').strip().lower()
    content = data.get('content', '').strip()

    if not fb_type or fb_type not in ALLOWED_FEEDBACK_TYPES:
        return jsonify({
            'message': 'Loại phản hồi không hợp lệ. Chỉ chấp nhận: bug, suggestion, query'
        }), 400

    if not content:
        return jsonify({'message': 'Nội dung phản hồi không được để trống'}), 400

    if len(content) > 5000:
        return jsonify({'message': 'Nội dung phản hồi vượt quá độ dài tối đa (5000 ký tự)'}), 400

    # User ID is strictly extracted from authenticated user (g.current_user.id)
    feedback = Feedback(
        user_id=g.current_user.id,
        type=fb_type,
        content=content,
        status='pending'
    )
    db.session.add(feedback)
    db.session.commit()

    return jsonify({
        'message': 'Gửi phản hồi thành công. Cảm ơn ý kiến của bạn!',
        'feedback': feedback.to_dict()
    }), 201
