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
    resetGame();
}

function showGame(username) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('game-section').style.display = 'block';
    document.getElementById('welcome-message').innerText = `Welcome, ${username}!`;
}

// --- Game Logic ---

const WIN_COMBOS = [
    [0, 1, 2], // top row
    [3, 4, 5], // middle row
    [6, 7, 8], // bottom row
    [0, 3, 6], // left column
    [1, 4, 7], // middle column
    [2, 5, 8], // right column
    [0, 4, 8], // diagonal
    [2, 4, 6], // diagonal
];

let currentPlayer = 'X';
let gameOver = false;
let board = ['', '', '', '', '', '', '', '', ''];

function checkWinner() {
    for (const combo of WIN_COMBOS) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], combo };
        }
    }
    return null;
}

function checkDraw() {
    return board.every(cell => cell !== '');
}

function highlightWinner(combo) {
    combo.forEach(index => {
        document.querySelectorAll('.cell')[index].classList.add('winner');
    });
}

function resetGame() {
    currentPlayer = 'X';
    gameOver = false;
    board = ['', '', '', '', '', '', '', '', ''];

    document.querySelectorAll('.cell').forEach(cell => {
        cell.innerText = '';
        cell.classList.remove('winner');
    });

    document.getElementById('turn-indicator').innerText = "Player X's Turn";
}

document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.cell');
    const turnIndicator = document.getElementById('turn-indicator');

    cells.forEach(cell => {
        cell.addEventListener('click', (e) => {
            const index = e.target.dataset.index;

            // Ignore click if cell is taken or game is over
            if (e.target.innerText !== '' || gameOver) return;

            // Place the mark
            e.target.innerText = currentPlayer;
            board[index] = currentPlayer;

            // Check for a winner
            const result = checkWinner();
            if (result) {
                turnIndicator.innerText = `Player ${result.winner} wins! 🎉`;
                highlightWinner(result.combo);
                gameOver = true;
                return;
            }

            // Check for a draw
            if (checkDraw()) {
                turnIndicator.innerText = "It's a draw! 🤝";
                gameOver = true;
                return;
            }

            // Switch turns
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            turnIndicator.innerText = `Player ${currentPlayer}'s Turn`;
        });
    });
});
