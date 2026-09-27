# crud/chatMessage.py

from extensions import db
from models.chatbotModels.chathistory import ChatMessage


def create_chat_message(session_id, role, content):
    message = ChatMessage(
        session_id=session_id,
        role=role,
        content=content
    )

    db.session.add(message)
    db.session.commit()
    db.session.refresh(message)

    return message


def get_chat_message(message_id):
    return ChatMessage.query.get(message_id)


def get_messages_by_session(session_id):
    return (
        ChatMessage.query
        .filter_by(session_id=session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


def delete_chat_message(message_id):
    message = get_chat_message(message_id)

    if message is None:
        return None

    db.session.delete(message)
    db.session.commit()

    return message