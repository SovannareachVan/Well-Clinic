function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (username === "wellclinic" && password === "wellclinic123") {
      window.location.href = "home.html"; // Redirect after login
  } else {
      document.getElementById("error-msg").textContent = "Invalid username or password.";
  }
}
