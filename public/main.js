// Auth Functions
async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        document.getElementById('auth-message').textContent = 'Please enter both username and password.';
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok) {
            document.getElementById('auth-message').textContent = data.message;
        } else {
            document.getElementById('auth-message').textContent = data.error || 'Registration failed.';
        }
    } catch (error) {
        document.getElementById('auth-message').textContent = 'Error connecting to server.';
    }
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        document.getElementById('auth-message').textContent = 'Please enter both username and password.';
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok) {
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('game-section').style.display = 'block';
            document.getElementById('welcome-message').textContent = `Welcome, ${data.username}!`;
            document.getElementById('auth-message').textContent = '';
        } else {
            document.getElementById('auth-message').textContent = data.error || 'Login failed.';
        }
    } catch (error) {
        document.getElementById('auth-message').textContent = 'Error connecting to server.';
    }
}

async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (response.ok) {
            document.getElementById('auth-section').style.display = 'block';
            document.getElementById('game-section').style.display = 'none';
            document.getElementById('auth-message').textContent = '';
        }
    } catch (error) {
        document.getElementById('auth-message').textContent = 'Error logging out.';
    }
}

// Check if user is already logged in on page load
async function checkAuth() {
    try {
        const response = await fetch('/api/me');
        const data = await response.json();

        if (response.ok && data.username) {
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('game-section').style.display = 'block';
            document.getElementById('welcome-message').textContent = `Welcome, ${data.username}!`;
        } else {
            document.getElementById('auth-section').style.display = 'block';
            document.getElementById('game-section').style.display = 'none';
        }
    } catch (error) {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('game-section').style.display = 'none';
    }
}

// Call checkAuth when the page loads
window.onload = checkAuth;
