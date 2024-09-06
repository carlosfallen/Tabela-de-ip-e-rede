document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            window.location.href = '/home'; // Redireciona para a página principal após o login
        } else {
            showError(result.message || 'Erro ao fazer login');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showError('Erro ao fazer login');
    }
});

function showError(message) {
    const error = document.createElement('div');
    error.textContent = message;
    error.style.backgroundColor = '#ffdddd';
    error.style.color = '#d8000c';
    error.style.padding = '10px';
    error.style.marginTop = '10px';
    error.style.borderRadius = '4px';
    error.style.fontSize = '14px';
    error.style.textAlign = 'center';
    
    const loginBox = document.querySelector('.login-box');
    loginBox.appendChild(error);

    setTimeout(() => {
        error.remove();
    }, 5000);
}
