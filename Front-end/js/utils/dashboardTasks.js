const tasksStorageKey = 'cocoRootTasks';
const alertsStorageKey = 'cocoRootDashboardAlerts';

function readTasksStore() { try { const raw = localStorage.getItem(tasksStorageKey); return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
function writeTasksStore(store) { localStorage.setItem(tasksStorageKey, JSON.stringify(store || {})); }
function readAlertsStore() { try { const raw = localStorage.getItem(alertsStorageKey); return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
function writeAlertsStore(store) { localStorage.setItem(alertsStorageKey, JSON.stringify(store || {})); }

function isTaskDone(task) { return String(task?.estado || '').toLowerCase().includes('conclu'); }
function getTaskDueDate(task) { const date = new Date(task?.data_inicio || task?.dueDate || 0); return Number.isNaN(date.getTime()) ? null : date; }

function classifyTasks(tasks) {
    const all = Array.isArray(tasks) ? tasks : [];
    const cutoff = endOfDay(new Date());
    const pending = all.filter((t) => !isTaskDone(t));
    const overdueOrToday = [], upcoming = [], unscheduled = [];
    pending.forEach((task) => {
        const due = getTaskDueDate(task);
        if (!due) { unscheduled.push(task); return; }
        if (due.getTime() <= cutoff.getTime()) overdueOrToday.push(task);
        else upcoming.push(task);
    });
    const sortByDue = (a, b) => (getTaskDueDate(a)?.getTime?.() ?? Number.MAX_SAFE_INTEGER) - (getTaskDueDate(b)?.getTime?.() ?? Number.MAX_SAFE_INTEGER);
    overdueOrToday.sort(sortByDue);
    upcoming.sort(sortByDue);
    return { pending, overdueOrToday, upcoming, unscheduled };
}

function formatTaskSectionTitle(base, list) { return list.length ? `${base} (${list.length})` : base; }

function createTaskRowMarkup(tarefa, interactive = true) {
    const dueText = formatShortDateTime(tarefa.data_inicio);
    const tipo = String(tarefa?.tipo || tarefa?.categoria || 'Tarefa').trim();
    const label = tipo ? `${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}` : 'Tarefa';
    const tag = getTaskDueDate(tarefa) ? label : 'Sem data';
    const rowClass = interactive ? 'dash-task-row' : 'dash-task-row dash-task-row-static';
    const attr = interactive ? `data-task-id="${String(tarefa.id || '')}"` : '';
    return `
        <button type="button" class="${rowClass}" ${attr}>
            <div class="dash-task-main">
                <div class="dash-task-title-row">
                    <div class="dash-task-title">${tarefa.titulo || 'Tarefa'}</div>
                    <span class="dash-task-tag">${tag}</span>
                </div>
                <div class="dash-task-sub">${tarefa.parcela_nome || 'Sem parcela'} · ${dueText}</div>
            </div>
            <span class="dash-task-check ${isTaskDone(tarefa) ? 'is-done' : ''}" aria-hidden="true"><i class="bi bi-check-lg"></i></span>
        </button>
    `;
}

function generateTasksForParcela(parcela, cultivoName) {
    const parcelaId = getParcelaId(parcela);
    const parcelaNome = getParcelaLabel(parcela);
    const cultivo = String(cultivoName || '').trim();
    const category = pickCultivoCategory(cultivo);
    const baseTitle = cultivo ? ` (${cultivo})` : '';
    const today = startOfDay(new Date());
    const make = (titulo, dueDate, kind) => ({ id: buildTaskId(), titulo, parcela_id: parcelaId, parcela_nome: parcelaNome, cultivo_nome: cultivo, categoria: category, tipo: kind || 'geral', estado: 'Pendente', data_inicio: new Date(dueDate).toISOString(), created_at: new Date().toISOString() });
    const tasks = [
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
}

function mergeGeneratedTasks(existingTasks, parcelas) {
    const list = Array.isArray(existingTasks) ? existingTasks.slice() : [];
    const byKey = new Set(list.map((t) => `${t.parcela_id || ''}::${normalizeText(t.titulo)}::${String(t.data_inicio || '').slice(0, 10)}`));
    parcelas.forEach((parcela) => {
        const cultivo = getCultivoLabel(parcela);
        generateTasksForParcela(parcela, cultivo).forEach((t) => {
            const key = `${t.parcela_id || ''}::${normalizeText(t.titulo)}::${String(t.data_inicio || '').slice(0, 10)}`;
            if (byKey.has(key)) return;
            byKey.add(key);
            list.push(t);
        });
    });
    return list;
}

function getUserTasks(userId) { const store = readTasksStore(); return { store, tasks: Array.isArray(store?.[userId]) ? store[userId] : [] }; }
function setUserTasks(store, userId, tasks) { writeTasksStore({ ...(store || {}), [userId]: Array.isArray(tasks) ? tasks : [] }); }

function getUserLocalAlerts(userId) {
    const store = readAlertsStore();
    const now = Date.now();
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    const alerts = (Array.isArray(store?.[userId]) ? store[userId] : []).filter((alerta) => {
        const createdAt = new Date(alerta?.created_at || alerta?.data || alerta?.date || 0).getTime();
        return !Number.isFinite(createdAt) || now - createdAt <= maxAgeMs;
    });
    if ((store?.[userId] || []).length !== alerts.length) writeAlertsStore({ ...store, [userId]: alerts });
    return alerts;
}
