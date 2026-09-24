from flask import Blueprint, request, jsonify
from extensions import db
from models import Merchandise, User
from flask_jwt_extended import jwt_required, get_jwt_identity

merchandise_bp = Blueprint('merchandise', __name__, url_prefix='/api/merchandise')

def is_admin(user_id):
    u = User.query.get(int(user_id))
    return u and u.role and u.role.name == 'Admin'

@merchandise_bp.route('', methods=['GET'])
def get_merchandise():
    items = Merchandise.query.order_by(Merchandise.id.desc()).all()
    return jsonify({'merchandise': [i.to_dict() for i in items]}), 200

@merchandise_bp.route('', methods=['POST'])
@jwt_required()
def create_merchandise():
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privilege required'}), 403

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    price = data.get('price')

    if not name or price is None:
        return jsonify({'error': 'Name and price are required'}), 400

    item = Merchandise(
        name=name,
        description=data.get('description', '').strip(),
        price=float(price),
        image=data.get('image', '').strip(),
        category=data.get('category', 'Figures').strip(),
        stock=int(data.get('stock', 50)),
        rating=float(data.get('rating', 4.8))
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({'message': 'Item created', 'item': item.to_dict()}), 201
