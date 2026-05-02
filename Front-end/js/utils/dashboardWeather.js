async function fetchWeatherFromOpenMeteo(city) {
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
    const forecastDays = Array.isArray(daily?.time) ? daily.time.map((day, i) => ({
        data: day,
        weather_code: daily?.weather_code?.[i] ?? null,
        temp_max: daily?.temperature_2m_max?.[i] ?? null,
        temp_min: daily?.temperature_2m_min?.[i] ?? null,
        chuva_probabilidade: daily?.precipitation_probability_max?.[i] ?? null,
        precipitacao_sum: daily?.precipitation_sum?.[i] ?? null,
        vento_max: daily?.wind_speed_10m_max?.[i] ?? null,
        et0: daily?.et0_fao_evapotranspiration?.[i] ?? null,
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
            solo_humidade_superficie: (() => { const v = Number(getHourlyValue('soil_moisture_0_1cm')); return Number.isFinite(v) ? v * 100 : null; })(),
            deficit_pressao_vapor: getHourlyValue('vapour_pressure_deficit'),
            evapotranspiracao_ref: daily?.et0_fao_evapotranspiration?.[0] ?? null,
            precipitacao_hoje: daily?.precipitation_sum?.[0] ?? null,
            uv_max: daily?.uv_index_max?.[0] ?? null,
            fonte: 'open-meteo-modelado',
        },
        fonte: 'open-meteo',
    };
}

async function fetchWeather(api, city) {
    const cityName = String(city || '').trim() || 'Lisboa';
    try { const climate = await fetchWeatherFromOpenMeteo(cityName); if (climate) return climate; } catch {}
    try { const response = await api.fetchJson(`clima?cidade=${encodeURIComponent(cityName)}`); if (response?.data) return response.data; } catch {}
    return null;
}

function getLocationCandidates(...sources) {
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
}

async function fetchWeatherByLocations(api, parcelas, profile, currentUser) {
    const cache = new Map();
    const weatherByParcelaId = {};
    const fetchCached = async (location) => {
        const key = String(location || '').trim() || 'Lisboa';
        if (!cache.has(key)) cache.set(key, fetchWeather(api, key));
        return cache.get(key);
    };
    const resolveBestWeather = async (...sources) => {
        for (const location of getLocationCandidates(...sources)) {
            const clima = await fetchCached(location);
            if (clima) return { clima, location };
        }
        return { clima: null, location: 'Lisboa' };
    };
    for (const parcela of Array.isArray(parcelas) ? parcelas : []) {
        const { clima } = await resolveBestWeather(parcela, profile, currentUser);
        weatherByParcelaId[getParcelaId(parcela)] = clima;
    }
    const { clima: defaultClima, location: defaultLocation } = await resolveBestWeather(
        (Array.isArray(parcelas) && parcelas[0]) || null, profile, currentUser,
    );
    return { defaultClima, weatherByParcelaId, defaultLocation };
}
