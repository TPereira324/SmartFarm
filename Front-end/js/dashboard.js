document.addEventListener('DOMContentLoaded', async () => {
    const api = window.CocoRootApi;
    if (!api) return;

    const user = api.requireLoggedUser();
    if (!user) return;

    const greetingName = document.getElementById('dashboard-user-name');
    const greetingText = document.getElementById('dashboard-greeting-text');
    const parcelasCount = document.getElementById('dashboard-parcelas-count');
    const tarefasCount = document.getElementById('dashboard-tarefas-count');
    const tarefasLabel = document.getElementById('dashboard-tarefas-label');
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
            const normalizeText = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const cultivoNome = String(
                cultivo?.nome ?? parcela?.tipo ?? parcela?.cultivo ?? parcela?.cultivo_nome ?? parcela?.nome ?? '',
            ).trim();
            const cultivoNorm = normalizeText(cultivoNome);
            const has = (...words) => words.some((w) => cultivoNorm.includes(normalizeText(w)));
            const iconClass = has('alface', 'couve', 'espinafre', 'rúcula', 'rucula', 'repolho')
                ? 'dash-cultivo-icon--folhosas'
                : has('tomate', 'pimento', 'pepino', 'abobrinha', 'courgette', 'beringela', 'melancia', 'melao', 'melão', 'morango')
                    ? 'dash-cultivo-icon--frutiferas'
                    : has('manjericão', 'manjericao', 'hortelã', 'hortela', 'salsa', 'coentros', 'alecrim', 'orégãos', 'oregãos', 'oregano', 'cebolinho')
                        ? 'dash-cultivo-icon--ervas'
                        : has('batata', 'cenoura', 'beterraba', 'nabo', 'rabanete')
                            ? 'dash-cultivo-icon--raizes'
                            : 'dash-cultivo-icon--geral';

            const cultivoIcon = (() => {
                if (!cultivoNome) return 'C';
                if (has('morango')) return '🍓';
                if (has('tomate')) return '🍅';
                if (has('pimento')) return '🫑';
                if (has('pepino')) return '🥒';
                if (has('alface', 'couve', 'espinafre', 'rúcula', 'rucula', 'repolho')) return '🥬';
                if (has('manjericão', 'manjericao', 'hortelã', 'hortela', 'salsa', 'coentros', 'alecrim', 'orégãos', 'oregãos', 'oregano', 'cebolinho')) return '🌿';
                if (has('batata')) return '🥔';
                if (has('cenoura', 'beterraba', 'nabo', 'rabanete')) return '🥕';
                if (iconClass === 'dash-cultivo-icon--frutiferas') return '🍅';
                if (iconClass === 'dash-cultivo-icon--folhosas') return '🥬';
                if (iconClass === 'dash-cultivo-icon--ervas') return '🌿';
                if (iconClass === 'dash-cultivo-icon--raizes') return '🥕';
                return cultivoNome.slice(0, 1).toUpperCase();
            })();
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
                        <div class="dash-cultivo-icon ${iconClass}" aria-hidden="true">${cultivoIcon}</div>
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

    const weatherCodeToIcon = (code) => {
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
        forecastUrl.searchParams.set('hourly', 'soil_temperature_0cm,soil_moisture_0_1cm,vapour_pressure_deficit');
        forecastUrl.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,precipitation_sum,et0_fao_evapotranspiration,uv_index_max');
        forecastUrl.searchParams.set('timezone', 'auto');

        const forecastRes = await fetch(forecastUrl.toString());
        const forecastData = await forecastRes.json().catch(() => null);
        const current = forecastData?.current || null;
        const hourly = forecastData?.hourly || null;
        const daily = forecastData?.daily || null;
        if (!current) return null;

        const hourlyTimes = Array.isArray(hourly?.time) ? hourly.time : [];
        const currentIndex = Math.max(0, hourlyTimes.indexOf(current.time));
        const getHourlyValue = (key) => {
            const values = Array.isArray(hourly?.[key]) ? hourly[key] : [];
            return values[currentIndex] ?? values[0] ?? null;
        };

        const cityLabel = place?.name || name;
        const tempMax = Array.isArray(daily?.temperature_2m_max) ? daily.temperature_2m_max[0] : null;
        const tempMin = Array.isArray(daily?.temperature_2m_min) ? daily.temperature_2m_min[0] : null;
        const forecastDays = Array.isArray(daily?.time) ? daily.time.map((day, index) => ({
            data: day,
            weather_code: Array.isArray(daily?.weather_code) ? daily.weather_code[index] : null,
            temp_max: Array.isArray(daily?.temperature_2m_max) ? daily.temperature_2m_max[index] : null,
            temp_min: Array.isArray(daily?.temperature_2m_min) ? daily.temperature_2m_min[index] : null,
            chuva_probabilidade: Array.isArray(daily?.precipitation_probability_max) ? daily.precipitation_probability_max[index] : null,
            precipitacao_sum: Array.isArray(daily?.precipitation_sum) ? daily.precipitation_sum[index] : null,
            vento_max: Array.isArray(daily?.wind_speed_10m_max) ? daily.wind_speed_10m_max[index] : null,
            et0: Array.isArray(daily?.et0_fao_evapotranspiration) ? daily.et0_fao_evapotranspiration[index] : null,
        })) : [];

        return {
            cidade: cityLabel,
            temperatura: current.temperature_2m,
            sensacao_termica: current.apparent_temperature,
            humidade: current.relative_humidity_2m,
            temp_max: tempMax,
            temp_min: tempMin,
            descricao: weatherCodeToText(current.weather_code),
            weather_code: current.weather_code,
            previsao: forecastDays,
            atualizado_em: current.time || null,
            agro: {
                solo_temperatura_0cm: getHourlyValue('soil_temperature_0cm'),
                solo_humidade_superficie: (() => {
                    const v = Number(getHourlyValue('soil_moisture_0_1cm'));
                    return Number.isFinite(v) ? v * 100 : null;
                })(),
                deficit_pressao_vapor: getHourlyValue('vapour_pressure_deficit'),
                evapotranspiracao_ref: Array.isArray(daily?.et0_fao_evapotranspiration) ? daily.et0_fao_evapotranspiration[0] : null,
                precipitacao_hoje: Array.isArray(daily?.precipitation_sum) ? daily.precipitation_sum[0] : null,
                uv_max: Array.isArray(daily?.uv_index_max) ? daily.uv_index_max[0] : null,
                fonte: 'open-meteo-modelado',
            },
            fonte: 'open-meteo',
        };
    };

    const fetchWeather = async (city) => {
        const cityName = String(city || '').trim() || 'Lisboa';
        try {
            const climate = await fetchWeatherFromOpenMeteo(cityName);
            if (climate) return climate;
        } catch {
        }
        try {
            const response = await api.fetchJson(`clima?cidade=${encodeURIComponent(cityName)}`);
            const clima = response?.data || null;
            if (clima) return clima;
        } catch { }
        return null;
    };

    const getLocationCandidates = (...sources) => {
        const priorityGroups = [
            ['localizacao', 'par_localizacao', 'cidade', 'city', 'localidade', 'municipio', 'distrito', 'provincia'],
            ['morada', 'endereco'],
            ['nome_fazenda'],
        ];
        const candidates = [];

        priorityGroups.forEach((fields) => {
            sources.forEach((source) => {
                fields.forEach((field) => {
                    const value = String(source?.[field] ?? '').trim();
                    if (value && !candidates.includes(value)) candidates.push(value);
                });
            });
        });

        if (!candidates.includes('Lisboa')) candidates.push('Lisboa');
        return candidates;
    };

    const fetchWeatherByLocations = async (parcelas, profile, currentUser) => {
        const cache = new Map();
        const weatherByParcelaId = {};

        const fetchCached = async (location) => {
            const key = String(location || '').trim() || 'Lisboa';
            if (!cache.has(key)) {
                cache.set(key, fetchWeather(key));
            }
            return cache.get(key);
        };

        const resolveBestWeather = async (...sources) => {
            const candidates = getLocationCandidates(...sources);
            for (const location of candidates) {
                const clima = await fetchCached(location);
                if (clima) return { clima, location };
            }
            return { clima: null, location: 'Lisboa' };
        };

        for (const parcela of Array.isArray(parcelas) ? parcelas : []) {
            const parcelaId = getParcelaId(parcela);
            const { clima } = await resolveBestWeather(parcela, profile, currentUser);
            weatherByParcelaId[parcelaId] = clima;
        }

        const { clima: defaultClima, location: defaultLocation } = await resolveBestWeather(
            (Array.isArray(parcelas) && parcelas[0]) || null,
            profile,
            currentUser,
        );

        return { defaultClima, weatherByParcelaId, defaultLocation };
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

    const isTaskDone = (task) => String(task?.estado || '').toLowerCase().includes('conclu');
    const getTaskDueDate = (task) => {
        const date = new Date(task?.data_inicio || task?.dueDate || 0);
        return Number.isNaN(date.getTime()) ? null : date;
    };
    const classifyTasks = (tasks) => {
        const all = Array.isArray(tasks) ? tasks : [];
        const now = new Date();
        const cutoff = endOfDay(now);
        const pending = all.filter((t) => !isTaskDone(t));
        const overdueOrToday = [];
        const upcoming = [];
        const unscheduled = [];

        pending.forEach((task) => {
            const due = getTaskDueDate(task);
            if (!due) {
                unscheduled.push(task);
                return;
            }
            if (due.getTime() <= cutoff.getTime()) overdueOrToday.push(task);
            else upcoming.push(task);
        });

        const sortByDue = (a, b) => {
            const aTime = getTaskDueDate(a)?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
            const bTime = getTaskDueDate(b)?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
        };

        overdueOrToday.sort(sortByDue);
        upcoming.sort(sortByDue);

        return { pending, overdueOrToday, upcoming, unscheduled };
    };
    const formatTaskSectionTitle = (base, list) => list.length ? `${base} (${list.length})` : base;
    const createTaskRowMarkup = (tarefa, interactive = true) => {
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
                    ${visibleNow.map((tarefa) => createTaskRowMarkup(tarefa, interactive)).join('')}
                </section>
            `);
        }
        if (!showOnlyToday && sections.upcoming.length > 0) {
            blocks.push(`
                <section class="dash-task-section">
                    <div class="dash-task-section-title">${formatTaskSectionTitle('Próximas', sections.upcoming)}</div>
                    ${sections.upcoming.map((tarefa) => createTaskRowMarkup(tarefa, interactive)).join('')}
                </section>
            `);
        } else if (showOnlyToday && sections.upcoming.length > 0) {
            blocks.push(`
                <section class="dash-task-section">
                    <div class="dash-task-section-title">${formatTaskSectionTitle('Próximas', sections.upcoming.slice(0, 4))}</div>
                    ${sections.upcoming.slice(0, 4).map((tarefa) => createTaskRowMarkup(tarefa, interactive)).join('')}
                </section>
            `);
        }
        if (sections.unscheduled.length > 0) {
            blocks.push(`
                <section class="dash-task-section">
                    <div class="dash-task-section-title">${formatTaskSectionTitle('Sem data definida', sections.unscheduled)}</div>
                    ${sections.unscheduled.map((tarefa) => createTaskRowMarkup(tarefa, interactive)).join('')}
                </section>
            `);
        }

        tarefasContainer.innerHTML = `
            <div class="dash-task-summary">${summaryText}</div>
            <div class="dash-task-sections">${blocks.join('')}</div>
        `;
    };

    const formatWeekdayShort = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return new Intl.DateTimeFormat('pt-PT', { weekday: 'short' })
            .format(date)
            .replace('.', '')
            .replace(/^\w/, (m) => m.toUpperCase());
    };

    const pickFirstFinite = (sources, keys) => {
        for (const source of sources) {
            for (const key of keys) {
                const value = Number(source?.[key]);
                if (Number.isFinite(value)) return value;
            }
        }
        return null;
    };

    const pickFirstText = (sources, keys) => {
        for (const source of sources) {
            for (const key of keys) {
                const value = String(source?.[key] ?? '').trim();
                if (value) return value;
            }
        }
        return '';
    };

    const createMonitorMetric = ({ icon, label, value, detail, tone = 'neutral', available = false, badge = null }) => `
        <div class="monitor-card monitor-${tone} ${available ? '' : 'is-empty'}">
            <div class="monitor-card-top">
                <i class="bi ${icon}" aria-hidden="true"></i>
                <span class="monitor-card-badge">${badge || (available ? 'disponível' : 'sem dado')}</span>
            </div>
            <div class="monitor-card-label">${label}</div>
            <div class="monitor-card-value">${value}</div>
            <div class="monitor-card-trend">${detail}</div>
        </div>
    `;

    const renderMonitorizacao = (parcelas, clima, alertas, weatherByParcelaId = {}) => {
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
    };

    const renderClima = (clima) => {
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

    const getCultivoProfile = (cultivoName) => {
        const category = pickCultivoCategory(cultivoName);
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
            const rainToday = Number(agro?.precipitacao_hoje);
            const soilHumidity = Number(agro?.solo_humidade_superficie);
            const soilTemp = Number(agro?.solo_temperatura_0cm);
            const vpd = Number(agro?.deficit_pressao_vapor);

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

            parcelas.forEach((parcela) => {
                const parcelaNome = getParcelaLabel(parcela);
                const cultivoNome = getCultivoLabel(parcela);
                const profile = getCultivoProfile(cultivoNome);
                const cultivoLabel = cultivoNome || profile.label;
                const hasSoilHumidity = Number.isFinite(soilHumidity);
                const hasEt0 = Number.isFinite(et0);
                const hasRain = Number.isFinite(rainToday);
                const hasVpd = Number.isFinite(vpd);
                const isRainy = hasRain && rainToday >= profile.skipRainMm;
                const isHotDryDay = (tempMax !== null && tempMax >= profile.hotTemp) || (hasEt0 && et0 >= profile.highEt0);
                const isCriticalDryDay = (tempMax !== null && tempMax >= profile.hotTemp + 3) || (hasEt0 && et0 >= profile.criticalEt0);
                const lowSoilHumidity = hasSoilHumidity && soilHumidity <= profile.minSoilHumidity;
                const nearLimitSoilHumidity = hasSoilHumidity && soilHumidity <= profile.minSoilHumidity + 5;

                if (isRainy && hasEt0 && et0 < profile.highEt0) {
                    add(
                        'info',
                        'Rega',
                        'Evitar rega pesada',
                        `${parcelaNome} (${cultivoLabel}) tem ${fixed(rainToday)} mm de chuva previstos e ET0 de ${fixed(et0)} mm. Hoje compensa reduzir ou adiar a rega.`,
                        { parcela_nome: parcelaNome },
                    );
                } else if (lowSoilHumidity && isCriticalDryDay) {
                    add(
                        'danger',
                        'Rega',
                        'Reforçar rega hoje',
                        `${parcelaNome} (${cultivoLabel}) apresenta humidade do solo estimada em ${fixed(soilHumidity)}% e um dia exigente. Faça verificação e rega reforçada para evitar stress hídrico.`,
                        { parcela_nome: parcelaNome },
                    );
                } else if ((lowSoilHumidity || nearLimitSoilHumidity) && isHotDryDay) {
                    add(
                        'warning',
                        'Rega',
                        'Planear rega',
                        `${parcelaNome} (${cultivoLabel}) entra num período de maior consumo hídrico. ${hasEt0 ? `ET0 ${fixed(et0)} mm` : 'Evapotranspiração elevada'}${hasSoilHumidity ? ` e humidade estimada ${fixed(soilHumidity)}%` : ''}. Verifique a rega hoje.`,
                        { parcela_nome: parcelaNome },
                    );
                }

                if (hasVpd && vpd >= 1.6 && tempMax !== null && tempMax >= profile.hotTemp) {
                    add(
                        vpd >= 2.2 ? 'danger' : 'warning',
                        'Stress hídrico',
                        'Risco de stress hídrico',
                        `${parcelaNome} (${cultivoLabel}) pode sofrer stress hídrico: VPD ${fixed(vpd)} kPa e máxima de ${tempMax}°C. Reforce observação e ajuste a rega.`,
                        { parcela_nome: parcelaNome },
                    );
                }

                if (hasEt0 && hasRain && et0 <= 2.2 && rainToday >= profile.skipRainMm + 2) {
                    add(
                        'info',
                        'Rega',
                        'Baixa necessidade de água',
                        `${parcelaNome} (${cultivoLabel}) tem procura hídrica mais baixa hoje: ET0 ${fixed(et0)} mm e chuva ${fixed(rainToday)} mm. Evite excesso de rega.`,
                        { parcela_nome: parcelaNome },
                    );
                }

                if (Number.isFinite(soilTemp) && soilTemp <= 10 && profile.category !== 'raizes') {
                    add(
                        'info',
                        'Solo',
                        'Solo frio',
                        `${parcelaNome} (${cultivoLabel}) apresenta temperatura do solo estimada em ${fixed(soilTemp)}°C. O crescimento pode ficar mais lento nas próximas horas.`,
                        { parcela_nome: parcelaNome },
                    );
                }
            });
        }

        return alerts;
    };

    const updateTaskSummary = (tasks) => {
        const sections = classifyTasks(tasks);
        if (tarefasCount) tarefasCount.textContent = String(sections.pending.length);
        if (tarefasLabel) {
            if (sections.pending.length === 0) tarefasLabel.textContent = 'Tudo em dia';
            else tarefasLabel.textContent = `${sections.overdueOrToday.length} até hoje · ${sections.upcoming.length} próximas`;
        }
    };

    const updateAlertsSummary = (alerts) => {
        const list = Array.isArray(alerts) ? alerts : [];
        if (alertasCount) alertasCount.textContent = String(list.length);
        if (alertasLabel) {
            if (list.length === 0) {
                alertasLabel.textContent = 'Sem alertas';
                return;
            }
            const top = list[0];
            const category = getAlertCategory(top);
            const title = getAlertTitle(top);
            alertasLabel.textContent = `${category} · ${title}`;
        }
    };

    try {
        const [parcelasResponse, tarefasResponse, alertasResponse, userProfileResponse] = await Promise.all([
            api.fetchJson(`parcelas/listar/${user.id}`),
            fetchOptional(`tarefas/listar/${user.id}`),
            fetchOptional(`alertas/listar/${user.id}`),
            fetchOptional(`usuarios/perfil/${user.id}`),
        ]);

        const parcelas = Array.isArray(parcelasResponse?.data) ? parcelasResponse.data : [];
        const serverTarefas = Array.isArray(tarefasResponse?.data) ? tarefasResponse.data : [];
        const serverAlertas = Array.isArray(alertasResponse?.data) ? alertasResponse.data : [];
        const userProfile = userProfileResponse?.data || null;
        const userId = String(user.id ?? 'anon');
        const localAlertas = getUserLocalAlerts(userId);
        const { defaultClima: clima, weatherByParcelaId } = await fetchWeatherByLocations(parcelas, userProfile, user);

        if (parcelasCount) parcelasCount.textContent = String(parcelas.length);

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

            const refreshComputedSections = (currentTasks) => {
                updateTaskSummary(currentTasks);
                const generatedAlertas = generateAlerts({ parcelas, tarefas: currentTasks, clima });
                const mergedAlertas = mergeAlerts(serverAlertas, localAlertas, generatedAlertas);
                updateAlertsSummary(mergedAlertas);
                renderMonitorizacao(parcelas, clima, mergedAlertas, weatherByParcelaId);
                return mergedAlertas;
            };

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
                        refreshComputedSections(nextTasks);
                    });
                }
            }

            refreshComputedSections(tarefas);
        }

        if (hasServerTasks) {
            updateTaskSummary(tarefas);
            renderTasks(tarefas, { onlyToday: false, interactive: false });
        } else {
            renderTasks(tarefas, { onlyToday: true });
        }

        const generatedAlertas = generateAlerts({ parcelas, tarefas, clima });
        const alertas = mergeAlerts(serverAlertas, localAlertas, generatedAlertas);

        updateTaskSummary(tarefas);
        updateAlertsSummary(alertas);
        renderMonitorizacao(parcelas, clima, alertas, weatherByParcelaId);
        renderClima(clima);

        setError('');
    } catch (error) {
        if (parcelasCount) parcelasCount.textContent = '0';
        if (tarefasCount) tarefasCount.textContent = '0';
        if (alertasCount) alertasCount.textContent = '0';
        if (tarefasLabel) tarefasLabel.textContent = 'Sem tarefas';
        if (alertasLabel) alertasLabel.textContent = 'Sem alertas';
        renderEmpty(parcelasContainer, 'Não foi possível carregar as parcelas da base de dados.');
        renderEmpty(tarefasContainer, 'As tarefas não puderam ser carregadas.');
        renderEmpty(monitorizacaoContainer, 'O monitoramento não está disponível.');
        renderEmpty(climaContainer, 'O clima não está disponível.');
        setError(error.message || 'Erro ao carregar o dashboard.');
    }
});
