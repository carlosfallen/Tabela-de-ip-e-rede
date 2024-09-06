document.getElementById('logoutButton')?.addEventListener('click', async function() {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            window.location.href = '/'; // Redireciona para a página de login após o logout
        } else {
            alert('Erro ao fazer logout');
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao fazer logout');
    }
});