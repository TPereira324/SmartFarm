function relSetLoading(active, els) {
    const { statProd, statRega, statTasks, loadingPills, lineWave, linePointsRoot, lineTooltip, donut, donutValue, refreshBtn } = els;
    [statProd, statRega, statTasks].forEach((node) => {
        if (!node) return;
        if (active) { node.classList.add('reports-loading-line', 'reports-loading-short'); node.textContent = ''; }
        else node.classList.remove('reports-loading-line', 'reports-loading-short');
    });
    loadingPills.forEach((pill) => { pill.textContent = active ? 'A carregar...' : 'Atualizado'; });
    if (lineWave) lineWave.classList.toggle('reports-loading-line', active);
    if (linePointsRoot) linePointsRoot.innerHTML = '';
    if (lineTooltip) lineTooltip.hidden = true;
    if (donut) donut.classList.toggle('reports-loading-line', active);
    if (donutValue && active) donutValue.textContent = '--';
    if (refreshBtn) refreshBtn.disabled = active;
}

function relRenderBars(values, labels, barsRoot) {
    if (!barsRoot) return;
    barsRoot.innerHTML = '';
    values.forEach((value, index) => {
        const bar = document.createElement('div');
        bar.className = 'reports-bar';
        bar.style.height = `${relClamp(value, 8, 95)}%`;
        bar.dataset.label = labels[index] || `B${index + 1}`;
        bar.title = `${labels[index] || `Bloco ${index + 1}`}: ${relRound(value)}%`;
        barsRoot.appendChild(bar);
    });
}

function relRenderLine(values, labels, els) {
    const { lineChart, linePointsRoot, lineTooltip } = els;
    if (!lineChart || values.length === 0) return;
    const points = values.map((value, index) => {
        const x = Math.round((index / Math.max(1, values.length - 1)) * 100);
        const y = 100 - relClamp(value, 10, 95);
        return `${x}% ${y}%`;
    });
    lineChart.style.setProperty('--reports-line', `polygon(0% 100%, ${points.join(', ')}, 100% 100%)`);
    if (!linePointsRoot) return;
    linePointsRoot.innerHTML = '';
    values.forEach((value, index) => {
        const x = (index / Math.max(1, values.length - 1)) * 100;
        const y = 100 - relClamp(value, 10, 95);
        const point = document.createElement('button');
        point.type = 'button';
        point.className = 'reports-line-point';
        point.style.left = `${x}%`;
        point.style.top = `${y}%`;
        point.setAttribute('aria-label', `${labels[index] || `Ponto ${index + 1}`}: ${relRound(value)}%`);
        const showTip = () => {
            if (!lineTooltip) return;
            lineTooltip.hidden = false;
            lineTooltip.style.left = `${x}%`;
            lineTooltip.style.top = `${y}%`;
            lineTooltip.innerHTML = `<strong>${labels[index] || `Bloco ${index + 1}`}</strong>${relRound(value)}%`;
        };
        const hideTip = () => { if (lineTooltip) lineTooltip.hidden = true; };
        point.addEventListener('mouseenter', showTip);
        point.addEventListener('mouseleave', hideTip);
        point.addEventListener('focus', showTip);
        point.addEventListener('blur', hideTip);
        linePointsRoot.appendChild(point);
    });
}

function relRenderDonut(score, label, els) {
    const { donut, donutValue, donutLabel } = els;
    if (!donut || !donutValue || !donutLabel) return;
    const safeScore = relClamp(relRound(score), 0, 100);
    donut.classList.remove('reports-loading-line');
    donut.style.setProperty('--score', String(safeScore));
    donutValue.textContent = `${safeScore}%`;
    donutLabel.textContent = label || 'Performance global';
}

function relRenderSummary(lines, summaryList) {
    if (!summaryList) return;
    summaryList.innerHTML = '';
    lines.forEach((line) => {
        const li = document.createElement('li');
        li.textContent = line;
        summaryList.appendChild(li);
    });
}

function relRenderDatasetView(data, els) {
    const { statProd, statRega, statTasks, barsRoot, summaryCopy, summaryList } = els;
    if (statProd) statProd.textContent = data.produtividade;
    if (statRega) statRega.textContent = data.rega;
    if (statTasks) statTasks.textContent = data.tarefas;
    relRenderBars(data.bars, data.bucketLabels, barsRoot);
    relRenderLine(data.line, data.bucketLabels, els);
    relRenderDonut(data.performanceScore, data.performanceText, els);
    relRenderSummary(data.summary, summaryList);
    if (summaryCopy) summaryCopy.textContent = data.helper;
}

function relAnimateDatasetTransition(from, to, els, onDone, duration = 420) {
    const start = performance.now();
    const fromBars = Array.isArray(from?.bars) ? from.bars : to.bars.map(() => 20);
    const fromLine = Array.isArray(from?.line) ? from.line : to.line.map(() => 20);
    const fromScore = Number(from?.performanceScore || 0);
    const toScore = Number(to?.performanceScore || 0);

    const step = (now) => {
        const progress = relClamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const frameBars = to.bars.map((v, i) => { const a = Number(fromBars[i] ?? fromBars[fromBars.length - 1] ?? 20); return a + (v - a) * eased; });
        const frameLine = to.line.map((v, i) => { const a = Number(fromLine[i] ?? fromLine[fromLine.length - 1] ?? 20); return a + (v - a) * eased; });
        const frameScore = fromScore + (toScore - fromScore) * eased;
        relRenderBars(frameBars, to.bucketLabels, els.barsRoot);
        relRenderLine(frameLine, to.bucketLabels, els);
        relRenderDonut(frameScore, to.performanceText, els);
        if (progress < 1) { requestAnimationFrame(step); return; }
        relRenderDatasetView(to, els);
        onDone();
    };
    requestAnimationFrame(step);
}
