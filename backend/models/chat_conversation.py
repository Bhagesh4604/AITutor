from ..extensions import db

class ChatConversation(db.Model):
    __tablename__ = 'chat_conversations'

    id = db.Column(db.String(80), primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    summary = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)
    student_id = db.Column(db.String(80), db.ForeignKey('students.id'), nullable=False)
    messages = db.relationship('Message', backref='conversation', lazy=True)
