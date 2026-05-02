window.CocoRootDashWidgetsUI = {
    renderClima: (climaContainer, clima, renderEmpty, weatherCodeToIcon, formatWeekdayShort, weatherCodeToText) => {
        if (!climaContainer) return;
        if (!clima) {
            renderEmpty(climaContainer, 'A integração de clima ainda não está disponível no servidor atual.');
            return;
        }

        const temp = Number(clima.temperatura);
        const humidade = Number(clima.humidade);
        const ventoHoje = Number(clima?.previsao?.[0]?.vento_max);
        const chuvaHoje = Number(clima?.previsao?.[0]?.chuva_probabilidade);
        const icon = weatherCodeToIcon(clima.weather_code);
        const forecast = Array.isArray(clima.previsao) ? clima.previsao.slice(0, 5) : [];

        climaContainer.innerHTML = `
            <div class="weather-shell">
                <div class="weather-hero">
                    <div class="weather-hero-main">
                        <div class="weather-hero-label">Hoje${clima?.cidade ? ` · ${clima.cidade}` : ''}</div>
                        <div class="weather-hero-temp">${Number.isFinite(temp) ? `${Math.round(temp)}°C` : '—'}</div>
                        <div class="weather-hero-desc">${clima.descricao || 'Sem descrição'}</div>
                    </div>
                    <div class="weather-hero-icon"><i class="bi ${icon}" aria-hidden="true"></i></div>
                    <div class="weather-hero-stats">
                        <div><span>Humidade</span><strong>${Number.isFinite(humidade) ? `${Math.round(humidade)}%` : '—'}</strong></div>
                        <div><span>Vento</span><strong>${Number.isFinite(ventoHoje) ? `${Math.round(ventoHoje)} km/h` : '12 km/h'}</strong></div>
                        <div><span>Chuva</span><strong>${Number.isFinite(chuvaHoje) ? `${Math.round(chuvaHoje)}%` : '0%'}</strong></div>
                    </div>
                </div>
                <div class="weather-forecast-grid">
                    ${forecast.map((dia) => {
            const max = Number(dia?.temp_max);
            const min = Number(dia?.temp_min);
            const chuva = Number(dia?.chuva_probabilidade);
            const vento = Number(dia?.vento_max);
            const desc = weatherCodeToText(dia?.weather_code);
            const iconName = weatherCodeToIcon(dia?.weather_code);
            const baseTemp = Number.isFinite(max) ? Math.round(max) : (Number.isFinite(min) ? Math.round(min) : null);
            return `
                            <article class="weather-day-card">
                                <div class="weather-day-name">${formatWeekdayShort(dia?.data)}</div>
                                <div class="weather-day-icon"><i class="bi ${iconName}" aria-hidden="true"></i></div>
                                <div class="weather-day-temp">${baseTemp !== null ? `${baseTemp}°C` : '—'}</div>
                                <div class="weather-day-desc">${desc}</div>
                                <div class="weather-day-meta">
                                    <span><i class="bi bi-moisture" aria-hidden="true"></i> ${Number.isFinite(chuva) ? `${Math.round(chuva)}%` : '0%'}</span>
                                    <span><i class="bi bi-wind" aria-hidden="true"></i> ${Number.isFinite(vento) ? `${Math.round(vento)} km/h` : '0 km/h'}</span>
                                </div>
                            </article>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    },

    renderAlertsCard: (alertasContainer, alertas, getAlertLevel, getAlertCategory, getAlertTitle, getAlertText) => {
        if (!alertasContainer) return;
        const list = Array.isArray(alertas) ? alertas : [];
        const dots = { info: '#2f6f3f', warning: '#b7791f', danger: '#b42318' };
        const badges = { info: 'rgba(47,111,63,0.12)', warning: 'rgba(183,121,31,0.14)', danger: 'rgba(180,35,24,0.12)' };
        const borders = { info: 'rgba(47,111,63,0.28)', warning: 'rgba(183,121,31,0.34)', danger: 'rgba(180,35,24,0.30)' };
        const levelText = { info: 'Info', warning: 'Atenção', danger: 'Crítico' };

        if (list.length === 0) {
            alertasContainer.innerHTML = `
                <div class="dash-card">
                    <div class="dash-card-title">Alertas</div>
                    <div style="color:var(--muted);line-height:1.6;">Sem alertas no momento.</div>
                </div>
            `;
            return;
        }

        const items = list.slice(0, 6).map((a) => {
            const level = getAlertLevel(a);
            const dot = dots[level] || dots.info;
            const badgeBg = badges[level] || badges.info;
            const badgeBorder = borders[level] || borders.info;
            const levelLabel = levelText[level] || levelText.info;
            const category = getAlertCategory(a);
            const title = getAlertTitle(a);
            const text = getAlertText(a);
            const where = String(a?.parcela_nome || a?.parcela || '').trim();
            const meta = where ? ` · ${where}` : '';
            return `
                <div style="display:flex;gap:10px;align-items:flex-start;">
                    <div style="width:10px;height:10px;border-radius:50%;margin-top:6px;background:${dot};flex-shrink:0;"></div>
                    <div>
                        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:2px;">
                            <div style="font-weight:900;">${title}${meta}</div>
                            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                                <span style="font-size:11px;font-weight:900;padding:4px 8px;border-radius:999px;border:1px solid ${badgeBorder};background:${badgeBg};">${category}</span>
                                <span style="font-size:11px;font-weight:900;padding:4px 8px;border-radius:999px;border:1px solid ${badgeBorder};background:${badgeBg};">${levelLabel}</span>
                            </div>
                        </div>
                        <div style="color:var(--muted);line-height:1.6;">${text}</div>
                    </div>
                </div>
            `;
        }).join('');

        const more = list.length > 6
            ? `<div style="color:var(--muted);margin-top:10px;">+${list.length - 6} alertas</div>`
            : '';

        alertasContainer.innerHTML = `
            <div class="dash-card">
                <div class="dash-card-title">Alertas</div>
                <div style="display:flex;flex-direction:column;gap:12px;">${items}${more}</div>
            </div>
        `;
    },

    renderMonitorizacao: (monitorizacaoContainer, parcelas, clima, alertas, weatherByParcelaId = {}, getParcelaId, formatArea, pickFirstText, createMonitorMetric) => {
        if (!monitorizacaoContainer) return;
        const list = Array.isArray(parcelas) ? parcelas : [];
        monitorizacaoContainer.innerHTML = `
            ${list.length === 0 ? '<div class="dash-card"><div style="color:var(--muted);line-height:1.6;">Registe parcelas para acompanhar a monitorização.</div></div>' : `
            <div class="monitor-accordion">
                ${list.map((parcela, index) => {
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
            const temperaturaSolo = Number(agro?.solo_temperatura_0cm);
            const humidadeSolo = Number(agro?.solo_humidade_superficie);
            const et0 = Number(agro?.evapotranspiracao_ref);
            const vpd = Number(agro?.deficit_pressao_vapor);
            const temperatura = temperaturaSolo;
            const humidade = humidadeSolo;
            const hasAnyReading = [temperatura, humidade, et0, vpd].some((value) => Number.isFinite(value));
            const relatedAlerts = (Array.isArray(alertas) ? alertas : []).filter((alerta) => {
                const where = String(alerta?.parcela_nome || alerta?.parcela || '');
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
                                ${createMonitorMetric({
                icon: 'bi-thermometer-half',
                label: 'Temperatura',
                value: Number.isFinite(temperatura) ? `${Math.round(temperatura)}°C` : 'Sem leitura',
                detail: Number.isFinite(temperatura) ? `Base API · solo em ${parcelaWeather?.cidade || 'local resolvido'}` : 'Sem temperatura disponível na API',
                tone: 'warm',
                available: Number.isFinite(temperatura),
                badge: Number.isFinite(temperatura) ? 'API' : 'sem dado',
            })}
                                ${createMonitorMetric({
                icon: 'bi-moisture',
                label: 'Humidade',
                value: Number.isFinite(humidade) ? `${Math.round(humidade)}%` : 'Sem leitura',
                detail: Number.isFinite(humidade) ? `Base API · camada superficial em ${parcelaWeather?.cidade || 'local resolvido'}` : 'Sem humidade disponível na API',
                tone: 'water',
                available: Number.isFinite(humidade),
                badge: Number.isFinite(humidade) ? 'API' : 'sem dado',
            })}
                                ${createMonitorMetric({
                icon: 'bi-cloud-drizzle',
                label: 'Necessidade de água',
                value: Number.isFinite(et0) ? `${et0.toFixed(1)} mm` : 'Sem leitura',
                detail: Number.isFinite(et0) ? 'Base API · evapotranspiração do dia' : 'Sem necessidade hídrica disponível',
                available: Number.isFinite(et0),
                badge: Number.isFinite(et0) ? 'API' : 'sem dado',
            })}
                                ${createMonitorMetric({
                icon: 'bi-wind',
                label: 'Stress do ar',
                value: Number.isFinite(vpd) ? `${vpd.toFixed(1)} kPa` : 'Sem leitura',
                detail: Number.isFinite(vpd) ? 'Base API · pressão atmosférica sobre a planta' : 'Sem índice atmosférico disponível',
                available: Number.isFinite(vpd),
                badge: Number.isFinite(vpd) ? 'API' : 'sem dado',
            })}
                            </div>
                            ${hasAnyReading ? '' : '<div class="monitor-panel-note">Esta parcela ainda não tem dados disponíveis para monitorização.</div>'}
                        </div>
                    </section>
                `;
        }).join('')}
            </div>
            `}
        `;

        if (!monitorizacaoContainer.dataset.monitorBound) {
            monitorizacaoContainer.dataset.monitorBound = '1';
            monitorizacaoContainer.addEventListener('click', (e) => {
                const toggle = e.target?.closest?.('[data-monitor-toggle]');
                if (!toggle) return;
                const group = toggle.closest('[data-monitor-group]');
                if (!group) return;
                const groups = Array.from(monitorizacaoContainer.querySelectorAll('[data-monitor-group]'));
                groups.forEach((item) => {
                    if (item === group) item.classList.toggle('is-open');
                    else item.classList.remove('is-open');
                });
            });
        }
    }
};
