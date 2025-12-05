from ..extensions import db
from .user import UserRole
from sqlalchemy.dialects.postgresql import JSONB

class InterventionFlag(db.Model):
    __tablename__ = 'intervention_flags'

    id = db.Column(db.String(80), primary_key=True)
    student_id = db.Column(db.String(80), db.ForeignKey('students.id'), nullable=False)
    student_name = db.Column(db.String(80), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)

class AIDecisionLog(db.Model):
    __tablename__ = 'ai_decision_logs'

    id = db.Column(db.String(80), primary_key=True)
    student_id = db.Column(db.String(80), db.ForeignKey('students.id'), nullable=False)
    student_input = db.Column(db.Text, nullable=False)
    ai_output = db.Column(db.Text, nullable=False)
    reasoning = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)

class TeacherMessage(db.Model):
    __tablename__ = 'teacher_messages'

    id = db.Column(db.String(80), primary_key=True)
    student_id = db.Column(db.String(80), db.ForeignKey('students.id'), nullable=False)
    teacher_name = db.Column(db.String(80), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    read = db.Column(db.Boolean, default=False)
