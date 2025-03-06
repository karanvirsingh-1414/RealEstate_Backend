document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const errorMessage = document.getElementById("error-message");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent page reload

        const formData = new FormData(loginForm);
        const response = await fetch("/login", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            window.location.href = "/dashboard"; // Redirect to dashboard if success
        } else {
            errorMessage.textContent = result.message; // Show error under form
            errorMessage.style.display = "block";
        }
    });
});
