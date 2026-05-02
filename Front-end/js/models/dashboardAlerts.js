window.CocoRootDashAlerts = {
    alertsStorageKey: 'cocoRootDashboardAlerts',

    readAlertsStore: (alertsStorageKey) => {
        try {
            const raw = localStorage.getItem(alertsStorageKey);
            return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
    },

    writeAlertsStore: (store, alertsStorageKey) => {
        localStorage.setItem(alertsStorageKey, JSON.stringify(store || {}));
    },

    getUserLocalAlerts: (userId, alertsStorageKey, readAlertsStore, writeAlertsStore) => {
        const store = readAlertsStore(alertsStorageKey);
        const now = Date.now();
        const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
        const alerts = (Array.isArray(store?.[userId]) ? store[userId] : []).filter((alerta) => {
            const createdAt = new Date(alerta?.created_at || alerta?.data || alerta?.date || 0).getTime();
            return !Number.isFinite(createdAt) || now - createdAt <= maxAgeMs;
        });

        if ((store?.[userId] || []).length !== alerts.length) {
            const next = { ...store, [userId]: alerts };
            writeAlertsStore(next, alertsStorageKey);
        }

        return alerts;
    },

    getAlertText: (alerta) => String(alerta?.mensagem || alerta?.message || '').trim(),
    getAlertTitle: (alerta) => String(alerta?.titulo || alerta?.title || 'Alerta').trim(),

    getAlertLevel: (alerta, normalizeText) => {
        const v = normalizeText(alerta?.nivel || alerta?.level || alerta?.tipo || '');
        if (v.includes('danger') || v.includes('crit') || v.includes('erro')) return 'danger';
        if (v.includes('warn') || v.includes('aten')) return 'warning';
        return 'info';
    },

    getAlertCategory: (alerta, normalizeText, getAlertTitle, getAlertText) => {
        const raw = String(alerta?.categoria || alerta?.cat || alerta?.origem || alerta?.source || '').trim();
        if (raw) return raw;

        const where = String(alerta?.parcela_nome || alerta?.parcela || '').trim();
        if (where) return 'Parcela';

        const title = normalizeText(getAlertTitle(alerta));
        const text = normalizeText(getAlertText(alerta));
        const combined = `${title} ${text}`;
        if (combined.includes('clima') || combined.includes('temperatura') || combined.includes('chuva') || combined.includes('trovoada')) return 'Clima';
        if (combined.includes('tarefa')) return 'Tarefas';
        if (combined.includes('cultivo')) return 'Cultivo';
        return 'Sistema';
    },

    buildAlertKey: (alerta, normalizeText, getAlertTitle, getAlertText, getAlertCategory) => {
        const title = normalizeText(getAlertTitle(alerta));
        const text = normalizeText(getAlertText(alerta));
        const parcela = normalizeText(alerta?.parcela_nome || alerta?.parcela || '');
        const category = normalizeText(getAlertCategory(alerta, normalizeText, getAlertTitle, getAlertText));
        return `${title}::${text}::${parcela}::${category}`;
    },

    mergeAlerts: (groups, buildAlertKey, normalizeText, getAlertTitle, getAlertText, getAlertCategory) => {
        const seen = new Set();
        const merged = [];

        groups.flat().forEach((alerta) => {
            if (!alerta) return;
            const key = buildAlertKey(alerta, normalizeText, getAlertTitle, getAlertText, getAlertCategory);
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(alerta);
        });

        return merged.sort((a, b) => {
            const aTime = new Date(a?.created_at || a?.updated_at || a?.data || 0).getTime();
            const bTime = new Date(b?.created_at || b?.updated_at || b?.data || 0).getTime();
            const safeA = Number.isFinite(aTime) ? aTime : 0;
            const safeB = Number.isFinite(bTime) ? bTime : 0;
            return safeB - safeA;
        });
    },

    getCultivoProfile: (cultivoName, pickCultivoCategory, normalizeText) => {
        const category = pickCultivoCategory(cultivoName, normalizeText);
        if (category === 'folhosas') {
            return { category, label: 'Folhosas', minSoilHumidity: 32, highEt0: 4.2, criticalEt0: 5.2, skipRainMm: 4, hotTemp: 29 };
        }
        if (category === 'frutiferas') {
            return { category, label: 'Frutíferas', minSoilHumidity: 28, highEt0: 4.8, criticalEt0: 5.8, skipRainMm: 5, hotTemp: 31 };
        }
        if (category === 'ervas') {
            return { category, label: 'Ervas aromáticas', minSoilHumidity: 30, highEt0: 4.0, criticalEt0: 5.0, skipRainMm: 4, hotTemp: 29 };
        }
        if (category === 'raizes') {
            return { category, label: 'Raízes', minSoilHumidity: 26, highEt0: 4.6, criticalEt0: 5.6, skipRainMm: 5, hotTemp: 30 };
        }
        return { category: 'geral', label: 'Cultivo', minSoilHumidity: 29, highEt0: 4.5, criticalEt0: 5.5, skipRainMm: 5, hotTemp: 30 };
    },

    generateAlerts: ({ parcelas, tarefas, clima }, buildTaskId, normalizeText, getParcelaLabel, getCultivoLabel, pickFirstText) => {
        const alerts = [];
        const add = (nivel, categoria, titulo, mensagem, extra = {}) => {
            alerts.push({
                id: buildTaskId(),
                nivel,
                categoria,
                titulo,
                mensagem,
                ...extra,
            });
        };

        const now = new Date();

        if (!Array.isArray(parcelas) || parcelas.length === 0) {
            add('info', 'Sistema', 'Sem parcelas registadas', 'Registe um cultivo para começar a receber tarefas e alertas.');
            return alerts;
        }

        parcelas.forEach((parcela) => {
            const estado = normalizeText(parcela?.estado || parcela?.par_estado || '');
            const parcelaNome = getParcelaLabel(parcela);
            const cultivoNome = getCultivoLabel(parcela);

            if (!cultivoNome) {
                add('info', 'Cultivo', 'Cultivo não definido', 'Defina o tipo de cultivo para gerar tarefas mais específicas.', { parcela_nome: parcelaNome });
            }
            if (estado.includes('critic')) {
                add('danger', 'Parcela', 'Parcela em estado crítico', 'Verifique imediatamente rega, drenagem e sinais de pragas/doenças.', { parcela_nome: parcelaNome });
            } else if (estado.includes('aten') || estado.includes('alert')) {
                const metodo = normalizeText(pickFirstText([Array.isArray(parcela?.cultivos) ? parcela.cultivos[0] : {}, parcela], ['metodo', 'pc_metodo_cultivo']));
                if (metodo.includes('hidro')) {
                    add('warning', 'Parcela', 'Sistema em atenção', 'Reveja os níveis de água, oxigenação e faça uma inspeção rápida.', { parcela_nome: parcelaNome });
                } else {
                    add('warning', 'Parcela', 'Parcela em atenção', 'Reveja humidade do substrato e faça uma inspeção rápida.', { parcela_nome: parcelaNome });
                }
            }
        });

        const pending = (Array.isArray(tarefas) ? tarefas : []).filter((t) => {
            const done = normalizeText(t?.estado).includes('conclu');
            const due = new Date(t?.data_inicio || t?.dueDate || 0);
            return !done && Number.isFinite(due.getTime()) && due.getTime() <= now.getTime();
        });
        if (pending.length > 0) {
            add('warning', 'Tarefas', 'Tarefas em atraso', `Tem ${pending.length} tarefa(s) para fazer até hoje.`, {});
        }

        if (clima) {
            const round = (value) => {
                const n = Number(value);
                return Number.isFinite(n) ? Math.round(n) : null;
            };
            const fixed = (value, decimals = 1) => {
                const n = Number(value);
                return Number.isFinite(n) ? n.toFixed(decimals) : null;
            };

            const tempNow = round(clima.temperatura);
            const feelsLike = round(clima.sensacao_termica);
            const tempMax = round(clima.temp_max);
            const tempMin = round(clima.temp_min);
            const hum = round(clima.humidade);
            const desc = normalizeText(clima.descricao || '');
            const agro = clima?.agro || {};
            const et0 = Number(agro?.evapotranspiracao_ref);
            const vpd = Number(agro?.deficit_pressao_vapor);
            const soilTemp = Number(agro?.solo_temperatura_0cm);
            const soilHum = Number(agro?.solo_humidade_superficie);

            if (Number.isFinite(tempMax) && tempMax > 30) {
                add('warning', 'Clima', 'Temperatura elevada prevista', `Estão previstos ${tempMax}°C. Aumente a rega e verifique ensombramento.`, {});
            } else if (Number.isFinite(tempNow) && tempNow > 32) {
                add('warning', 'Clima', 'Muito calor agora', `Estão ${tempNow}°C (Sensação: ${feelsLike}°C). Risco de stress térmico.`, {});
            }

            if (Number.isFinite(tempMin) && tempMin < 5) {
                add('warning', 'Clima', 'Temperatura baixa prevista', `Estão previstos ${tempMin}°C. Pode requerer proteção em plantas sensíveis.`, {});
            }

            if (Number.isFinite(hum) && hum < 30) {
                add('warning', 'Clima', 'Humidade do ar muito baixa', `Humidade a ${hum}%. Maior perda de água pelas folhas.`, {});
            } else if (Number.isFinite(hum) && hum > 85 && Number.isFinite(tempNow) && tempNow > 18) {
                add('warning', 'Clima', 'Condições para fungos', `Humidade alta (${hum}%) com tempo ameno. Inspecione fungos.`, {});
            }

            if (desc.includes('chuva') || desc.includes('aguaceiro') || desc.includes('trov')) {
                add('info', 'Clima', 'Possível precipitação', 'Verifique a drenagem e se precisa alterar rega agendada.', {});
            } else if (desc.includes('neve') || desc.includes('gelo')) {
                add('warning', 'Clima', 'Neve ou gelo previstos', 'Proteja as culturas mais expostas.', {});
            }

            if (Number.isFinite(et0) && et0 > 5.5) {
                add('warning', 'Água', 'Maior necessidade de água hoje', `Evapotranspiração em ${fixed(et0, 1)} mm. As plantas perdem mais água hoje.`, {});
            }

            if (Number.isFinite(vpd) && vpd > 1.8) {
                add('warning', 'Clima', 'Stress atmosférico (VPD)', `VPD em ${fixed(vpd, 1)} kPa. Plantas sob tensão evaporativa elevada.`, {});
            }

            if (Number.isFinite(soilTemp)) {
                if (soilTemp > 28) add('warning', 'Solo', 'Solo demasiado quente', `A superfície está a ${fixed(soilTemp, 1)}°C. Considere usar mulch/cobertura vegetal.`, {});
                else if (soilTemp < 8) add('warning', 'Solo', 'Solo muito frio', `Raízes mogą abrandar crescimento (${fixed(soilTemp, 1)}°C).`, {});
            }
        }

        return alerts;
    }
};
