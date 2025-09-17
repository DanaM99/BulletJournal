document.addEventListener('DOMContentLoaded', function() {
    const authForm = document.getElementById('auth-form');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const additionalFields = document.getElementById('additional-fields');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const submitBtn = document.getElementById('submit-btn');
    const forgotPassword = document.getElementById('forgot-password');

    let isLoginMode = true;

    // Función para cambiar a modo login
    function switchToLogin() {
        isLoginMode = true;
        loginBtn.classList.add('active');
        registerBtn.classList.remove('active');
        formTitle.textContent = 'Bienvenido de nuevo';
        formSubtitle.textContent = 'Inicia sesión en tu cuenta';
        submitBtn.textContent = 'Iniciar Sesión';
        additionalFields.classList.remove('show');
        forgotPassword.style.display = 'block';
    }

    // Función para cambiar a modo registro
    function switchToRegister() {
        isLoginMode = false;
        registerBtn.classList.add('active');
        loginBtn.classList.remove('active');
        formTitle.textContent = 'Crear Cuenta';
        formSubtitle.textContent = 'Únete a nuestra comunidad';
        submitBtn.textContent = 'Registrarse';
        additionalFields.classList.add('show');
        forgotPassword.style.display = 'none';
    }

    // Asignar los event listeners
    loginBtn.addEventListener('click', switchToLogin);
    registerBtn.addEventListener('click', switchToRegister);

    // Inicializar la página en modo login
    switchToLogin();

    // Manejar el envío del formulario
    authForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Limpiar el objeto data para cada envío
        const data = {};
        data.email = document.getElementById('email').value;
        data.password = document.getElementById('password').value;

        // Validaciones del lado del cliente
        if (!data.email || !data.password) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'El correo electrónico y la contraseña son obligatorios' });
            return;
        }

        if (isLoginMode) {
            // No se necesitan campos adicionales para el login
            // El objeto 'data' ya está completo
        } else {
            // Campos adicionales para el registro
            data.nombre = document.getElementById('nombre').value;
            data.apellido = document.getElementById('apellido').value;
            if (!data.nombre || !data.apellido) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Nombre y apellido son obligatorios para registrarse' });
                return;
            }
        }

        const url = isLoginMode ? '/login' : '/register';

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
                        window.location.href = '/home';
                    } else {
                        // Después de un registro exitoso, cambia automáticamente a modo login
                        switchToLogin();
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

    // Efectos visuales...
    window.addEventListener('load', function () {
        document.querySelector('.container').style.animation = 'fadeIn 0.8s ease';
    });
    
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', function () {
            this.style.borderColor = this.value.length > 0 ? '#f093fb' : '#e1e5e9';
        });
    });
});