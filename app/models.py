from config import get_connection
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

# --- Usuarios ---
def create_user(nombre, apellido, email, password):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        cursor.execute("""
            INSERT INTO Usuarios (Nombre, Apellido, Email, Contraseña)
            VALUES (?, ?, ?, ?)
        """, (nombre, apellido, email, hashed_password))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error al crear el usuario: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()

def get_user_by_email(email):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ID_Usuario, Nombre, Email, Contraseña FROM Usuarios WHERE Email = ?", (email,))
        user_data = cursor.fetchone()
        if user_data:
            return {
                'ID_Usuario': user_data[0],
                'Nombre': user_data[1],
                'Email': user_data[2],
                'Contraseña': user_data[3]
            }
        return None
    except Exception as e:
        print(f"Error al obtener el usuario: {e}")
        return None
    finally:
        if conn:
            conn.close()

# ---------- CRUD de Categorías ----------

def get_user_categories(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT ID_Categoria, Nombre, Descripcion FROM Categorias WHERE ID_Usuario = ?", (user_id,))
    categorias = cursor.fetchall()
    conn.close()
    return categorias

def get_or_create_category(user_id, category_name):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Check if category exists for the user
        cursor.execute("SELECT ID_Categoria FROM Categorias WHERE ID_Usuario = ? AND Nombre = ?", (user_id, category_name))
        result = cursor.fetchone()
        if result:
            return result[0]
        
        # If not, create it
        cursor.execute("INSERT INTO Categorias (Nombre, ID_Usuario) VALUES (?, ?)", (category_name, user_id))
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        print(f"Error al obtener o crear la categoría: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()

def create_category(nombre, descripcion, user_id):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Insertamos la nueva categoría y obtenemos su ID en la misma ejecución
        cursor.execute("INSERT INTO Categorias (Nombre, Descripcion, ID_Usuario) VALUES (?, ?, ?); SELECT SCOPE_IDENTITY()", (nombre, descripcion, user_id))
        conn.commit()
        # Obtenemos el ID del resultado de la consulta
        category_id = cursor.fetchone()[0]
        return int(category_id)
    except Exception as e:
        print(f"Error al crear la categoría: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()

def update_category(category_id, nombre, descripcion, user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Categorias SET Nombre = ?, Descripcion = ? WHERE ID_Categoria = ? AND ID_Usuario = ?", (nombre, descripcion, category_id, user_id))
    conn.commit()
    conn.close()
    return cursor.rowcount > 0

def delete_category(category_id, user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Categorias WHERE ID_Categoria = ? AND ID_Usuario = ?", (category_id, user_id))
    conn.commit()
    conn.close()
    return cursor.rowcount > 0

# --- Tareas (CRUD) ---
def create_task(user_id, title, description, due_date, priority, category):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        id_categoria = get_or_create_category(user_id, category)
        if not id_categoria:
            raise Exception("No se pudo obtener el ID de la categoría")

        # Insertamos la nueva tarea y obtenemos su ID en la misma ejecución
        cursor.execute("""
            INSERT INTO Tareas (ID_Usuario, Titulo, Descripcion, FechaVencimiento, Prioridad, ID_Categoria, Estado)
            VALUES (?, ?, ?, ?, ?, ?, ?); SELECT SCOPE_IDENTITY()
        """, (user_id, title, description, due_date, priority, id_categoria, 'Pendiente'))
        conn.commit()
        # Obtenemos el ID del resultado de la consulta
        task_id = cursor.fetchone()[0]
        return int(task_id)
    except Exception as e:
        print(f"Error al crear la tarea: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()

def get_user_tasks(user_id):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                T.ID_Tarea, 
                T.Titulo, 
                T.Descripcion, 
                T.FechaVencimiento, 
                T.Prioridad, 
                T.Estado, 
                C.Nombre AS Categoria
            FROM Tareas T
            LEFT JOIN Categorias C ON T.ID_Categoria = C.ID_Categoria
            WHERE T.ID_Usuario = ?
        """, (user_id,))
        return cursor.fetchall()
    except Exception as e:
        print(f"Error al obtener las tareas: {e}")
        return []
    finally:
        if conn:
            conn.close()

def get_task_by_id(task_id):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Tareas WHERE ID_Tarea = ?", (task_id,))
        task_data = cursor.fetchone()
        if task_data:
            columns = [col[0] for col in cursor.description]
            return dict(zip(columns, task_data))
        return None
    except Exception as e:
        print(f"Error al obtener la tarea: {e}")
        return None
    finally:
        if conn:
            conn.close()

def update_task(task_id, user_id, **updates):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        set_clause = []
        params = []
        if 'title' in updates:
            set_clause.append("Titulo = ?")
            params.append(updates['title'])
        if 'description' in updates:
            set_clause.append("Descripcion = ?")
            params.append(updates['description'])
        if 'due_date' in updates:
            set_clause.append("FechaVencimiento = ?")
            params.append(updates['due_date'])
        if 'priority' in updates:
            set_clause.append("Prioridad = ?")
            params.append(updates['priority'])
        if 'completed' in updates:
            set_clause.append("Estado = ?")
            params.append('Completada' if updates['completed'] else 'Pendiente')
        if 'category' in updates:
            id_categoria = get_or_create_category(user_id, updates['category'])
            if id_categoria:
                set_clause.append("ID_Categoria = ?")
                params.append(id_categoria)

        if not set_clause:
            return True

        params.append(task_id)
        params.append(user_id)
        sql_query = f"UPDATE Tareas SET {', '.join(set_clause)} WHERE ID_Tarea = ? AND ID_Usuario = ?"

        cursor.execute(sql_query, tuple(params))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error al actualizar la tarea: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()

def delete_task(task_id, user_id):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Tareas WHERE ID_Tarea = ? AND ID_Usuario = ?", (task_id, user_id))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error al eliminar la tarea: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()