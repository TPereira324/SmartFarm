document.addEventListener('DOMContentLoaded', async () => {
    const api = window.CocoRootApi;
    if (!api) return;

    const user = api.requireLoggedUser();
    if (!user) return;

    const preferencesKey = `cocoRootProfilePrefs:${String(user.id ?? 'anon')}`;
    const interestsKey = `cocoRootProfileInterests:${String(user.id ?? 'anon')}`;
    const defaultInterests = ['Folhosas', 'Frutíferas', 'Ervas', 'Raízes', 'Hidroponia'];
    let liveUser = { ...user };

    const inputName = document.getElementById('profile-input-name');
    const inputEmail = document.getElementById('profile-input-email');
    const inputPhone = document.getElementById('profile-input-phone');
    const inputLocation = document.getElementById('profile-input-location');
    const saveBtn = document.getElementById('profile-save-btn');
    const saveStatus = document.getElementById('profile-save-status');
    const avatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileRole = document.getElementById('profile-role');
    const statParcelas = document.getElementById('profile-stat-parcelas');
    const statPendentes = document.getElementById('profile-stat-pendentes');
    const statModulos = document.getElementById('profile-stat-modulos');
    const progressFill = document.getElementById('profile-progress-fill');
    const progressText = document.getElementById('profile-progress-text');
    const chipsRoot = document.getElementById('profile-chips');
    const activityRoot = document.getElementById('profile-activity');
    const prefAlertas = document.getElementById('pref-alertas');
    const prefResumo = document.getElementById('pref-resumo');
    const prefComunidade = document.getElementById('pref-comunidade');

    const { fetchOptional, friendlyError, readJson, writeJson, toUserShape, calcProgress, renderActivity } = window.CocoRootPerfilAPI;

    const updateIdentityUI = () => {
        inputName.value = liveUser.nome || '';
        inputEmail.value = liveUser.email || '';
        inputPhone.value = liveUser.telefone || '';
        inputLocation.value = liveUser.localizacao || '';
        const initials = String(liveUser.nome || 'U')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() || '')
            .join('');
        avatar.textContent = initials || 'U';
        profileName.textContent = liveUser.nome || 'Utilizador';
        profileRole.textContent = liveUser.role === 'admin' ? 'Administrador' : 'Produtor CocoRoot';
    };

    const initIdentity = () => {
        liveUser = toUserShape(liveUser, liveUser);
        updateIdentityUI();
    };

    const initPreferences = () => {
        const prefs = readJson(preferencesKey, {
            alertas: true,
            resumo: true,
            comunidade: true,
        });
        prefAlertas.checked = prefs.alertas !== false;
        prefResumo.checked = prefs.resumo !== false;
        prefComunidade.checked = prefs.comunidade !== false;

        [prefAlertas, prefResumo, prefComunidade].forEach((el) => {
            el?.addEventListener('change', () => {
                writeJson(preferencesKey, {
                    alertas: !!prefAlertas.checked,
                    resumo: !!prefResumo.checked,
                    comunidade: !!prefComunidade.checked,
                });
                if (window.CocoRootToast) window.CocoRootToast('Perfil', 'Preferências atualizadas');
            });
        });
    };

    const initInterests = () => {
        const selected = new Set(readJson(interestsKey, ['Folhosas', 'Frutíferas']));
        chipsRoot.innerHTML = '';
        defaultInterests.forEach((name) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `profile-chip${selected.has(name) ? ' active' : ''}`;
            btn.textContent = name;
            btn.addEventListener('click', () => {
                if (selected.has(name)) selected.delete(name);
                else selected.add(name);
                writeJson(interestsKey, Array.from(selected));
                btn.classList.toggle('active', selected.has(name));
            });
            chipsRoot.appendChild(btn);
        });
    };



    const loadStats = async () => {
        const userId = String(liveUser.id ?? user.id ?? 'anon');
        const completedModulesStore = readJson('cocoRootCompletedModules', {});
        const localTasksStore = readJson('cocoRootTasks', {});

        const [perfilResponse, parcelasResponse, tarefasResponse, alertasResponse] = await Promise.all([
            fetchOptional(api, `usuarios/perfil/${liveUser.id}`),
            fetchOptional(api, `parcelas/listar/${liveUser.id}`),
            fetchOptional(api, `tarefas/listar/${liveUser.id}`),
            fetchOptional(api, `alertas/listar/${liveUser.id}`),
        ]);
        const remoteProfile = perfilResponse?.data || perfilResponse?.user || null;
        if (remoteProfile) {
            liveUser = toUserShape(remoteProfile, liveUser);
            localStorage.setItem('user', JSON.stringify(liveUser));
            updateIdentityUI();
        }

        const parcelas = Array.isArray(parcelasResponse?.data) ? parcelasResponse.data : [];
        const serverTasks = Array.isArray(tarefasResponse?.data) ? tarefasResponse.data : [];
        const localTasks = Array.isArray(localTasksStore[userId]) ? localTasksStore[userId] : [];
        const allTasks = serverTasks.length > 0 ? serverTasks : localTasks;
        const pending = allTasks.filter((t) => !String(t?.estado || '').toLowerCase().includes('conclu')).length;
        const completedModules = Array.isArray(completedModulesStore[userId]) ? completedModulesStore[userId].length : 0;

        statParcelas.textContent = String(parcelas.length);
        statPendentes.textContent = String(pending);
        statModulos.textContent = String(completedModules);

        const progress = calcProgress(parcelas.length, pending, completedModules);
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${progress}% concluído`;

        const alerts = Array.isArray(alertasResponse?.data) ? alertasResponse.data : [];
        const activities = [];
        allTasks.slice(0, 2).forEach((task) => {
            activities.push({
                title: task?.titulo || 'Tarefa atualizada',
                meta: `${task?.parcela_nome || 'Sem parcela'} · ${task?.estado || 'Pendente'}`,
            });
        });
        alerts.slice(0, 2).forEach((alert) => {
            activities.push({
                title: alert?.titulo || 'Alerta do sistema',
                meta: alert?.mensagem || alert?.message || 'Nova notificação recebida',
            });
        });
        if (activities.length === 0) {
            activities.push({
                title: 'Perfil criado',
                meta: 'Complete seus dados para personalizar a experiência.',
            });
        }
        renderActivity(activities, activityRoot);
    };

    const saveProfile = async () => {
        const nextUser = toUserShape({
            ...liveUser,
            nome: inputName.value.trim(),
            email: inputEmail.value.trim(),
            telefone: inputPhone.value.trim(),
            localizacao: inputLocation.value.trim(),
        }, liveUser);
        const payload = {
            id: nextUser.id,
            nome: nextUser.nome,
            email: nextUser.email,
            telefone: nextUser.telefone,
            localizacao: nextUser.localizacao,
            cidade: nextUser.localizacao,
            ut_nome: nextUser.nome,
            ut_email: nextUser.email,
            ut_phone: nextUser.telefone,
            ut_localizacao: nextUser.localizacao,
        };
        const attempts = [
            { path: `usuarios/atualizar/${nextUser.id}`, method: 'POST' },
            { path: 'usuarios/atualizar', method: 'POST' },
            { path: `usuarios/perfil/${nextUser.id}`, method: 'POST' },
            { path: 'usuarios/perfil', method: 'POST' },
            { path: `usuarios/atualizar/${nextUser.id}`, method: 'PUT' },
        ];

        let saved = false;
        let lastError = null;
        for (const attempt of attempts) {
            try {
                const response = await api.fetchJson(attempt.path, {
                    method: attempt.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const ok = response?.success !== false;
                if (ok) {
                    saved = true;
                    break;
                }
                lastError = new Error(response?.message || 'Falha ao atualizar perfil.');
            } catch (error) {
                lastError = error;
            }
        }

        if (!saved) {
            throw new Error(friendlyError(lastError, 'Não foi possível salvar no servidor.'));
        }

        liveUser = nextUser;
        localStorage.setItem('user', JSON.stringify(liveUser));
        updateIdentityUI();

        if (saveStatus) {
            saveStatus.hidden = false;
            saveStatus.textContent = 'Perfil atualizado com sucesso.';
            setTimeout(() => {
                saveStatus.hidden = true;
                saveStatus.textContent = '';
            }, 2500);
        }
        if (window.CocoRootToast) window.CocoRootToast('Perfil', 'Dados guardados');
    };

    initIdentity();
    initPreferences();
    initInterests();
    try {
        await loadStats();
    } catch {
    }
    saveBtn?.addEventListener('click', async () => {
        saveBtn.disabled = true;
        if (saveStatus) {
            saveStatus.hidden = false;
            saveStatus.textContent = 'A guardar alterações na base de dados...';
        }
        try {
            await saveProfile();
            await loadStats();
        } catch (error) {
            if (saveStatus) {
                saveStatus.hidden = false;
                saveStatus.textContent = friendlyError(error, 'Falha ao salvar perfil na base de dados.');
            }
            if (window.CocoRootToast) window.CocoRootToast('Perfil', 'Erro ao guardar dados');
        } finally {
            saveBtn.disabled = false;
        }
    });
});
