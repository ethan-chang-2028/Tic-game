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
document.addEventListener("DOMContentLoaded", () => {
    const cells = document.querySelectorAll(".cell");
    const turnIndicator = document.getElementById("turn-indicator");
    let currentPlayer = "X";

    cells.forEach(cell => {
        cell.addEventListener("click", (e) => {
            // Prevent overwriting a cell that has already been clicked
            if (e.target.innerText !== "") return;

            // Draw the X or O in the cell
            e.target.innerText = currentPlayer;

            // Switch the active player
            currentPlayer = currentPlayer === "X" ? "O" : "X";

            // Update the turn indicator text at the top
            turnIndicator.innerText = `Player ${currentPlayer}'s Turn`;
        });
    });
});