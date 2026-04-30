// ── Game state ──────────────────────────────────────────────
let currentPlayer = 'X';
let board = ['', '', '', '', '', '', '', '', ''];
let gameOver = false;

const WIN_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]              // diagonals
];

// ── Win / draw detection ─────────────────────────────────────
function checkWinner() {
    for (const [a, b, c] of WIN_COMBOS) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // 'X' or 'O'
        }
    }
    return null;
}

function checkDraw() {
    return board.every(cell => cell !== '');
}

// ── Highlight the winning cells green ────────────────────────
function highlightWinner() {
    for (const [a, b, c] of WIN_COMBOS) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            const cells = document.querySelectorAll('.cell');
            cells[a].classList.add('winner');
            cells[b].classList.add('winner');
            cells[c].classList.add('winner');
            break;
        }
    }
}

// ── Save a finished game to the server ───────────────────────
async function saveGame(winner, result) {
    try {
        const response = await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ winner, result, board })
        });

        if (response.ok) {
            // Refresh the history panel so the new game shows up immediately
            loadHistory();
        } else {
            console.warn('Game not saved (not logged in?)');
        }
    } catch (err) {
        console.error('Error saving game:', err);
    }
}

// ── Load and display game history ────────────────────────────
async function loadHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    try {
        const response = await fetch('/api/games');

        if (!response.ok) {
            historyList.innerHTML = '<p>Log in to see your history.</p>';
            return;
        }

        const games = await response.json();

        if (games.length === 0) {
            historyList.innerHTML = '<p>No games played yet.</p>';
            return;
        }

        // Build a small card for each past game
        historyList.innerHTML = games.map(game => {
            const date = new Date(game.playedAt).toLocaleString();
            const resultText = game.result === 'draw'
                ? "Draw 🤝"
                : `${game.winner} wins 🎉`;

            // Render the mini board with proper styling
            const cells = game.board.map((cell, i) =>
                `<span class="mini-cell" data-index="${i}">${cell}</span>`
            ).join('');

            return `
                <div class="history-card">
                    <div class="history-meta">
                        <span class="history-result">${resultText}</span>
                        <span class="history-date">${date}</span>
                    </div>
                    <div class="mini-board">${cells}</div>
                </div>
            `;
        }).join('');

    } catch (err) {
        historyList.innerHTML = '<p>Could not load history.</p>';
        console.error(err);
    }
}

// ── Clear game history for the logged-in user ──────────────
async function clearHistory() {
    if (!confirm('Are you sure you want to clear your game history?')) return;

    try {
        const response = await fetch('/api/games', { method: 'DELETE' });
        if (response.ok) {
            loadHistory();
            alert('History cleared!');
        } else {
            alert('Failed to clear history.');
        }
    } catch (err) {
        console.error('Error clearing history:', err);
    }
}

// ── Cell click handler ────────────────────────────────────────
function handleCellClick(e) {
    const index = parseInt(e.target.getAttribute('data-index'));

    if (board[index] !== '' || gameOver) return;

    board[index] = currentPlayer;
    e.target.textContent = currentPlayer;
    e.target.classList.add('taken');

    const winner = checkWinner();

    if (winner) {
        gameOver = true;
        document.getElementById('turn-indicator').textContent = '';
        document.getElementById('game-status').textContent = `Player ${winner} wins! 🎉`;
        highlightWinner();
        saveGame(winner, `${winner} wins`);

    } else if (checkDraw()) {
        gameOver = true;
        document.getElementById('turn-indicator').textContent = '';
        document.getElementById('game-status').textContent = "It's a draw! 🤝";
        saveGame(null, 'draw');

    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        document.getElementById('turn-indicator').textContent =
            `Player ${currentPlayer}'s Turn`;
    }
}

// ── Reset the board ───────────────────────────────────────────
function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameOver = false;

    document.querySelectorAll('.cell').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'winner');
    });

    document.getElementById('turn-indicator').textContent = "Player X's Turn";
    document.getElementById('game-status').textContent = '';
}

// ── Attach click listeners to every cell ─────────────────────
function initBoard() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
}

// ── Auth ──────────────────────────────────────────────────────
window.onload = async () => {
    initBoard();

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
    document.getElementById('auth-message').textContent = data.error || data.message;
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
        document.getElementById('auth-message').textContent = data.error;
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    document.getElementById('game-section').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('auth-message').textContent = 'Logged out.';
    resetGame();
}

function showGame(username) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('game-section').style.display = 'block';
    document.getElementById('welcome-message').textContent = `Welcome, ${username}!`;
    loadHistory(); // load history whenever someone logs in
}