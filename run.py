from flask import Flask
from flask_bcrypt import Bcrypt
from app.routes import routes

def create_app():
    app = Flask(__name__)
    app.secret_key = "clave_super_secreta"  # Utiliza una clave secreta segura en producción
    
    # Inicializa Bcrypt para el hash de contraseñas
    bcrypt = Bcrypt(app)
    
    # Registra el Blueprint de rutas
    app.register_blueprint(routes)
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)