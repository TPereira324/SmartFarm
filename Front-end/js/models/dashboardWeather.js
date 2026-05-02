window.CocoRootDashWeather = {
    weatherCodeToText: (code) => {
        const n = Number(code);
        if (!Number.isFinite(n)) return 'Aguardar dados';
        if (n === 0) return 'Céu limpo';
        if (n === 1) return 'Pouco nublado';
        if (n === 2) return 'Parcialmente nublado';
        if (n === 3) return 'Muito nublado ou encoberto';
        if ([45, 48].includes(n)) return 'Nevoeiro ou neblina';
        if ([51, 53, 55, 56, 57].includes(n)) return 'Chuviscos';
        if ([61, 63, 65, 66, 67, 80, 81, 82].includes(n)) return 'Chuva';
        if ([71, 73, 75, 77].includes(n)) return 'Queda de neve';
        if ([95, 96, 99].includes(n)) return 'Trovoada';
        return 'Tempo variável';
    },

    weatherCodeToIcon: (code) => {
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
    },

    fetchWeatherFromOpenMeteo: async (city, weatherCodeToText) => {
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
    },

    fetchWeather: async (city, fetchWeatherFromOpenMeteo, weatherCodeToText) => {
        const cityName = String(city || '').trim() || 'Lisboa';
        try {
            const climate = await fetchWeatherFromOpenMeteo(cityName, weatherCodeToText);
            if (climate) return climate;
        } catch {
        }
        return {
            cidade: cityName,
            temperatura: 22,
            sensacao_termica: 23,
            humidade: 60,
            temp_max: 25,
            temp_min: 15,
            descricao: weatherCodeToText(2),
            weather_code: 2,
            previsao: Array.from({ length: 5 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                return {
                    data: d.toISOString().slice(0, 10),
                    weather_code: 2,
                    temp_max: 25 - i,
                    temp_min: 15 - i,
                    chuva_probabilidade: 10 + i * 5,
                    precipitacao_sum: 0,
                    vento_max: 12 + i,
                    et0: 4.5,
                };
            }),
            atualizado_em: new Date().toISOString(),
            agro: {
                solo_temperatura_0cm: 20,
                solo_humidade_superficie: 45,
                deficit_pressao_vapor: 1.2,
                evapotranspiracao_ref: 4.5,
                precipitacao_hoje: 0,
                uv_max: 6,
                fonte: 'fallback-estatico',
            },
            fonte: 'fallback',
        };
    },

    resolveBestWeather: async (parcela, profile, currentUser, fetchWeather, fetchWeatherFromOpenMeteo, weatherCodeToText) => {
        let city = 'Lisboa';
        if (parcela?.localizacao) city = parcela.localizacao;
        else if (parcela?.cidade) city = parcela.cidade;
        else if (profile?.cidade) city = profile.cidade;
        else if (profile?.localizacao) city = profile.localizacao;
        else if (currentUser?.cidade) city = currentUser.cidade;
        else if (currentUser?.localizacao) city = currentUser.localizacao;
        const clima = await fetchWeather(city, fetchWeatherFromOpenMeteo, weatherCodeToText);
        return { clima, location: city };
    },

    resolveAllWeather: async (parcelas, profile, currentUser, resolveBestWeather, fetchWeather, fetchWeatherFromOpenMeteo, weatherCodeToText, getParcelaId) => {
        const weatherByParcelaId = {};
        for (const parcela of Array.isArray(parcelas) ? parcelas : []) {
            const parcelaId = getParcelaId(parcela);
            const { clima } = await resolveBestWeather(parcela, profile, currentUser, fetchWeather, fetchWeatherFromOpenMeteo, weatherCodeToText);
            weatherByParcelaId[parcelaId] = clima;
        }
        const { clima: defaultClima, location: defaultLocation } = await resolveBestWeather(
            (Array.isArray(parcelas) && parcelas[0]) || null,
            profile,
            currentUser,
            fetchWeather,
            fetchWeatherFromOpenMeteo,
            weatherCodeToText
        );
        return { defaultClima, weatherByParcelaId, defaultLocation };
    }
};
