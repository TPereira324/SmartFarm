window.CocoRootDashUI = {
    renderEmpty: (container, message) => {
        if (!container) return;
        container.innerHTML = `
            <div class="dash-empty">
                <i class="bi bi-inbox" aria-hidden="true" style="font-size:32px;color:var(--muted);margin-bottom:12px;"></i>
                <div style="max-width:300px;margin:0 auto;color:var(--muted);line-height:1.6;">${message || 'Sem dados para apresentar.'}</div>
            </div>
        `;
    },

    formatTaskSectionTitle: (base, list) => list.length ? `${base} (${list.length})` : base,

    createTaskRowMarkup: (tarefa, interactive, formatShortDateTime, getTaskDueDate, isTaskDone) => {
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
    },

    renderTasks: (tarefasContainer, tasks, options, classifyTasks, renderEmpty, formatTaskSectionTitle, createTaskRowMarkup, formatShortDateTime, getTaskDueDate, isTaskDone) => {
        if (!tarefasContainer) return;
        const sections = classifyTasks(tasks);
        const showOnlyToday = options.onlyToday === true;
        const interactive = options.interactive !== false;
        const visibleNow = showOnlyToday ? sections.overdueOrToday : sections.pending;

        if (sections.pending.length === 0) {
            renderEmpty(tarefasContainer, 'Sem tarefas pendentes. Quando registares ou planeares novos cultivos, as tarefas aparecem aqui.');
            return;
        }

        const summaryText = sections.overdueOrToday.length > 0
            ? `Tens ${sections.overdueOrToday.length} tarefa(s) para tratar até hoje e ${sections.upcoming.length} próxima(s) a seguir.`
            : `Não tens tarefas para hoje, mas ainda existem ${sections.upcoming.length} tarefa(s) pendente(s) agendada(s).`;

        const blocks = [];
        if (visibleNow.length > 0) {
            blocks.push(`
                <section class="dash-task-section">
                    <div class="dash-task-section-title">${formatTaskSectionTitle(showOnlyToday ? 'Para hoje e em atraso' : 'Pendentes', visibleNow)}</div>
                    ${visibleNow.map((tarefa) => createTaskRowMarkup(tarefa, interactive, formatShortDateTime, getTaskDueDate, isTaskDone)).join('')}
                </section>
            `);
        }
        if (!showOnlyToday && sections.upcoming.length > 0) {
            blocks.push(`
                <section class="dash-task-section">
                    <div class="dash-task-section-title">${formatTaskSectionTitle('Próximas', sections.upcoming)}</div>
                    ${sections.upcoming.map((tarefa) => createTaskRowMarkup(tarefa, interactive, formatShortDateTime, getTaskDueDate, isTaskDone)).join('')}
                </section>
            `);
        } else if (showOnlyToday && sections.upcoming.length > 0) {
            blocks.push(`
                <section class="dash-task-section">
                    <div class="dash-task-section-title">${formatTaskSectionTitle('Próximas', sections.upcoming.slice(0, 4))}</div>
                    ${sections.upcoming.slice(0, 4).map((tarefa) => createTaskRowMarkup(tarefa, interactive, formatShortDateTime, getTaskDueDate, isTaskDone)).join('')}
                </section>
            `);
        }
        if (sections.unscheduled.length > 0) {
            blocks.push(`
                <section class="dash-task-section">
                    <div class="dash-task-section-title">${formatTaskSectionTitle('Sem data definida', sections.unscheduled)}</div>
                    ${sections.unscheduled.map((tarefa) => createTaskRowMarkup(tarefa, interactive, formatShortDateTime, getTaskDueDate, isTaskDone)).join('')}
                </section>
            `);
        }

        tarefasContainer.innerHTML = `
            <div class="dash-task-summary">${summaryText}</div>
            <div class="dash-task-sections">${blocks.join('')}</div>
        `;
    },



    formatArea: (value) => {
        const amount = Number(value || 0);
        return `${amount.toFixed(2)} m²`;
    },

    formatShortDateTime: (value) => {
        if (!value) return 'Sem data';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Sem data';
        return new Intl.DateTimeFormat('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    },

    formatWeekdayShort: (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return new Intl.DateTimeFormat('pt-PT', { weekday: 'short' })
            .format(date)
            .replace('.', '')
            .replace(/^\w/, (m) => m.toUpperCase());
    },

    pickFirstFinite: (sources, keys) => {
        for (const source of sources) {
            for (const key of keys) {
                const value = Number(source?.[key]);
                if (Number.isFinite(value)) return value;
            }
        }
        return null;
    },

    pickFirstText: (sources, keys) => {
        for (const source of sources) {
            for (const key of keys) {
                const value = String(source?.[key] ?? '').trim();
                if (value) return value;
            }
        }
        return '';
    },

    createMonitorMetric: ({ icon, label, value, detail, tone = 'neutral', available = false, badge = null }) => `
        <div class="monitor-card monitor-${tone} ${available ? '' : 'is-empty'}">
            <div class="monitor-card-top">
                <i class="bi ${icon}" aria-hidden="true"></i>
                <span class="monitor-card-badge">${badge || (available ? 'disponível' : 'sem dado')}</span>
            </div>
            <div class="monitor-card-label">${label}</div>
            <div class="monitor-card-value">${value}</div>
            <div class="monitor-card-trend">${detail}</div>
        </div>
    `,


};
