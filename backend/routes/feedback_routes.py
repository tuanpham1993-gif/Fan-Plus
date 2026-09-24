from flask import Blueprint, request, jsonify
from extensions import db
from models import Feedback, User
from flask_jwt_extended import jwt_required, get_jwt_identity, jwt_required

feedback_bp = Blueprint('feedback', __name__, url_prefix='/api/feedback')

def is_admin(user_id):
    u = User.query.get(int(user_id))
    return u and u.role and u.role.name == 'Admin'

@feedback_bp.route('', methods=['GET'])
@jwt_required()
def get_feedbacks():
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privilege required'}), 403

    feedbacks = Feedback.query.order_by(Feedback.created_at.desc()).all()
    return jsonify({'feedbacks': [f.to_dict() for f in feedbacks]}), 200

@feedback_bp.route('', methods=['POST'])
def submit_feedback():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()
    user_id = data.get('user_id')

    if not name or not email or not subject or not message:
        return jsonify({'error': 'All fields (name, email, subject, message) are required'}), 400

    fb = Feedback(
        user_id=user_id if user_id else None,
        name=name,
        email=email,
        subject=subject,
        message=message
    )
    db.session.add(fb)
    db.session.commit()

    return jsonify({'message': 'Thank you for your feedback!', 'feedback': fb.to_dict()}), 201

@feedback_bp.route('/<int:fb_id>/status', methods=['PUT'])
@jwt_required()
def update_feedback_status(fb_id):
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privilege required'}), 403

    fb = Feedback.query.get(fb_id)
    if not fb:
        return jsonify({'error': 'Feedback not found'}), 404

    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status in ['pending', 'resolved', 'dismissed']:
        fb.status = new_status
        db.session.commit()
        return jsonify({'message': 'Status updated', 'feedback': fb.to_dict()}), 200

    return jsonify({'error': 'Invalid status'}), 400

@feedback_bp.route('/<int:fb_id>', methods=['DELETE'])
@jwt_required()
def delete_feedback(fb_id):
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privilege required'}), 403

    fb = Feedback.query.get(fb_id)
    if not fb:
        return jsonify({'error': 'Feedback not found'}), 404

    db.session.delete(fb)
    db.session.commit()
    return jsonify({'message': 'Feedback deleted'}), 200
