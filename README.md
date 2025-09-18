# Bullet Journal Web App

## Descripción
Bullet Journal es una aplicación web que permite a los usuarios gestionar sus tareas y categorías de forma sencilla y visual. La aplicación incluye registro e inicio de sesión de usuarios, creación y gestión de tareas, categorías personalizadas, estadísticas visuales y un calendario dinámico para el seguimiento de tareas.

---

## Tecnologías utilizadas
- **Backend:** Python, Flask
- **Base de datos:** SQL Server (con pyodbc)
- **Frontend:** HTML, CSS, JavaScript, Bootstrap
- **Gráficos:** Chart.js
- **Seguridad:** Flask-Bcrypt para el hash de contraseñas
- **Alertas:** SweetAlert2 para notificaciones y confirmaciones

---

## Funcionalidades

### Usuario
- Registro y login con validación de campos y almacenamiento seguro de contraseñas.
- Sesiones activas para mantener autenticado al usuario.
- Logout seguro.

### Tareas
- Crear tareas con título, descripción, fecha de vencimiento, prioridad y categoría.
- Listado dinámico de tareas.
- Visualización de estadísticas por prioridad y categoría.

### Categorías
- CRUD completo (crear, leer, actualizar, eliminar) de categorías por usuario.
- Asociar tareas a categorías.
- Contador de tareas por categoría.

### Estadísticas
- Número total de tareas y tareas completadas.
- Gráficos de prioridad y categorías utilizando Chart.js.

### Calendario
- Calendario mensual que muestra los días con tareas.
- Destaca el día actual y días con tareas.

---

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/bullet-journal.git
