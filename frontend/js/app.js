console.log("Adventurers Ledger Loaded");

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('btn-login');
    const newCharBtn = document.getElementById('btn-new-char');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = "/login";
        });
    }

    if (newCharBtn) {
        newCharBtn.addEventListener('click', () => {
            window.location.href = "/create-character";
        });
    }
});
