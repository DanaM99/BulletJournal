// index.js

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    loadCategories();
    updateUserName();
});

// Mostrar nombre del usuario
function updateUserName() {
    const userNameElem = document.querySelector('.user-name');
    fetch('/home') 
        .then(() => {
            userNameElem.textContent = userNameElem.textContent || 'Usuario';
        });
}

// Toggle del dropdown del avatar
function toggleDropdown() {
    document.getElementById('userDropdown').classList.toggle('show');
}

// Logout
function logout() {
    window.location.href = '/logout';
}

// --- SECCIONES ---
function setActiveSection(sectionId) {
    const sections = ['tasksSection', 'categoriesSection', 'statisticsSection'];
    sections.forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(sectionId + 'Section').classList.remove('hidden');

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[onclick="setActiveSection('${sectionId}')"]`).classList.add('active');
}

// --- TAREAS ---
document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    const category = document.getElementById('taskCategory').value.trim();

    if (!title) {
        Swal.fire('Error', 'El título es obligatorio', 'error');
        return;
    }

    try {
        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ title, description, dueDate, priority, category })
        });
        const data = await res.json();

        if (data.success) {
            Swal.fire('Éxito', data.message, 'success');
            loadTasks();
            document.getElementById('taskForm').reset();
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'No se pudo crear la tarea', 'error');
    }
});

async function loadTasks() {
    try {
        const res = await fetch('/api/tasks');
        const tasks = await res.json();
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';

        tasks.forEach(task => {
            const taskDiv = document.createElement('div');
            taskDiv.classList.add('task-item');
            taskDiv.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.description || ''}</p>
                <p>Categoría: ${task.category || 'Sin categoría'}</p>
                <p>Prioridad: ${task.priority}</p>
                <p>Estado: ${task.completed}</p>
                <button onclick="deleteTask(${task.id})">Eliminar</button>
            `;
            taskList.appendChild(taskDiv);
        });

        loadCategoriesIntoSelect();
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Error al cargar las tareas', 'error');
    }
}

async function deleteTask(id) {
    if (!confirm('¿Seguro quieres eliminar esta tarea?')) return;
    try {
        const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            Swal.fire('Éxito', data.message, 'success');
            loadTasks();
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'No se pudo eliminar la tarea', 'error');
    }
}

// --- CATEGORÍAS ---
async function loadCategoriesIntoSelect() {
    const categorySelect = document.getElementById('taskCategory');
    categorySelect.innerHTML = '<option value="">Sin categoría</option>';
    try {
        const res = await fetch('/api/categories');
        const categories = await res.json();
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.nombre;
            option.textContent = category.nombre;
            categorySelect.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading categories:', err);
    }
}

async function loadCategories() {
    try {
        const res = await fetch('/api/categories');
        const categories = await res.json();
        const categoriesList = document.getElementById('categoriesList');
        categoriesList.innerHTML = '';
        categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('category-item');
            categoryDiv.innerHTML = `
                <h4>${category.nombre}</h4>
                <p>${category.descripcion || ''}</p>
                <button onclick="editCategory(${category.id})">Editar</button>
                <button onclick="deleteCategory(${category.id})">Eliminar</button>
            `;
            categoriesList.appendChild(categoryDiv);
        });
    } catch (err) {
        console.error('Error al cargar las categorías:', err);
    }
}

async function addCategory() {
    const { value: formValues } = await Swal.fire({
        title: 'Agregar Categoría',
        html:
            '<input id="swal-input1" class="swal2-input" placeholder="Nombre de la categoría">' +
            '<input id="swal-input2" class="swal2-input" placeholder="Descripción (opcional)">',
        focusConfirm: false,
        preConfirm: () => {
            return [
                document.getElementById('swal-input1').value,
                document.getElementById('swal-input2').value
            ];
        }
    });

    if (formValues) {
        const nombre = formValues[0].trim();
        const descripcion = formValues[1].trim();

        if (!nombre) {
            Swal.fire('Error', 'El nombre de la categoría es obligatorio', 'error');
            return;
        }

        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, descripcion })
            });
            const data = await res.json();
            if (res.ok) {
                Swal.fire('Éxito', 'Categoría agregada correctamente', 'success');
                loadCategories();
                loadCategoriesIntoSelect();
            } else {
                Swal.fire('Error', data.error || 'Error al agregar la categoría', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'No se pudo agregar la categoría', 'error');
        }
    }
}

async function editCategory(id) {
    const { value: formValues } = await Swal.fire({
        title: 'Editar Categoría',
        html:
            '<input id="swal-input1" class="swal2-input" placeholder="Nuevo nombre">' +
            '<input id="swal-input2" class="swal2-input" placeholder="Nueva descripción (opcional)">',
        focusConfirm: false,
        preConfirm: () => {
            return [
                document.getElementById('swal-input1').value,
                document.getElementById('swal-input2').value
            ];
        }
    });

    if (formValues) {
        const nombre = formValues[0].trim();
        const descripcion = formValues[1].trim();
        
        if (!nombre) {
            Swal.fire('Error', 'El nombre es obligatorio', 'error');
            return;
        }

        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, descripcion })
            });
            const data = await res.json();
            if (res.ok) {
                Swal.fire('Éxito', 'Categoría actualizada correctamente', 'success');
                loadCategories();
                loadCategoriesIntoSelect();
            } else {
                Swal.fire('Error', data.error || 'Error al actualizar la categoría', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'No se pudo actualizar la categoría', 'error');
        }
    }
}

async function deleteCategory(id) {
    if (!confirm('¿Seguro quieres eliminar esta categoría?')) return;
    try {
        const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
            Swal.fire('Éxito', 'Categoría eliminada correctamente', 'success');
            loadCategories();
            loadCategoriesIntoSelect();
        } else {
            Swal.fire('Error', data.error || 'Error al eliminar la categoría', 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'No se pudo eliminar la categoría', 'error');
    }
}