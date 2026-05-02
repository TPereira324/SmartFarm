window.CocoRootRelatoriosUI = {
    renderBars: (barsRoot, values, labels, round, clamp) => {
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
    },

    renderLine: (lineChart, linePointsRoot, lineTooltip, values, labels, round, clamp) => {
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
    },

    renderDonut: (donut, donutValue, donutLabel, score, label, round, clamp) => {
        if (!donut || !donutValue || !donutLabel) return;
        const safeScore = clamp(round(score), 0, 100);
        donut.classList.remove('reports-loading-line');
        donut.style.setProperty('--score', String(safeScore));
        donutValue.textContent = `${safeScore}%`;
        donutLabel.textContent = label || 'Performance global';
    },

    renderSummary: (summaryList, lines) => {
        if (!summaryList) return;
        summaryList.innerHTML = '';
        lines.forEach((line) => {
            const li = document.createElement('li');
            li.textContent = line;
            summaryList.appendChild(li);
        });
    }
};
