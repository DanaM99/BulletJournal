from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from app.models import create_user, get_user_by_email, get_user_tasks, bcrypt
import pandas as pd

routes = Blueprint('routes', __name__)

@routes.route('/')
def index():
    return render_template('register.html')

@routes.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    nombre = data.get('nombre')
    apellido = data.get('apellido')
    email = data.get('email')
    password = data.get('password')

    if not all([nombre, apellido, email, password]):
        return jsonify({"success": False, "message": "Completa todos los campos"})

    user = get_user_by_email(email)
    if user:
        return jsonify({"success": False, "message": "El email ya está registrado"})

    if create_user(nombre, apellido, email, password):
        return jsonify({"success": True, "message": f"Usuario {nombre} registrado correctamente"})
    else:
        return jsonify({"success": False, "message": "Error al registrar el usuario"})

@routes.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"success": False, "message": "Completa todos los campos"})

    user = get_user_by_email(email)
    
    if user and bcrypt.check_password_hash(user['Contraseña'], password):
        session['user_id'] = user['ID_Usuario']
        session['user_name'] = user['Nombre']
        return jsonify({"success": True, "message": "Inicio de sesión exitoso"})
    else:
        return jsonify({"success": False, "message": "Email o contraseña incorrectos"})

@routes.route('/home')
def home():
    if 'user_id' not in session:
        return redirect(url_for('routes.index'))

    # Usamos Pandas para procesar las tareas del usuario
    tasks = get_user_tasks(session['user_id'])
    
    # Creamos un DataFrame de Pandas
    df_tasks = pd.DataFrame(tasks, columns=['Titulo', 'Descripcion', 'FechaCreacion', 'Prioridad', 'Estado'])

    # Si no hay tareas, evitamos errores
    if df_tasks.empty:
        total_tasks = 0
        completed_tasks = 0
        pending_tasks = 0
    else:
        total_tasks = len(df_tasks)
        completed_tasks = len(df_tasks[df_tasks['Estado'] == 'Completada'])
        pending_tasks = len(df_tasks[df_tasks['Estado'] == 'Pendiente'])

    # Pasamos las estadísticas a la plantilla
    stats = {
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'pending_tasks': pending_tasks
    }

    return render_template('index.html', user_name=session['user_name'], stats=stats)

@routes.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('user_name', None)
    return redirect(url_for('routes.index'))