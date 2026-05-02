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
    const els = { statProd, statRega, statTasks, barsRoot, lineWave, lineChart, linePointsRoot, lineTooltip, donut, donutValue, donutLabel, summaryCopy, summaryList, loadingPills, refreshBtn };

    const tasksStorageKey = 'cocoRootTasks';
    const reportsPrefsKey = `cocoRootReportsPrefs:${String(user.id ?? 'anon')}`;
    const daysByPeriod = { '7d': 7, '30d': 30, '90d': 90 };
    let sourceData = { parcelas: [], tarefas: [], alertas: [] };
    let loadError = '';
    let currentDataset = null;

    const fetchOptional = async (path) => { try { return await api.fetchJson(path); } catch { return null; } };

    const readPreferences = () => { try { const raw = localStorage.getItem(reportsPrefsKey); return raw ? JSON.parse(raw) : {}; } catch { return {}; } };
    const writePreferences = () => localStorage.setItem(reportsPrefsKey, JSON.stringify({ period: periodSelect?.value || '30d', focus: focusSelect?.value || 'geral' }));

    const applySavedPreferences = () => {
        const prefs = readPreferences();
        if (periodSelect && daysByPeriod[prefs?.period]) periodSelect.value = prefs.period;
        if (focusSelect && ['geral', 'rega', 'tarefas'].includes(prefs?.focus)) focusSelect.value = prefs.focus;
    };

    const computeDataset = () => relComputeDataset(sourceData, periodSelect?.value || '30d', focusSelect?.value || 'geral', daysByPeriod);

    const setLoading = (active) => relSetLoading(active, els);

    const renderDataset = (data) => {
        relRenderDatasetView(data, els);
        setLoading(false);
        currentDataset = data;
    };

    const applyDataWithDelay = () => {
        setLoading(true);
        if (summaryCopy) summaryCopy.textContent = 'A atualizar estatísticas reais para o período selecionado...';
        if (summaryList) summaryList.innerHTML = '<li class="reports-loading-line"></li><li class="reports-loading-line"></li><li class="reports-loading-line"></li>';
        const data = computeDataset();
        window.setTimeout(() => {
            if (currentDataset) relAnimateDatasetTransition(currentDataset, data, els, () => { setLoading(false); currentDataset = data; });
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
        const fallbackTasks = relGetLocalTasks(tasksStorageKey, String(user.id ?? 'anon'));
        const buildTaskKey = (task) => {
            const explicitId = String(task?.id || '').trim();
            if (explicitId) return `id:${explicitId}`;
            return `sig:${relNormalizeTaskText(task?.titulo)}::${relNormalizeTaskText(task?.parcela_nome || task?.parcela || task?.parcela_id)}::${String(task?.data_inicio || task?.dueDate || task?.created_at || '').slice(0, 10)}`;
        };
        const mergeTasksPreferLocal = (server, local) => {
            const mergedMap = new Map();
            (Array.isArray(server) ? server : []).forEach((task) => mergedMap.set(buildTaskKey(task), { ...task }));
            (Array.isArray(local) ? local : []).forEach((localTask) => {
                const key = buildTaskKey(localTask);
                const base = mergedMap.get(key);
                if (!base) { mergedMap.set(key, { ...localTask }); return; }
                if (relIsTaskDone(localTask) && !relIsTaskDone(base)) {
                    mergedMap.set(key, { ...base, ...localTask, estado: localTask.estado || 'Concluída', concluida_em: localTask.concluida_em || localTask.concluidaEm || new Date().toISOString() });
                    return;
                }
                mergedMap.set(key, { ...base, ...localTask });
            });
            return Array.from(mergedMap.values());
        };
        sourceData = {
            parcelas: Array.isArray(parcelasResponse?.data) ? parcelasResponse.data : [],
            tarefas: mergeTasksPreferLocal(serverTasks, fallbackTasks),
            alertas: Array.isArray(alertasResponse?.data) ? alertasResponse.data : [],
        };
    };

    const exportCsv = () => {
        const data = currentDataset || computeDataset();
        const periodLabel = periodSelect?.selectedOptions?.[0]?.textContent?.trim() || periodSelect?.value || '30d';
        const focusLabel = focusSelect?.selectedOptions?.[0]?.textContent?.trim() || focusSelect?.value || 'geral';
        const rows = [
            ['Metrica', 'Valor'], ['Periodo', periodLabel], ['Foco', focusLabel],
            ['Produtividade', data.produtividade], ['Eficiencia da rega', data.rega],
            ['Tarefas concluidas', data.tarefas], ['Performance global', `${relRound(data.performanceScore)}%`],
            [''], ['Serie', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
            ['Linha', ...data.line.map((v) => `${relRound(v)}%`)],
            ['Barras', ...data.bars.map((v) => `${relRound(v)}%`)],
        ];
        const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `relatorio-cocoroot-${Date.now()}.csv`;
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    };

    const exportPdf = () => {
        const data = currentDataset || computeDataset();
        const periodLabel = periodSelect?.selectedOptions?.[0]?.textContent?.trim() || periodSelect?.value || '30d';
        const focusLabel = focusSelect?.selectedOptions?.[0]?.textContent?.trim() || focusSelect?.value || 'geral';
        const popup = window.open('', '_blank', 'width=900,height=700');
        if (!popup) return;
        popup.document.write(`<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Relatório CocoRoot</title>
            <style>body{font-family:Arial,sans-serif;padding:24px;color:#1b1b1b}h1{margin:0 0 8px}.meta{color:#4c4c4c;margin-bottom:18px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}.card{border:1px solid #d6e4d2;border-radius:10px;padding:10px}.k{font-size:12px;color:#667}.v{font-size:24px;font-weight:700;margin-top:6px}ul{line-height:1.7}</style>
            </head><body>
            <h1>Relatório Detalhado</h1>
            <div class="meta">Período: ${periodLabel} · Foco: ${focusLabel}</div>
            <div class="cards">
                <div class="card"><div class="k">Produtividade</div><div class="v">${data.produtividade}</div></div>
                <div class="card"><div class="k">Eficiência da Rega</div><div class="v">${data.rega}</div></div>
                <div class="card"><div class="k">Tarefas Concluídas</div><div class="v">${data.tarefas}</div></div>
            </div>
            <div><strong>Performance Global:</strong> ${relRound(data.performanceScore)}%</div>
            <h3>Resumo</h3><ul>${data.summary.map((line) => `<li>${line}</li>`).join('')}</ul>
            <h3>Indicadores por bloco</h3>
            <div>Linha: ${data.line.map((v) => `${relRound(v)}%`).join(' · ')}</div>
            <div>Barras: ${data.bars.map((v) => `${relRound(v)}%`).join(' · ')}</div>
            </body></html>`);
        popup.document.close(); popup.focus(); popup.print();
    };

    try { await loadSources(); } catch (error) { loadError = error?.message || 'Sem ligação ao servidor.'; }
    if (loadError && summaryCopy) summaryCopy.textContent = `${loadError} A mostrar dados locais quando disponíveis.`;

    applySavedPreferences();
    periodSelect?.addEventListener('change', () => { writePreferences(); applyDataWithDelay(); });
    focusSelect?.addEventListener('change', () => { writePreferences(); applyDataWithDelay(); });
    refreshBtn?.addEventListener('click', async () => { setLoading(true); await loadSources().catch(() => null); applyDataWithDelay(); });
    exportCsvBtn?.addEventListener('click', exportCsv);
    exportPdfBtn?.addEventListener('click', exportPdf);
    applyDataWithDelay();
});
