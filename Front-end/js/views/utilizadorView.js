class UtilizadorView {
    constructor() {
        this.app = document.getElementById('app');
        this.registerForm = document.getElementById('register-form');
        this.steps = document.querySelectorAll('.register-step');
    }

    showStep(stepNumber) {
        this.steps.forEach((step, index) => {
            if (index === stepNumber - 1) {
                step.classList.remove('hidden');
            } else {
                step.classList.add('hidden');
            }
        });
    }

    displayMessage(message, isError = false) {
        alert(message);
    }
}
