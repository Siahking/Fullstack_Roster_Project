let currentMode = null;

export function toggleDiv(itemId) {
    const container = document.getElementById("info-container");
    const passwordInput = document.getElementById("password");
    const usernameInput = document.getElementById("username");

    const newMode = itemId === "login-button" ? "login" : "signup";

    if (container.classList.contains("hidden") === false && currentMode === newMode) {
        usernameInput.value = "";
        passwordInput.value = "";
        container.classList.add("hidden");
        currentMode = null;
        return;
    }

    container.classList.remove("hidden");
    usernameInput.value = "";
    passwordInput.value = "";

    if (newMode === "login") {
        passwordInput.setAttribute("type", "password");
    } else {
        passwordInput.setAttribute("type", "text");
    }

    currentMode = newMode;
}