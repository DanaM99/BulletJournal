from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from app.models import (
    create_user, get_user_by_email, bcrypt,
    get_user_tasks, create_task,
    get_user_categories, create_category, update_category, delete_category, get_or_create_category
)

routes = Blueprint('routes', __name__)

# --- Registro y login ---
@routes.route('/')
def index():
    return render_template('register.html')


@routes.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    nombre = data.get('nombre')
    apellido = data.get('apellido')
    email = data.get('email')
    password = data.get('password')

    if not all([nombre, apellido, email, password]):
        return jsonify({"success": False, "message": "Completa todos los campos"})

    if get_user_by_email(email):
        return jsonify({"success": False, "message": "El email ya está registrado"})

    if create_user(nombre, apellido, email, password):
        return jsonify({"success": True, "message": f"Usuario {nombre} registrado correctamente"})
    return jsonify({"success": False, "message": "Error al registrar el usuario"})


@routes.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"success": False, "message": "Completa todos los campos"})

    user = get_user_by_email(email)
    if user and bcrypt.check_password_hash(user['Contraseña'], password):
        session['user_id'] = user['ID_Usuario']
        session['user_name'] = user['Nombre']
        return jsonify({"success": True, "message": "Inicio de sesión exitoso"})
    return jsonify({"success": False, "message": "Email o contraseña incorrectos"})


@routes.route('/home')
def home():
    if 'user_id' not in session:
        return redirect(url_for('routes.index'))
    return render_template('index.html', user_name=session['user_name'])

@routes.route("/api/user", methods=["GET"])
def get_logged_user():
    if 'user_id' not in session:
        return jsonify({"success": False, "message": "No autenticado"}), 401

    return jsonify({
        "success": True,
        "user_name": session.get('user_name')
    }) 
    
@routes.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('routes.index'))


# --- API Tareas (solo crear y listar) ---
@routes.route('/api/tasks', methods=['GET', 'POST'])
def tasks_api():
    if 'user_id' not in session:
        return jsonify({"error": "No autenticado"}), 401
    user_id = session['user_id']

    if request.method == 'GET':
        try:
            tasks = get_user_tasks(user_id)
            return jsonify([
                {
                    'id': t[0],
                    'title': t[1],
                    'description': t[2],
                    'due_date': t[3].isoformat() if t[3] else None,
                    'priority': t[4],
                    'category': t[5]
                } for t in tasks
            ])
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

    elif request.method == 'POST':
        data = request.get_json() or {}
        title = data.get('title')
        description = data.get('description') or None
        due_date = data.get('due_date') or None
        priority = data.get('priority') or 'medium'
        category = data.get('category') or None

        if not title:
            return jsonify({"success": False, "message": "El título es obligatorio"}), 400
        if priority not in ['low', 'medium', 'high']:
            return jsonify({"success": False, "message": "Prioridad inválida"}), 400

        try:
            task_id = create_task(user_id, title, description, due_date, priority, category)
            if task_id:
                return jsonify({"success": True, "message": "Tarea creada", "task_id": task_id}), 201
            return jsonify({"success": False, "message": "Error al crear la tarea"}), 500
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500


# --- API Categorías (CRUD completo) ---
@routes.route("/api/categories", methods=["GET", "POST"])
def categories_api():
    if 'user_id' not in session:
        return jsonify({"error": "No autorizado"}), 401
    user_id = session['user_id']

    if request.method == 'GET':
        try:
            categories = get_user_categories(user_id)
            return jsonify([{"id": c[0], "nombre": c[1], "descripcion": c[2]} for c in categories])
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

    else:
        data = request.get_json() or {}
        nombre = data.get('nombre')
        descripcion = data.get('descripcion') or None
        if not nombre:
            return jsonify({"error": "El nombre es obligatorio"}), 400
        try:
            cat_id = create_category(nombre, descripcion, user_id)
            return jsonify({"message": "Categoría creada", "id": cat_id}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@routes.route('/api/categories/<int:category_id>', methods=['PUT'])
def update_category_route(category_id):
    if 'user_id' not in session:
        return jsonify({"error": "No autorizado"}), 401
    user_id = session['user_id']

    data = request.get_json() or {}
    nombre = data.get('nombre')
    descripcion = data.get('descripcion') or None

    if not nombre:
        return jsonify({"error": "El nombre es obligatorio"}), 400

    try:
        success = update_category(category_id, nombre, descripcion, user_id)
        if success:
            return jsonify({"message": "Categoría actualizada correctamente"}), 200
        else:
            return jsonify({"error": "No se pudo actualizar la categoría"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@routes.route('/api/categories/<int:category_id>', methods=['DELETE'])
def delete_category_route(category_id):
    user_id = session.get('user_id')  # asegúrate de tener la sesión
    if not user_id:
        return jsonify({"error": "Usuario no autenticado"}), 401

    success = delete_category(category_id, user_id)
    if success:
        return jsonify({"message": "Categoría eliminada correctamente"}), 200
    else:
        return jsonify({"error": "No se pudo eliminar la categoría"}), 400
