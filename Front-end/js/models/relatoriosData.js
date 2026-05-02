window.CocoRootRelatoriosData = {
    mergeTasksPreferLocal: (serverTasks, localTasks, buildTaskKey, isTaskDone, normalize) => {
        const mergedMap = new Map();
        (Array.isArray(serverTasks) ? serverTasks : []).forEach((task) => {
            mergedMap.set(buildTaskKey(task), { ...task });
        });
        (Array.isArray(localTasks) ? localTasks : []).forEach((localTask) => {
            const key = buildTaskKey(localTask);
            const base = mergedMap.get(key);
            if (!base) {
                mergedMap.set(key, { ...localTask });
                return;
            }
            const localDone = isTaskDone(localTask, normalize);
            const serverDone = isTaskDone(base, normalize);
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
    },

    animateDatasetTransition: (from, to, duration, renderBars, renderLine, renderDonut, renderDatasetView, setLoading, setCurrentDataset, barsRoot, lineChart, linePointsRoot, lineTooltip, donut, donutValue, donutLabel, round, clamp) => {
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

            renderBars(barsRoot, frameBars, to.bucketLabels, round, clamp);
            renderLine(lineChart, linePointsRoot, lineTooltip, frameLine, to.bucketLabels, round, clamp);
            renderDonut(donut, donutValue, donutLabel, frameScore, to.performanceText, round, clamp);

            if (progress < 1) {
                requestAnimationFrame(step);
                return;
            }

            renderDatasetView(to);
            setLoading(false);
            setCurrentDataset(to);
        };

        requestAnimationFrame(step);
    },

    computeDataset: (periodKey, focus, days, sourceData, helpers) => {
        const { getWindowRange, getPreviousWindowRange, getTodayRange, isRegaTask, inRange, taskDate, isTaskDone, normalize, taskCompletedAt, parseDate, safeRate, clamp, round, buildBuckets, toBucketSeries, toDeltaText } = helpers;

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
        const currentDone = currentTasks.filter((task) => isTaskDone(task, normalize) && inRange(taskCompletedAt(task, parseDate) || taskDate(task, parseDate), currentRange));
        const previousDone = previousTasks.filter((task) => isTaskDone(task, normalize) && inRange(taskCompletedAt(task, parseDate) || taskDate(task, parseDate), prevRange));
        const pendingNow = currentTasks.length - currentDone.length;
        const todayTasks = tasks.filter((task) => inRange(taskDate(task), todayRange));
        const todayDone = todayTasks.filter(t => isTaskDone(t, normalize));
        const todayPending = todayTasks.filter((task) => !isTaskDone(task, normalize));

        const currentRate = safeRate(currentDone.length, Math.max(1, currentTasks.length), clamp);
        const previousRate = safeRate(previousDone.length, Math.max(1, previousTasks.length), clamp);
        const productivityDelta = currentRate - previousRate;

        const regaTasks = allTasks.filter(isRegaTask);
        const regaCurrent = regaTasks.filter((task) => inRange(taskDate(task), currentRange));
        const regaDone = regaCurrent.filter(t => isTaskDone(t, normalize));
        const regaEfficiency = safeRate(regaDone.length, Math.max(1, regaCurrent.length), clamp);

        const alertCurrent = allAlerts.filter((alerta) => inRange(parseDate(alerta?.created_at || alerta?.data || alerta?.updated_at), currentRange));
        const alertScore = clamp(100 - round((alertCurrent.length / Math.max(1, parcelas.length * 3)) * 100), 5, 100);

        const taskBucketRaw = buildBuckets(currentTasks, (task) => taskDate(task, parseDate), currentRange, clamp, inRange, 6);
        const alertBucketRaw = buildBuckets(alertCurrent, (alerta) => parseDate(alerta?.created_at || alerta?.data || alerta?.updated_at), currentRange, clamp, inRange, 6);

        const lineSource = focus === 'rega'
            ? buildBuckets(regaCurrent, (task) => taskDate(task, parseDate), currentRange, clamp, inRange, 6)
            : taskBucketRaw;

        const line = toBucketSeries(lineSource.map((v, i) => v + (focus === 'geral' ? Math.max(0, 2 - alertBucketRaw[i]) : 0)), round, clamp);
        const bucketLabels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
        const bars = focus === 'tarefas'
            ? toBucketSeries(taskBucketRaw.map((v, i) => v + (i % 2 === 0 ? 1 : 0)), round, clamp)
            : focus === 'rega'
                ? toBucketSeries(buildBuckets(regaCurrent, (task) => taskDate(task, parseDate), currentRange, clamp, inRange, 6), round, clamp)
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
            todayPending.length === 0 ? `Hoje está tudo em dia: ${todayDone.length} tarefa(s) concluída(s).` : `Hoje tens ${todayPending.length} tarefa(s) pendente(s) e ${todayDone.length} concluída(s).`,
            `${currentDone.length} tarefa(s) concluída(s) em ${days} dias (${focus}).`,
            `Eficiência de rega em ${round(regaEfficiency)}% com ${regaCurrent.length} tarefa(s) relacionadas.`,
            `Foram registados ${alertCurrent.length} alerta(s) no período analisado.`,
        ];

        return {
            produtividade: toDeltaText(productivityDelta, round),
            rega: `${round(regaEfficiency)}%`,
            tarefas: String(currentDone.length),
            bars, line, bucketLabels, performanceScore, performanceText, summary,
            helper: `Dados reais de ${parcelas.length} parcela(s), ${allTasks.length} tarefa(s) e ${allAlerts.length} alerta(s).`,
        };
    }
};
