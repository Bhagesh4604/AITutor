from ..extensions import db
from .user import User
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

class Student(User):
    __tablename__ = 'students'

    id = db.Column(db.String(80), db.ForeignKey('users.id'), primary_key=True)
    bio = db.Column(db.Text)
    mastery_score = db.Column(db.Integer, default=0)
    topics_completed = db.Column(db.Integer, default=0)
    at_risk = db.Column(db.Boolean, default=False)
    sentiment_trend = db.Column(db.String)
    preferred_language = db.Column(db.String(80))
    preferred_voice = db.Column(db.String(80))

    modules = db.relationship('ModuleStats', backref='student', lazy=True)
    saved_resources = db.relationship('StudyResource', backref='student', lazy=True)
    conversations = db.relationship('ChatConversation', backref='student', lazy=True)
    live_sessions = db.relationship('LiveSession', backref='student', lazy=True)
    attempts = db.relationship('QuizAttempt', backref='student', lazy=True)

    __mapper_args__ = {
        'polymorphic_identity': 'STUDENT',
    }
