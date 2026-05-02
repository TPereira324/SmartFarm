function createMonitorMetric({ icon, label, value, detail, tone = 'neutral', available = false, badge = null }) {
    return `
        <div class="monitor-card monitor-${tone} ${available ? '' : 'is-empty'}">
            <div class="monitor-card-top">
                <i class="bi ${icon}" aria-hidden="true"></i>
                <span class="monitor-card-badge">${badge || (available ? 'disponível' : 'sem dado')}</span>
            </div>
            <div class="monitor-card-label">${label}</div>
            <div class="monitor-card-value">${value}</div>
            <div class="monitor-card-trend">${detail}</div>
        </div>`;
}

function renderMonitorizacao(parcelas, clima, alertas, weatherByParcelaId, monitorizacaoContainer) {
    if (!monitorizacaoContainer) return;
    const list = Array.isArray(parcelas) ? parcelas : [];
    monitorizacaoContainer.innerHTML = list.length === 0
        ? '<div class="dash-card"><div style="color:var(--muted);line-height:1.6;">Registe parcelas para acompanhar a monitorização.</div></div>'
        : `<div class="monitor-accordion">${list.map((parcela, index) => {
            const cultivos = Array.isArray(parcela?.cultivos) ? parcela.cultivos : [];
            const cultivo = cultivos[0] || {};
            const parcelaWeather = weatherByParcelaId?.[getParcelaId(parcela)] || clima || null;
            const parcelaNome = parcela?.nome || `Parcela ${index + 1}`;
            const cultivoNome = cultivo?.nome ? ` - ${cultivo.nome}` : '';
            const area = Number(parcela?.area_m2 ?? parcela?.par_area);
            const estado = String(parcela?.estado || parcela?.par_estado || '').trim() || 'Sem estado';
            const metodo = pickFirstText([cultivo, parcela], ['metodo', 'pc_metodo_cultivo']);
            const objetivo = pickFirstText([cultivo, parcela], ['objetivo', 'pc_objetivo']);
            const agro = parcelaWeather?.agro || {};
            const temperatura = Number(agro?.solo_temperatura_0cm);
            const humidade = Number(agro?.solo_humidade_superficie);
            const et0 = Number(agro?.evapotranspiracao_ref);
            const vpd = Number(agro?.deficit_pressao_vapor);
            const hasAnyReading = [temperatura, humidade, et0, vpd].some((v) => Number.isFinite(v));
            const relatedAlerts = (Array.isArray(alertas) ? alertas : []).filter((a) => {
                const where = String(a?.parcela_nome || a?.parcela || '');
                return where && where.toLowerCase() === parcelaNome.toLowerCase();
            }).length;
            const meta = [
                `Estado: ${estado}`,
                Number.isFinite(area) ? `Área: ${formatArea(area)}` : '',
                metodo ? `Método: ${metodo}` : '',
                objetivo ? `Objetivo: ${objetivo}` : '',
                parcelaWeather?.cidade ? `Local: ${parcelaWeather.cidade}` : '',
            ].filter(Boolean);
            return `
                <section class="monitor-group ${index === 0 ? 'is-open' : ''}" data-monitor-group>
                    <button type="button" class="monitor-group-toggle" data-monitor-toggle>
                        <span class="monitor-group-info">
                            <span class="monitor-group-title">${parcelaNome}${cultivoNome}</span>
                            <span class="monitor-group-meta">${meta.join(' · ')}</span>
                        </span>
                        <span class="monitor-group-right">
                            ${relatedAlerts > 0 ? `<span class="monitor-group-pill">${relatedAlerts} alerta${relatedAlerts > 1 ? 's' : ''}</span>` : ''}
                            <i class="bi bi-chevron-down" aria-hidden="true"></i>
                        </span>
                    </button>
                    <div class="monitor-group-panel">
                        <div class="monitor-cards-grid">
                            ${createMonitorMetric({ icon: 'bi-thermometer-half', label: 'Temperatura', value: Number.isFinite(temperatura) ? `${Math.round(temperatura)}°C` : 'Sem leitura', detail: Number.isFinite(temperatura) ? `Base API · solo em ${parcelaWeather?.cidade || 'local resolvido'}` : 'Sem temperatura disponível na API', tone: 'warm', available: Number.isFinite(temperatura), badge: Number.isFinite(temperatura) ? 'API' : 'sem dado' })}
                            ${createMonitorMetric({ icon: 'bi-moisture', label: 'Humidade', value: Number.isFinite(humidade) ? `${Math.round(humidade)}%` : 'Sem leitura', detail: Number.isFinite(humidade) ? `Base API · camada superficial em ${parcelaWeather?.cidade || 'local resolvido'}` : 'Sem humidade disponível na API', tone: 'water', available: Number.isFinite(humidade), badge: Number.isFinite(humidade) ? 'API' : 'sem dado' })}
                            ${createMonitorMetric({ icon: 'bi-cloud-drizzle', label: 'Necessidade de água', value: Number.isFinite(et0) ? `${et0.toFixed(1)} mm` : 'Sem leitura', detail: Number.isFinite(et0) ? 'Base API · evapotranspiração do dia' : 'Sem necessidade hídrica disponível', available: Number.isFinite(et0), badge: Number.isFinite(et0) ? 'API' : 'sem dado' })}
                            ${createMonitorMetric({ icon: 'bi-wind', label: 'Stress do ar', value: Number.isFinite(vpd) ? `${vpd.toFixed(1)} kPa` : 'Sem leitura', detail: Number.isFinite(vpd) ? 'Base API · pressão atmosférica sobre a planta' : 'Sem índice atmosférico disponível', available: Number.isFinite(vpd), badge: Number.isFinite(vpd) ? 'API' : 'sem dado' })}
                        </div>
                        ${hasAnyReading ? '' : '<div class="monitor-panel-note">Esta parcela ainda não tem dados disponíveis para monitorização.</div>'}
                    </div>
                </section>`;
        }).join('')}</div>`;

    if (!monitorizacaoContainer.dataset.monitorBound) {
        monitorizacaoContainer.dataset.monitorBound = '1';
        monitorizacaoContainer.addEventListener('click', (e) => {
            const toggle = e.target?.closest?.('[data-monitor-toggle]');
            if (!toggle) return;
            const group = toggle.closest('[data-monitor-group]');
            if (!group) return;
            Array.from(monitorizacaoContainer.querySelectorAll('[data-monitor-group]')).forEach((item) => {
                if (item === group) item.classList.toggle('is-open');
                else item.classList.remove('is-open');
            });
        });
    }
}
