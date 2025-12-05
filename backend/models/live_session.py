from ..extensions import db

class LiveSession(db.Model):
    __tablename__ = 'live_sessions'

    id = db.Column(db.String(80), primary_key=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    student_id = db.Column(db.String(80), db.ForeignKey('students.id'), nullable=False)
    transcript = db.relationship('TranscriptItem', backref='live_session', lazy=True)
