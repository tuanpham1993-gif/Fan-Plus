from flask import Blueprint, request, jsonify, g

from middleware.auth_middleware import token_required

from crud.chatbot_crud.chatsession import (
    create_chat_session,
    get_chat_session,
    get_chat_sessions_by_user
)

from crud.chatbot_crud.chatshistory import (
    create_chat_message,
    get_messages_by_session,
)

chat_bp = Blueprint("chat", __name__, url_prefix="/chat")

@chat_bp.post("/sessions")
@token_required
def create_session():
    user_id = g.current_user.id

    session = get_chat_sessions_by_user(user_id)

    if session is not None:
        return jsonify({
            "session_id": session.id,
            "created_at": session.created_at.isoformat()
        }), 200

    session = create_chat_session(user_id=user_id)

    return jsonify({
        "session_id": session.id,
        "created_at": session.created_at.isoformat()
    }), 201

@chat_bp.post("/sessions/<int:session_id>/messages")
@token_required
def create_message(session_id):
    user_id = g.current_user.id
    session = get_chat_session(session_id)

    if session is None:
        return jsonify({"message": "Chat session not found"}), 404

    if session.user_id != user_id:
        return jsonify({"message": "You do not have access to this chat session"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required"}), 400
    content = data.get("content")
    if not content:
        return jsonify({"message": "Message content is required"}), 400
    
    message = create_chat_message(session_id=session.id,role="user",content=content)

    return jsonify({
        "id": message.id,
        "session_id": message.session_id,
        "role": message.role,
        "content": message.content,
        "created_at": message.created_at.isoformat()
    }), 201

@chat_bp.get("/<int:session_id>/messages")
@token_required
def get_chat_history(session_id):
    user_id = g.current_user.id

    session = get_chat_session(session_id)

    if session is None:
        return jsonify({
            "message": "Chat session not found"
        }), 404

    if session.user_id != user_id:
        return jsonify({
            "message": "You do not have access to this chat session"
        }), 403

    messages = get_messages_by_session(session_id)

    return jsonify({
        "session_id": session_id,
        "messages": [
            {
                "id": message.id,
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at.isoformat()
            }
            for message in messages
        ]
    }), 200