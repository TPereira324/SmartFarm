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

        const fields = currentStepEl.querySelectorAll('input, select');
        for (const field of fields) {
            if (field.id === 'country_code') {
                const code = (field.value || '').trim();
                if (!code) {
                    const countryError = document.getElementById('country-error');
                    if (countryError) countryError.style.display = 'block';
                    field.style.borderColor = 'red';
                    field.focus();
                    return false;
                }
            }
            if (field.id === 'phone') {
                const phone = (field.value || '').trim();
                const validPhonePattern = /^[0-9]{9}$/;
                if (!validPhonePattern.test(phone)) {
                    const phoneError = document.getElementById('phone-error');
                    if (phoneError) phoneError.style.display = 'block';
                    field.style.borderColor = 'red';
                    field.reportValidity();
                    return false;
                }
            }
            if (!field.checkValidity()) {
                field.reportValidity();
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
            if (userData.country_code && userData.phone) {
                userData.phone = `${userData.country_code}${String(userData.phone).trim()}`;
                delete userData.country_code;
            }
            if (this.model && typeof this.model.register === 'function') {
                const result = await this.model.register(userData);
                if (!result || result.success !== true) {
                    this.view.displayMessage(result?.message || 'Falha ao registrar.', true);
                    return;
                }
            }

            this.view.displayMessage('Cadastro concluído com sucesso!');
            window.location.href = 'login.html';
        } catch (e) {
            this.view.displayMessage('Falha ao registrar.', true);
        }
    }
}
