# crud/chatSession.py

from extensions import db
from models.chatbotModels.chatsession import ChatSession


def create_chat_session(user_id=None):
    session = ChatSession(
        user_id=user_id
    )

    db.session.add(session)
    db.session.commit()
    db.session.refresh(session)

    return session


def get_chat_session(session_id):
    return ChatSession.query.get(session_id)


def get_chat_sessions_by_user(user_id):
    return (
        ChatSession.query
        .filter_by(user_id=user_id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )


def delete_chat_session(session_id):
    session = get_chat_session(session_id)

    if session is None:
        return None

    db.session.delete(session)
    db.session.commit()

    return session