from ..extensions import db
from sqlalchemy.dialects.postgresql import ARRAY

class QuizQuestion(db.Model):
    __tablename__ = 'quiz_questions'

    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.Text, nullable=False)
    options = db.Column(db.String, nullable=False)
    correct_answer = db.Column(db.Integer, nullable=False)
    topic = db.Column(db.String(120), nullable=False)
    module_id = db.Column(db.String(80), db.ForeignKey('module_stats.id'), nullable=False)
