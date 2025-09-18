from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from app.models import (
    create_user, get_user_by_email, bcrypt, 
    get_user_tasks, create_task, get_task_by_id, update_task, delete_task, 
    get_user_categories, create_category, update_category, delete_category
)

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

    return render_template('index.html', user_name=session['user_name'])

@routes.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('user_name', None)
    return redirect(url_for('routes.index'))

# --- API Endpoints para Tareas (CRUD) ---

@routes.route('/api/tasks', methods=['GET', 'POST'])
def tasks_api():
    if 'user_id' not in session:
        return jsonify({"error": "No autenticado"}), 401
    
    user_id = session['user_id']

    if request.method == 'GET':
        tasks = get_user_tasks(user_id)
        # Adaptar los datos para el frontend
        tasks_list = []
        for task in tasks:
            tasks_list.append({
                'id': task[0],
                'title': task[1],
                'description': task[2],
                'due_date': task[3].isoformat() if task[3] else None,
                'priority': task[4],
                'completed': task[5],
                'category': task[6]
            })
        return jsonify(tasks_list)

    elif request.method == 'POST':
        data = request.get_json()
        title = data.get('title')
        description = data.get('description')
        due_date = data.get('dueDate')
        priority = data.get('priority')
        category = data.get('category')
        
        if not title:
            return jsonify({"success": False, "message": "El título es obligatorio"}), 400

        try:
            task_id = create_task(user_id, title, description, due_date, priority, category)
            if task_id:
                return jsonify({"success": True, "message": "Tarea creada correctamente", "task_id": task_id}), 201
            else:
                raise Exception("No se pudo crear la tarea.")
        except Exception as e:
            return jsonify({"success": False, "message": f"Error al crear la tarea: {str(e)}"}), 500

@routes.route('/api/tasks/<int:task_id>', methods=['PUT', 'DELETE'])
def task_api(task_id):
    if 'user_id' not in session:
        return jsonify({"error": "No autenticado"}), 401
    
    user_id = session['user_id']

    if request.method == 'PUT':
        data = request.get_json()
        
        task = get_task_by_id(task_id)
        if not task or task['ID_Usuario'] != user_id:
            return jsonify({"success": False, "message": "Tarea no encontrada o no tienes permisos"}), 404
        
        updates = {}
        if 'title' in data:
            updates['title'] = data['title']
        if 'description' in data:
            updates['description'] = data['description']
        if 'due_date' in data:
            updates['due_date'] = data['due_date']
        if 'priority' in data:
            updates['priority'] = data['priority']
        if 'completed' in data:
            updates['completed'] = data['completed']
        if 'category' in data:
            updates['category'] = data['category']

        if update_task(task_id, user_id, **updates):
            return jsonify({"success": True, "message": "Tarea actualizada correctamente"})
        else:
            return jsonify({"success": False, "message": "Error al actualizar la tarea"}), 500

    elif request.method == 'DELETE':
        task = get_task_by_id(task_id)
        if not task or task['ID_Usuario'] != user_id:
            return jsonify({"success": False, "message": "Tarea no encontrada o no tienes permisos"}), 404
        
        if delete_task(task_id, user_id):
            return jsonify({"success": True, "message": "Tarea eliminada correctamente"})
        else:
            return jsonify({"success": False, "message": "Error al eliminar la tarea"}), 500

# --- API Endpoints para Categorías (CRUD) ---

# Crear categoría
@routes.route("/api/categories", methods=["POST"])
def add_category_api():
    if "user_id" not in session:
        return jsonify({"error": "No autorizado"}), 401

    data = request.get_json()
    nombre = data.get("nombre")
    descripcion = data.get("descripcion")

    if not nombre:
        return jsonify({"error": "El nombre es obligatorio"}), 400

    try:
        category_id = create_category(nombre, descripcion, session["user_id"])
        return jsonify({"message": "Categoría creada", "id": category_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Leer categorías
@routes.route("/api/categories", methods=["GET"])
def list_categories_api():
    if "user_id" not in session:
        return jsonify({"error": "No autorizado"}), 401

    categories = get_user_categories(session["user_id"])
    result = [
        {"id": c[0], "nombre": c[1], "descripcion": c[2]}
        for c in categories
    ]
    return jsonify(result)

# Actualizar categoría
@routes.route("/api/categories/<int:category_id>", methods=["PUT"])
def edit_category_api(category_id):
    if "user_id" not in session:
        return jsonify({"error": "No autorizado"}), 401

    data = request.get_json()
    nombre = data.get("nombre")
    descripcion = data.get("descripcion")

    if not nombre:
        return jsonify({"error": "El nombre es obligatorio"}), 400

    success = update_category(category_id, nombre, descripcion, session["user_id"])
    if success:
        return jsonify({"message": "Categoría actualizada"})
    else:
        return jsonify({"error": "No se encontró la categoría o no pertenece al usuario"}), 404

# Eliminar categoría
@routes.route("/api/categories/<int:category_id>", methods=["DELETE"])
def remove_category_api(category_id):
    if "user_id" not in session:
        return jsonify({"error": "No autorizado"}), 401

    success = delete_category(category_id, session["user_id"])
    if success:
        return jsonify({"message": "Categoría eliminada"})
    else:
        return jsonify({"error": "No se encontró la categoría o no pertenece al usuario"}), 404