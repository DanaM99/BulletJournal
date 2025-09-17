from flask import Flask
from app.routes import routes

def create_app():
    app = Flask(__name__)
    app.secret_key = "clave_super_secreta"
    app.register_blueprint(routes)
    return app