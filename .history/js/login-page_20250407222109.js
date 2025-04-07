document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    // Dummy check
    if (email === "admin@example.com" && password === "123456") {
      document.getElementById('message').style.color = 'green';
      document.getElementById('message').textContent = "Login successful!";
      // Redirect or perform login logic here
    } else {
      document.getElementById('message').style.color = 'red';
      document.getElementById('message').textContent = "Invalid credentials!";
    }
  });
  