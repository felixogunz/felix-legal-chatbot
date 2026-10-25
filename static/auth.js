"use strict";

document.addEventListener("click", function (event) {
    const target = event.target;

    if (!(target instanceof Element)) {
        return;
    }

    const button = target.closest(".toggle-password");

    if (!button) {
        return;
    }

    const inputId = button.getAttribute("aria-controls");
    const passwordInput = document.getElementById(inputId);

    if (
        !(passwordInput instanceof HTMLInputElement) ||
        !["password", "text"].includes(passwordInput.type)
    ) {
        return;
    }

    const shouldShow = passwordInput.type === "password";

    passwordInput.type = shouldShow ? "text" : "password";

    button.setAttribute(
        "aria-label",
        shouldShow ? "Hide password" : "Show password"
    );

    button.setAttribute("aria-pressed", String(shouldShow));

    if (shouldShow) {
        button.innerHTML = `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true"
                 focusable="false">
                <path d="M3 3l18 18"></path>
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
                <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a15.8 15.8 0 0 1-4 4.8"></path>
                <path d="M6.2 6.2A16.5 16.5 0 0 0 2 12s3.6 7 10 7a10.8 10.8 0 0 0 4-.8"></path>
            </svg>
        `;
    } else {
        button.innerHTML = `
            <svg viewBox="0 0 24 24"
                 aria-hidden="true"
                 focusable="false">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
    }
});
