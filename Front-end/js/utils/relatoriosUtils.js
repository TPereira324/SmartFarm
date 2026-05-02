function relParseDate(value) {
    const d = new Date(value || 0);
    return Number.isNaN(d.getTime()) ? null : d;
}

function relNormalizeTaskText(value) { return String(value || '').trim().toLowerCase(); }
function relNormalize(value) { return String(value || '').toLowerCase(); }
function relIsTaskDone(task) { return relNormalize(task?.estado).includes('conclu'); }
function relIsRegaTask(task) {
    const text = `${task?.tipo || ''} ${task?.categoria || ''} ${task?.titulo || ''}`.toLowerCase();
    return text.includes('rega') || text.includes('agua') || text.includes('irrig');
}
function relTaskDate(task) { return relParseDate(task?.data_inicio || task?.dueDate || task?.created_at); }
function relTaskCompletedAt(task) { return relParseDate(task?.concluida_em || task?.concluidaEm || task?.completed_at || task?.updated_at); }

function relRound(value) { return Math.round(Number(value || 0)); }
function relClamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function relSafeRate(done, total) { if (!total) return 0; return relClamp((done / total) * 100, 0, 100); }
function relToDeltaText(delta) { return `${delta >= 0 ? '+' : '-'}${relRound(Math.abs(delta))}%`; }

function relToBucketSeries(values, minHeight = 18) {
    const max = Math.max(1, ...values);
    return values.map((value) => relClamp(relRound((value / max) * 90), minHeight, 95));
}

function relBuildBuckets(items, getDate, range, bucketCount = 6) {
    const duration = range.end.getTime() - range.start.getTime();
    const size = duration / bucketCount;
    const buckets = Array.from({ length: bucketCount }, () => 0);
    items.forEach((item) => {
        const date = getDate(item);
        if (!date || !relInRange(date, range)) return;
        const offset = date.getTime() - range.start.getTime();
        const idx = relClamp(Math.floor(offset / size), 0, bucketCount - 1);
        buckets[idx] += 1;
    });
    return buckets;
}

function relGetWindowRange(days) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

function relGetPreviousWindowRange(days) {
    const current = relGetWindowRange(days);
    const end = new Date(current.start.getTime() - 1);
    const start = new Date(end);
    start.setDate(end.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
}

function relGetTodayRange() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

function relInRange(date, range) { return date && date >= range.start && date <= range.end; }

function relGetLocalTasks(tasksStorageKey, userId) {
    try {
        const raw = localStorage.getItem(tasksStorageKey);
        const store = raw ? JSON.parse(raw) : {};
        return Array.isArray(store?.[userId]) ? store[userId] : [];
    } catch { return []; }
}

function relComputeDataset(sourceData, periodKey, focus, daysByPeriod) {
    const days = daysByPeriod[periodKey] || 30;
    const currentRange = relGetWindowRange(days);
    const prevRange = relGetPreviousWindowRange(days);
    const todayRange = relGetTodayRange();

    const allTasks = Array.isArray(sourceData.tarefas) ? sourceData.tarefas : [];
    const allAlerts = Array.isArray(sourceData.alertas) ? sourceData.alertas : [];
    const parcelas = Array.isArray(sourceData.parcelas) ? sourceData.parcelas : [];

    const filterFocusTask = (task) => {
        if (focus === 'geral') return true;
        if (focus === 'rega') return relIsRegaTask(task);
        if (focus === 'tarefas') return !relIsRegaTask(task);
        return true;
    };

    const tasks = allTasks.filter(filterFocusTask);
    const currentTasks = tasks.filter((task) => relInRange(relTaskDate(task), currentRange));
    const previousTasks = tasks.filter((task) => relInRange(relTaskDate(task), prevRange));
    const currentDone = currentTasks.filter((task) => relIsTaskDone(task) && relInRange(relTaskCompletedAt(task) || relTaskDate(task), currentRange));
    const previousDone = previousTasks.filter((task) => relIsTaskDone(task) && relInRange(relTaskCompletedAt(task) || relTaskDate(task), prevRange));
    const pendingNow = currentTasks.length - currentDone.length;
    const todayTasks = tasks.filter((task) => relInRange(relTaskDate(task), todayRange));
    const todayDone = todayTasks.filter(relIsTaskDone);
    const todayPending = todayTasks.filter((task) => !relIsTaskDone(task));

    const currentRate = relSafeRate(currentDone.length, Math.max(1, currentTasks.length));
    const previousRate = relSafeRate(previousDone.length, Math.max(1, previousTasks.length));
    const productivityDelta = currentRate - previousRate;

    const regaTasks = allTasks.filter(relIsRegaTask);
    const regaCurrent = regaTasks.filter((task) => relInRange(relTaskDate(task), currentRange));
    const regaDone = regaCurrent.filter(relIsTaskDone);
    const regaEfficiency = relSafeRate(regaDone.length, Math.max(1, regaCurrent.length));

    const alertCurrent = allAlerts.filter((a) => relInRange(relParseDate(a?.created_at || a?.data || a?.updated_at), currentRange));
    const alertScore = relClamp(100 - relRound((alertCurrent.length / Math.max(1, parcelas.length * 3)) * 100), 5, 100);

    const taskBucketRaw = relBuildBuckets(currentTasks, (t) => relTaskDate(t), currentRange, 6);
    const alertBucketRaw = relBuildBuckets(alertCurrent, (a) => relParseDate(a?.created_at || a?.data || a?.updated_at), currentRange, 6);
    const lineSource = focus === 'rega' ? relBuildBuckets(regaCurrent, (t) => relTaskDate(t), currentRange, 6) : taskBucketRaw;
    const line = relToBucketSeries(lineSource.map((v, i) => v + (focus === 'geral' ? Math.max(0, 2 - alertBucketRaw[i]) : 0)));
    const bucketLabels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
    const bars = focus === 'tarefas'
        ? relToBucketSeries(taskBucketRaw.map((v, i) => v + (i % 2 === 0 ? 1 : 0)))
        : focus === 'rega'
            ? relToBucketSeries(relBuildBuckets(regaCurrent, (t) => relTaskDate(t), currentRange, 6))
            : [
                relClamp(relRound((parcelas.length / Math.max(1, parcelas.length + 1)) * 100), 18, 95),
                relClamp(relRound(currentRate), 18, 95),
                relClamp(relRound(regaEfficiency), 18, 95),
                relClamp(relRound(alertScore), 18, 95),
                relClamp(relRound((currentDone.length / Math.max(1, days)) * 100), 18, 95),
                relClamp(relRound((pendingNow / Math.max(1, currentTasks.length)) * 100), 18, 95),
            ];
    const performanceScore = relClamp(relRound((currentRate * 0.45) + (regaEfficiency * 0.35) + (alertScore * 0.2)), 0, 100);
    const performanceText = performanceScore >= 80 ? 'Performance excelente' : performanceScore >= 60 ? 'Performance estável' : 'Performance em atenção';
    const summary = [
        todayPending.length === 0 ? `Hoje está tudo em dia: ${todayDone.length} tarefa(s) concluída(s).` : `Hoje tens ${todayPending.length} tarefa(s) pendente(s) e ${todayDone.length} concluída(s).`,
        `${currentDone.length} tarefa(s) concluída(s) em ${days} dias (${focus}).`,
        `Eficiência de rega em ${relRound(regaEfficiency)}% com ${regaCurrent.length} tarefa(s) relacionadas.`,
        `Foram registados ${alertCurrent.length} alerta(s) no período analisado.`,
    ];
    return {
        produtividade: relToDeltaText(productivityDelta),
        rega: `${relRound(regaEfficiency)}%`,
        tarefas: String(currentDone.length),
        bars, line, bucketLabels, performanceScore, performanceText, summary,
        helper: `Dados reais de ${parcelas.length} parcela(s), ${allTasks.length} tarefa(s) e ${allAlerts.length} alerta(s).`,
    };
}
