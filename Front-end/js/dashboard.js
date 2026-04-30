document.addEventListener('DOMContentLoaded', async () => {
    const api = window.CocoRootApi;
    if (!api) return;

    const user = api.requireLoggedUser();
    if (!user) return;

    const greetingName = document.getElementById('dashboard-user-name');
    const greetingText = document.getElementById('dashboard-greeting-text');
    const parcelasCount = document.getElementById('dashboard-parcelas-count');
    const tarefasCount = document.getElementById('dashboard-tarefas-count');
    const alertasCount = document.getElementById('dashboard-alertas-count');
    const alertasLabel = document.getElementById('dashboard-alertas-label');
    const parcelasContainer = document.getElementById('dashboard-parcelas-list');
    const tarefasContainer = document.getElementById('dashboard-tarefas-list');
    const monitorizacaoContainer = document.getElementById('dashboard-monitorizacao');
    const climaContainer = document.getElementById('dashboard-clima');
    const errorBox = document.getElementById('dashboard-error');

    if (greetingName) greetingName.textContent = user.nome || 'utilizador';
    if (greetingText) greetingText.textContent = 'Bem-vindo ao dashboard da sua exploração agrícola, onde encontra tudo num só sítio!';

    const setError = (message) => {
        if (!errorBox) return;
        errorBox.hidden = !message;
        errorBox.textContent = message || '';
    };

    const renderEmpty = (container, message) => {
        if (!container) return;
        container.innerHTML = `<div class="card"><div style="color:var(--muted);line-height:1.6;">${message}</div></div>`;
    };

    const renderParcelas = (parcelas) => {
        if (!parcelasContainer) return;
        const list = Array.isArray(parcelas) ? parcelas : [];
        if (list.length === 0) {
            parcelasContainer.innerHTML = `
                <div class="dash-empty-card">
                    <div style="color:var(--muted);line-height:1.6;">Ainda não existem parcelas registadas.</div>
                </div>
                <a href="registrar-cultivo.html" class="dash-add-card">
                    <span class="dash-add-icon" aria-hidden="true">+</span>
                    <span>Adicionar cultivo</span>
                </a>
            `;
            return;
        }

        const cards = list.map((parcela) => {
            const cultivos = Array.isArray(parcela.cultivos) ? parcela.cultivos : [];
            const cultivo = cultivos[0];
            const ph = Number(cultivo?.ph ?? parcela?.ph);
            const ec = Number(cultivo?.ec ?? parcela?.ec);
            const humidade = Number(cultivo?.humidade ?? parcela?.humidade);
            const area = Number(parcela?.area_m2 || 0);
            const estado = String(parcela?.estado || parcela?.par_estado || 'Ativo');
            const phText = Number.isFinite(ph) ? ph.toFixed(1) : '6.5';
            const ecText = Number.isFinite(ec) ? `${ec.toFixed(1)}mS/cm` : '1.8mS/cm';
            const humidadeText = Number.isFinite(humidade) ? `${Math.round(humidade)}%` : '55%';
            const areaText = area > 0 ? `${area.toFixed(0)}m²` : 'Sem área';

            return `
                <article class="dash-cultivo-card">
                    <div class="dash-cultivo-top">
                        <div class="dash-cultivo-icon"><i class="bi bi-flower1" aria-hidden="true"></i></div>
                        <span class="dash-cultivo-badge">${estado}</span>
                    </div>
                    <div class="dash-cultivo-name">${cultivo?.nome || parcela.nome || 'Cultivo'}</div>
                    <div class="dash-cultivo-meta">${parcela.nome || 'Parcela'} · ${areaText}</div>
                    <div class="dash-cultivo-metrics">
                        <div class="dash-cultivo-metric">
                            <span>pH</span>
                            <strong>${phText}</strong>
                        </div>
                        <div class="dash-cultivo-metric">
                            <span>EC</span>
                            <strong>${ecText}</strong>
                        </div>
                        <div class="dash-cultivo-metric">
                            <span>Humidade</span>
                            <strong>${humidadeText}</strong>
                        </div>
                    </div>
                    <button type="button" class="dash-cultivo-link">Ver Detalhes</button>
                </article>
            `;
        }).join('');

        parcelasContainer.innerHTML = `${cards}
            <a href="registrar-cultivo.html" class="dash-add-card">
                <span class="dash-add-icon" aria-hidden="true">+</span>
                <span>Adicionar cultivo</span>
            </a>
        `;
    };

    const fetchOptional = async (path) => {
        try {
            return await api.fetchJson(path);
        } catch {
            return null;
        }
    };

    const weatherCodeToText = (code) => {
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
    };

    const fetchWeatherFromOpenMeteo = async (city) => {
        const name = String(city || '').trim() || 'Lisboa';
        const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
        geoUrl.searchParams.set('name', name);
        geoUrl.searchParams.set('count', '1');
        geoUrl.searchParams.set('language', 'pt');
        geoUrl.searchParams.set('format', 'json');

        const geoRes = await fetch(geoUrl.toString());
        const geoData = await geoRes.json().catch(() => null);
        const place = geoData?.results?.[0];
        const latitude = Number(place?.latitude);
        const longitude = Number(place?.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

        const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
        forecastUrl.searchParams.set('latitude', String(latitude));
        forecastUrl.searchParams.set('longitude', String(longitude));
        forecastUrl.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code');
        forecastUrl.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min');
        forecastUrl.searchParams.set('timezone', 'auto');

        const forecastRes = await fetch(forecastUrl.toString());
        const forecastData = await forecastRes.json().catch(() => null);
        const current = forecastData?.current || null;
        const daily = forecastData?.daily || null;
        if (!current) return null;

        const cityLabel = place?.name || name;
        const tempMax = Array.isArray(daily?.temperature_2m_max) ? daily.temperature_2m_max[0] : null;
        const tempMin = Array.isArray(daily?.temperature_2m_min) ? daily.temperature_2m_min[0] : null;

        return {
            cidade: cityLabel,
            temperatura: current.temperature_2m,
            sensacao_termica: current.apparent_temperature,
            humidade: current.relative_humidity_2m,
            temp_max: tempMax,
            temp_min: tempMin,
            descricao: weatherCodeToText(current.weather_code),
            atualizado_em: current.time || null,
            fonte: 'open-meteo',
        };
    };

    const fetchWeather = async (city) => {
        const cityName = String(city || '').trim() || 'Lisboa';
        try {
            return await fetchWeatherFromOpenMeteo(cityName);
        } catch {
            try {
                const response = await api.fetchJson(`clima?cidade=${encodeURIComponent(cityName)}`);
                const clima = response?.data || null;
                if (clima) return clima;
            } catch { }
            return null;
        }
    };

    const formatArea = (value) => {
        const amount = Number(value || 0);
        return `${amount.toFixed(2)} m²`;
    };

    const formatDate = (value) => {
        if (!value) return 'Sem data';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Sem data';
        return new Intl.DateTimeFormat('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    };

    const formatShortDateTime = (value) => {
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
    };

    const tasksStorageKey = 'cocoRootTasks';
    const alertsStorageKey = 'cocoRootDashboardAlerts';

    const readTasksStore = () => {
        try {
            const raw = localStorage.getItem(tasksStorageKey);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    };

    const writeTasksStore = (store) => {
        localStorage.setItem(tasksStorageKey, JSON.stringify(store || {}));
    };

    const readAlertsStore = () => {
        try {
            const raw = localStorage.getItem(alertsStorageKey);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    };

    const writeAlertsStore = (store) => {
        localStorage.setItem(alertsStorageKey, JSON.stringify(store || {}));
    };

    const normalizeText = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const getParcelaId = (parcela) => {
        const id = parcela?.id ?? parcela?.par_id ?? parcela?.parcela_id ?? parcela?.parcelaId ?? parcela?.nome;
        return String(id || '');
    };

    const getParcelaLabel = (parcela) => String(parcela?.nome || parcela?.par_nome || 'Parcela');

    const getCultivoLabel = (parcela) => {
        const cultivos = Array.isArray(parcela?.cultivos) ? parcela.cultivos : [];
        const first = cultivos[0];
        return String(first?.nome || parcela?.tipo || parcela?.cultivo || '');
    };

    const pickCultivoCategory = (cultivoName) => {
        const t = normalizeText(cultivoName);
        if (!t) return 'geral';
        const has = (...words) => words.some((w) => t.includes(normalizeText(w)));
        if (has('alface', 'couve', 'espinafre', 'rúcula', 'rucula', 'repolho')) return 'folhosas';
        if (has('tomate', 'pimento', 'pepino', 'abobrinha', 'courgette', 'beringela', 'melancia', 'melao', 'melão', 'morango')) return 'frutiferas';
        if (has('manjericão', 'manjericao', 'hortelã', 'hortela', 'salsa', 'coentros', 'alecrim', 'orégãos', 'oregãos', 'oregano', 'cebolinho')) return 'ervas';
        if (has('batata', 'cenoura', 'beterraba', 'nabo', 'rabanete')) return 'raizes';
        return 'geral';
    };

    const addDays = (date, days) => {
        const d = new Date(date);
        d.setDate(d.getDate() + Number(days || 0));
        return d;
    };

    const startOfDay = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const endOfDay = (date) => {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    };

    const buildTaskId = () => {
        try {
            if (window.crypto?.randomUUID) return window.crypto.randomUUID();
        } catch { }
        return `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    };

    const generateTasksForParcela = (parcela, cultivoName) => {
        const parcelaId = getParcelaId(parcela);
        const parcelaNome = getParcelaLabel(parcela);
        const cultivo = String(cultivoName || '').trim();
        const category = pickCultivoCategory(cultivo);
        const baseTitle = cultivo ? ` (${cultivo})` : '';
        const today = startOfDay(new Date());

        const make = (titulo, dueDate, kind) => ({
            id: buildTaskId(),
            titulo,
            parcela_id: parcelaId,
            parcela_nome: parcelaNome,
            cultivo_nome: cultivo,
            categoria: category,
            tipo: kind || 'geral',
            estado: 'Pendente',
            data_inicio: new Date(dueDate).toISOString(),
            created_at: new Date().toISOString(),
        });

        const tasks = [
            make(`Verificar humidade e ajustar rega${baseTitle}`, today, 'rega'),
            make(`Inspecionar pragas/doenças${baseTitle}`, addDays(today, 3), 'saude'),
        ];

        if (category === 'folhosas') {
            tasks.push(make(`Verificar crescimento e desbaste${baseTitle}`, addDays(today, 2), 'maneio'));
            tasks.push(make(`Adubação leve (se necessário)${baseTitle}`, addDays(today, 7), 'nutricao'));
        } else if (category === 'frutiferas') {
            tasks.push(make(`Verificar floração/frutificação${baseTitle}`, addDays(today, 2), 'maneio'));
            tasks.push(make(`Apoiar/tutorar plantas (se aplicável)${baseTitle}`, addDays(today, 5), 'maneio'));
            tasks.push(make(`Adubação (se necessário)${baseTitle}`, addDays(today, 10), 'nutricao'));
        } else if (category === 'ervas') {
            tasks.push(make(`Colheita seletiva e limpeza${baseTitle}`, addDays(today, 4), 'maneio'));
            tasks.push(make(`Podar para estimular rebrote${baseTitle}`, addDays(today, 8), 'maneio'));
        } else if (category === 'raizes') {
            tasks.push(make(`Verificar solo e compactação${baseTitle}`, addDays(today, 2), 'maneio'));
            tasks.push(make(`Rega profunda (se necessário)${baseTitle}`, addDays(today, 4), 'rega'));
            tasks.push(make(`Adubação de manutenção${baseTitle}`, addDays(today, 9), 'nutricao'));
        } else {
            tasks.push(make(`Registar observações no painel${baseTitle}`, addDays(today, 1), 'registo'));
            tasks.push(make(`Adubação (se necessário)${baseTitle}`, addDays(today, 8), 'nutricao'));
        }

        return tasks;
    };

    const mergeGeneratedTasks = (existingTasks, parcelas) => {
        const list = Array.isArray(existingTasks) ? existingTasks.slice() : [];
        const byKey = new Set(
            list.map((t) => `${t.parcela_id || ''}::${normalizeText(t.titulo)}::${String(t.data_inicio || '').slice(0, 10)}`),
        );

        parcelas.forEach((parcela) => {
            const cultivo = getCultivoLabel(parcela);
            const generated = generateTasksForParcela(parcela, cultivo);
            generated.forEach((t) => {
                const key = `${t.parcela_id || ''}::${normalizeText(t.titulo)}::${String(t.data_inicio || '').slice(0, 10)}`;
                if (byKey.has(key)) return;
                byKey.add(key);
                list.push(t);
            });
        });

        return list;
    };

    const getUserTasks = (userId) => {
        const store = readTasksStore();
        const tasks = Array.isArray(store?.[userId]) ? store[userId] : [];
        return { store, tasks };
    };

    const setUserTasks = (store, userId, tasks) => {
        const next = { ...(store || {}) };
        next[userId] = Array.isArray(tasks) ? tasks : [];
        writeTasksStore(next);
    };

    const getUserLocalAlerts = (userId) => {
        const store = readAlertsStore();
        const now = Date.now();
        const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
        const alerts = (Array.isArray(store?.[userId]) ? store[userId] : []).filter((alerta) => {
            const createdAt = new Date(alerta?.created_at || alerta?.data || alerta?.date || 0).getTime();
            return !Number.isFinite(createdAt) || now - createdAt <= maxAgeMs;
        });

        if ((store?.[userId] || []).length !== alerts.length) {
            const next = { ...store, [userId]: alerts };
            writeAlertsStore(next);
        }

        return alerts;
    };

    const renderTasks = (tasks, options = {}) => {
        if (!tarefasContainer) return;
        const all = Array.isArray(tasks) ? tasks : [];
        const showOnlyToday = options.onlyToday !== false;
        const now = new Date();
        const cutoff = endOfDay(now);

        const isDone = (task) => String(task?.estado || '').toLowerCase().includes('conclu');
        const due = (task) => new Date(task?.data_inicio || task?.dueDate || 0);

        const visible = showOnlyToday
            ? all.filter((t) => !isDone(t) && due(t).getTime() <= cutoff.getTime())
            : all.filter((t) => !isDone(t));

        visible.sort((a, b) => due(a).getTime() - due(b).getTime());

        if (visible.length === 0) {
            renderEmpty(tarefasContainer, 'Sem tarefas para hoje. Registe um cultivo para gerar tarefas automaticamente.');
            return;
        }

        tarefasContainer.innerHTML = visible.map((tarefa) => {
            const dueText = formatShortDateTime(tarefa.data_inicio);
            const tipo = String(tarefa?.tipo || tarefa?.categoria || 'Tarefa').trim();
            const label = tipo ? `${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}` : 'Tarefa';
            return `
                <button type="button" class="dash-task-row" data-task-id="${String(tarefa.id || '')}">
                    <div class="dash-task-main">
                        <div class="dash-task-title-row">
                            <div class="dash-task-title">${tarefa.titulo || 'Tarefa'}</div>
                            <span class="dash-task-tag">${label}</span>
                        </div>
                        <div class="dash-task-sub">${tarefa.parcela_nome || 'Sem parcela'} · ${dueText}</div>
                    </div>
                    <span class="dash-task-check" aria-hidden="true"><i class="bi bi-check-lg"></i></span>
                </button>
            `;
        }).join('');
    };

    const getAlertText = (alerta) => String(alerta?.mensagem || alerta?.message || '').trim();
    const getAlertTitle = (alerta) => String(alerta?.titulo || alerta?.title || 'Alerta').trim();
    const getAlertLevel = (alerta) => {
        const v = normalizeText(alerta?.nivel || alerta?.level || alerta?.tipo || '');
        if (v.includes('danger') || v.includes('crit') || v.includes('erro')) return 'danger';
        if (v.includes('warn') || v.includes('aten')) return 'warning';
        return 'info';
    };

    const getAlertCategory = (alerta) => {
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
    };

    const renderAlertsCard = (alertas) => {
        const list = Array.isArray(alertas) ? alertas : [];
        const dots = { info: '#2f6f3f', warning: '#b7791f', danger: '#b42318' };
        const badges = { info: 'rgba(47,111,63,0.12)', warning: 'rgba(183,121,31,0.14)', danger: 'rgba(180,35,24,0.12)' };
        const borders = { info: 'rgba(47,111,63,0.28)', warning: 'rgba(183,121,31,0.34)', danger: 'rgba(180,35,24,0.30)' };
        const levelText = { info: 'Info', warning: 'Atenção', danger: 'Crítico' };
        if (list.length === 0) {
            return `
                <div class="dash-card">
                    <div class="dash-card-title">Alertas</div>
                    <div style="color:var(--muted);line-height:1.6;">Sem alertas no momento.</div>
                </div>
            `;
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
        return `
            <div class="dash-card">
                <div class="dash-card-title">Alertas</div>
                <div style="display:flex;flex-direction:column;gap:12px;">${items}${more}</div>
            </div>
        `;
    };

    const buildAlertKey = (alerta) => {
        const title = normalizeText(getAlertTitle(alerta));
        const text = normalizeText(getAlertText(alerta));
        const parcela = normalizeText(alerta?.parcela_nome || alerta?.parcela || '');
        const category = normalizeText(getAlertCategory(alerta));
        return `${title}::${text}::${parcela}::${category}`;
    };

    const mergeAlerts = (...groups) => {
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
            const safeA = Number.isFinite(aTime) ? aTime : 0;
            const safeB = Number.isFinite(bTime) ? bTime : 0;
            return safeB - safeA;
        });
    };

    const generateAlerts = ({ parcelas, tarefas, clima }) => {
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
                add('warning', 'Parcela', 'Parcela em atenção', 'Reveja humidade do substrato e faça uma inspeção rápida.', { parcela_nome: parcelaNome });
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

            const tempNow = round(clima.temperatura);
            const feelsLike = round(clima.sensacao_termica);
            const tempMax = round(clima.temp_max);
            const tempMin = round(clima.temp_min);
            const hum = round(clima.humidade);
            const desc = normalizeText(clima.descricao || '');

            const tempLabel = (n) => (n === null ? '—' : `${n}°C`);
            const nowText = `Agora: ${tempLabel(tempNow)}${feelsLike !== null ? ` (sensação ${tempLabel(feelsLike)})` : ''}`;
            const rangeText = (tempMin !== null || tempMax !== null)
                ? ` · Mín ${tempLabel(tempMin)} · Máx ${tempLabel(tempMax)}`
                : '';

            const hotSignal = [tempNow, feelsLike, tempMax].filter((n) => n !== null);
            const coldSignal = [tempNow, feelsLike, tempMin].filter((n) => n !== null);
            const maxHot = hotSignal.length ? Math.max(...hotSignal) : null;
            const minCold = coldSignal.length ? Math.min(...coldSignal) : null;

            if (maxHot !== null && maxHot >= 35) {
                add('danger', 'Clima', 'Calor extremo', `${nowText}${rangeText}. Reforce rega/monitorização e evite stress hídrico.`);
            } else if (maxHot !== null && maxHot >= 32) {
                add('warning', 'Clima', 'Calor elevado', `${nowText}${rangeText}. Aumente a frequência de verificação de humidade e ajuste a rega.`);
            }

            if (minCold !== null && minCold <= 2) {
                add('danger', 'Clima', 'Frio extremo', `${nowText}${rangeText}. Proteja as plantas e evite regas tardias que aumentem o risco de frio.`);
            } else if (minCold !== null && minCold <= 6) {
                add('warning', 'Clima', 'Temperatura baixa', `${nowText}${rangeText}. Atenção a stress térmico; ajuste rega e proteção se necessário.`);
            }

            if (tempMax !== null && tempMin !== null && tempMax - tempMin >= 15) {
                add('info', 'Clima', 'Amplitude térmica alta', `Variação prevista: ${tempLabel(tempMin)} → ${tempLabel(tempMax)}. Monitore humidade e sinais de stress.`);
            }

            if (hum !== null && hum <= 30 && maxHot !== null && maxHot >= 30) {
                add('warning', 'Clima', 'Ar seco + calor', `Humidade ${hum}% com calor. O substrato pode secar mais rápido; verifique humidade com maior frequência.`);
            } else if (hum !== null && hum <= 30) {
                add('info', 'Clima', 'Humidade relativa baixa', `Humidade ${hum}%. Monitore a secagem do substrato ao longo do dia.`);
            }

            if (desc.includes('trovoada') || desc.includes('chuva') || desc.includes('aguace')) {
                add('info', 'Clima', 'Condições de chuva', 'Evite rega excessiva e confirme drenagem.');
            }
        }

        return alerts;
    };

    try {
        const [parcelasResponse, tarefasResponse, alertasResponse, clima] = await Promise.all([
            api.fetchJson(`parcelas/listar/${user.id}`),
            fetchOptional(`tarefas/listar/${user.id}`),
            fetchOptional(`alertas/listar/${user.id}`),
            fetchWeather('Lisboa'),
        ]);

        const parcelas = Array.isArray(parcelasResponse?.data) ? parcelasResponse.data : [];
        const serverTarefas = Array.isArray(tarefasResponse?.data) ? tarefasResponse.data : [];
        const serverAlertas = Array.isArray(alertasResponse?.data) ? alertasResponse.data : [];
        const userId = String(user.id ?? 'anon');
        const localAlertas = getUserLocalAlerts(userId);

        if (parcelasCount) parcelasCount.textContent = String(parcelas.length);
        if (alertasCount) alertasCount.textContent = String(serverAlertas.length + localAlertas.length);
        if (alertasLabel) alertasLabel.textContent = '';

        if (parcelas.length === 0) {
            renderParcelas(parcelas);
        } else if (parcelasContainer) {
            renderParcelas(parcelas);
        }

        const hasServerTasks = serverTarefas.length > 0;
        let tarefas = hasServerTasks ? serverTarefas : [];

        if (!hasServerTasks) {
            const { store, tasks } = getUserTasks(userId);
            const merged = mergeGeneratedTasks(tasks, parcelas);
            tarefas = merged;
            setUserTasks(store, userId, merged);

            if (tarefasContainer) {
                if (!tarefasContainer.dataset.tasksBound) {
                    tarefasContainer.dataset.tasksBound = '1';
                    tarefasContainer.addEventListener('click', (e) => {
                        const btn = e.target?.closest?.('[data-task-id]');
                        const taskId = btn?.getAttribute?.('data-task-id');
                        if (!taskId) return;
                        const { store: currentStore, tasks: currentTasks } = getUserTasks(userId);
                        const nextTasks = currentTasks.map((t) => {
                            if (String(t.id) !== String(taskId)) return t;
                            return { ...t, estado: 'Concluída', concluida_em: new Date().toISOString() };
                        });
                        setUserTasks(currentStore, userId, nextTasks);
                        renderTasks(nextTasks, { onlyToday: true });
                        if (tarefasCount) {
                            const pending = nextTasks.filter((t) => !String(t?.estado || '').toLowerCase().includes('conclu')).length;
                            tarefasCount.textContent = String(pending);
                        }
                    });
                }
            }
        }

        if (tarefasCount) {
            const pending = tarefas.filter((t) => !String(t?.estado || '').toLowerCase().includes('conclu')).length;
            tarefasCount.textContent = String(pending);
        }

        if (hasServerTasks) {
            if (tarefasContainer) {
                tarefasContainer.innerHTML = tarefas.map((tarefa) => `
                    <div class="dash-task-row dash-task-row-static">
                        <div class="dash-task-main">
                            <div class="dash-task-title-row">
                                <div class="dash-task-title">${tarefa.titulo || 'Tarefa'}</div>
                                <span class="dash-task-tag">${String(tarefa.tipo || tarefa.categoria || 'Tarefa')}</span>
                            </div>
                            <div class="dash-task-sub">${tarefa.parcela_nome || 'Sem parcela'} · ${formatDate(tarefa.data_inicio)}</div>
                        </div>
                        <span class="dash-task-check ${String(tarefa.estado || '').toLowerCase().includes('conclu') ? 'is-done' : ''}" aria-hidden="true"><i class="bi bi-check-lg"></i></span>
                    </div>
                `).join('');
            }
        } else {
            renderTasks(tarefas, { onlyToday: true });
        }

        const generatedAlertas = generateAlerts({ parcelas, tarefas, clima });
        const alertas = mergeAlerts(serverAlertas, localAlertas, generatedAlertas);

        if (alertasCount) alertasCount.textContent = String(Array.isArray(alertas) ? alertas.length : 0);
        if (alertasLabel) {
            alertasLabel.textContent = '';
        }

        if (monitorizacaoContainer) {
            const totalArea = parcelas.reduce((sum, parcela) => sum + Number(parcela.area_m2 || 0), 0);
            const healthyCount = parcelas.filter((parcela) => String(parcela.estado || '').toLowerCase().includes('saud')).length;
            const attentionCount = parcelas.filter((parcela) => {
                const state = String(parcela.estado || '').toLowerCase();
                return state.includes('aten') || state.includes('critic');
            }).length;
            const cultivosCount = parcelas.reduce((sum, parcela) => sum + (Array.isArray(parcela.cultivos) ? parcela.cultivos.length : 0), 0);

            monitorizacaoContainer.innerHTML = `
                <div class="dash-card">
                    <div class="dash-card-title">Área total registada</div>
                    <div style="font-size:28px;font-weight:900;line-height:1;">${formatArea(totalArea)}</div>
                    <div style="color:var(--muted);margin-top:6px;">Somatório das parcelas registadas.</div>
                </div>
                <div class="dash-card">
                    <div class="dash-card-title">Estado das parcelas</div>
                    <div style="color:var(--muted);line-height:1.8;">
                        Saudáveis: ${healthyCount}<br>
                        Em atenção: ${attentionCount}<br>
                        Cultivos associados: ${cultivosCount}
                    </div>
                </div>
                ${renderAlertsCard(alertas)}
            `;
        }

        if (climaContainer) {
            if (!clima) {
                renderEmpty(climaContainer, 'A integração de clima ainda não está disponível no servidor atual.');
            } else {
                const fonte = String(clima.fonte || '').toLowerCase().includes('open')
                    ? 'Open‑Meteo'
                    : 'CocoRoot API';
                const updatedAt = clima.atualizado_em || clima.updated_at || clima.time || null;
                const updatedText = updatedAt ? formatShortDateTime(updatedAt) : '';
                const temp = Number(clima.temperatura);
                const tempDisplay = Number.isFinite(temp) ? `${Math.round(temp)}°C` : '—';
                climaContainer.innerHTML = `
                    <div class="dash-card" style="background:linear-gradient(180deg, rgba(47,143,61,0.92), rgba(42,126,54,0.92)); color: rgba(255,255,255,0.98); border-color: rgba(47,143,61,0.32);">
                        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap;">
                            <div>
                                <div style="font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase;opacity:0.92;">${clima.cidade || 'Lisboa'}</div>
                                <div style="font-size:40px;font-weight:900;line-height:1;margin-top:8px;">${tempDisplay}</div>
                                <div style="opacity:0.92;margin-top:8px;line-height:1.6;">${clima.descricao || 'Sem descrição'} · Humidade ${clima.humidade ?? '—'}%</div>
                                <div style="opacity:0.86;margin-top:6px;font-size:12px;">Fonte: ${fonte}${updatedText ? ` · Atualizado: ${updatedText}` : ''}</div>
                            </div>
                            <div style="opacity:0.92;line-height:1.8;">
                                Sensação: ${clima.sensacao_termica ?? '—'}°C<br>
                                Mín: ${clima.temp_min ?? '—'}°C<br>
                                Máx: ${clima.temp_max ?? '—'}°C
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        setError('');
    } catch (error) {
        if (parcelasCount) parcelasCount.textContent = '0';
        if (tarefasCount) tarefasCount.textContent = '0';
        if (alertasCount) alertasCount.textContent = '0';
        renderEmpty(parcelasContainer, 'Não foi possível carregar as parcelas da base de dados.');
        renderEmpty(tarefasContainer, 'As tarefas não puderam ser carregadas.');
        renderEmpty(monitorizacaoContainer, 'O monitoramento não está disponível.');
        renderEmpty(climaContainer, 'O clima não está disponível.');
        setError(error.message || 'Erro ao carregar o dashboard.');
    }
});
