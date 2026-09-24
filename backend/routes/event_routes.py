from flask import Blueprint, request, jsonify
from extensions import db
from models import Event, User
from flask_jwt_extended import jwt_required, get_jwt_identity

event_bp = Blueprint('event', __name__, url_prefix='/api/events')

def is_admin(user_id):
    u = User.query.get(int(user_id))
    return u and u.role and u.role.name == 'Admin'

@event_bp.route('', methods=['GET'])
def get_events():
    events = Event.query.order_by(Event.id.desc()).all()
    return jsonify({'events': [e.to_dict() for e in events]}), 200

@event_bp.route('', methods=['POST'])
@jwt_required()
def create_event():
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privilege required'}), 403

    data = request.get_json() or {}
    title = data.get('title', '').strip()
    location = data.get('location', '').strip()
    event_date = data.get('event_date', '').strip()

    if not title or not location or not event_date:
        return jsonify({'error': 'Title, location, and event_date are required'}), 400

    ev = Event(
        title=title,
        description=data.get('description', '').strip(),
        location=location,
        event_date=event_date,
        banner=data.get('banner', '').strip(),
        organizer=data.get('organizer', 'Fan Hub Plus Team').strip()
    )
    db.session.add(ev)
    db.session.commit()
    return jsonify({'message': 'Event created', 'event': ev.to_dict()}), 201
