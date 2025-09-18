document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    loadCategories();
    loadStatistics();
    updateUserName();
    renderCalendar();
});

// VARIABLES GLOBALES
let tasksData = [];
let categoriesData = [];
let priorityChartInstance = null;
let categoryChartInstance = null;

// --- FUNCIONES DE AYUDA ---
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
    Swal.fire({
        title: 'Cerrar sesión',
        text: '¿Estás seguro de que quieres cerrar tu sesión?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '/logout';
        }
    });
}

// Cambiar sección activa
function setActiveSection(sectionId) {
    const sections = ['tasks', 'categories', 'statistics'];
    sections.forEach(id => document.getElementById(id + 'Section').classList.add('hidden'));
    document.getElementById(sectionId + 'Section').classList.remove('hidden');

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[onclick="setActiveSection('${sectionId}')"]`).classList.add('active');

    // Recarga controlada
    if(sectionId==='tasks') loadTasks();
    else if(sectionId==='categories') loadCategories();
    else if(sectionId==='statistics') loadStatistics();
}

// Cargar categorías en select del formulario
function loadCategoriesIntoSelect() {
    const select = document.getElementById('taskCategory');
    if (!select) return;
    select.innerHTML = '<option value="">Sin categoría</option>';
    categoriesData.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.nombre;
        option.textContent = cat.nombre;
        select.appendChild(option);
    });
}

// --- GRÁFICOS ---
function renderPriorityChart() {
    const counts = { high:0, medium:0, low:0 };
    tasksData.forEach(t => counts[t.priority] = (counts[t.priority]||0)+1);
    const data = [counts.high, counts.medium, counts.low];

    const chartConfig = {
        type:'doughnut',
        data:{
            labels:['Alta','Media','Baja'],
            datasets:[{
                data,
                backgroundColor:['oklch(0.65 0.25 15)','oklch(0.65 0.25 60)','oklch(0.65 0.25 150)'],
                borderColor:'transparent',
                borderWidth:1
            }]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false,
            plugins:{
                legend:{ position:'bottom', labels:{ color:'var(--foreground)', boxWidth:12 } },
                tooltip:{
                    enabled:true,
                    callbacks:{
                        label: context => {
                            const val = context.raw || 0;
                            return `${context.label}: ${val} tarea${val!==1?'s':''}`;
                        }
                    }
                }
            }
        }
    };

    if(priorityChartInstance){
        priorityChartInstance.data.datasets[0].data = data;
        priorityChartInstance.update();
    } else {
        const ctx = document.getElementById('priorityChart');
        priorityChartInstance = new Chart(ctx, chartConfig);
    }
}

function renderCategoryChart() {
    try {
        const counts = {};
        tasksData.forEach(t=>{
            const cat = t.category||'Sin categoría';
            counts[cat]=(counts[cat]||0)+1;
        });

        let labels = Object.keys(counts);
        let data = Object.values(counts);

        if(labels.length===0){ labels=['Sin categorías']; data=[0]; }

        const bgColors = labels.map((_,i)=>`hsl(${(360/labels.length)*i},70%,50%)`);

        const chartConfig = {
            type:'pie',
            data:{ labels, datasets:[{ data, backgroundColor:bgColors, borderColor:'transparent', borderWidth:1 }] },
            options:{
                responsive:true,
                maintainAspectRatio:false,
                plugins:{
                    legend:{ position:'right', labels:{ color:'var(--foreground)', boxWidth:12 } },
                    tooltip:{
                        enabled:true,
                        callbacks:{
                            label: ctx => {
                                const val = ctx.raw||0;
                                return `${ctx.label}: ${val} tarea${val!==1?'s':''}`;
                            }
                        }
                    }
                }
            }
        };

        if(categoryChartInstance){
            categoryChartInstance.data.labels = labels;
            categoryChartInstance.data.datasets[0].data = data;
            categoryChartInstance.data.datasets[0].backgroundColor = bgColors;
            categoryChartInstance.update();
        } else {
            const ctx = document.getElementById('categoryChart');
            categoryChartInstance = new Chart(ctx, chartConfig);
        }
    } catch(err){
        console.error('Error gráfico categorías:',err);
    }
}

// --- ESTADÍSTICAS ---
async function loadStatistics() {
    try {
        document.getElementById('totalTasksCount').textContent = tasksData.length;
        document.getElementById('completedTasksCount').textContent = tasksData.filter(t=>t.completed).length;
        document.getElementById('categoriesCount').textContent = categoriesData.length;

        renderPriorityChart();
        renderCategoryChart();
    } catch(err){
        console.error('Error al cargar estadísticas:',err);
    }
}

// --- TAREAS ---
async function loadTasks() {
    try {
        const res = await fetch('/api/tasks');
        tasksData = await res.json();
        const taskList = document.getElementById('taskList');
        taskList.innerHTML='';

        if(tasksData.length===0){
            taskList.innerHTML='<p class="text-center text-muted">Aún no hay tareas. ¡Crea una para empezar!</p>';
            return;
        }

        tasksData.forEach(task=>{
            const taskDiv=document.createElement('div');
            taskDiv.classList.add('task-item');
            taskDiv.innerHTML=`
                <h4 class="task-title">${task.title}</h4>
                <p class="task-description">${task.description||'Sin descripción'}</p>
                <div class="task-meta">
                    <span class="task-priority priority-${task.priority}">${task.priority.charAt(0).toUpperCase()+task.priority.slice(1)}</span>
                    <span class="task-category-label">${task.category||'Sin categoría'}</span>
                </div>
            `;
            taskList.appendChild(taskDiv);
        });

        loadCategoriesIntoSelect();
        renderCalendar();
    } catch(err){
        console.error('Error al cargar las tareas:',err);
        Swal.fire('Error','Error al cargar las tareas','error');
    }
}

// --- FORMULARIO DE TAREA ---
document.getElementById('taskForm').addEventListener('submit', async (e)=>{
    e.preventDefault();

    const title=document.getElementById('taskTitle').value.trim();
    const description=document.getElementById('taskDescription').value.trim()||null;
    const priority=document.getElementById('taskPriority').value;
    const category=document.getElementById('taskCategory').value.trim()||null;
    const dueDate=document.getElementById('taskDueDate').value||null;

    if(!title){
        Swal.fire('Error','El título es obligatorio','error');
        return;
    }

    try{
        const res=await fetch('/api/tasks',{
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({ title, description, priority, category, due_date:dueDate })
        });
        const data=await res.json();
        if(res.ok){
            Swal.fire('Éxito', data.message,'success');
            loadTasks();
            document.getElementById('taskForm').reset();
        } else {
            Swal.fire('Error', data.message,'error');
        }
    } catch(err){
        console.error(err);
        Swal.fire('Error','No se pudo crear la tarea','error');
    }
});

// --- CATEGORÍAS (CRUD) ---
async function loadCategories() {
    try{
        const res=await fetch('/api/categories');
        categoriesData=await res.json();
        const categoriesList=document.getElementById('categoriesList');
        categoriesList.innerHTML='';

        if(categoriesData.length===0){
            categoriesList.innerHTML='<p class="text-center text-muted">Aún no hay categorías. ¡Crea una!</p>';
            return;
        }

        const tasksByCategory = tasksData.reduce((acc,task)=>{
            const key=task.category||'Sin categoría';
            acc[key]=(acc[key]||0)+1;
            return acc;
        }, {});

        categoriesData.forEach(cat=>{
            const div=document.createElement('div');
            div.classList.add('category-item');
            const taskCount=tasksByCategory[cat.nombre]||0;

            div.innerHTML=`
                <div class="category-actions">
                    <button class="btn btn-secondary edit-btn">✏️</button>
                    <button class="btn btn-destructive delete-btn">🗑️</button>
                </div>
                <div class="category-icon">📁</div>
                <h4 class="category-name">${cat.nombre}</h4>
                <div class="category-count">${taskCount} tareas</div>
            `;

            div.querySelector('.edit-btn').addEventListener('click', ()=>editCategory(cat.id));
            div.querySelector('.delete-btn').addEventListener('click', ()=>deleteCategory(cat.id));

            categoriesList.appendChild(div);
        });

        loadCategoriesIntoSelect();
    } catch(err){
        console.error('Error al cargar las categorías:',err);
    }
}

async function addCategory() {
    const { value: formValues } = await Swal.fire({
        title:'Agregar Categoría',
        html:`
            <input id="swal-input1" class="swal2-input" placeholder="Nombre de la categoría" required>
            <input id="swal-input2" class="swal2-input" placeholder="Descripción (opcional)">
        `,
        focusConfirm:false,
        preConfirm:()=>{
            const nombre=document.getElementById('swal-input1').value;
            if(!nombre){ Swal.showValidationMessage('El nombre es obligatorio'); return false; }
            return [nombre, document.getElementById('swal-input2').value];
        }
    });

    if(!formValues) return;
    const [nombre, descripcion]=formValues;

    try{
        const res=await fetch('/api/categories',{
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body:JSON.stringify({ nombre, descripcion })
        });
        if(res.ok){
            Swal.fire('Éxito','Categoría agregada correctamente','success');
            loadCategories();
        } else {
            const errorData=await res.json();
            Swal.fire('Error',errorData.error,'error');
        }
    } catch{
        Swal.fire('Error','No se pudo agregar la categoría','error');
    }
}

async function editCategory(id){
    const cat=categoriesData.find(c=>c.id===id);
    if(!cat) return;

    const { value: formValues } = await Swal.fire({
        title:'Editar Categoría',
        html:`
            <input id="swal-input1" class="swal2-input" value="${cat.nombre}" required>
            <input id="swal-input2" class="swal2-input" value="${cat.descripcion||''}">
        `,
        focusConfirm:false,
        preConfirm:()=>{
            const nombre=document.getElementById('swal-input1').value;
            if(!nombre){ Swal.showValidationMessage('El nombre es obligatorio'); return false; }
            return [nombre, document.getElementById('swal-input2').value];
        }
    });

    if(!formValues) return;
    const [nombre, descripcion]=formValues;

    try{
        const res=await fetch(`/api/categories/${id}`,{
            method:'PUT',
            headers:{ 'Content-Type':'application/json' },
            body:JSON.stringify({ nombre, descripcion })
        });
        if(res.ok){
            Swal.fire('Éxito','Categoría actualizada','success');
            loadCategories();
        } else {
            const errorData=await res.json();
            Swal.fire('Error', errorData.error,'error');
        }
    } catch{
        Swal.fire('Error','No se pudo actualizar la categoría','error');
    }
}

async function deleteCategory(id){
    const confirmDelete = await Swal.fire({
        title:'¿Estás seguro?',
        text:'Al eliminar esta categoría, las tareas asociadas quedarán sin categoría.',
        icon:'warning',
        showCancelButton:true,
        confirmButtonColor:'#d33',
        cancelButtonColor:'#3085d6',
        confirmButtonText:'Sí, eliminar',
        cancelButtonText:'Cancelar'
    });
    if(!confirmDelete.isConfirmed) return;

    try{
        const res=await fetch(`/api/categories/${id}`,{ method:'DELETE' });
        if(res.ok){
            Swal.fire('¡Eliminada!','Categoría eliminada','success');
            loadCategories();
            loadTasks();
        } else {
            const errorData=await res.json();
            Swal.fire('Error',errorData.error,'error');
        }
    } catch{
        Swal.fire('Error','No se pudo eliminar la categoría','error');
    }
}

// --- CALENDARIO ---
const calendarState = { currentDate:new Date() };

function renderCalendar(){
    const { currentDate } = calendarState;
    const calendarTitle=document.getElementById('calendarTitle');
    const calendarGrid=document.getElementById('calendarGrid');

    calendarTitle.textContent=currentDate.toLocaleDateString('es-ES',{ month:'long', year:'numeric' });
    calendarGrid.innerHTML=`
        <span class="calendar-day-header">Lun</span>
        <span class="calendar-day-header">Mar</span>
        <span class="calendar-day-header">Mié</span>
        <span class="calendar-day-header">Jue</span>
        <span class="calendar-day-header">Vie</span>
        <span class="calendar-day-header">Sáb</span>
        <span class="calendar-day-header">Dom</span>
    `;

    const firstDayOfMonth=new Date(currentDate.getFullYear(), currentDate.getMonth(),1);
    const lastDayOfMonth=new Date(currentDate.getFullYear(), currentDate.getMonth()+1,0);
    const startDayOfWeek=firstDayOfMonth.getDay()===0?6:firstDayOfMonth.getDay()-1;

    for(let i=0;i<startDayOfWeek;i++){
        calendarGrid.innerHTML+=`<div class="calendar-day other-month"></div>`;
    }

    const tasksByDate=tasksData.reduce((acc,task)=>{
        if(task.due_date){
            const date=new Date(task.due_date).toISOString().split('T')[0];
            acc[date]=(acc[date]||0)+1;
        }
        return acc;
    }, {});

    for(let i=1;i<=lastDayOfMonth.getDate();i++){
        const dayDate=new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const dayString=dayDate.toISOString().split('T')[0];
        const hasTasks=tasksByDate[dayString]>0;

        const dayDiv=document.createElement('div');
        dayDiv.classList.add('calendar-day');
        if(dayDate.toDateString()===new Date().toDateString()) dayDiv.classList.add('today');
        if(hasTasks) dayDiv.classList.add('has-tasks');
        dayDiv.textContent=i;
        calendarGrid.appendChild(dayDiv);
    }
}

function changeMonth(direction){
    calendarState.currentDate.setMonth(calendarState.currentDate.getMonth()+direction);
    renderCalendar();
}
