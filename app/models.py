import pyodbc
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
            OUTPUT INSERTED.ID_Usuario
            VALUES (?, ?, ?, ?)
        """, (nombre, apellido, email, hashed_password))
        user_id = cursor.fetchone()[0]
        conn.commit()
        return int(user_id)
    except Exception as e:
        print(f"Error al crear el usuario: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()


def get_user_by_email(email):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ID_Usuario, Nombre, Email, Contraseña FROM Usuarios WHERE Email = ?", (email,))
        row = cursor.fetchone()
        if row:
            return {
                'ID_Usuario': row[0],
                'Nombre': row[1],
                'Email': row[2],
                'Contraseña': row[3]
            }
        return None
    except Exception as e:
        print(f"Error al obtener el usuario: {e}")
        return None
    finally:
        if conn:
            conn.close()


# --- Tareas (solo crear y listar) ---
def get_user_tasks(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            t.ID_Tarea, t.Titulo, t.Descripcion, t.FechaVencimiento, t.Prioridad, c.Nombre
        FROM Tareas t
        LEFT JOIN Categorias c ON t.ID_Categoria = c.ID_Categoria
        WHERE t.ID_Usuario = ?
        ORDER BY t.FechaCreacion DESC
    """, (user_id,))
    tasks = cursor.fetchall()
    conn.close()
    return tasks


def create_task(user_id, title, description, due_date, priority, category_name):
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Obtener ID de categoría si existe
        category_id = None
        if category_name:
            category_id = get_or_create_category(user_id, category_name)

        cursor.execute("""
            INSERT INTO Tareas (Titulo, Descripcion, FechaVencimiento, Prioridad, ID_Usuario, ID_Categoria)
            OUTPUT INSERTED.ID_Tarea
            VALUES (?, ?, ?, ?, ?, ?)
        """, (title, description, due_date, priority, user_id, category_id))
        task_id = cursor.fetchone()[0]
        conn.commit()
        return int(task_id)
    except Exception as e:
        print(f"Error al crear la tarea: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()


# --- Categorías (CRUD completo) ---
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
        cursor.execute("SELECT ID_Categoria FROM Categorias WHERE ID_Usuario = ? AND Nombre = ?", (user_id, category_name))
        result = cursor.fetchone()
        if result:
            return result[0]

        cursor.execute("""
            INSERT INTO Categorias (Nombre, Descripcion, ID_Usuario)
            OUTPUT INSERTED.ID_Categoria
            VALUES (?, ?, ?)
        """, (category_name, 'Categoría creada automáticamente', user_id))
        new_id = cursor.fetchone()[0]
        conn.commit()
        return int(new_id)
    except Exception as e:
        print(f"Error en get_or_create_category: {e}")
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
        cursor.execute("""
            INSERT INTO Categorias (Nombre, Descripcion, ID_Usuario)
            OUTPUT INSERTED.ID_Categoria
            VALUES (?, ?, ?)
        """, (nombre, descripcion, user_id))
        category_id = cursor.fetchone()[0]
        conn.commit()
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
    cursor.execute("UPDATE Categorias SET Nombre=?, Descripcion=? WHERE ID_Categoria=? AND ID_Usuario=?",
                   (nombre, descripcion, category_id, user_id))
    conn.commit()
    conn.close()
    return cursor.rowcount > 0


def delete_category(category_id, user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Categorias WHERE ID_Categoria=? AND ID_Usuario=?", (category_id, user_id))
    conn.commit()
    conn.close()
    return cursor.rowcount > 0
