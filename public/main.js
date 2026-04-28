// Game state
let currentPlayer = 'X';
let board = ['', '', '', '', '', '', '', '', ''];
let gameOver = false;

const WIN_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]              // diagonals
];

// Check if current board state has a winner
function checkWinner() {
    for (const [a, b, c] of WIN_COMBOS) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // returns 'X' or 'O'
        }
    }
    return null;
}

// Check if board is full (draw)
function checkDraw() {
    return board.every(cell => cell !== '');
}

// Handle a cell click
function handleCellClick(e) {
    const index = parseInt(e.target.getAttribute('data-index'));

    // Ignore click if cell already filled or game is over
    if (board[index] !== '' || gameOver) return;

    // Place the mark
    board[index] = currentPlayer;
    e.target.textContent = currentPlayer;
    e.target.classList.add('taken');

    const winner = checkWinner();

    if (winner) {
        gameOver = true;
        document.getElementById('turn-indicator').textContent = '';
        document.getElementById('game-status').textContent = `Player ${winner} wins! 🎉`;
        highlightWinner();
    } else if (checkDraw()) {
        gameOver = true;
        document.getElementById('turn-indicator').textContent = '';
        document.getElementById('game-status').textContent = "It's a draw! 🤝";
    } else {
        // Switch player
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        document.getElementById('turn-indicator').textContent = `Player ${currentPlayer}'s Turn`;
    }
}

// Highlight the winning cells
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

// Reset the game board
function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameOver = false;

    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'winner');
    });

    document.getElementById('turn-indicator').textContent = "Player X's Turn";
    document.getElementById('game-status').textContent = '';
}

// Attach click handlers to all cells
function initBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
}

// --- AUTH ---

window.onload = async () => {
    const response = await fetch('/api/me');
    if (response.ok) {
        const data = await response.json();
        showGame(data.username);
    }
    initBoard();
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
}
