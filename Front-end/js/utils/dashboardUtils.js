function weatherCodeToText(code) {
    const n = Number(code);
    if (!Number.isFinite(n)) return 'Sem descrição';
    if (n === 0) return 'Céu limpo';
    if ([1, 2, 3].includes(n)) return 'Parcialmente nublado';
    if ([45, 48].includes(n)) return 'Nevoeiro';
    if ([51, 53, 55, 56, 57].includes(n)) return 'Chuvisco';
    if ([61, 63, 65, 66, 67].includes(n)) return 'Chuva';
    if ([71, 73, 75, 77].includes(n)) return 'Neve';
    if ([80, 81, 82].includes(n)) return 'Aguaceiros';
    if ([95, 96, 99].includes(n)) return 'Trovoada';
    return 'Tempo variável';
}

function weatherCodeToIcon(code) {
    const n = Number(code);
    if (!Number.isFinite(n)) return 'bi-cloud';
    if (n === 0) return 'bi-sun';
    if ([1, 2, 3].includes(n)) return 'bi-cloud-sun';
    if ([45, 48].includes(n)) return 'bi-cloud-fog2';
    if ([51, 53, 55, 56, 57].includes(n)) return 'bi-cloud-drizzle';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(n)) return 'bi-cloud-rain';
    if ([71, 73, 75, 77].includes(n)) return 'bi-cloud-snow';
    if ([95, 96, 99].includes(n)) return 'bi-cloud-lightning-rain';
    return 'bi-cloud';
}

function formatArea(value) {
    return `${Number(value || 0).toFixed(2)} m²`;
}

function formatDate(value) {
    if (!value) return 'Sem data';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sem data';
    return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function formatShortDateTime(value) {
    if (!value) return 'Sem data';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sem data';
    return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatWeekdayShort(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-PT', { weekday: 'short' }).format(date).replace('.', '').replace(/^\w/, (m) => m.toUpperCase());
}

function normalizeText(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function buildTaskId() {
    try { if (window.crypto?.randomUUID) return window.crypto.randomUUID(); } catch {}
    return `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + Number(days || 0));
    return d;
}

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

function getParcelaId(parcela) {
    const id = parcela?.id ?? parcela?.par_id ?? parcela?.parcela_id ?? parcela?.parcelaId ?? parcela?.nome;
    return String(id || '');
}

function getParcelaLabel(parcela) {
    return String(parcela?.nome || parcela?.par_nome || 'Parcela');
}

function getCultivoLabel(parcela) {
    const cultivos = Array.isArray(parcela?.cultivos) ? parcela.cultivos : [];
    return String(cultivos[0]?.nome || parcela?.tipo || parcela?.cultivo || '');
}

function pickCultivoCategory(cultivoName) {
    const t = normalizeText(cultivoName);
    if (!t) return 'geral';
    const has = (...words) => words.some((w) => t.includes(normalizeText(w)));
    if (has('alface', 'couve', 'espinafre', 'rúcula', 'rucula', 'repolho')) return 'folhosas';
    if (has('tomate', 'pimento', 'pepino', 'abobrinha', 'courgette', 'beringela', 'melancia', 'melao', 'melão', 'morango')) return 'frutiferas';
    if (has('manjericão', 'manjericao', 'hortelã', 'hortela', 'salsa', 'coentros', 'alecrim', 'orégãos', 'oregãos', 'oregano', 'cebolinho')) return 'ervas';
    if (has('batata', 'cenoura', 'beterraba', 'nabo', 'rabanete')) return 'raizes';
    return 'geral';
}

function pickFirstFinite(sources, keys) {
    for (const source of sources) {
        for (const key of keys) {
            const value = Number(source?.[key]);
            if (Number.isFinite(value)) return value;
        }
    }
    return null;
}

function pickFirstText(sources, keys) {
    for (const source of sources) {
        for (const key of keys) {
            const value = String(source?.[key] ?? '').trim();
            if (value) return value;
        }
    }
    return '';
}
