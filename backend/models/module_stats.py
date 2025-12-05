from ..extensions import db

class ModuleStats(db.Model):
    __tablename__ = 'module_stats'

    id = db.Column(db.String(80), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    mastery = db.Column(db.Integer, default=0)
    time_spent = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), nullable=False)
    student_id = db.Column(db.String(80), db.ForeignKey('students.id'), nullable=False)
