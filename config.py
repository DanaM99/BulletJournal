import pyodbc

DB_SERVER = 'DANA\\SQLEXPRESS'   # Nombre del servidor e instancia
DB_NAME = 'BulletJournal'

def get_connection():
    conn_str = (
        f'DRIVER={{SQL Server}};'
        f'SERVER={DB_SERVER};'
        f'DATABASE={DB_NAME};'
        f'Trusted_Connection=yes;'
    )
    try:
        conn = pyodbc.connect(conn_str)
        print("Conexión exitosa a la base de datos")
        return conn
    except Exception as e:
        print("Error al conectar a la base de datos:", e)
        return None

# Prueba la conexión
conn = get_connection()
