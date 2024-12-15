document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const email = document.getElementById("login-email").value;
            const password = document.getElementById("login-password").value;

            try {
                const response = await fetch("/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                });

                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error("로그인 요청 중 오류:", error);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const email = document.getElementById("signup-email").value;
            const password = document.getElementById("signup-password").value;
            const name = document.getElementById("signup-name").value;

            try {
                const response = await fetch("/signup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password, name }),
                });

                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error("회원가입 요청 중 오류:", error);
            }
        });
    }
});
