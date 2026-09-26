from flask import Blueprint, request, jsonify, g
from crud import feedback_crud
from schema.feedback_schema import validate_feedback_data
from middleware.auth_middleware import token_required

feedback_bp = Blueprint('feedback', __name__, url_prefix='/api/feedback')

@feedback_bp.route('', methods=['POST'])
@token_required
def create_feedback():
    data = request.get_json(silent=True) or {}
    
    is_valid, err_msg = validate_feedback_data(data)
    if not is_valid:
        return jsonify({'message': err_msg}), 400

    fb_type = data.get('type', '').strip().lower()
    content = data.get('content', '').strip()

    feedback = feedback_crud.create_feedback(
        user_id=g.current_user.id,
        fb_type=fb_type,
        content=content,
        status='pending'
    )

    return jsonify({
        'message': 'Gửi phản hồi thành công. Cảm ơn ý kiến của bạn!',
        'feedback': feedback.to_dict()
    }), 201
