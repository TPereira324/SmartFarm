class UtilizadorController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.currentStep = 1;
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Navegação de passos no registo
        const nextButtons = document.querySelectorAll('.next-step');
        const prevButtons = document.querySelectorAll('.prev-step');

        nextButtons.forEach(btn => {
            btn.addEventListener('click', () => this.nextStep());
        });

        prevButtons.forEach(btn => {
            btn.addEventListener('click', () => this.prevStep());
        });

        // Submissão do formulário de registo
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Eventos do Login (se existirem nesta página)
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    nextStep() {
        // Validação simples do passo atual antes de avançar
        const currentStepEl = document.getElementById(`step-${this.currentStep}`);
        const inputs = currentStepEl.querySelectorAll('input');
        let allValid = true;

        inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.reportValidity();
                allValid = false;
            }
        });

        if (allValid && this.currentStep < 5) {
            this.currentStep++;
            this.view.showStep(this.currentStep);
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.view.showStep(this.currentStep);
        }
    }

    handleRegister(event) {
        event.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        if (password !== confirmPassword) {
            this.view.displayMessage('As palavras-passe não coincidem.', true);
            return;
        }

        const formData = new FormData(event.target);
        const userData = Object.fromEntries(formData.entries());

        console.log('Dados do utilizador:', userData);
        this.view.displayMessage('Registo concluído com sucesso!');

        // Redirecionar para login após sucesso
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }

    handleLogin(event) {
        event.preventDefault();
        // Lógica de login similar...
    }
}
