(function () {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const loginMessage = document.getElementById("loginMessage");
  const registerMessage = document.getElementById("registerMessage");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.textContent = "Checking login...";
    loginMessage.className = "message";

    try {
      const data = await App.request("/login", {
        method: "POST",
        body: {
          email: document.getElementById("loginEmail").value,
          password: document.getElementById("loginPassword").value
        }
      });
      App.setUser(data.user);
      window.location.href = "dashboard.html";
    } catch (error) {
      loginMessage.textContent = error.message;
      loginMessage.className = "message error";
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    registerMessage.textContent = "Saving user...";
    registerMessage.className = "message";

    try {
      const data = await App.request("/register", {
        method: "POST",
        body: {
          name: document.getElementById("registerName").value,
          email: document.getElementById("registerEmail").value,
          password: document.getElementById("registerPassword").value,
          role: document.getElementById("registerRole").value,
          zone_name: document.getElementById("registerZone").value
        }
      });
      registerForm.reset();
      registerMessage.textContent = data.message;
      registerMessage.className = "message success";
    } catch (error) {
      registerMessage.textContent = error.message;
      registerMessage.className = "message error";
    }
  });

  document.querySelectorAll("[data-login]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("loginEmail").value = button.dataset.login;
      document.getElementById("loginPassword").value = "1234";
    });
  });
})();
