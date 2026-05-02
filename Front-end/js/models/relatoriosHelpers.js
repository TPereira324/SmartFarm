window.CocoRootRelatoriosHelpers = {
    parseDate: (value) => {
        const d = new Date(value || 0);
        return Number.isNaN(d.getTime()) ? null : d;
    },
    normalizeTaskText: (value) => String(value || '').trim().toLowerCase(),
    taskDate: (task, parseDate) => parseDate(task?.data_inicio || task?.dueDate || task?.created_at),
    taskCompletedAt: (task, parseDate) => parseDate(task?.concluida_em || task?.concluidaEm || task?.completed_at || task?.updated_at),
    normalize: (value) => String(value || '').toLowerCase(),

    isTaskDone: (task, normalize) => normalize(task?.estado).includes('conclu'),
    isRegaTask: (task) => {
        const text = `${task?.tipo || ''} ${task?.categoria || ''} ${task?.titulo || ''}`.toLowerCase();
        return text.includes('rega') || text.includes('agua') || text.includes('irrig');
    },

    round: (value) => Math.round(Number(value || 0)),
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),

    safeRate: (done, total, clamp) => {
        if (!total) return 0;
        return clamp((done / total) * 100, 0, 100);
    },

    toDeltaText: (delta, round) => {
        const value = round(Math.abs(delta));
        return `${delta >= 0 ? '+' : '-'}${value}%`;
    },

    getWindowRange: (days) => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - days + 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    },

    getPreviousWindowRange: (days, getWindowRange) => {
        const current = getWindowRange(days);
        const end = new Date(current.start.getTime() - 1);
        const start = new Date(end);
        start.setDate(end.getDate() - days + 1);
        start.setHours(0, 0, 0, 0);
        return { start, end };
    },

    getTodayRange: () => {
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    },

    inRange: (date, range) => date && date >= range.start && date <= range.end,

    toBucketSeries: (values, round, clamp, minHeight = 18) => {
        const max = Math.max(1, ...values);
        return values.map((value) => {
            const scaled = round((value / max) * 90);
            return clamp(scaled, minHeight, 95);
        });
    },

    buildBuckets: (items, getDate, range, clamp, inRange, bucketCount = 6) => {
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
    }
};
