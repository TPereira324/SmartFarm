document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname.split('/').pop() || 'principal.html';
    const user = JSON.parse(localStorage.getItem('user'));
    const isInPages = window.location.pathname.includes('/pages/');
    const assetPrefix = isInPages ? '../' : '';

    const headerHTML = `
    <nav class="nav">
        <a href="principal.html" class="nav-logo" aria-label="CocoRoot">
            <img src="${assetPrefix}image/logo.jpeg" alt="" class="nav-brand">
            <span class="nav-title">CocoRoot</span>
        </a>
        <div class="nav-links">
            <a href="noticias.html" class="nav-link ${currentPath.includes('noticias') || currentPath.includes('post') ? 'active' : ''}">Notícias</a>
            <a href="dashboard.html" class="nav-link ${currentPath.includes('dashboard') || currentPath.includes('registrar-cultivo') ? 'active' : ''}">Dashboard</a>
            <a href="relatorios.html" class="nav-link ${currentPath.includes('relatorios') ? 'active' : ''}">Relatórios</a>
            <a href="comunidade.html" class="nav-link ${currentPath.includes('comunidade') ? 'active' : ''}">Comunidade</a>
            <a href="comecar.html" class="nav-link ${currentPath.includes('comecar') ? 'active' : ''}">Começar do Zero</a>
            <a href="sobre.html" class="nav-link ${currentPath.includes('sobre') ? 'active' : ''}">Sobre nós</a>
            ${user && user.role === 'admin' ? '<a href="dashboard.html?admin=true" class="nav-link active">Admin</a>' : ''}
        </div>
        <div class="nav-right">
            ${user ? `
                <a href="perfil.html" class="nav-link ${currentPath.includes('perfil') ? 'active' : ''}" style="display:inline-flex;align-items:center;gap:6px;"><i class="bi bi-person-circle" aria-hidden="true"></i> ${user.nome}</a>
                <a href="#" id="logout-btn" class="nav-link nav-logout"><i class="bi bi-box-arrow-right" aria-hidden="true"></i> Sair</a>
            ` : `
                <a href="login.html" class="btn outline"><i class="bi bi-box-arrow-in-right" aria-hidden="true"></i> Entrar</a>
                <a href="registo.html" class="btn outline"><i class="bi bi-person-plus" aria-hidden="true"></i> Criar Conta</a>
            `}
        </div>
    </nav>
    `;

    const footerHTML = `
    <footer class="footer">
        <div class="footer-inner">
            <div>
                <div class="footer-brand">
                    <img src="${assetPrefix}image/logo.jpeg" alt="" class="nav-brand">
                    <div class="footer-brand-name">CocoRoot</div>
                </div>
            </div>
            <div>
                <div class="footer-col-title">Produto</div>
                <div class="footer-links">
                    <a href="comecar.html">Começar do zero</a>
                    <a href="relatorios.html">Relatórios</a>
                    <a href="principal.html#funcionalidades">Funcionalidades</a>
                    <a href="principal.html#como-funciona">Como funciona</a>
                </div>
            </div>
            <div>
                <div class="footer-col-title">Contacto</div>
                <div class="footer-links">
                    <a href="mailto:contacto@cocoroot.pt">contacto@cocoroot.pt</a>
                    <a href="sobre.html">Sobre nós</a>
                    <a href="dashboard.html">Dashboard</a>
                    <a href="perfil.html">Perfil</a>
                </div>
            </div>
            <div>
                <div class="footer-col-title">Redes sociais</div>
                <div class="footer-links">
                    <a href="#">Instagram</a>
                    <a href="#">Facebook</a>
                    <a href="#">YouTube</a>
                </div>
            </div>
        </div>
    </footer>
    `;


    if (!document.body.classList.contains('auth-page') && !document.querySelector('.nav')) {
        document.body.insertAdjacentHTML('afterbegin', headerHTML);
    } else if (document.querySelector('.nav')) {
        document.querySelector('.nav').outerHTML = headerHTML;
    }


    if (!document.body.classList.contains('auth-page')) {
        if (document.querySelector('.footer')) {
            document.querySelector('.footer').outerHTML = footerHTML;
        } else {
            document.body.insertAdjacentHTML('beforeend', footerHTML);
        }
    }


    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = 'principal.html';
        });
    }

    const ensureToastRoot = () => {
        let root = document.querySelector('.toast-root');
        if (!root) {
            root = document.createElement('div');
            root.className = 'toast-root';
            root.setAttribute('aria-live', 'polite');
            document.body.appendChild(root);
        }
        return root;
    };

    window.CocoRootToast = (title, text) => {
        const root = ensureToastRoot();
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-icon"><i class="bi bi-bell" aria-hidden="true"></i></div>
            <div style="flex:1;">
                <div class="toast-title">${title || 'Notificação'}</div>
                <div class="toast-text">${text || ''}</div>
                <div class="toast-bar"><div style="animation-duration: 2600ms;"></div></div>
            </div>
        `;
        root.appendChild(toast);
        window.setTimeout(() => toast.remove(), 2700);
    };
});
