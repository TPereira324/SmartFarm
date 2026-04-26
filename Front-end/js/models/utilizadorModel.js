class UtilizadorModel {
    async register(userData) {
        const endpoint = window.CocoRootApi
            ? window.CocoRootApi.buildPhpUrl('registrar.php')
            : new URL('../../Back-end/registrar.php', window.location.href).toString();
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || !data) {
                return { success: false, message: 'Servidor indisponivel para registo.' };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Falha na ligacao ao servidor de registo.' };
        }
    }
}
