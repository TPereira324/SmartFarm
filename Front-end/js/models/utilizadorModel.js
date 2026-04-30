class UtilizadorModel {
    async register(userData) {
        try {
            const data = window.CocoRootApi && typeof window.CocoRootApi.fetchJson === 'function'
                ? await window.CocoRootApi.fetchJson('usuarios/registar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData),
                })
                : await fetch(
                    new URL('usuarios/registar', window.CocoRootConfig?.apiBaseUrl || new URL('api.php/', new URL('../Back-end/', window.location.href))).toString(),
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userData),
                    }
                ).then((response) => response.json().catch(() => null));

            if (!data) {
                return { success: false, message: 'Servidor indisponível para cadastro.' };
            }

            return data;
        } catch (error) {
            return { success: false, message: error?.message || 'Falha na ligação ao servidor de cadastro.' };
        }
    }
}
