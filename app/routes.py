from flask import Flask, render_template, request, redirect, url_for
from config import get_connection

app = Flask(__name__)

@app.route('/')
def index():
    conn = get_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM Usuarios")
        total_usuarios = cursor.fetchone()[0]
        conn.close()
    else:
        total_usuarios = 0
    return f"Total de usuarios registrados: {total_usuarios}"

if __name__ == "__main__":
    app.run(debug=True)
