class UtilizadorModel {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
    }

    register(userData) {
        this.users.push(userData);
        localStorage.setItem('users', JSON.stringify(this.users));
        return { success: true };
    }
}
