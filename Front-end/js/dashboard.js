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
    const parcelasContainer = document.getElementById('dashboard-parcelas-list');
    const tarefasContainer = document.getElementById('dashboard-tarefas-list');
    const monitorizacaoContainer = document.getElementById('dashboard-monitorizacao');
    const climaContainer = document.getElementById('dashboard-clima');
    const errorBox = document.getElementById('dashboard-error');

    if (greetingName) greetingName.textContent = user.nome || 'utilizador';
    if (greetingText) greetingText.textContent = 'Visão geral carregada a partir dos dados disponíveis no servidor.';

    const setError = (message) => {
        if (!errorBox) return;
        errorBox.hidden = !message;
        errorBox.textContent = message || '';
    };

    const renderEmpty = (container, message) => {
        if (!container) return;
        container.innerHTML = `<div class="card"><div style="color:var(--muted);line-height:1.6;">${message}</div></div>`;
    };

    const fetchOptional = async (path) => {
        try {
            return await api.fetchJson(path);
        } catch {
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

    try {
        const [parcelasResponse, tarefasResponse, alertasResponse, climaResponse] = await Promise.all([
            api.fetchJson(`parcelas/listar/${user.id}`),
            fetchOptional(`tarefas/listar/${user.id}`),
            fetchOptional(`alertas/listar/${user.id}`),
            fetchOptional('clima?cidade=Lisboa'),
        ]);

        const parcelas = Array.isArray(parcelasResponse?.data) ? parcelasResponse.data : [];
        const tarefas = Array.isArray(tarefasResponse?.data) ? tarefasResponse.data : [];
        const alertas = Array.isArray(alertasResponse?.data) ? alertasResponse.data : [];
        const clima = climaResponse?.data || null;

        if (parcelasCount) parcelasCount.textContent = String(parcelas.length);
        if (tarefasCount) tarefasCount.textContent = String(tarefas.length);
        if (alertasCount) alertasCount.textContent = String(alertas.length);

        if (parcelas.length === 0) {
            renderEmpty(parcelasContainer, 'Ainda não existem parcelas registadas na base de dados.');
        } else if (parcelasContainer) {
            parcelasContainer.innerHTML = parcelas.map((parcela) => {
                const cultivos = Array.isArray(parcela.cultivos) ? parcela.cultivos : [];
                const cultivo = cultivos[0];
                return `
                    <div class="card">
                        <div style="font-weight:900;margin-bottom:6px;">${parcela.nome || 'Parcela'}</div>
                        <div style="color:var(--muted);line-height:1.6;">Estado: ${parcela.estado || 'Sem estado'}</div>
                        <div style="color:var(--muted);line-height:1.6;">Área: ${formatArea(parcela.area_m2)}</div>
                        <div style="color:var(--muted);line-height:1.6;">Cultivo: ${cultivo?.nome || 'Não definido'}</div>
                    </div>
                `;
            }).join('');
        }

        if (tarefas.length === 0) {
            renderEmpty(tarefasContainer, 'Sem tarefas dinâmicas disponíveis no servidor atual.');
        } else if (tarefasContainer) {
            tarefasContainer.innerHTML = tarefas.map((tarefa) => `
                <div style="display:flex;align-items:flex-start;gap:10px;">
                    <div class="check-box">${String(tarefa.estado || '').toLowerCase().includes('conclu') ? '✓' : '•'}</div>
                    <div>
                        <div style="font-weight:900;">${tarefa.titulo || 'Tarefa'}</div>
                        <div style="color:var(--muted);line-height:1.6;">${tarefa.parcela_nome || 'Sem parcela'} · ${tarefa.estado || 'Sem estado'} · ${formatDate(tarefa.data_inicio)}</div>
                    </div>
                </div>
            `).join('');
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
                    <div style="color:var(--muted);margin-top:6px;">Somatório das parcelas guardadas na base de dados.</div>
                </div>
                <div class="dash-card">
                    <div class="dash-card-title">Estado das parcelas</div>
                    <div style="color:var(--muted);line-height:1.8;">
                        Saudáveis: ${healthyCount}<br>
                        Em atenção: ${attentionCount}<br>
                        Cultivos associados: ${cultivosCount}
                    </div>
                </div>
            `;
        }

        if (climaContainer) {
            if (!clima) {
                renderEmpty(climaContainer, 'A integração de clima ainda não está disponível no servidor atual.');
            } else {
                climaContainer.innerHTML = `
                    <div class="dash-card">
                        <div class="dash-card-title">Agora em ${clima.cidade || 'Lisboa'}</div>
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
                            <div>
                                <div style="font-size:34px;font-weight:900;line-height:1;">${Math.round(Number(clima.temperatura || 0))}°C</div>
                                <div style="color:var(--muted);margin-top:6px;">${clima.descricao || 'Sem descrição'} · Humidade ${clima.humidade ?? '—'}%</div>
                            </div>
                            <div style="color:var(--muted);line-height:1.8;">
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
