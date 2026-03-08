document.addEventListener('DOMContentLoaded', () => {
    const model = new UtilizadorModel();
    const view = new UtilizadorView();
    const controller = new UtilizadorController(model, view);

    
    console.log('Aplicação CocoRoot carregada!');
});
