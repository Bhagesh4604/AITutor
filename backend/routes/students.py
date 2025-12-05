from flask import Blueprint, jsonify
from ..models.student import Student
from ..extensions import db
# from ..extensions import db, bcrypt # bcrypt is no longer needed here after removing add_student
# import uuid # uuid is no longer needed here after removing add_student

bp = Blueprint('students', __name__)

@bp.route('/', methods=['GET'])
def get_students():
    students = Student.query.all()
    return jsonify([
        {
            'id': student.id,
            'name': student.name,
            'email': student.email,
            'masteryScore': student.mastery_score,
            'topicsCompleted': student.topics_completed,
            'atRisk': student.at_risk,
        } for student in students
    ])

@bp.route('/<string:student_id>', methods=['GET'])
def get_student(student_id):
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'message': 'Student not found'}), 404
        
    return jsonify({
        'id': student.id,
        'name': student.name,
        'email': student.email,
        'masteryScore': student.mastery_score,
        'topicsCompleted': student.topics_completed,
        'atRisk': student.at_risk,
        'sentimentTrend': student.sentiment_trend,
        'modules': [
            {
                'id': module.id,
                'name': module.name,
                'mastery': module.mastery,
                'timeSpent': module.time_spent,
                'status': module.status,
            } for module in student.modules
        ]
    })