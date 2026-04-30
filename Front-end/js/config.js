(() => {
    const manualConfig = {
        backendOrigin: '',
        projectBasePath: '',
        backendDirectory: 'Back-end',
        apiEntry: 'api.php',
    };

    const staticDevPorts = new Set(['5500', '5501', '5502', '8080']);
    const knownProjectPaths = ['CocoRoot'];

    const normalizeBasePath = (value) => {
        const raw = String(value || '').trim();
        if (!raw) return '/';
        const withoutSlashes = raw.replace(/^\/+|\/+$/g, '');
        return withoutSlashes ? `/${withoutSlashes}/` : '/';
    };

    const detectProjectBasePath = () => {
        if (window.location.protocol === 'file:') {
            return '/';
        }

        const match = window.location.pathname.match(/^(.*?\/)(Front-end|Back-end)\//);
        if (match && match[1]) {
            return normalizeBasePath(match[1]);
        }

        return '/';
    };

    const uniqueValues = (values) => {
        const seen = new Set();
        return values.filter((value) => {
            const key = String(value || '');
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    const detectBackendOrigin = () => {
        const manualOrigin = String(manualConfig.backendOrigin || '').trim();
        if (manualOrigin) {
            return manualOrigin;
        }

        if (window.location.protocol === 'file:') {
            return 'http://localhost';
        }

        const { protocol, hostname, port, origin } = window.location;
        const isLocalStaticServer = (hostname === '127.0.0.1' || hostname === 'localhost')
            && staticDevPorts.has(String(port || ''));

        if (isLocalStaticServer) {
            return `${protocol}//localhost`;
        }

        return origin;
    };

    const origin = detectBackendOrigin();
    const detectedBasePath = normalizeBasePath(detectProjectBasePath());
    const manualBasePath = normalizeBasePath(manualConfig.projectBasePath || '');
    const backendDirectory = String(manualConfig.backendDirectory || 'Back-end').trim().replace(/^\/+|\/+$/g, '');
    const apiEntry = String(manualConfig.apiEntry || 'api.php').trim().replace(/^\/+|\/+$/g, '');
    const candidateBasePaths = uniqueValues([
        manualConfig.projectBasePath ? manualBasePath : '',
        detectedBasePath,
        '/',
        ...knownProjectPaths.map((name) => normalizeBasePath(name)),
    ]);
    const backendBaseCandidates = candidateBasePaths.map((basePath) =>
        new URL(`${basePath}${backendDirectory}/`, `${origin}/`).toString()
    );
    const apiBaseCandidates = backendBaseCandidates.map((backendUrl) =>
        new URL(`${apiEntry}/`, backendUrl).toString()
    );
    const projectBasePath = candidateBasePaths[0] || '/';
    const backendBaseUrl = backendBaseCandidates[0];
    const apiBaseUrl = apiBaseCandidates[0];

    window.CocoRootConfig = {
        backendOrigin: origin,
        projectBasePath,
        projectBaseCandidates: candidateBasePaths,
        backendDirectory,
        apiEntry,
        backendBaseUrl,
        backendBaseCandidates,
        apiBaseUrl,
        apiBaseCandidates,
    };
})();
