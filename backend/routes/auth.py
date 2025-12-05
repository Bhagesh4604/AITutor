from flask import Blueprint, request, jsonify
from ..extensions import db, bcrypt
from ..models.user import User, UserRole
from ..models.student import Student
from flask_jwt_extended import create_access_token
import uuid

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({'message': 'Missing required fields'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already registered'}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    student_id = f's{uuid.uuid4()}'
    new_student = Student(
        id=student_id,
        name=name,
        email=email,
        password=hashed_password,
        role=UserRole.STUDENT
    )

    db.session.add(new_student)
    db.session.commit()

    return jsonify({'message': 'Student registered successfully', 'id': student_id}), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Missing email or password'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({'message': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify(access_token=access_token)