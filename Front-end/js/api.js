(() => {
    const config = window.CocoRootConfig || {};
    const backendBaseUrl = String(config.backendBaseUrl || new URL('../Back-end/', window.location.href).toString());
    const apiBaseUrl = String(config.apiBaseUrl || new URL('api.php/', backendBaseUrl).toString());
    const apiBaseCandidates = Array.isArray(config.apiBaseCandidates) && config.apiBaseCandidates.length > 0
        ? config.apiBaseCandidates
        : [apiBaseUrl];

    function cleanPath(path = '') {
        return String(path || '').replace(/^\/+/, '');
    }

    function buildQueryRouteUrl(baseUrl, path = '') {
        const clean = cleanPath(path);
        const normalizedBase = String(baseUrl).replace(/\/+$/, '');
        if (!clean) {
            return normalizedBase;
        }

        const [routePath, queryString = ''] = clean.split('?');
        const url = new URL(normalizedBase);
        url.searchParams.set('route', routePath);
        if (queryString) {
            new URLSearchParams(queryString).forEach((value, key) => url.searchParams.set(key, value));
        }
        return url.toString();
    }

    function buildBackendUrl(path = '') {
        return buildQueryRouteUrl(apiBaseUrl, path);
    }

    function buildBackendUrlCandidates(path = '') {
        const clean = cleanPath(path);
        const urls = [];

        for (const baseUrl of apiBaseCandidates) {
            urls.push(buildQueryRouteUrl(baseUrl, clean));
            urls.push(new URL(clean, baseUrl).toString());
        }

        return [...new Set(urls)];
    }

    async function fetchWithFallback(urls, options = {}) {
        let lastError = null;

        for (const url of urls) {
            try {
                const response = await fetch(url, options);
                if (response.status === 404) {
                    lastError = new Error('Endpoint não encontrado.');
                    continue;
                }
                return response;
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError || new Error('Falha ao comunicar com o servidor.');
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
        const response = await fetchWithFallback(buildBackendUrlCandidates(path), options);
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
        buildBackendUrlCandidates,
        fetchJson,
        getLoggedUser,
        requireLoggedUser,
    };
})();
