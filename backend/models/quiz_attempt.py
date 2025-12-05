from ..extensions import db

class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'

    id = db.Column(db.String(80), primary_key=True)
    date = db.Column(db.DateTime, nullable=False)
    module_id = db.Column(db.String(80), db.ForeignKey('module_stats.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    max_score = db.Column(db.Integer, nullable=False)
    student_id = db.Column(db.String(80), db.ForeignKey('students.id'), nullable=False)
