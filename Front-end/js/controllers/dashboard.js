document.addEventListener('DOMContentLoaded', async () => {
    const api = window.CocoRootApi;
    if (!api) return;
    const user = api.requireLoggedUser();
    if (!user) return;

    const greetingName = document.getElementById('dashboard-user-name');
    const greetingText = document.getElementById('dashboard-greeting-text');
    const parcelasCount = document.getElementById('dashboard-parcelas-count');
    const tarefasCount = document.getElementById('dashboard-tarefas-count');
    const tarefasLabel = document.getElementById('dashboard-tarefas-label');
    const alertasCount = document.getElementById('dashboard-alertas-count');
    const alertasLabel = document.getElementById('dashboard-alertas-label');
    const parcelasContainer = document.getElementById('dashboard-parcelas-list');
    const tarefasContainer = document.getElementById('dashboard-tarefas-list');
    const monitorizacaoContainer = document.getElementById('dashboard-monitorizacao');
    const climaContainer = document.getElementById('dashboard-clima');
    const errorBox = document.getElementById('dashboard-error');

    if (greetingName) greetingName.textContent = user.nome || 'utilizador';
    if (greetingText) greetingText.textContent = 'Bem-vindo ao dashboard da sua exploração agrícola, onde encontra tudo num só sítio!';

    const setError = (message) => {
        if (!errorBox) return;
        errorBox.hidden = !message;
        errorBox.textContent = message || '';
    };

    const fetchOptional = async (path) => { try { return await api.fetchJson(path); } catch { return null; } };

    const updateTaskSummary = (tasks) => {
        const sections = classifyTasks(tasks);
        if (tarefasCount) tarefasCount.textContent = String(sections.pending.length);
        if (tarefasLabel) tarefasLabel.textContent = sections.pending.length === 0 ? 'Tudo em dia' : `${sections.overdueOrToday.length} até hoje · ${sections.upcoming.length} próximas`;
    };

    const updateAlertsSummary = (alerts) => {
        const list = Array.isArray(alerts) ? alerts : [];
        if (alertasCount) alertasCount.textContent = String(list.length);
        if (alertasLabel) {
            if (list.length === 0) { alertasLabel.textContent = 'Sem alertas'; return; }
            alertasLabel.textContent = `${getAlertCategory(list[0])} · ${getAlertTitle(list[0])}`;
        }
    };

    try {
        const [parcelasResponse, tarefasResponse, alertasResponse, userProfileResponse] = await Promise.all([
            api.fetchJson(`parcelas/listar/${user.id}`),
            fetchOptional(`tarefas/listar/${user.id}`),
            fetchOptional(`alertas/listar/${user.id}`),
            fetchOptional(`usuarios/perfil/${user.id}`),
        ]);

        const parcelas = Array.isArray(parcelasResponse?.data) ? parcelasResponse.data : [];
        const serverTarefas = Array.isArray(tarefasResponse?.data) ? tarefasResponse.data : [];
        const serverAlertas = Array.isArray(alertasResponse?.data) ? alertasResponse.data : [];
        const userProfile = userProfileResponse?.data || null;
        const userId = String(user.id ?? 'anon');
        const localAlertas = getUserLocalAlerts(userId);
        const { defaultClima: clima, weatherByParcelaId } = await fetchWeatherByLocations(api, parcelas, userProfile, user);

        if (parcelasCount) parcelasCount.textContent = String(parcelas.length);
        renderParcelas(parcelas, parcelasContainer);

        if (parcelasContainer && !parcelasContainer.dataset.detailsBound) {
            parcelasContainer.dataset.detailsBound = '1';
            parcelasContainer.addEventListener('click', (e) => {
                const btn = e.target?.closest?.('[data-parcela-id]');
                if (!btn) return;
                const parcelaId = btn.getAttribute('data-parcela-id');
                document.querySelector('.tab[data-tab="visualizacao"]')?.click();
                window.cocoRootFarmVisualizationShow?.(parcelas, parcelaId);
            });
        }

        const hasServerTasks = serverTarefas.length > 0;
        let tarefas = hasServerTasks ? serverTarefas : [];

        if (!hasServerTasks) {
            const { store, tasks } = getUserTasks(userId);
            const merged = mergeGeneratedTasks(tasks, parcelas);
            tarefas = merged;
            setUserTasks(store, userId, merged);

            const refreshComputedSections = (currentTasks) => {
                updateTaskSummary(currentTasks);
                const generatedAlertas = generateAlerts({ parcelas, tarefas: currentTasks, clima });
                const mergedAlertas = mergeAlerts(serverAlertas, localAlertas, generatedAlertas);
                updateAlertsSummary(mergedAlertas);
                renderMonitorizacao(parcelas, clima, mergedAlertas, weatherByParcelaId, monitorizacaoContainer);
                return mergedAlertas;
            };

            if (tarefasContainer && !tarefasContainer.dataset.tasksBound) {
                tarefasContainer.dataset.tasksBound = '1';
                tarefasContainer.addEventListener('click', (e) => {
                    const btn = e.target?.closest?.('[data-task-id]');
                    const taskId = btn?.getAttribute?.('data-task-id');
                    if (!taskId) return;
                    const { store: currentStore, tasks: currentTasks } = getUserTasks(userId);
                    const nextTasks = currentTasks.map((t) => String(t.id) !== String(taskId) ? t : { ...t, estado: 'Concluída', concluida_em: new Date().toISOString() });
                    setUserTasks(currentStore, userId, nextTasks);
                    renderTasks(nextTasks, { onlyToday: true }, tarefasContainer);
                    refreshComputedSections(nextTasks);
                });
            }
            refreshComputedSections(tarefas);
        }

        if (hasServerTasks) {
            updateTaskSummary(tarefas);
            renderTasks(tarefas, { onlyToday: false, interactive: false }, tarefasContainer);
        } else {
            renderTasks(tarefas, { onlyToday: true }, tarefasContainer);
        }

        const generatedAlertas = generateAlerts({ parcelas, tarefas, clima });
        const alertas = mergeAlerts(serverAlertas, localAlertas, generatedAlertas);
        updateTaskSummary(tarefas);
        updateAlertsSummary(alertas);
        renderMonitorizacao(parcelas, clima, alertas, weatherByParcelaId, monitorizacaoContainer);
        renderClima(clima, climaContainer);
        setError('');
    } catch (error) {
        if (parcelasCount) parcelasCount.textContent = '0';
        if (tarefasCount) tarefasCount.textContent = '0';
        if (alertasCount) alertasCount.textContent = '0';
        if (tarefasLabel) tarefasLabel.textContent = 'Sem tarefas';
        if (alertasLabel) alertasLabel.textContent = 'Sem alertas';
        renderEmpty(parcelasContainer, 'Não foi possível carregar as parcelas da base de dados.');
        renderEmpty(tarefasContainer, 'As tarefas não puderam ser carregadas.');
        renderEmpty(monitorizacaoContainer, 'O monitoramento não está disponível.');
        renderEmpty(climaContainer, 'O clima não está disponível.');
        setError(error.message || 'Erro ao carregar o dashboard.');
    }
});
