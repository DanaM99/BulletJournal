// Global state
let tasks = [
    {
        id: 1,
        title: "Completar proyecto de diseño",
        description: "Finalizar el diseño del dashboard",
        dueDate: "2024-01-15",
        priority: "high",
        completed: false,
        category: "Trabajo"
    },
    {
        id: 2,
        title: "Reunión con el equipo",
        description: "Revisar avances del sprint",
        dueDate: "2024-01-16",
        priority: "medium",
        completed: false,
        category: "Reuniones"
    },
    {
        id: 3,
        title: "Actualizar documentación",
        description: "Documentar nuevas funcionalidades",
        dueDate: "2024-01-18",
        priority: "low",
        completed: true,
        category: "Documentación"
    }
];

let activeSection = 'tasks';
let currentDate = new Date();

// Initialize app
document.addEventListener('DOMContentLoaded', function () {
    renderTasks();
    renderCalendar();
    renderStats();
    renderCategories();
});

// Header functions
function toggleDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

function logout() {
    alert('Cerrando sesión...');
    // Aquí iría la lógica de logout
}

// Close dropdown when clicking outside
document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('userDropdown');
    const avatar = document.querySelector('.avatar');
    if (!avatar.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Sidebar functions
function setActiveSection(section) {
    activeSection = section;

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');

    // Show/hide sections
    document.querySelectorAll('[id$="Section"]').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(section + 'Section').classList.remove('hidden');

    // Update content based on section
    if (section === 'statistics') {
        renderStats();
    } else if (section === 'categories') {
        renderCategories();
    }
}

// Task functions
document.getElementById('taskForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const newTask = {
        id: Date.now(),
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        dueDate: document.getElementById('taskDueDate').value,
        priority: document.getElementById('taskPriority').value,
        category: document.getElementById('taskCategory').value || 'General',
        completed: false
    };

    tasks.push(newTask);
    renderTasks();
    renderCalendar();
    renderStats();
    renderCategories();

    // Reset form
    this.reset();
});

function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;

        taskElement.innerHTML = `
                    <div class="task-header">
                        <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                        <div class="task-actions">
                            <button class="btn btn-secondary" onclick="toggleTask(${task.id})">
                                ${task.completed ? '↩️' : '✅'}
                            </button>
                            <button class="btn btn-destructive" onclick="deleteTask(${task.id})">🗑️</button>
                        </div>
                    </div>
                    <div class="task-description">${task.description}</div>
                    <div class="task-meta">
                        <span class="task-priority priority-${task.priority}">${getPriorityText(task.priority)}</span>
                        <span class="task-category">${task.category}</span>
                        ${task.dueDate ? `<span>📅 ${formatDate(task.dueDate)}</span>` : ''}
                    </div>
                `;

        taskList.appendChild(taskElement);
    });
}

function toggleTask(taskId) {
    tasks = tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    renderTasks();
    renderStats();
}

function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    renderTasks();
    renderCalendar();
    renderStats();
    renderCategories();
}

function getPriorityText(priority) {
    const priorities = {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta'
    };
    return priorities[priority] || priority;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

// Calendar functions
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarTitle = document.getElementById('calendarTitle');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    calendarTitle.textContent = new Intl.DateTimeFormat('es-ES', {
        month: 'long',
        year: 'numeric'
    }).format(currentDate);

    // Clear calendar
    calendarGrid.innerHTML = '';

    // Add day headers
    const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }

    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        const currentDay = new Date(year, month, day);

        // Check if it's today
        if (currentDay.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }

        // Check if there are tasks on this day
        const dayTasks = tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate.toDateString() === currentDay.toDateString();
        });

        if (dayTasks.length > 0) {
            dayElement.classList.add('has-tasks');
        }

        calendarGrid.appendChild(dayElement);
    }

    // Update task count
    const monthTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.getMonth() === month && taskDate.getFullYear() === year;
    });

    document.getElementById('taskCount').textContent =
        `${monthTasks.length} tarea${monthTasks.length !== 1 ? 's' : ''} este mes`;
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

// Statistics functions
function renderStats() {
    const statsGrid = document.getElementById('statsGrid');

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${totalTasks}</div>
                    <div class="stat-label">Total de Tareas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${completedTasks}</div>
                    <div class="stat-label">Completadas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${pendingTasks}</div>
                    <div class="stat-label">Pendientes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${completionRate}%</div>
                    <div class="stat-label">Tasa de Completado</div>
                </div>
            `;
}

// Categories functions
function renderCategories() {
    const categoriesList = document.getElementById('categoriesList');

    // Get unique categories with task counts
    const categoryStats = {};
    tasks.forEach(task => {
        const category = task.category || 'Sin categoría';
        if (!categoryStats[category]) {
            categoryStats[category] = { total: 0, completed: 0 };
        }
        categoryStats[category].total++;
        if (task.completed) {
            categoryStats[category].completed++;
        }
    });

    categoriesList.innerHTML = '';

    Object.entries(categoryStats).forEach(([category, stats]) => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'stat-card';
        categoryElement.innerHTML = `
                    <h3>${category}</h3>
                    <div class="stat-number">${stats.total}</div>
                    <div class="stat-label">${stats.completed} completadas</div>
                `;
        categoriesList.appendChild(categoryElement);
    });
}