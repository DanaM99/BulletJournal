let isLoginMode = true;

// --------------------
// Funciones para cambiar entre login y register
// --------------------
function switchToLogin() {
    if (!isLoginMode) {
        isLoginMode = true;

        // Botones
        document.getElementById('login-btn').classList.add('active');
        document.getElementById('register-btn').classList.remove('active');

        // Actualizar títulos y botón
        updateFormContent('Bienvenido de nuevo', 'Inicia sesión en tu cuenta', 'Iniciar Sesión');

        // Ocultar campos adicionales
        document.getElementById('additional-fields').classList.remove('show');

        // Mostrar enlace de contraseña olvidada
        document.getElementById('forgot-password').style.display = 'block';

        // Quitar required de campos adicionales
        document.getElementById('nombre').removeAttribute('required');
        document.getElementById('apellido').removeAttribute('required');
    }
}

function switchToRegister() {
    if (isLoginMode) {
        isLoginMode = false;

        // Botones
        document.getElementById('register-btn').classList.add('active');
        document.getElementById('login-btn').classList.remove('active');

        // Actualizar títulos y botón
        updateFormContent('Crear Cuenta', 'Únete a nuestra comunidad', 'Registrarse');

        // Mostrar campos adicionales
        setTimeout(() => {
            document.getElementById('additional-fields').classList.add('show');
        }, 100);

        // Ocultar enlace de contraseña olvidada
        document.getElementById('forgot-password').style.display = 'none';

        // Agregar required a campos adicionales
        document.getElementById('nombre').setAttribute('required', '');
        document.getElementById('apellido').setAttribute('required', '');
    }
}

function updateFormContent(title, subtitle, buttonText) {
    const titleElement = document.getElementById('form-title');
    const subtitleElement = document.getElementById('form-subtitle');
    const submitBtn = document.getElementById('submit-btn');

    titleElement.style.opacity = '0';
    subtitleElement.style.opacity = '0';
    submitBtn.style.opacity = '0';

    setTimeout(() => {
        titleElement.textContent = title;
        subtitleElement.textContent = subtitle;
        submitBtn.textContent = buttonText;

        titleElement.style.opacity = '1';
        subtitleElement.style.opacity = '1';
        submitBtn.style.opacity = '1';
    }, 150);
}

function showForgotPassword() {
    Swal.fire({
        icon: 'info',
        title: 'Recuperación de contraseña',
        text: 'Aquí implementarías la lógica para enviar un email de recuperación',
        confirmButtonColor: '#f093fb'
    });
}

// --------------------
// Envío del formulario usando fetch + SweetAlert
// --------------------
document.getElementById('auth-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData);

    let url = isLoginMode ? '/login' : '/register';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: result.message,
                confirmButtonColor: '#f093fb'
            }).then(() => {
                if (isLoginMode) {
                    window.location.href = '/dashboard'; // redirige al dashboard
                } else {
                    switchToLogin(); // después de registrarse, ir a login
                }
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message,
                confirmButtonColor: '#f093fb'
            });
        }

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error en la conexión',
            confirmButtonColor: '#f093fb'
        });
    }
});

// --------------------
// Efectos iniciales y de input
// --------------------
window.addEventListener('load', function () {
    document.querySelector('.container').style.animation = 'fadeIn 0.8s ease';
});

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function () {
        this.style.borderColor = this.value.length > 0 ? '#f093fb' : '#e1e5e9';
    });
});
