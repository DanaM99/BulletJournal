import pyodbc

DB_SERVER = r'DANA\SQLEXPRESS'
DB_NAME = 'BulletJournal'

def get_connection():
    try:
        conn_str = (
            f'DRIVER={{SQL Server}};'
            f'SERVER={DB_SERVER};'
            f'DATABASE={DB_NAME};'
            f'Trusted_Connection=yes;'
        )
        conn = pyodbc.connect(conn_str)
        print("Conexión a la base de datos exitosa.") # Opcional: un mensaje de éxito
        return conn
    except pyodbc.OperationalError as e:
        print("Error de conexión a la base de datos:", e)
        return None
    except Exception as e:
        print("Ocurrió un error inesperado:", e)
        return None