  register(nome, email, senha, nome_fazenda, agricultor_iniciante) {
    try {
        const response = await fetch('../../Back-end/registrar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, nome_fazenda, agricultor_iniciante }),
        });
        return await response.json();
    } catch (error) {
        return { status: 'error', message: 'Falha na ligação com o servidor.' };
    }
}