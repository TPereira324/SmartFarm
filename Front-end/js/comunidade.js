document.addEventListener('DOMContentLoaded', async () => {
    const api = window.CocoRootApi;
    if (!api) return;

    const statsRoot = document.getElementById('community-stats');
    const postsRoot = document.getElementById('posts');
    const errorBox = document.getElementById('community-error');
    const tabs = Array.from(document.querySelectorAll('.tab[data-cat]'));

    const setError = (message) => {
        if (!errorBox) return;
        errorBox.hidden = !message;
        errorBox.textContent = message || '';
    };

    const renderStats = (posts) => {
        if (!statsRoot) return;
        const counters = {
            todos: posts.length,
            duvidas: posts.filter((post) => post.categoria === 'duvidas').length,
            dicas: posts.filter((post) => post.categoria === 'dicas').length,
            experiencias: posts.filter((post) => post.categoria === 'experiencias').length,
        };

        statsRoot.innerHTML = `
            <div class="stat-item">
                <span class="stat-num">${counters.todos}</span>
                <span class="stat-label">Todos</span>
            </div>
            <div class="stat-item">
                <span class="stat-num">${counters.duvidas}</span>
                <span class="stat-label">Dúvidas</span>
            </div>
            <div class="stat-item">
                <span class="stat-num">${counters.dicas}</span>
                <span class="stat-label">Dicas</span>
            </div>
            <div class="stat-item">
                <span class="stat-num">${counters.experiencias}</span>
                <span class="stat-label">Experiências</span>
            </div>
        `;
    };

    const formatRelativeMeta = (post) => {
        const author = post?.autor?.nome || 'Utilizador';
        const date = post?.data ? new Date(post.data) : null;
        if (!date || Number.isNaN(date.getTime())) {
            return `${author} · ${post?.comentarios ?? 0} respostas`;
        }

        const text = new Intl.DateTimeFormat('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
        return `${author} · ${text}`;
    };

    const renderPosts = (posts, activeCategory) => {
        if (!postsRoot) return;
        const filtered = activeCategory === 'todos'
            ? posts
            : posts.filter((post) => post.categoria === activeCategory);

        if (filtered.length === 0) {
            postsRoot.innerHTML = '<div class="card"><div style="color:var(--muted);line-height:1.6;">Sem publicações para esta categoria.</div></div>';
            return;
        }

        postsRoot.innerHTML = filtered.map((post) => `
            <a class="community-post" data-cat="${post.categoria || 'outros'}" href="comunidade-post.html?id=${post.id}">
                <div class="community-post-top">
                    <div class="community-post-user">${post?.autor?.nome || 'Utilizador'}</div>
                    <div class="community-post-time">${formatRelativeMeta(post)}</div>
                </div>
                <div class="community-post-title">${post.titulo || 'Sem título'}</div>
                <div class="community-post-excerpt">${post.conteudo || 'Sem conteúdo.'}</div>
                <div class="post-badge ${post.categoria || 'outros'}">${post.categoria_label || 'Outro'}</div>
            </a>
        `).join('');
    };

    const publishToggleBtn = document.getElementById('publish-toggle-btn');
    const publishFormSection = document.getElementById('publish-form-section');
    const publishForm = document.getElementById('community-publish-form');
    const publishCancelBtn = document.getElementById('publish-cancel-btn');
    const publishSubmitBtn = document.getElementById('publish-submit-btn');
    const publishErrorEl = document.getElementById('publish-error');

    const setPublishError = (message) => {
        if (!publishErrorEl) return;
        publishErrorEl.hidden = !message;
        publishErrorEl.textContent = message || '';
    };

    const openPublishForm = () => {
        const user = api.getLoggedUser();
        if (!user?.id) {
            setPublishError('Precisas de iniciar sessão para fazer perguntas ou partilhar dicas.');
            setError('Precisas de iniciar sessão para participar na comunidade.');
            if (window.CocoRootToast) {
                window.CocoRootToast('Comunidade', 'Inicia sessão para publicar uma pergunta');
            }
            return;
        }
        if (publishFormSection) publishFormSection.hidden = false;
        if (publishToggleBtn) publishToggleBtn.hidden = true;
        document.getElementById('publish-titulo')?.focus();
    };

    const closePublishForm = () => {
        if (publishFormSection) publishFormSection.hidden = true;
        if (publishToggleBtn) publishToggleBtn.hidden = false;
        if (publishForm) publishForm.reset();
        setPublishError('');
    };

    publishToggleBtn?.addEventListener('click', openPublishForm);
    publishCancelBtn?.addEventListener('click', closePublishForm);

    publishForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = api.getLoggedUser();
        if (!user?.id) {
            setPublishError('Precisas de iniciar sessão para publicar.');
            return;
        }

        const titulo = String(document.getElementById('publish-titulo')?.value || '').trim();
        const conteudo = String(document.getElementById('publish-conteudo')?.value || '').trim();
        const categoria = String(document.getElementById('publish-categoria')?.value || 'outros');

        if (!titulo) { setPublishError('O título é obrigatório.'); return; }
        if (!conteudo) { setPublishError('O conteúdo é obrigatório.'); return; }

        try {
            setPublishError('');
            if (publishSubmitBtn) publishSubmitBtn.disabled = true;
            await api.fetchJson('forum/publicar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ut_id: user.id, titulo, conteudo, categoria }),
            });
            closePublishForm();
            const response = await api.fetchJson('forum/listar');
            posts = Array.isArray(response?.data) ? response.data : [];
            renderStats(posts);
            renderPosts(posts, currentCategory);
        } catch (error) {
            setPublishError(error.message || 'Não foi possível publicar.');
        } finally {
            if (publishSubmitBtn) publishSubmitBtn.disabled = false;
        }
    });

    let currentCategory = 'todos';
    let posts = [];

    const activateTab = (category) => {
        currentCategory = category;
        tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.cat === category));
        renderPosts(posts, currentCategory);
    };

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => activateTab(tab.dataset.cat));
    });

    try {
        const response = await api.fetchJson('forum/listar');
        posts = Array.isArray(response?.data) ? response.data : [];
        renderStats(posts);
        renderPosts(posts, currentCategory);
        setError('');
    } catch (error) {
        renderStats([]);
        renderPosts([], currentCategory);
        setError(error.message || 'Não foi possível carregar a comunidade.');
    }
});
