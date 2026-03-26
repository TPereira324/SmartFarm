class UtilizadorController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.currentStep = 1;
        this.maxStep = 5;
    }

    init() {
        if (this.view.steps && this.view.steps.length > 0) {
            this.view.showStep(this.currentStep);
        }

        this.bindEvents();
    }

    bindEvents() {
        const nextButtons = document.querySelectorAll('.next-step');
        const prevButtons = document.querySelectorAll('.prev-step');

        nextButtons.forEach((btn) => {
            btn.addEventListener('click', () => this.nextStep());
        });

        prevButtons.forEach((btn) => {
            btn.addEventListener('click', () => this.prevStep());
        });

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    validateCurrentStep() {
        const currentStepEl = document.getElementById(`step-${this.currentStep}`);
        if (!currentStepEl) return true;

        const inputs = currentStepEl.querySelectorAll('input');
        for (const input of inputs) {
            if (!input.checkValidity()) {
                input.reportValidity();
                return false;
            }
        }
        return true;
    }

    nextStep() {
        if (!this.validateCurrentStep()) return;
        if (this.currentStep >= this.maxStep) return;

        this.currentStep += 1;
        this.view.showStep(this.currentStep);
    }

    prevStep() {
        if (this.currentStep <= 1) return;

        this.currentStep -= 1;
        this.view.showStep(this.currentStep);
    }

    async handleRegister(event) {
        event.preventDefault();

        if (!this.validateCurrentStep()) return;

        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm_password');

        const password = passwordInput ? passwordInput.value : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

        if (password !== confirmPassword) {
            this.view.displayMessage('As palavras-passe não coincidem.', true);
            return;
        }

        const formData = new FormData(event.target);
        const userData = Object.fromEntries(formData.entries());

        try {
            if (this.model && typeof this.model.register === 'function') {
                const result = await this.model.register(userData);
                if (result && (result.status === 'error' || result.success === false)) {
                    this.view.displayMessage(result.message || 'Falha ao registar.', true);
                    return;
                }
            }

            this.view.displayMessage('Registo concluído com sucesso!');
            window.location.href = 'login.html';
        } catch (e) {
            this.view.displayMessage('Falha ao registar.', true);
        }
    }
}
