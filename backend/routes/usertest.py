from flask import Blueprint, request, jsonify
from extensions import db
from projectHubPlus.backend.models.usertest import User
from schema.user import UserCreate, UserResponse

user_bp = Blueprint("users",__name__,url_prefix="/api/users")

@user_bp.post("/")
def create_user():

    # JSON → Pydantic
    data = UserCreate.model_validate(request.json)

    # Pydantic → SQLAlchemy
    user = User(
        username=data.username,
        email=data.email
    )

    db.session.add(user)
    db.session.commit()

    # SQLAlchemy → Pydantic
    response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email
    )

    return jsonify(response.model_dump()), 201