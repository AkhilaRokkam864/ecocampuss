// ======================================================
// EcoCampus Login & Registration
// ======================================================

const API_URL = window.ECOCAMPUS_API_URL || (
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000/api"
        : "https://ecocampus-api.onrender.com/api"
);


// ======================================================
// PAGE LOAD
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        loginForm.addEventListener("submit", loginUser);
    }

    if (registerForm) {
        registerForm.addEventListener("submit", registerUser);
    }

    // Check if user is already logged in
    checkExistingSession();
});


// ======================================================
// CHECK EXISTING SESSION
// ======================================================

function checkExistingSession() {

    const token = localStorage.getItem("ecoCampusToken");

    if (!token) {
        return;
    }

    // Verify token with backend
    fetch(`${API_URL}/auth/me`, {

        method: "GET",

        headers: {
            "Authorization": `Bearer ${token}`
        }

    })
    .then(async response => {

        if (!response.ok) {
            throw new Error("Session expired");
        }

        return response.json();

    })
    .then(data => {

        if (data.user) {
            redirectUser(data.user);
        }

    })
    .catch(() => {

        localStorage.removeItem("ecoCampusToken");
        localStorage.removeItem("ecoCampusUser");

    });
}


// ======================================================
// LOGIN
// ======================================================

async function loginUser(event) {

    event.preventDefault();

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    const rememberMe =
        document.getElementById("rememberMe").checked;


    if (!email || !password) {

        showMessage(
            "Please enter email and password.",
            "error"
        );

        return;
    }


    const button =
        event.target.querySelector("button[type='submit']");

    button.disabled = true;

    button.textContent = "Logging in...";


    try {

        const response = await fetch(
            `${API_URL}/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        // Check if server actually returned JSON
        const contentType =
            response.headers.get("content-type") || "";


        if (!contentType.includes("application/json")) {

            const text = await response.text();

            console.error(
                "Backend returned non-JSON:",
                text
            );

            throw new Error(
                "Backend returned an HTML page instead of JSON. Make sure the backend is running on port 5000."
            );
        }


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.message || "Login failed."
            );
        }


        // Save token
        localStorage.setItem(
            "ecoCampusToken",
            data.token
        );


        // Save user information
        localStorage.setItem(
            "ecoCampusUser",
            JSON.stringify(data.user)
        );


        if (rememberMe) {

            localStorage.setItem(
                "ecoCampusRemember",
                "true"
            );

        } else {

            localStorage.removeItem(
                "ecoCampusRemember"
            );
        }


        showMessage(
            "Login successful! Redirecting...",
            "success"
        );


        setTimeout(() => {

            redirectUser(data.user);

        }, 700);


    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        showMessage(
            error.message,
            "error"
        );

    } finally {

        button.disabled = false;

        button.textContent = "Login";
    }
}


// ======================================================
// REGISTER
// ======================================================

async function registerUser(event) {

    event.preventDefault();


    const name =
        document.getElementById("registerName")
        .value
        .trim();

    const email =
        document.getElementById("registerEmail")
        .value
        .trim();

    const password =
        document.getElementById("registerPassword")
        .value;

    const confirmPassword =
        document.getElementById("confirmPassword")
        .value;


    // -----------------------------
    // Validation
    // -----------------------------

    if (!name || !email || !password || !confirmPassword) {

        showMessage(
            "Please fill in all fields.",
            "error"
        );

        return;
    }


    if (name.length < 2) {

        showMessage(
            "Please enter a valid name.",
            "error"
        );

        return;
    }


    if (password.length < 6) {

        showMessage(
            "Password must contain at least 6 characters.",
            "error"
        );

        return;
    }


    if (password !== confirmPassword) {

        showMessage(
            "Passwords do not match.",
            "error"
        );

        return;
    }


    const button =
        document.getElementById("registerButton");


    button.disabled = true;

    button.textContent = "Creating Account...";


    try {

        console.log(
            "Sending registration request..."
        );


        const response = await fetch(
            `${API_URL}/auth/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify({

                    name: name,

                    email: email,

                    password: password

                })
            }
        );


        // ==================================================
        // VERY IMPORTANT:
        // Detect HTML response instead of trying JSON
        // ==================================================

        const contentType =
            response.headers.get("content-type") || "";


        if (!contentType.includes("application/json")) {

            const text =
                await response.text();

            console.error(
                "Registration returned HTML:",
                text
            );

            throw new Error(
                "The registration API returned an HTML page instead of JSON. Please make sure the backend is running on http://localhost:5000."
            );
        }


        const data =
            await response.json();


        console.log(
            "Registration response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Registration failed."
            );
        }


        // ==================================================
        // SUCCESS
        // ==================================================

        showMessage(
            "Account created successfully! Please login.",
            "success"
        );


        // Clear registration fields

        document.getElementById(
            "registerName"
        ).value = "";

        document.getElementById(
            "registerEmail"
        ).value = "";

        document.getElementById(
            "registerPassword"
        ).value = "";

        document.getElementById(
            "confirmPassword"
        ).value = "";


        // Go back to login

        setTimeout(() => {

            showLogin();

            document.getElementById(
                "loginEmail"
            ).value = email;

            document.getElementById(
                "loginPassword"
            ).focus();

        }, 1000);


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        showMessage(
            error.message,
            "error"
        );

    } finally {

        button.disabled = false;

        button.textContent = "Create Account";
    }
}


// ======================================================
// REDIRECT USER
// ======================================================

function redirectUser(user) {

    if (!user) {
        return;
    }


    const role =
        String(user.role || "user")
        .toLowerCase();


    if (role === "admin") {

        window.location.href = "admin.html";

    } else {

        window.location.href = "user.html";

    }
}


// ======================================================
// SHOW REGISTER
// ======================================================

function showRegister() {

    document
        .getElementById("loginSection")
        .classList
        .add("hidden");


    document
        .getElementById("registerSection")
        .classList
        .remove("hidden");


    const nameInput =
        document.getElementById("registerName");


    if (nameInput) {
        nameInput.focus();
    }
}


// ======================================================
// SHOW LOGIN
// ======================================================

function showLogin() {

    document
        .getElementById("registerSection")
        .classList
        .add("hidden");


    document
        .getElementById("loginSection")
        .classList
        .remove("hidden");


    const emailInput =
        document.getElementById("loginEmail");


    if (emailInput) {
        emailInput.focus();
    }
}


// ======================================================
// PASSWORD TOGGLE
// ======================================================

function togglePassword(
    inputId,
    button
) {

    const input =
        document.getElementById(inputId);


    if (!input) {
        return;
    }


    if (input.type === "password") {

        input.type = "text";

        button.textContent = "🙈";

    } else {

        input.type = "password";

        button.textContent = "👁";

    }
}


// ======================================================
// ADMIN DEMO
// ======================================================

function fillAdminLogin() {

    showLogin();


    document.getElementById(
        "loginEmail"
    ).value =
        "admin@ecocampus.com";


    document.getElementById(
        "loginPassword"
    ).value =
        "admin123";

}


// ======================================================
// USER DEMO
// ======================================================

function fillUserLogin() {

    showLogin();


    document.getElementById(
        "loginEmail"
    ).value =
        "user@ecocampus.com";


    document.getElementById(
        "loginPassword"
    ).value =
        "user123";

}


// ======================================================
// FORGOT PASSWORD
// ======================================================

function showForgotPassword() {

    document
        .getElementById("forgotModal")
        .classList
        .remove("hidden");
}


function closeForgotPassword() {

    document
        .getElementById("forgotModal")
        .classList
        .add("hidden");
}


// ======================================================
// MESSAGE
// ======================================================

function showMessage(
    message,
    type = "info"
) {

    const box =
        document.getElementById("messageBox");


    box.textContent = message;

    box.className =
        `message-box ${type}`;


    setTimeout(() => {

        box.className =
            "message-box";

    }, 5000);
}