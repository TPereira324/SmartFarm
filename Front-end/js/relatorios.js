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

    const parseDate = (value) => {
        const d = new Date(value || 0);
        return Number.isNaN(d.getTime()) ? null : d;
    };
    const normalizeTaskText = (value) => String(value || '').trim().toLowerCase();
    const taskDate = (task) => parseDate(task?.data_inicio || task?.dueDate || task?.created_at);
    const taskCompletedAt = (task) => parseDate(task?.concluida_em || task?.concluidaEm || task?.completed_at || task?.updated_at);

    const normalize = (value) => String(value || '').toLowerCase();
    const isTaskDone = (task) => normalize(task?.estado).includes('conclu');
    const isRegaTask = (task) => {
        const text = `${task?.tipo || ''} ${task?.categoria || ''} ${task?.titulo || ''}`.toLowerCase();
        return text.includes('rega') || text.includes('agua') || text.includes('irrig');
    };

    const round = (value) => Math.round(Number(value || 0));
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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

    const getWindowRange = (days) => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - days + 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    };

    const getPreviousWindowRange = (days) => {
        const current = getWindowRange(days);
        const end = new Date(current.start.getTime() - 1);
        const start = new Date(end);
        start.setDate(end.getDate() - days + 1);
        start.setHours(0, 0, 0, 0);
        return { start, end };
    };
    const getTodayRange = () => {
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    };

    const inRange = (date, range) => date && date >= range.start && date <= range.end;

    const safeRate = (done, total) => {
        if (!total) return 0;
        return clamp((done / total) * 100, 0, 100);
    };

    const toDeltaText = (delta) => {
        const value = round(Math.abs(delta));
        return `${delta >= 0 ? '+' : '-'}${value}%`;
    };

    const toBucketSeries = (values, minHeight = 18) => {
        const max = Math.max(1, ...values);
        return values.map((value) => {
            const scaled = round((value / max) * 90);
            return clamp(scaled, minHeight, 95);
        });
    };

    const buildBuckets = (items, getDate, range, bucketCount = 6) => {
        const duration = range.end.getTime() - range.start.getTime();
        const size = duration / bucketCount;
        const buckets = Array.from({ length: bucketCount }, () => 0);
        items.forEach((item) => {
            const date = getDate(item);
            if (!date || !inRange(date, range)) return;
            const offset = date.getTime() - range.start.getTime();
            const idx = clamp(Math.floor(offset / size), 0, bucketCount - 1);
            buckets[idx] += 1;
        });
        return buckets;
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

    const renderBars = (values, labels = []) => {
        if (!barsRoot) return;
        barsRoot.innerHTML = '';
        values.forEach((value, index) => {
            const bar = document.createElement('div');
            bar.className = 'reports-bar';
            bar.style.height = `${clamp(value, 8, 95)}%`;
            bar.dataset.label = labels[index] || `B${index + 1}`;
            bar.title = `${labels[index] || `Bloco ${index + 1}`}: ${round(value)}%`;
            barsRoot.appendChild(bar);
        });
    };

    const renderLine = (values, labels = []) => {
        if (!lineChart || values.length === 0) return;
        const points = values.map((value, index) => {
            const x = Math.round((index / Math.max(1, values.length - 1)) * 100);
            const y = 100 - clamp(value, 10, 95);
            return `${x}% ${y}%`;
        });
        lineChart.style.setProperty('--reports-line', `polygon(0% 100%, ${points.join(', ')}, 100% 100%)`);

        if (!linePointsRoot) return;
        linePointsRoot.innerHTML = '';
        values.forEach((value, index) => {
            const x = (index / Math.max(1, values.length - 1)) * 100;
            const y = 100 - clamp(value, 10, 95);
            const point = document.createElement('button');
            point.type = 'button';
            point.className = 'reports-line-point';
            point.style.left = `${x}%`;
            point.style.top = `${y}%`;
            point.setAttribute('aria-label', `${labels[index] || `Ponto ${index + 1}`}: ${round(value)}%`);
            point.addEventListener('mouseenter', () => {
                if (!lineTooltip) return;
                lineTooltip.hidden = false;
                lineTooltip.style.left = `${x}%`;
                lineTooltip.style.top = `${y}%`;
                lineTooltip.innerHTML = `<strong>${labels[index] || `Bloco ${index + 1}`}</strong>${round(value)}%`;
            });
            point.addEventListener('mouseleave', () => {
                if (lineTooltip) lineTooltip.hidden = true;
            });
            point.addEventListener('focus', () => {
                if (!lineTooltip) return;
                lineTooltip.hidden = false;
                lineTooltip.style.left = `${x}%`;
                lineTooltip.style.top = `${y}%`;
                lineTooltip.innerHTML = `<strong>${labels[index] || `Bloco ${index + 1}`}</strong>${round(value)}%`;
            });
            point.addEventListener('blur', () => {
                if (lineTooltip) lineTooltip.hidden = true;
            });
            linePointsRoot.appendChild(point);
        });
    };

    const renderDonut = (score, label) => {
        if (!donut || !donutValue || !donutLabel) return;
        const safeScore = clamp(round(score), 0, 100);
        donut.classList.remove('reports-loading-line');
        donut.style.setProperty('--score', String(safeScore));
        donutValue.textContent = `${safeScore}%`;
        donutLabel.textContent = label || 'Performance global';
    };

    const renderDatasetView = (data) => {
        if (statProd) statProd.textContent = data.produtividade;
        if (statRega) statRega.textContent = data.rega;
        if (statTasks) statTasks.textContent = data.tarefas;
        renderBars(data.bars, data.bucketLabels);
        renderLine(data.line, data.bucketLabels);
        renderDonut(data.performanceScore, data.performanceText);
        renderSummary(data.summary);
        if (summaryCopy) summaryCopy.textContent = data.helper;
    };

    const animateDatasetTransition = (from, to, duration = 420) => {
        const start = performance.now();
        const fromBars = Array.isArray(from?.bars) ? from.bars : to.bars.map(() => 20);
        const fromLine = Array.isArray(from?.line) ? from.line : to.line.map(() => 20);
        const fromScore = Number(from?.performanceScore || 0);
        const toScore = Number(to?.performanceScore || 0);

        const step = (now) => {
            const progress = clamp((now - start) / duration, 0, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const frameBars = to.bars.map((v, i) => {
                const a = Number(fromBars[i] ?? fromBars[fromBars.length - 1] ?? 20);
                return a + (v - a) * eased;
            });
            const frameLine = to.line.map((v, i) => {
                const a = Number(fromLine[i] ?? fromLine[fromLine.length - 1] ?? 20);
                return a + (v - a) * eased;
            });
            const frameScore = fromScore + (toScore - fromScore) * eased;

            renderBars(frameBars, to.bucketLabels);
            renderLine(frameLine, to.bucketLabels);
            renderDonut(frameScore, to.performanceText);

            if (progress < 1) {
                requestAnimationFrame(step);
                return;
            }

            renderDatasetView(to);
            setLoading(false);
            currentDataset = to;
        };

        requestAnimationFrame(step);
    };

    const renderSummary = (lines) => {
        if (!summaryList) return;
        summaryList.innerHTML = '';
        lines.forEach((line) => {
            const li = document.createElement('li');
            li.textContent = line;
            summaryList.appendChild(li);
        });
    };

    const computeDataset = () => {
        const periodKey = periodSelect?.value || '30d';
        const focus = focusSelect?.value || 'geral';
        const days = daysByPeriod[periodKey] || 30;
        const currentRange = getWindowRange(days);
        const prevRange = getPreviousWindowRange(days);
        const todayRange = getTodayRange();

        const allTasks = Array.isArray(sourceData.tarefas) ? sourceData.tarefas : [];
        const allAlerts = Array.isArray(sourceData.alertas) ? sourceData.alertas : [];
        const parcelas = Array.isArray(sourceData.parcelas) ? sourceData.parcelas : [];

        const filterFocusTask = (task) => {
            if (focus === 'geral') return true;
            if (focus === 'rega') return isRegaTask(task);
            if (focus === 'tarefas') return !isRegaTask(task);
            return true;
        };

        const tasks = allTasks.filter(filterFocusTask);
        const currentTasks = tasks.filter((task) => inRange(taskDate(task), currentRange));
        const previousTasks = tasks.filter((task) => inRange(taskDate(task), prevRange));
        const currentDone = currentTasks.filter((task) => isTaskDone(task) && inRange(taskCompletedAt(task) || taskDate(task), currentRange));
        const previousDone = previousTasks.filter((task) => isTaskDone(task) && inRange(taskCompletedAt(task) || taskDate(task), prevRange));
        const pendingNow = currentTasks.length - currentDone.length;
        const todayTasks = tasks.filter((task) => inRange(taskDate(task), todayRange));
        const todayDone = todayTasks.filter(isTaskDone);
        const todayPending = todayTasks.filter((task) => !isTaskDone(task));

        const currentRate = safeRate(currentDone.length, Math.max(1, currentTasks.length));
        const previousRate = safeRate(previousDone.length, Math.max(1, previousTasks.length));
        const productivityDelta = currentRate - previousRate;

        const regaTasks = allTasks.filter(isRegaTask);
        const regaCurrent = regaTasks.filter((task) => inRange(taskDate(task), currentRange));
        const regaDone = regaCurrent.filter(isTaskDone);
        const regaEfficiency = safeRate(regaDone.length, Math.max(1, regaCurrent.length));

        const alertCurrent = allAlerts.filter((alerta) => inRange(parseDate(alerta?.created_at || alerta?.data || alerta?.updated_at), currentRange));
        const alertScore = clamp(100 - round((alertCurrent.length / Math.max(1, parcelas.length * 3)) * 100), 5, 100);

        const taskBucketRaw = buildBuckets(
            currentTasks,
            (task) => taskDate(task),
            currentRange,
            6,
        );
        const alertBucketRaw = buildBuckets(
            alertCurrent,
            (alerta) => parseDate(alerta?.created_at || alerta?.data || alerta?.updated_at),
            currentRange,
            6,
        );

        const lineSource = focus === 'rega'
            ? buildBuckets(regaCurrent, (task) => taskDate(task), currentRange, 6)
            : taskBucketRaw;

        const line = toBucketSeries(lineSource.map((v, i) => v + (focus === 'geral' ? Math.max(0, 2 - alertBucketRaw[i]) : 0)));
        const bucketLabels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
        const bars = focus === 'tarefas'
            ? toBucketSeries(taskBucketRaw.map((v, i) => v + (i % 2 === 0 ? 1 : 0)))
            : focus === 'rega'
                ? toBucketSeries(buildBuckets(regaCurrent, (task) => taskDate(task), currentRange, 6))
                : [
                    clamp(round((parcelas.length / Math.max(1, parcelas.length + 1)) * 100), 18, 95),
                    clamp(round(currentRate), 18, 95),
                    clamp(round(regaEfficiency), 18, 95),
                    clamp(round(alertScore), 18, 95),
                    clamp(round((currentDone.length / Math.max(1, days)) * 100), 18, 95),
                    clamp(round((pendingNow / Math.max(1, currentTasks.length)) * 100), 18, 95),
                ];
        const performanceScore = clamp(round((currentRate * 0.45) + (regaEfficiency * 0.35) + (alertScore * 0.2)), 0, 100);
        const performanceText = performanceScore >= 80 ? 'Performance excelente' : performanceScore >= 60 ? 'Performance estável' : 'Performance em atenção';

        const summary = [
            todayPending.length === 0
                ? `Hoje está tudo em dia: ${todayDone.length} tarefa(s) concluída(s).`
                : `Hoje tens ${todayPending.length} tarefa(s) pendente(s) e ${todayDone.length} concluída(s).`,
            `${currentDone.length} tarefa(s) concluída(s) em ${days} dias (${focus}).`,
            `Eficiência de rega em ${round(regaEfficiency)}% com ${regaCurrent.length} tarefa(s) relacionadas.`,
            `Foram registados ${alertCurrent.length} alerta(s) no período analisado.`,
        ];

        return {
            produtividade: toDeltaText(productivityDelta),
            rega: `${round(regaEfficiency)}%`,
            tarefas: String(currentDone.length),
            bars,
            line,
            bucketLabels,
            performanceScore,
            performanceText,
            summary,
            helper: `Dados reais de ${parcelas.length} parcela(s), ${allTasks.length} tarefa(s) e ${allAlerts.length} alerta(s).`,
        };
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
        const mergeTasksPreferLocal = (server, local) => {
            const mergedMap = new Map();
            (Array.isArray(server) ? server : []).forEach((task) => {
                mergedMap.set(buildTaskKey(task), { ...task });
            });
            (Array.isArray(local) ? local : []).forEach((localTask) => {
                const key = buildTaskKey(localTask);
                const base = mergedMap.get(key);
                if (!base) {
                    mergedMap.set(key, { ...localTask });
                    return;
                }
                const localDone = isTaskDone(localTask);
                const serverDone = isTaskDone(base);
                if (localDone && !serverDone) {
                    mergedMap.set(key, {
                        ...base,
                        ...localTask,
                        estado: localTask.estado || 'Concluída',
                        concluida_em: localTask.concluida_em || localTask.concluidaEm || new Date().toISOString(),
                    });
                    return;
                }
                mergedMap.set(key, { ...base, ...localTask });
            });
            return Array.from(mergedMap.values());
        };
        const mergedTasks = mergeTasksPreferLocal(serverTasks, fallbackTasks);

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
        const periodLabel = periodSelect?.selectedOptions?.[0]?.textContent?.trim() || periodSelect?.value || '30d';
        const focusLabel = focusSelect?.selectedOptions?.[0]?.textContent?.trim() || focusSelect?.value || 'geral';
        const rows = [
            ['Metrica', 'Valor'],
            ['Periodo', periodLabel],
            ['Foco', focusLabel],
            ['Produtividade', data.produtividade],
            ['Eficiencia da rega', data.rega],
            ['Tarefas concluidas', data.tarefas],
            ['Performance global', `${round(data.performanceScore)}%`],
            [''],
            ['Serie', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
            ['Linha', ...data.line.map((v) => `${round(v)}%`)],
            ['Barras', ...data.bars.map((v) => `${round(v)}%`)],
        ];
        const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-cocoroot-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });

    exportPdfBtn?.addEventListener('click', () => {
        const data = currentDataset || computeDataset();
        const periodLabel = periodSelect?.selectedOptions?.[0]?.textContent?.trim() || periodSelect?.value || '30d';
        const focusLabel = focusSelect?.selectedOptions?.[0]?.textContent?.trim() || focusSelect?.value || 'geral';
        const popup = window.open('', '_blank', 'width=900,height=700');
        if (!popup) return;
        popup.document.write(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Relatório CocoRoot</title>
                <style>
                    body{font-family:Arial,sans-serif;padding:24px;color:#1b1b1b}
                    h1{margin:0 0 8px}
                    .meta{color:#4c4c4c;margin-bottom:18px}
                    .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
                    .card{border:1px solid #d6e4d2;border-radius:10px;padding:10px}
                    .k{font-size:12px;color:#667}
                    .v{font-size:24px;font-weight:700;margin-top:6px}
                    ul{line-height:1.7}
                </style>
            </head>
            <body>
                <h1>Relatório Detalhado</h1>
                <div class="meta">Período: ${periodLabel} · Foco: ${focusLabel}</div>
                <div class="cards">
                    <div class="card"><div class="k">Produtividade</div><div class="v">${data.produtividade}</div></div>
                    <div class="card"><div class="k">Eficiência da Rega</div><div class="v">${data.rega}</div></div>
                    <div class="card"><div class="k">Tarefas Concluídas</div><div class="v">${data.tarefas}</div></div>
                </div>
                <div><strong>Performance Global:</strong> ${round(data.performanceScore)}%</div>
                <h3>Resumo</h3>
                <ul>${data.summary.map((line) => `<li>${line}</li>`).join('')}</ul>
                <h3>Indicadores por bloco</h3>
                <div>Linha: ${data.line.map((v) => `${round(v)}%`).join(' · ')}</div>
                <div>Barras: ${data.bars.map((v) => `${round(v)}%`).join(' · ')}</div>
            </body>
            </html>
        `);
        popup.document.close();
        popup.focus();
        popup.print();
    });

    applyDataWithDelay();
});
