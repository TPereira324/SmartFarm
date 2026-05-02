function getAlertText(alerta) { return String(alerta?.mensagem || alerta?.message || '').trim(); }
function getAlertTitle(alerta) { return String(alerta?.titulo || alerta?.title || 'Alerta').trim(); }
function getAlertLevel(alerta) {
    const v = normalizeText(alerta?.nivel || alerta?.level || alerta?.tipo || '');
    if (v.includes('danger') || v.includes('crit') || v.includes('erro')) return 'danger';
    if (v.includes('warn') || v.includes('aten')) return 'warning';
    return 'info';
}
function getAlertCategory(alerta) {
    const raw = String(alerta?.categoria || alerta?.cat || alerta?.origem || alerta?.source || '').trim();
    if (raw) return raw;
    if (String(alerta?.parcela_nome || alerta?.parcela || '').trim()) return 'Parcela';
    const combined = `${normalizeText(getAlertTitle(alerta))} ${normalizeText(getAlertText(alerta))}`;
    if (combined.includes('clima') || combined.includes('temperatura') || combined.includes('chuva') || combined.includes('trovoada')) return 'Clima';
    if (combined.includes('tarefa')) return 'Tarefas';
    if (combined.includes('cultivo')) return 'Cultivo';
    return 'Sistema';
}
function buildAlertKey(alerta) {
    return `${normalizeText(getAlertTitle(alerta))}::${normalizeText(getAlertText(alerta))}::${normalizeText(alerta?.parcela_nome || alerta?.parcela || '')}::${normalizeText(getAlertCategory(alerta))}`;
}
function mergeAlerts(...groups) {
    const seen = new Set();
    const merged = [];
    groups.flat().forEach((alerta) => {
        if (!alerta) return;
        const key = buildAlertKey(alerta);
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(alerta);
    });
    return merged.sort((a, b) => {
        const aTime = new Date(a?.created_at || a?.updated_at || a?.data || 0).getTime();
        const bTime = new Date(b?.created_at || b?.updated_at || b?.data || 0).getTime();
        return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    });
}

function getCultivoProfile(cultivoName) {
    const category = pickCultivoCategory(cultivoName);
    if (category === 'folhosas') return { category, label: 'Folhosas', minSoilHumidity: 32, highEt0: 4.2, criticalEt0: 5.2, skipRainMm: 4, hotTemp: 29 };
    if (category === 'frutiferas') return { category, label: 'Frutíferas', minSoilHumidity: 28, highEt0: 4.8, criticalEt0: 5.8, skipRainMm: 5, hotTemp: 31 };
    if (category === 'ervas') return { category, label: 'Ervas aromáticas', minSoilHumidity: 30, highEt0: 4.0, criticalEt0: 5.0, skipRainMm: 4, hotTemp: 29 };
    if (category === 'raizes') return { category, label: 'Raízes', minSoilHumidity: 26, highEt0: 4.6, criticalEt0: 5.6, skipRainMm: 5, hotTemp: 30 };
    return { category: 'geral', label: 'Cultivo', minSoilHumidity: 29, highEt0: 4.5, criticalEt0: 5.5, skipRainMm: 5, hotTemp: 30 };
}

function renderAlertsCard(alertas) {
    const list = Array.isArray(alertas) ? alertas : [];
    const dots = { info: '#2f6f3f', warning: '#b7791f', danger: '#b42318' };
    const badges = { info: 'rgba(47,111,63,0.12)', warning: 'rgba(183,121,31,0.14)', danger: 'rgba(180,35,24,0.12)' };
    const borders = { info: 'rgba(47,111,63,0.28)', warning: 'rgba(183,121,31,0.34)', danger: 'rgba(180,35,24,0.30)' };
    const levelText = { info: 'Info', warning: 'Atenção', danger: 'Crítico' };
    if (list.length === 0) return `<div class="dash-card"><div class="dash-card-title">Alertas</div><div style="color:var(--muted);line-height:1.6;">Sem alertas no momento.</div></div>`;
    const items = list.slice(0, 6).map((a) => {
        const level = getAlertLevel(a);
        const dot = dots[level] || dots.info;
        const badgeBg = badges[level] || badges.info;
        const badgeBorder = borders[level] || borders.info;
        const levelLabel = levelText[level] || levelText.info;
        const meta = String(a?.parcela_nome || a?.parcela || '').trim();
        return `
            <div style="display:flex;gap:10px;align-items:flex-start;">
                <div style="width:10px;height:10px;border-radius:50%;margin-top:6px;background:${dot};flex-shrink:0;"></div>
                <div>
                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:2px;">
                        <div style="font-weight:900;">${getAlertTitle(a)}${meta ? ` · ${meta}` : ''}</div>
                        <div style="display:flex;gap:6px;"><span style="font-size:11px;font-weight:900;padding:4px 8px;border-radius:999px;border:1px solid ${badgeBorder};background:${badgeBg};">${getAlertCategory(a)}</span><span style="font-size:11px;font-weight:900;padding:4px 8px;border-radius:999px;border:1px solid ${badgeBorder};background:${badgeBg};">${levelLabel}</span></div>
                    </div>
                    <div style="color:var(--muted);line-height:1.6;">${getAlertText(a)}</div>
                </div>
            </div>`;
    }).join('');
    const more = list.length > 6 ? `<div style="color:var(--muted);margin-top:10px;">+${list.length - 6} alertas</div>` : '';
    return `<div class="dash-card"><div class="dash-card-title">Alertas</div><div style="display:flex;flex-direction:column;gap:12px;">${items}${more}</div></div>`;
}

function generateAlerts({ parcelas, tarefas, clima }) {
    const alerts = [];
    const add = (nivel, categoria, titulo, mensagem, extra = {}) => alerts.push({ id: buildTaskId(), nivel, categoria, titulo, mensagem, ...extra });
    const now = new Date();

    if (!Array.isArray(parcelas) || parcelas.length === 0) {
        add('info', 'Sistema', 'Sem parcelas registadas', 'Registe um cultivo para começar a receber tarefas e alertas.');
        return alerts;
    }
    parcelas.forEach((parcela) => {
        const estado = normalizeText(parcela?.estado || parcela?.par_estado || '');
        const parcelaNome = getParcelaLabel(parcela);
        const cultivoNome = getCultivoLabel(parcela);
        if (!cultivoNome) add('info', 'Cultivo', 'Cultivo não definido', 'Defina o tipo de cultivo para gerar tarefas mais específicas.', { parcela_nome: parcelaNome });
        if (estado.includes('critic')) add('danger', 'Parcela', 'Parcela em estado crítico', 'Verifique imediatamente rega, drenagem e sinais de pragas/doenças.', { parcela_nome: parcelaNome });
        else if (estado.includes('aten') || estado.includes('alert')) add('warning', 'Parcela', 'Parcela em atenção', 'Reveja humidade do substrato e faça uma inspeção rápida.', { parcela_nome: parcelaNome });
    });

    const pending = (Array.isArray(tarefas) ? tarefas : []).filter((t) => {
        const done = normalizeText(t?.estado).includes('conclu');
        const due = new Date(t?.data_inicio || t?.dueDate || 0);
        return !done && Number.isFinite(due.getTime()) && due.getTime() <= now.getTime();
    });
    if (pending.length > 0) add('warning', 'Tarefas', 'Tarefas em atraso', `Tem ${pending.length} tarefa(s) para fazer até hoje.`, {});

    if (!clima) return alerts;

    const round = (v) => { const n = Number(v); return Number.isFinite(n) ? Math.round(n) : null; };
    const fixed = (v, d = 1) => { const n = Number(v); return Number.isFinite(n) ? n.toFixed(d) : null; };
    const tempNow = round(clima.temperatura), feelsLike = round(clima.sensacao_termica);
    const tempMax = round(clima.temp_max), tempMin = round(clima.temp_min), hum = round(clima.humidade);
    const desc = normalizeText(clima.descricao || '');
    const agro = clima?.agro || {};
    const et0 = Number(agro?.evapotranspiracao_ref), rainToday = Number(agro?.precipitacao_hoje);
    const soilHumidity = Number(agro?.solo_humidade_superficie), soilTemp = Number(agro?.solo_temperatura_0cm), vpd = Number(agro?.deficit_pressao_vapor);
    const tempLabel = (n) => (n === null ? '—' : `${n}°C`);
    const nowText = `Agora: ${tempLabel(tempNow)}${feelsLike !== null ? ` (sensação ${tempLabel(feelsLike)})` : ''}`;
    const rangeText = (tempMin !== null || tempMax !== null) ? ` · Mín ${tempLabel(tempMin)} · Máx ${tempLabel(tempMax)}` : '';
    const hotSignal = [tempNow, feelsLike, tempMax].filter((n) => n !== null);
    const coldSignal = [tempNow, feelsLike, tempMin].filter((n) => n !== null);
    const maxHot = hotSignal.length ? Math.max(...hotSignal) : null;
    const minCold = coldSignal.length ? Math.min(...coldSignal) : null;

    if (maxHot !== null && maxHot >= 35) add('danger', 'Clima', 'Calor extremo', `${nowText}${rangeText}. Reforce rega/monitorização e evite stress hídrico.`);
    else if (maxHot !== null && maxHot >= 32) add('warning', 'Clima', 'Calor elevado', `${nowText}${rangeText}. Aumente a frequência de verificação de humidade e ajuste a rega.`);
    if (minCold !== null && minCold <= 2) add('danger', 'Clima', 'Frio extremo', `${nowText}${rangeText}. Proteja as plantas e evite regas tardias.`);
    else if (minCold !== null && minCold <= 6) add('warning', 'Clima', 'Temperatura baixa', `${nowText}${rangeText}. Atenção a stress térmico.`);
    if (tempMax !== null && tempMin !== null && tempMax - tempMin >= 15) add('info', 'Clima', 'Amplitude térmica alta', `Variação prevista: ${tempLabel(tempMin)} → ${tempLabel(tempMax)}. Monitore humidade e sinais de stress.`);
    if (hum !== null && hum <= 30 && maxHot !== null && maxHot >= 30) add('warning', 'Clima', 'Ar seco + calor', `Humidade ${hum}% com calor. O substrato pode secar mais rápido.`);
    else if (hum !== null && hum <= 30) add('info', 'Clima', 'Humidade relativa baixa', `Humidade ${hum}%. Monitore a secagem do substrato ao longo do dia.`);
    if (desc.includes('trovoada') || desc.includes('chuva') || desc.includes('aguace')) add('info', 'Clima', 'Condições de chuva', 'Evite rega excessiva e confirme drenagem.');

    parcelas.forEach((parcela) => {
        const parcelaNome = getParcelaLabel(parcela);
        const cultivoNome = getCultivoLabel(parcela);
        const profile = getCultivoProfile(cultivoNome);
        const cultivoLabel = cultivoNome || profile.label;
        const hasSoilHumidity = Number.isFinite(soilHumidity), hasEt0 = Number.isFinite(et0);
        const hasRain = Number.isFinite(rainToday), hasVpd = Number.isFinite(vpd);
        const isRainy = hasRain && rainToday >= profile.skipRainMm;
        const isHotDryDay = (tempMax !== null && tempMax >= profile.hotTemp) || (hasEt0 && et0 >= profile.highEt0);
        const isCriticalDryDay = (tempMax !== null && tempMax >= profile.hotTemp + 3) || (hasEt0 && et0 >= profile.criticalEt0);
        const lowSoilHumidity = hasSoilHumidity && soilHumidity <= profile.minSoilHumidity;
        const nearLimitSoilHumidity = hasSoilHumidity && soilHumidity <= profile.minSoilHumidity + 5;

        if (isRainy && hasEt0 && et0 < profile.highEt0) add('info', 'Rega', 'Evitar rega pesada', `${parcelaNome} (${cultivoLabel}) tem ${fixed(rainToday)} mm chuva e ET0 ${fixed(et0)} mm. Reduzir/adiar rega.`, { parcela_nome: parcelaNome });
        else if (lowSoilHumidity && isCriticalDryDay) add('danger', 'Rega', 'Reforçar rega hoje', `${parcelaNome} (${cultivoLabel}) humidade solo ${fixed(soilHumidity)}%. Rega reforçada para evitar stress hídrico.`, { parcela_nome: parcelaNome });
        else if ((lowSoilHumidity || nearLimitSoilHumidity) && isHotDryDay) add('warning', 'Rega', 'Planear rega', `${parcelaNome} (${cultivoLabel}) maior consumo hídrico. ${hasEt0 ? `ET0 ${fixed(et0)} mm` : ''}${hasSoilHumidity ? ` humidade ${fixed(soilHumidity)}%` : ''}. Verifique a rega.`, { parcela_nome: parcelaNome });
        if (hasVpd && vpd >= 1.6 && tempMax !== null && tempMax >= profile.hotTemp) add(vpd >= 2.2 ? 'danger' : 'warning', 'Stress hídrico', 'Risco de stress hídrico', `${parcelaNome} (${cultivoLabel}) VPD ${fixed(vpd)} kPa, máxima ${tempMax}°C.`, { parcela_nome: parcelaNome });
        if (hasEt0 && hasRain && et0 <= 2.2 && rainToday >= profile.skipRainMm + 2) add('info', 'Rega', 'Baixa necessidade de água', `${parcelaNome} (${cultivoLabel}) ET0 ${fixed(et0)} mm e chuva ${fixed(rainToday)} mm. Evite excesso de rega.`, { parcela_nome: parcelaNome });
        if (Number.isFinite(soilTemp) && soilTemp <= 10 && profile.category !== 'raizes') add('info', 'Solo', 'Solo frio', `${parcelaNome} (${cultivoLabel}) temperatura solo ${fixed(soilTemp)}°C. Crescimento mais lento.`, { parcela_nome: parcelaNome });
    });
    return alerts;
}
