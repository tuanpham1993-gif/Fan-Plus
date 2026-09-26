from flask import Blueprint, request, jsonify
from crud import event_crud
from schema.event_schema import validate_event_data
from middleware.auth_middleware import admin_required

event_bp = Blueprint('event', __name__, url_prefix='/api/events')

@event_bp.route('', methods=['GET'])
def get_events():
    events = event_crud.get_all_events()
    return jsonify({'events': [e.to_dict() for e in events]}), 200

@event_bp.route('', methods=['POST'])
@admin_required
def create_event():
    data = request.get_json(silent=True) or {}
    is_valid, err_msg = validate_event_data(data)
    if not is_valid:
        return jsonify({'error': err_msg}), 400

    ev = event_crud.create_event(
        title=data.get('title', '').strip(),
        location=data.get('location', '').strip(),
        event_date=data.get('event_date', '').strip(),
        description=data.get('description', '').strip(),
        banner=data.get('banner', '').strip(),
        organizer=data.get('organizer', 'Fan Hub Plus Team').strip()
    )

    return jsonify({'message': 'Event created', 'event': ev.to_dict()}), 201
