class UtilizadorModel {
    async register(userData) {
        try {
            const response = await fetch('../../Back-end/registrar.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                throw new Error('Request failed');
            }

            return await response.json();
        } catch (error) {
            try {
                const users = JSON.parse(localStorage.getItem('users')) || [];
                users.push(userData);
                localStorage.setItem('users', JSON.stringify(users));
                return { success: true };
            } catch (e) {
                return { status: 'error', message: 'Falha na ligação com o servidor.' };
            }
        }
    }
}
