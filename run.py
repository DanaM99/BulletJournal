from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from config import get_connection
import pyodbc

app = Flask(__name__)
app.secret_key = "tu_clave_secreta"  # reemplazar por algo seguro en producción

# ----------------------- RUTAS PRINCIPALES -----------------------

@app.route('/')
def index():
    # Si ya hay sesión activa, redirigir al dashboard
    if session.get('user_id'):
        return redirect(url_for('dashboard'))
    return render_template('register.html')

# ----------------------- REGISTRO -----------------------
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        nombre = data.get('nombre')
        apellido = data.get('apellido')
        email = data.get('email')
        password = data.get('password')

        if not (nombre and apellido and email and password):
            return jsonify({'success': False, 'message': 'Todos los campos son obligatorios'}), 400

        hashed_password = generate_password_hash(password)
        conn = get_connection()

        if not conn:
            return jsonify({'success': False, 'message': 'Error de conexión a la base de datos'}), 503

        cursor = conn.cursor()

        # Verificar si el correo ya existe
        cursor.execute("SELECT ID_Usuario FROM Usuarios WHERE Email = ?", (email,))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'El correo ya está registrado'}), 409

        # Insertar el nuevo usuario
        cursor.execute(
            "INSERT INTO Usuarios (Nombre, Apellido, Email, Contraseña) VALUES (?, ?, ?, ?)",
            (nombre, apellido, email, hashed_password)
        )
        conn.commit()
        return jsonify({'success': True, 'message': 'Registro exitoso'}), 201

    except pyodbc.Error as e:
        print("Error de la base de datos:", e)
        return jsonify({'success': False, 'message': 'Error en la base de datos al registrar el usuario'}), 500
    except Exception as e:
        print("Error inesperado en registro:", e)
        return jsonify({'success': False, 'message': 'Error inesperado del servidor'}), 500
    finally:
        if 'conn' in locals() and conn:
            conn.close()

# ----------------------- LOGIN -----------------------
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not (email and password):
            return jsonify({'success': False, 'message': 'Email y contraseña son obligatorios'}), 400

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT ID_Usuario, Nombre, Contraseña FROM Usuarios WHERE Email = ?", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404

        user_id, nombre, hashed_password = user

        if not check_password_hash(hashed_password, password):
            return jsonify({'success': False, 'message': 'Contraseña incorrecta'}), 401

        # Guardar sesión
        session['user_id'] = user_id
        session['user_name'] = nombre

        return jsonify({'success': True, 'message': f'Bienvenido {nombre}'}), 200

    except pyodbc.Error as e:
        print("Error de la base de datos:", e)
        return jsonify({'success': False, 'message': 'Error en la base de datos al iniciar sesión'}), 500
    except Exception as e:
        print("Error inesperado en login:", e)
        return jsonify({'success': False, 'message': 'Error inesperado del servidor'}), 500
    finally:
        if 'conn' in locals() and conn:
            conn.close()

# ----------------------- DASHBOARD -----------------------
@app.route('/dashboard')
def dashboard():
    if not session.get('user_id'):
        return redirect(url_for('index'))
    return render_template('index.html', nombre=session.get('user_name'))

# ----------------------- LOGOUT -----------------------
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

# ----------------------- EJECUCIÓN -----------------------
if __name__ == "__main__":
    app.run(debug=True)
