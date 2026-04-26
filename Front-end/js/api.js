(() => {
    // ---------------------------------------------------------------
    // CONFIGURAÇÃO MAMP PRO  (porta 80 — lido do httpd.conf)
    const MAMP_PORT = 80;
    // ---------------------------------------------------------------

    // URL base do Apache MAMP (sem barra final)
    const mampOrigin = MAMP_PORT === 80
        ? 'http://localhost'
        : 'http://localhost:' + MAMP_PORT;

    // Calcula o path relativo do backend a partir do URL atual da página.
    // Ex: se a página está em /Front-end/pages/login.html,
    // o backend está em /Back-end/ (dois níveis acima + Back-end/)
    const rawBackend = new URL('../../Back-end/', window.location.href);

    // Se a página NÃO está a ser servida pelo Apache do MAMP,
    // substitui o origin pelo MAMP, mantendo o mesmo path.
    const servedByMamp = rawBackend.origin === mampOrigin
        || rawBackend.origin === 'http://localhost:80'
        || rawBackend.origin === 'http://localhost';

    const backendBaseUrl = (servedByMamp ? rawBackend.origin : mampOrigin) + rawBackend.pathname;
    const apiBaseUrl     = backendBaseUrl + 'api.php/';

    function buildBackendUrl(path = '') {
        return new URL(String(path).replace(/^\/+/, ''), apiBaseUrl).toString();
    }

    function buildPhpUrl(fileName) {
        return new URL(String(fileName).replace(/^\/+/, ''), backendBaseUrl).toString();
    }

    async function parseJson(response) {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            const message = data?.message || data?.mensagem || 'Falha ao comunicar com o servidor.';
            throw new Error(message);
        }
        return data;
    }

    async function fetchJson(path, options = {}) {
        const response = await fetch(buildBackendUrl(path), options);
        return parseJson(response);
    }

    function getLoggedUser() {
        try {
            const raw = localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function requireLoggedUser() {
        const user = getLoggedUser();
        if (!user || !user.id) {
            window.location.href = 'login.html';
            return null;
        }
        return user;
    }

    window.CocoRootApi = {
        buildBackendUrl,
        buildPhpUrl,
        fetchJson,
        getLoggedUser,
        requireLoggedUser,
    };
})();
