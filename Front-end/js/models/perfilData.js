window.CocoRootPerfilAPI = {
    fetchOptional: async (api, path) => {
        try {
            return await api.fetchJson(path);
        } catch {
            return null;
        }
    },
    friendlyError: (error, fallback) => {
        const text = String(error?.message || '').toLowerCase();
        if (text.includes('failed to fetch') || text.includes('networkerror') || text.includes('load failed')) {
            return 'Sem ligação ao servidor neste momento. Tente novamente em alguns segundos.';
        }
        return error?.message || fallback;
    },
    readJson: (key, fallback) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    },
    writeJson: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    toUserShape: (raw, liveUser) => {
        const source = raw && typeof raw === 'object' ? raw : {};
        return {
            id: source.id ?? source.ut_id ?? source.user_id ?? liveUser.id,
            role: source.role ?? source.ut_role ?? liveUser.role,
            nome: source.nome ?? source.ut_nome ?? source.name ?? liveUser.nome ?? '',
            email: source.email ?? source.ut_email ?? liveUser.email ?? '',
            telefone: source.telefone ?? source.phone ?? source.ut_phone ?? liveUser.telefone ?? '',
            localizacao: source.localizacao ?? source.cidade ?? source.morada ?? source.endereco ?? liveUser.localizacao ?? '',
        };
    },
    calcProgress: (parcelas, tarefasPendentes, modulosConcluidos) => {
        const parcelaScore = Math.min(100, parcelas * 20);
        const moduloScore = Math.min(100, modulosConcluidos * 25);
        const taskScore = Math.max(0, 100 - (tarefasPendentes * 8));
        return Math.round((parcelaScore * 0.35) + (moduloScore * 0.35) + (taskScore * 0.3));
    },
    renderActivity: (items, activityRoot) => {
        if (!Array.isArray(items) || items.length === 0) {
            activityRoot.innerHTML = '<div class="profile-activity-empty">Sem atividade recente.</div>';
            return;
        }
        activityRoot.innerHTML = items.map((item) => `
            <article class="profile-activity-item">
                <div class="profile-activity-dot"></div>
                <div>
                    <div class="profile-activity-title">${item.title}</div>
                    <div class="profile-activity-meta">${item.meta}</div>
                </div>
            </article>
        `).join('');
    }
};
