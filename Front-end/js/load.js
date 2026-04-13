document.addEventListener('DOMContentLoaded', () => {
    const model = new UtilizadorModel();
    const view = new UtilizadorView();
    const controller = new UtilizadorController(model, view);

    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    function setResponsiveScale() {
        const w = window.innerWidth;
        const scale = Math.min(1, Math.max(0.85, w / 1200));
        document.documentElement.style.setProperty('--scale', `${scale}`);
    }

    setViewportHeight();
    setResponsiveScale();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('resize', setResponsiveScale);
    window.addEventListener('orientationchange', () => {
        setViewportHeight();
        setResponsiveScale();
    });

    controller.init();
    console.log('Aplicação CocoRoot carregada!');
});
