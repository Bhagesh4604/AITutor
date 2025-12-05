from ..extensions import db

class StudyResource(db.Model):
    __tablename__ = 'study_resources'

    id = db.Column(db.String(80), primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    uri = db.Column(db.String(255), nullable=False)
    source = db.Column(db.String(120))
    type = db.Column(db.String(20))
    date_saved = db.Column(db.DateTime)
    student_id = db.Column(db.String(80), db.ForeignKey('students.id'), nullable=False)
