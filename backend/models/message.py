from ..extensions import db
from .user import UserRole
from sqlalchemy.dialects.postgresql import JSONB

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.String(80), primary_key=True)
    role = db.Column(db.Enum(UserRole), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    attachment = db.Column(db.JSON)
    conversation_id = db.Column(db.String(80), db.ForeignKey('chat_conversations.id'), nullable=False)
