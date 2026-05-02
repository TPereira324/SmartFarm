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


    const renderParcelas = (parcelas) => {
        if (!parcelasContainer) return;
        const list = Array.isArray(parcelas) ? parcelas : [];
        if (list.length === 0) {
            parcelasContainer.innerHTML = `
                <div class="dash-empty-card">
                    <div style="color:var(--muted);line-height:1.6;">Ainda não existem parcelas registadas.</div>
                </div>
                <a href="registrar-cultivo.html" class="dash-add-card">
                    <span class="dash-add-icon" aria-hidden="true">+</span>
                    <span>Adicionar cultivo</span>
                </a>
            `;
            return;
        }

        const cards = list.map((parcela) => {
            const cultivos = Array.isArray(parcela.cultivos) ? parcela.cultivos : [];
            const cultivo = cultivos[0];
            const normalizeText = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const cultivoNome = String(
                cultivo?.nome ?? parcela?.tipo ?? parcela?.cultivo ?? parcela?.cultivo_nome ?? parcela?.nome ?? '',
            ).trim();
            const cultivoNorm = normalizeText(cultivoNome);
            const has = (...words) => words.some((w) => cultivoNorm.includes(normalizeText(w)));
            const iconClass = has('alface', 'couve', 'espinafre', 'rúcula', 'rucula', 'repolho')
                ? 'dash-cultivo-icon--folhosas'
                : has('tomate', 'pimento', 'pepino', 'abobrinha', 'courgette', 'beringela', 'melancia', 'melao', 'melão', 'morango')
                    ? 'dash-cultivo-icon--frutiferas'
                    : has('manjericão', 'manjericao', 'hortelã', 'hortela', 'salsa', 'coentros', 'alecrim', 'orégãos', 'oregãos', 'oregano', 'cebolinho')
                        ? 'dash-cultivo-icon--ervas'
                        : has('batata', 'cenoura', 'beterraba', 'nabo', 'rabanete')
                            ? 'dash-cultivo-icon--raizes'
                            : 'dash-cultivo-icon--geral';

            const cultivoIcon = (() => {
                if (!cultivoNome) return 'C';
                if (has('morango')) return '🍓';
                if (has('tomate')) return '🍅';
                if (has('pimento')) return '🫑';
                if (has('pepino')) return '🥒';
                if (has('alface', 'couve', 'espinafre', 'rúcula', 'rucula', 'repolho')) return '🥬';
                if (has('manjericão', 'manjericao', 'hortelã', 'hortela', 'salsa', 'coentros', 'alecrim', 'orégãos', 'oregãos', 'oregano', 'cebolinho')) return '🌿';
                if (has('batata')) return '🥔';
                if (has('cenoura', 'beterraba', 'nabo', 'rabanete')) return '🥕';
                if (iconClass === 'dash-cultivo-icon--frutiferas') return '🍅';
                if (iconClass === 'dash-cultivo-icon--folhosas') return '🥬';
                if (iconClass === 'dash-cultivo-icon--ervas') return '🌿';
                if (iconClass === 'dash-cultivo-icon--raizes') return '🥕';
                return cultivoNome.slice(0, 1).toUpperCase();
            })();
            const ph = Number(cultivo?.ph ?? parcela?.ph);
            const ec = Number(cultivo?.ec ?? parcela?.ec);
            const humidade = Number(cultivo?.humidade ?? parcela?.humidade);
            const area = Number(parcela?.area_m2 || 0);
            const estado = String(parcela?.estado || parcela?.par_estado || 'Ativo');
            const phText = Number.isFinite(ph) ? ph.toFixed(1) : '6.5';
            const ecText = Number.isFinite(ec) ? `${ec.toFixed(1)}mS/cm` : '1.8mS/cm';
            const humidadeText = Number.isFinite(humidade) ? `${Math.round(humidade)}%` : '55%';
            const areaText = area > 0 ? `${area.toFixed(0)}m²` : 'Sem área';

            return `
                <article class="dash-cultivo-card">
                    <div class="dash-cultivo-top">
                        <div class="dash-cultivo-icon ${iconClass}" aria-hidden="true">${cultivoIcon}</div>
                        <span class="dash-cultivo-badge">${estado}</span>
                    </div>
                    <div class="dash-cultivo-name">${cultivo?.nome || parcela.nome || 'Cultivo'}</div>
                    <div class="dash-cultivo-meta">${parcela.nome || 'Parcela'} · ${areaText}</div>
                    <div class="dash-cultivo-metrics">
                        <div class="dash-cultivo-metric">
                            <span>pH</span>
                            <strong>${phText}</strong>
                        </div>
                        <div class="dash-cultivo-metric">
                            <span>EC</span>
                            <strong>${ecText}</strong>
                        </div>
                        <div class="dash-cultivo-metric">
                            <span>Humidade</span>
                            <strong>${humidadeText}</strong>
                        </div>
                    </div>
                    <button type="button" class="dash-cultivo-link">Ver Detalhes</button>
                </article>
            `;
        }).join('');

        parcelasContainer.innerHTML = `${cards}
            <a href="registrar-cultivo.html" class="dash-add-card">
                <span class="dash-add-icon" aria-hidden="true">+</span>
                <span>Adicionar cultivo</span>
            </a>
        `;
    };

    const fetchOptional = async (path) => {
        try {
            return await api.fetchJson(path);
        } catch {
            return null;
        }
    };

    const { weatherCodeToText, weatherCodeToIcon, fetchWeatherFromOpenMeteo, fetchWeather, resolveBestWeather, resolveAllWeather } = window.CocoRootDashWeather;
    const { buildAlertKey, generateAlerts, getAlertCategory, getAlertLevel, getAlertText, getAlertTitle, getCultivoProfile, getUserLocalAlerts, mergeAlerts, readAlertsStore, writeAlertsStore, alertsStorageKey } = window.CocoRootDashAlerts;
    const { addDays, buildTaskId, classifyTasks, endOfDay, generateTasksForParcela, getCultivoLabel, getParcelaId, getParcelaLabel, getTaskDueDate, getUserTasks, isTaskDone, mergeGeneratedTasks, normalizeText, pickCultivoCategory, readTasksStore, setUserTasks, startOfDay, writeTasksStore } = window.CocoRootDashTasks;
    const { createMonitorMetric, createTaskRowMarkup, formatTaskSectionTitle, formatArea, formatShortDateTime, formatWeekdayShort, pickFirstFinite, pickFirstText, renderEmpty, renderTasks } = window.CocoRootDashUI;
    const { renderAlertsCard, renderClima, renderMonitorizacao } = window.CocoRootDashWidgetsUI || {};

    const localGenerateAlerts = (params) => generateAlerts(params, buildTaskId, normalizeText, getParcelaLabel, getCultivoLabel, pickFirstText);
    const localMergeAlerts = (...groups) => mergeAlerts(groups, buildAlertKey, normalizeText, getAlertTitle, getAlertText, getAlertCategory);
    const localRenderTasks = (tasks, options) => renderTasks(tarefasContainer, tasks, options, classifyTasks, renderEmpty, formatTaskSectionTitle, createTaskRowMarkup, formatShortDateTime, getTaskDueDate, isTaskDone);
    const localRenderMonitorizacao = (parcelas, clima, alertas, weatherByParcelaId) => renderMonitorizacao(monitorizacaoContainer, parcelas, clima, alertas, weatherByParcelaId, getParcelaId, formatArea, pickFirstText, createMonitorMetric);
    const localRenderClima = (clima) => renderClima(climaContainer, clima, renderEmpty, weatherCodeToIcon, formatWeekdayShort, weatherCodeToText);
    const localRenderAlertsCard = (alertas) => renderAlertsCard(document.getElementById('dashboard-alert-col'), alertas, getAlertLevel, getAlertCategory, getAlertTitle, getAlertText);
    const localGetUserLocalAlerts = (userId) => getUserLocalAlerts(userId, alertsStorageKey, readAlertsStore, writeAlertsStore);
    const localGetUserTasks = (userId) => getUserTasks(userId, 'cocoRootTasks', readTasksStore);
    const localSetUserTasks = (store, userId, tasks) => setUserTasks(store, userId, tasks, 'cocoRootTasks', writeTasksStore);
    const localMergeGeneratedTasks = (tasks, parcelas) => mergeGeneratedTasks(tasks, parcelas, getCultivoLabel, generateTasksForParcela, getParcelaId, getParcelaLabel, pickCultivoCategory, startOfDay, addDays, buildTaskId, normalizeText);

    const updateTaskSummary = (tasks) => {
        const sections = classifyTasks(tasks);
        if (tarefasCount) tarefasCount.textContent = String(sections.pending.length);
        if (tarefasLabel) {
            if (sections.pending.length === 0) tarefasLabel.textContent = 'Tudo em dia';
            else tarefasLabel.textContent = `${sections.overdueOrToday.length} até hoje · ${sections.upcoming.length} próximas`;
        }
    };

    const updateAlertsSummary = (alerts) => {
        const list = Array.isArray(alerts) ? alerts : [];
        if (alertasCount) alertasCount.textContent = String(list.length);
        if (alertasLabel) {
            if (list.length === 0) {
                alertasLabel.textContent = 'Sem alertas';
                return;
            }
            const top = list[0];
            const category = getAlertCategory(top);
            const title = getAlertTitle(top);
            alertasLabel.textContent = `${category} · ${title}`;
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
        const localAlertas = localGetUserLocalAlerts(userId);
        const { defaultClima: clima, weatherByParcelaId } = await resolveAllWeather(parcelas, userProfile, user, resolveBestWeather, fetchWeather, fetchWeatherFromOpenMeteo, weatherCodeToText, getParcelaId);

        if (parcelasCount) parcelasCount.textContent = String(parcelas.length);

        if (parcelas.length === 0) {
            renderParcelas(parcelas);
        } else if (parcelasContainer) {
            renderParcelas(parcelas);
        }

        const hasServerTasks = serverTarefas.length > 0;
        let tarefas = hasServerTasks ? serverTarefas : [];

        if (!hasServerTasks) {
            const { store, tasks } = localGetUserTasks(userId);
            const merged = localMergeGeneratedTasks(tasks, parcelas);
            tarefas = merged;
            localSetUserTasks(store, userId, merged);

            const refreshComputedSections = (currentTasks) => {
                updateTaskSummary(currentTasks);
                const generatedAlertas = localGenerateAlerts({ parcelas, tarefas: currentTasks, clima });
                const mergedAlertas = localMergeAlerts(serverAlertas, localAlertas, generatedAlertas);
                updateAlertsSummary(mergedAlertas);
                localRenderMonitorizacao(parcelas, clima, mergedAlertas, weatherByParcelaId);
                return mergedAlertas;
            };

            if (tarefasContainer) {
                if (!tarefasContainer.dataset.tasksBound) {
                    tarefasContainer.dataset.tasksBound = '1';
                    tarefasContainer.addEventListener('click', (e) => {
                        const btn = e.target?.closest?.('[data-task-id]');
                        const taskId = btn?.getAttribute?.('data-task-id');
                        if (!taskId) return;
                        const { store: currentStore, tasks: currentTasks } = localGetUserTasks(userId);
                        const nextTasks = currentTasks.map((t) => {
                            if (String(t.id) !== String(taskId)) return t;
                            return { ...t, estado: 'Concluída', concluida_em: new Date().toISOString() };
                        });
                        localSetUserTasks(currentStore, userId, nextTasks);
                        localRenderTasks(nextTasks, { onlyToday: true });
                        refreshComputedSections(nextTasks);
                    });
                }
            }

            refreshComputedSections(tarefas);
        }

        if (hasServerTasks) {
            updateTaskSummary(tarefas);
            localRenderTasks(tarefas, { onlyToday: false, interactive: false });
        } else {
            localRenderTasks(tarefas, { onlyToday: true });
        }

        const generatedAlertas = localGenerateAlerts({ parcelas, tarefas, clima });
        const alertas = localMergeAlerts(serverAlertas, localAlertas, generatedAlertas);

        updateTaskSummary(tarefas);
        updateAlertsSummary(alertas);
        localRenderMonitorizacao(parcelas, clima, alertas, weatherByParcelaId);
        localRenderClima(clima);

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
