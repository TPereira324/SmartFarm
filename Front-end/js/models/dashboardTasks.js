window.CocoRootDashTasks = {
    normalizeText: (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    getParcelaId: (parcela) => String(parcela?.id ?? parcela?.par_id ?? parcela?.parcela_id ?? parcela?.parcelaId ?? parcela?.nome || ''),
    getParcelaLabel: (parcela) => String(parcela?.nome || parcela?.par_nome || 'Parcela'),
    getCultivoLabel: (parcela) => {
        const cultivos = Array.isArray(parcela?.cultivos) ? parcela.cultivos : [];
        const first = cultivos[0];
        return String(first?.nome || parcela?.tipo || parcela?.cultivo || '');
    },

    pickCultivoCategory: (cultivoName, normalizeText) => {
        const t = normalizeText(cultivoName);
        if (!t) return 'geral';
        const has = (...words) => words.some((w) => t.includes(normalizeText(w)));
        if (has('alface', 'couve', 'espinafre', 'rúcula', 'rucula', 'repolho')) return 'folhosas';
        if (has('tomate', 'pimento', 'pepino', 'abobrinha', 'courgette', 'beringela', 'melancia', 'melao', 'melão', 'morango')) return 'frutiferas';
        if (has('manjericão', 'manjericao', 'hortelã', 'hortela', 'salsa', 'coentros', 'alecrim', 'orégãos', 'oregãos', 'oregano', 'cebolinho')) return 'ervas';
        if (has('batata', 'cenoura', 'beterraba', 'nabo', 'rabanete')) return 'raizes';
        return 'geral';
    },

    addDays: (date, days) => {
        const d = new Date(date);
        d.setDate(d.getDate() + Number(days || 0));
        return d;
    },

    startOfDay: (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    endOfDay: (date) => {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    },

    buildTaskId: () => {
        try { if (window.crypto?.randomUUID) return window.crypto.randomUUID(); } catch { }
        return `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    },

    isTaskDone: (task) => String(task?.estado || '').toLowerCase().includes('conclu'),
    getTaskDueDate: (task) => {
        const date = new Date(task?.data_inicio || task?.dueDate || 0);
        return Number.isNaN(date.getTime()) ? null : date;
    },

    classifyTasks: (tasks, endOfDay, isTaskDone, getTaskDueDate) => {
        const all = Array.isArray(tasks) ? tasks : [];
        const now = new Date();
        const cutoff = endOfDay(now);
        const pending = all.filter((t) => !isTaskDone(t));
        const overdueOrToday = [];
        const upcoming = [];
        const unscheduled = [];

        pending.forEach((task) => {
            const due = getTaskDueDate(task);
            if (!due) {
                unscheduled.push(task);
                return;
            }
            if (due.getTime() <= cutoff.getTime()) overdueOrToday.push(task);
            else upcoming.push(task);
        });

        const sortByDue = (a, b) => {
            const aTime = getTaskDueDate(a)?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
            const bTime = getTaskDueDate(b)?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
        };

        overdueOrToday.sort(sortByDue);
        upcoming.sort(sortByDue);

        return { pending, overdueOrToday, upcoming, unscheduled };
    },

    generateTasksForParcela: (parcela, cultivoName, getParcelaId, getParcelaLabel, pickCultivoCategory, startOfDay, addDays, buildTaskId) => {
        const parcelaId = getParcelaId(parcela);
        const parcelaNome = getParcelaLabel(parcela);
        const cultivo = String(cultivoName || '').trim();
        const category = pickCultivoCategory(cultivo, window.CocoRootDashTasks.normalizeText);
        const baseTitle = cultivo ? ` (${cultivo})` : '';
        const today = startOfDay(new Date());

        const make = (titulo, dueDate, kind) => ({
            id: buildTaskId(),
            titulo,
            parcela_id: parcelaId,
            parcela_nome: parcelaNome,
            cultivo_nome: cultivo,
            categoria: category,
            tipo: kind || 'geral',
            estado: 'Pendente',
            data_inicio: new Date(dueDate).toISOString(),
            created_at: new Date().toISOString(),
        });

        let tasks = [];
        const isMorango = cultivo.toLowerCase().includes('morango');
        const isTomate = cultivo.toLowerCase().includes('tomate');

        if (isMorango) {
            tasks.push(make(`Rega gota-a-gota cuidadosa${baseTitle}`, today, 'rega'));
            tasks.push(make(`Inspecionar pragas e doenças${baseTitle}`, addDays(today, 2), 'saude'));
            tasks.push(make(`Verificar e remover estolhos${baseTitle}`, addDays(today, 4), 'maneio'));
            tasks.push(make(`Adicionar solução nutritiva${baseTitle}`, addDays(today, 6), 'nutricao'));
            tasks.push(make(`Colheita de frutos maduros${baseTitle}`, addDays(today, 8), 'colheita'));
            return tasks;
        } else if (isTomate) {
            tasks.push(make(`Rega profunda com nutrientes${baseTitle}`, today, 'rega'));
            tasks.push(make(`Ajustar tutoramento e amarrar ramos${baseTitle}`, addDays(today, 2), 'maneio'));
            tasks.push(make(`Remover ramos ladrões (poda)${baseTitle}`, addDays(today, 4), 'maneio'));
            tasks.push(make(`Colheita de frutos maduros${baseTitle}`, addDays(today, 8), 'colheita'));
            return tasks;
        }

        tasks = [
            make(`Verificar humidade e ajustar rega${baseTitle}`, today, 'rega'),
            make(`Inspecionar pragas/doenças${baseTitle}`, addDays(today, 3), 'saude'),
        ];

        if (category === 'folhosas') {
            tasks.push(make(`Verificar crescimento e desbaste${baseTitle}`, addDays(today, 2), 'maneio'));
            tasks.push(make(`Adubação leve (se necessário)${baseTitle}`, addDays(today, 7), 'nutricao'));
        } else if (category === 'frutiferas') {
            tasks.push(make(`Verificar floração/frutificação${baseTitle}`, addDays(today, 2), 'maneio'));
            tasks.push(make(`Apoiar/tutorar plantas (se aplicável)${baseTitle}`, addDays(today, 5), 'maneio'));
            tasks.push(make(`Adubação (se necessário)${baseTitle}`, addDays(today, 10), 'nutricao'));
        } else if (category === 'ervas') {
            tasks.push(make(`Colheita seletiva e limpeza${baseTitle}`, addDays(today, 4), 'maneio'));
            tasks.push(make(`Podar para estimular rebrote${baseTitle}`, addDays(today, 8), 'maneio'));
        } else if (category === 'raizes') {
            tasks.push(make(`Verificar solo e compactação${baseTitle}`, addDays(today, 2), 'maneio'));
            tasks.push(make(`Rega profunda (se necessário)${baseTitle}`, addDays(today, 4), 'rega'));
            tasks.push(make(`Adubação de manutenção${baseTitle}`, addDays(today, 9), 'nutricao'));
        } else {
            tasks.push(make(`Registar observações no painel${baseTitle}`, addDays(today, 1), 'registo'));
            tasks.push(make(`Adubação (se necessário)${baseTitle}`, addDays(today, 8), 'nutricao'));
        }
        return tasks;
    },

    mergeGeneratedTasks: (existingTasks, parcelas, getCultivoLabel, generateTasksForParcela, getParcelaId, getParcelaLabel, pickCultivoCategory, startOfDay, addDays, buildTaskId, normalizeText) => {
        const list = Array.isArray(existingTasks) ? existingTasks.slice() : [];
        const byKey = new Set(
            list.map((t) => `${t.parcela_id || ''}::${normalizeText(t.titulo)}::${String(t.data_inicio || '').slice(0, 10)}`),
        );

        parcelas.forEach((parcela) => {
            const cultivo = getCultivoLabel(parcela);
            const generated = generateTasksForParcela(parcela, cultivo, getParcelaId, getParcelaLabel, pickCultivoCategory, startOfDay, addDays, buildTaskId);
            generated.forEach((t) => {
                const key = `${t.parcela_id || ''}::${normalizeText(t.titulo)}::${String(t.data_inicio || '').slice(0, 10)}`;
                if (byKey.has(key)) return;
                byKey.add(key);
                list.push(t);
            });
        });

        return list;
    },

    readTasksStore: (tasksStorageKey) => {
        try {
            const raw = localStorage.getItem(tasksStorageKey);
            return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
    },

    writeTasksStore: (store, tasksStorageKey) => {
        localStorage.setItem(tasksStorageKey, JSON.stringify(store || {}));
    },

    getUserTasks: (userId, tasksStorageKey, readTasksStore) => {
        const store = readTasksStore(tasksStorageKey);
        const tasks = Array.isArray(store?.[userId]) ? store[userId] : [];
        return { store, tasks };
    },

    setUserTasks: (store, userId, tasks, tasksStorageKey, writeTasksStore) => {
        const next = { ...(store || {}) };
        next[userId] = Array.isArray(tasks) ? tasks : [];
        writeTasksStore(next, tasksStorageKey);
    }
};
