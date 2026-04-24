// Check if user is already logged in when the page loads
window.onload = async () => {
    const response = await fetch('/api/me');
    if (response.ok) {
        const data = await response.json();
        showGame(data.username);
    }
};

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    document.getElementById('auth-message').innerText = data.error || data.message;
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
        showGame(data.username);
    } else {
        document.getElementById('auth-message').innerText = data.error;
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    document.getElementById('game-section').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('auth-message').innerText = 'Logged out.';
}

function showGame(username) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('game-section').style.display = 'block';
    document.getElementById('welcome-message').innerText = `Welcome, ${username}!`;
}