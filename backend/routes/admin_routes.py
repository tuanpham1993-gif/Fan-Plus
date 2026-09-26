from flask import Blueprint, request, jsonify
from crud import admin_crud, feedback_crud
from middleware.auth_middleware import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    stats_data = admin_crud.get_admin_stats()
    return jsonify(stats_data), 200

@admin_bp.route('/feedback', methods=['GET'])
@admin_required
def get_all_feedback():
    status = request.args.get('status', type=str)
    feedbacks = feedback_crud.get_feedbacks(status=status)
    return jsonify({
        'count': len(feedbacks),
        'feedbacks': [f.to_dict() for f in feedbacks]
    }), 200

@admin_bp.route('/feedback/<int:feedback_id>', methods=['PUT'])
@admin_required
def update_feedback_status(feedback_id):
    fb = feedback_crud.get_feedback_by_id(feedback_id)
    if not fb:
        return jsonify({'error': 'Feedback not found'}), 404

    data = request.get_json(silent=True) or {}
    new_status = data.get('status', '').strip().lower()

    if new_status not in ['pending', 'resolved', 'dismissed']:
        return jsonify({'error': 'Trạng thái không hợp lệ (Chỉ chấp nhận: pending, resolved, dismissed)'}), 400

    updated_fb = feedback_crud.update_feedback_status(fb, new_status)

    return jsonify({
        'message': f'Cập nhật trạng thái phản hồi thành {new_status} thành công',
        'feedback': updated_fb.to_dict()
    }), 200
