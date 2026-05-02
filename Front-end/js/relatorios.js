document.addEventListener('DOMContentLoaded', async () => {
    const api = window.CocoRootApi;
    if (!api) return;

    const user = api.requireLoggedUser();
    if (!user) return;

    const periodSelect = document.getElementById('reports-period');
    const focusSelect = document.getElementById('reports-focus');
    const refreshBtn = document.getElementById('reports-refresh');
    const exportCsvBtn = document.getElementById('reports-export-csv');
    const exportPdfBtn = document.getElementById('reports-export-pdf');
    const statProd = document.getElementById('stat-productividade');
    const statRega = document.getElementById('stat-rega');
    const statTasks = document.getElementById('stat-tarefas');
    const barsRoot = document.getElementById('reports-bars');
    const lineWave = document.getElementById('reports-line-wave');
    const lineChart = document.getElementById('reports-line-chart');
    const linePointsRoot = document.getElementById('reports-line-points');
    const lineTooltip = document.getElementById('reports-line-tooltip');
    const donut = document.getElementById('reports-donut');
    const donutValue = document.getElementById('reports-donut-value');
    const donutLabel = document.getElementById('reports-donut-label');
    const summaryCopy = document.getElementById('reports-summary-copy');
    const summaryList = document.getElementById('reports-summary-list');
    const loadingPills = Array.from(document.querySelectorAll('.reports-loading-pill'));

    const tasksStorageKey = 'cocoRootTasks';
    const reportsPrefsKey = `cocoRootReportsPrefs:${String(user.id ?? 'anon')}`;
    const daysByPeriod = { '7d': 7, '30d': 30, '90d': 90 };
    let sourceData = { parcelas: [], tarefas: [], alertas: [] };
    let loadError = '';
    let currentDataset = null;

    const fetchOptional = async (path) => {
        try {
            return await api.fetchJson(path);
        } catch {
            return null;
        }
    };

    const { 
        parseDate, normalizeTaskText, taskDate, taskCompletedAt, normalize, isTaskDone, isRegaTask, round, clamp, safeRate, toDeltaText, getWindowRange, getPreviousWindowRange, getTodayRange, inRange, toBucketSeries, buildBuckets 
    } = window.CocoRootRelatoriosHelpers;

    const { renderBars, renderLine, renderDonut, renderSummary } = window.CocoRootRelatoriosUI;
    const { exportCsv, exportPdf } = window.CocoRootRelatoriosExport;
    const { computeDataset: _computeDataset, animateDatasetTransition: _animateDatasetTransition, mergeTasksPreferLocal } = window.CocoRootRelatoriosData || {};

    const getLocalTasks = (userId) => {
        try {
            const raw = localStorage.getItem(tasksStorageKey);
            const store = raw ? JSON.parse(raw) : {};
            return Array.isArray(store?.[userId]) ? store[userId] : [];
        } catch {
            return [];
        }
    };

    const readPreferences = () => {
        try {
            const raw = localStorage.getItem(reportsPrefsKey);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    };

    const writePreferences = () => {
        const payload = {
            period: periodSelect?.value || '30d',
            focus: focusSelect?.value || 'geral',
        };
        localStorage.setItem(reportsPrefsKey, JSON.stringify(payload));
    };

    const applySavedPreferences = () => {
        const prefs = readPreferences();
        if (periodSelect && daysByPeriod[prefs?.period]) {
            periodSelect.value = prefs.period;
        }
        if (focusSelect && ['geral', 'rega', 'tarefas'].includes(prefs?.focus)) {
            focusSelect.value = prefs.focus;
        }
    };



    const setLoading = (active) => {
        [statProd, statRega, statTasks].forEach((node) => {
            if (!node) return;
            if (active) {
                node.classList.add('reports-loading-line', 'reports-loading-short');
                node.textContent = '';
            } else {
                node.classList.remove('reports-loading-line', 'reports-loading-short');
            }
        });
        loadingPills.forEach((pill) => {
            pill.textContent = active ? 'A carregar...' : 'Atualizado';
        });
        if (lineWave) lineWave.classList.toggle('reports-loading-line', active);
        if (linePointsRoot) linePointsRoot.innerHTML = '';
        if (lineTooltip) lineTooltip.hidden = true;
        if (donut) donut.classList.toggle('reports-loading-line', active);
        if (donutValue && active) donutValue.textContent = '--';
        if (refreshBtn) refreshBtn.disabled = active;
    };

    const renderDatasetView = (data) => {
        if (statProd) statProd.textContent = data.produtividade;
        if (statRega) statRega.textContent = data.rega;
        if (statTasks) statTasks.textContent = data.tarefas;
        renderBars(barsRoot, data.bars, data.bucketLabels, round, clamp);
        renderLine(lineChart, linePointsRoot, lineTooltip, data.line, data.bucketLabels, round, clamp);
        renderDonut(donut, donutValue, donutLabel, data.performanceScore, data.performanceText, round, clamp);
        renderSummary(summaryList, data.summary);
        if (summaryCopy) summaryCopy.textContent = data.helper;
    };

    const animateDatasetTransition = (from, to, duration = 420) => {
        _animateDatasetTransition(from, to, duration, renderBars, renderLine, renderDonut, renderDatasetView, setLoading, (d) => currentDataset = d, barsRoot, lineChart, linePointsRoot, lineTooltip, donut, donutValue, donutLabel, round, clamp);
    };



    const computeDataset = () => {
        const periodKey = periodSelect?.value || '30d';
        const focus = focusSelect?.value || 'geral';
        const days = daysByPeriod[periodKey] || 30;
        return _computeDataset(periodKey, focus, days, sourceData, window.CocoRootRelatoriosHelpers);
    };

    const renderDataset = (data) => {
        renderDatasetView(data);
        setLoading(false);
        currentDataset = data;
    };

    const applyDataWithDelay = () => {
        setLoading(true);
        if (summaryCopy) {
            summaryCopy.textContent = 'A atualizar estatísticas reais para o período selecionado...';
        }
        if (summaryList) {
            summaryList.innerHTML = '<li class="reports-loading-line"></li><li class="reports-loading-line"></li><li class="reports-loading-line"></li>';
        }
        const data = computeDataset();
        window.setTimeout(() => {
            if (currentDataset) animateDatasetTransition(currentDataset, data, 420);
            else renderDataset(data);
        }, 220);
    };

    const loadSources = async () => {
        const [parcelasResponse, tarefasResponse, alertasResponse] = await Promise.all([
            fetchOptional(`parcelas/listar/${user.id}`),
            fetchOptional(`tarefas/listar/${user.id}`),
            fetchOptional(`alertas/listar/${user.id}`),
        ]);

        const serverTasks = Array.isArray(tarefasResponse?.data) ? tarefasResponse.data : [];
        const fallbackTasks = getLocalTasks(String(user.id ?? 'anon'));
        const buildTaskKey = (task) => {
            const explicitId = String(task?.id || '').trim();
            if (explicitId) return `id:${explicitId}`;
            const title = normalizeTaskText(task?.titulo);
            const parcela = normalizeTaskText(task?.parcela_nome || task?.parcela || task?.parcela_id);
            const dateKey = String(task?.data_inicio || task?.dueDate || task?.created_at || '').slice(0, 10);
            return `sig:${title}::${parcela}::${dateKey}`;
        };
        const mergedTasks = mergeTasksPreferLocal(serverTasks, fallbackTasks, buildTaskKey, isTaskDone, normalize);

        sourceData = {
            parcelas: Array.isArray(parcelasResponse?.data) ? parcelasResponse.data : [],
            tarefas: mergedTasks,
            alertas: Array.isArray(alertasResponse?.data) ? alertasResponse.data : [],
        };
    };

    try {
        await loadSources();
    } catch (error) {
        loadError = error?.message || 'Sem ligação ao servidor.';
    }

    if (loadError && summaryCopy) {
        summaryCopy.textContent = `${loadError} A mostrar dados locais quando disponíveis.`;
    }

    applySavedPreferences();

    periodSelect?.addEventListener('change', () => {
        writePreferences();
        applyDataWithDelay();
    });
    focusSelect?.addEventListener('change', () => {
        writePreferences();
        applyDataWithDelay();
    });
    refreshBtn?.addEventListener('click', async () => {
        setLoading(true);
        await loadSources().catch(() => null);
        applyDataWithDelay();
    });

    exportCsvBtn?.addEventListener('click', () => {
        const data = currentDataset || computeDataset();
        exportCsv(data, periodSelect, focusSelect, round);
    });

    exportPdfBtn?.addEventListener('click', () => {
        const data = currentDataset || computeDataset();
        exportPdf(data, periodSelect, focusSelect, round);
    });

    applyDataWithDelay();
});
