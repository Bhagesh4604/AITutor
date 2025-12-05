from flask import Flask
from flask_cors import CORS
from .extensions import db, migrate, jwt, bcrypt
from . import models

def create_app():
    app = Flask(__name__)
    app.config.from_object('backend.config.Config')

    CORS(app, resources={r"/*": {"origins": "*"}})

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)

    with app.app_context():
        from .routes import auth, ai, students
        
        app.register_blueprint(auth.bp, url_prefix='/auth')
        app.register_blueprint(ai.bp, url_prefix='/ai')
        app.register_blueprint(students.bp, url_prefix='/students')

        @app.route('/')
        def index():
            return 'Backend is running!'

        return app
