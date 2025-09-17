from config import get_connection
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

def create_user(nombre, apellido, email, password):
    """
    Crea un nuevo usuario en la base de datos con la contraseña hasheada.
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Hashea la contraseña de manera segura
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
    """
    Busca un usuario en la base de datos por su email.
    """
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
            
def get_user_tasks(user_id):
    """
    Obtiene todas las tareas de un usuario específico.
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT Titulo, Descripcion, FechaCreacion, Prioridad, Estado
            FROM Tareas
            WHERE ID_Usuario = ?
        """, (user_id,))
        tasks = cursor.fetchall()
        return tasks
    except Exception as e:
        print(f"Error al obtener las tareas: {e}")
        return []
    finally:
        if conn:
            conn.close()