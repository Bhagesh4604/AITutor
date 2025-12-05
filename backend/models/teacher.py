from ..extensions import db
from .user import User

class Teacher(User):
    __tablename__ = 'teachers'

    id = db.Column(db.String(80), db.ForeignKey('users.id'), primary_key=True)
    subject = db.Column(db.String(120))
    bio = db.Column(db.Text)
    years_of_experience = db.Column(db.Integer)

    __mapper_args__ = {
        'polymorphic_identity': 'TEACHER',
    }
