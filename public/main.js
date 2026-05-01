// ── Game state ──────────────────────────────────────────────
let currentPlayer = 'X';
let board = ['', '', '', '', '', '', '', '', ''];
let gameOver = false;
let gameMode = 'pvp'; // 'pvp' or 'ai'
let aiDifficulty = 'medium'; // 'easy', 'medium', 'hard'
let aiPersonality = 'neutral'; // 'neutral', 'mathematician', 'psychologist'

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

// ── AI Personalities with Varied Responses ────────────────────
const personalities = {
    neutral: {
        win: [" wins! 🎉", " wins! Good game!", " wins! Try again!", " wins! You'll get it next time!"],
        lose: ["You got me this time...", "Nice move!", "Well played!", "I'll get you next time!"],
        draw: ["It's a draw! 🤝", "A tie! Close game!", "Draw! Want a rematch?", "No winner this time!"],
        thinking: ["AI is thinking...", "Calculating...", "Making a move...", "Processing..."],
        turn: ["Your Turn", "Your move", "Go ahead", "Make your move"]
    },
    mathematician: {
        win: [" wins by the power of logic! ∫√∑", " wins! The numbers don't lie.", " wins! A calculated victory.", " wins! x + y = victory!"],
        lose: ["Your strategy was... unexpected. Recalculating...", "An anomaly in the data!", "I need to recalibrate my algorithms.", "That was statistically unlikely!"],
        draw: ["A perfect equilibrium! 1-1=0", "The game is in balance.", "A draw! The math checks out.", "Symmetry achieved!"],
        thinking: ["Calculating optimal move...", "Running simulations...", "Solving the equation...", "Analyzing probabilities..."],
        turn: ["Your move, human.", "Input your coordinates.", "What's your next variable?", "Your turn to solve."]
    },
    psychologist: {
        win: [" wins! I knew you'd pick that spot. 😉", " wins! Your patterns are predictable.", " wins! I'm inside your head.", " wins! Did you see that coming?"],
        lose: ["Interesting... you outsmarted me. Let's analyze that.", "Fascinating choice! Tell me more.", "Your subconscious led you well.", "I didn't expect that. Well done!"],
        draw: ["A stalemate. Your subconscious is strong.", "A draw! We're equally matched.", "No winner. The mind is complex.", "A tie. What were you thinking?"],
        thinking: ["Analyzing your patterns...", "Reading your mind...", "Predicting your next move...", "Studying your behavior..."],
        turn: ["What's your next move?", "Show me your strategy.", "Where will you go?", "Your turn to reveal yourself."]
    }
};

// Helper function to get a random message from the personality arrays
function getRandomMessage(type, winner) {
    const p = personalities[aiPersonality];
    if (!p) return '';
    
    const messages = p[type];
    if (!messages || messages.length === 0) return '';
    
    const randomIndex = Math.floor(Math.random() * messages.length);
    let message = messages[randomIndex];
    
    if (type === 'win') {
        if (winner === 'O') {
            return `AI${message}`;
        } else {
            return `Player ${winner}${message}`;
        }
    }
    
    return message;
}

// ── AI Logic: Minimax Algorithm (Hard) ───────────────────────
function minimax(board, depth, isMaximizing) {
    const winner = checkWinner();
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (checkDraw()) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// ── AI Logic: Easy (Random Move) ────
function getRandomMove() {
    const emptyCells = board.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

// ── AI Logic: Medium (Block/Win + Random) ─────────────────────
function getMediumMove() {
    // Check for winning move
    for (let i = 0; i < WIN_COMBOS.length; i++) {
        const [a, b, c] = WIN_COMBOS[i];
        if (board[a] === 'O' && board[b] === 'O' && board[c] === '') return c;
        if (board[a] === 'O' && board[c] === 'O' && board[b] === '') return b;
        if (board[b] === 'O' && board[c] === 'O' && board[a] === '') return a;
    }
    // Block player's winning move
    for (let i = 0; i < WIN_COMBOS.length; i++) {
        const [a, b, c] = WIN_COMBOS[i];
        if (board[a] === 'X' && board[b] === 'X' && board[c] === '') return c;
        if (board[a] === 'X' && board[c] === 'X' && board[b] === '') return b;
        if (board[b] === 'X' && board[c] === 'X' && board[a] === '') return a;
    }
    // Take center if available
    if (board[4] === '') return 4;
    // Take a corner if available
    const corners = [0, 2, 6, 8].filter(i => board[i] === '');
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
    // Random move
    return getRandomMove();
}

// ── AI Logic: Hard (Minimax) ──────────────────────────────────
function getHardMove() {
    let bestScore = -Infinity;
    let bestMove = null;
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    return bestMove;
}

// ── AI makes a move based on difficulty ──────────────────────
function getAIMove() {
    if (aiDifficulty === 'easy') return getRandomMove();
    if (aiDifficulty === 'medium') return getMediumMove();
    if (aiDifficulty === 'hard') return getHardMove();
    return getRandomMove();
}

function makeAIMove() {
    if (gameOver) return;
    const aiMove = getAIMove();
    if (aiMove !== null) {
        board[aiMove] = 'O';
        const cells = document.querySelectorAll('.cell');
        cells[aiMove].textContent = 'O';
        cells[aiMove].classList.add('taken');

        const winner = checkWinner();
        if (winner) {
            gameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = getRandomMessage('win', winner);
            highlightWinner();
            saveGame(winner, winner === 'O' ? 'AI wins' : 'Player wins');
        } else if (checkDraw()) {
            gameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = getRandomMessage('draw');
            saveGame(null, 'draw');
        } else {
            currentPlayer = 'X';
            document.getElementById('turn-indicator').textContent = getRandomMessage('turn');
        }
    }
}

// ── Save a finished game to the server ───────────────────────
async function saveGame(winner, result) {
    try {
        const response = await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ winner, result, board, aiDifficulty, aiPersonality })
        });
        if (response.ok) {
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

        historyList.innerHTML = games.map(game => {
            const date = new Date(game.playedAt).toLocaleString();
            const resultText = game.result === 'draw'
                ? getRandomMessage('draw')
                : `${game.winner} wins`;

            const cells = game.board.map((cell, i) =>
                `<span class="mini-cell" data-index="${i}">${cell}</span>`
            ).join('');

            const difficultyInfo = game.aiDifficulty ? 
                `<div class="game-meta">Difficulty: ${game.aiDifficulty}, Personality: ${game.aiPersonality || 'neutral'}</div>` : '';

            return `
                <div class="history-card">
                    <div class="history-meta">
                        <span class="history-result">${resultText}</span>
                        <span class="history-date">${date}</span>
                    </div>
                    ${difficultyInfo}
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

// ── Toggle AI settings visibility ────────────────────────────
function toggleAISettings() {
    const modeSelect = document.getElementById('game-mode');
    gameMode = modeSelect.value;
    const difficultySection = document.getElementById('difficulty-section');
    const personalitySection = document.getElementById('personality-section');

    if (gameMode === 'ai') {
        difficultySection.style.display = 'flex';
        personalitySection.style.display = 'flex';
    } else {
        difficultySection.style.display = 'none';
        personalitySection.style.display = 'none';
    }
    resetGame();
}

// ── Set AI difficulty ────────────────────────────────────────
function setAIDifficulty() {
    const difficultySelect = document.getElementById('ai-difficulty');
    aiDifficulty = difficultySelect.value;
}

// ── Set AI personality ───────────────────────────────────────
function setAIPersonality() {
    const personalitySelect = document.getElementById('ai-personality');
    aiPersonality = personalitySelect.value;
}

// ── Cell click handler ────────────────────────────────────────
function handleCellClick(e) {
    if (gameMode === 'ai' && currentPlayer === 'O') return;
    const index = parseInt(e.target.getAttribute('data-index'));
    if (board[index] !== '' || gameOver) return;

    board[index] = currentPlayer;
    e.target.textContent = currentPlayer;
    e.target.classList.add('taken');

    const winner = checkWinner();
    if (winner) {
        gameOver = true;
        document.getElementById('turn-indicator').textContent = '';
        document.getElementById('game-status').textContent = getRandomMessage('win', winner);
        highlightWinner();
        saveGame(winner, winner === 'O' ? 'AI wins' : 'Player wins');
    } else if (checkDraw()) {
        gameOver = true;
        document.getElementById('turn-indicator').textContent = '';
        document.getElementById('game-status').textContent = getRandomMessage('draw');
        saveGame(null, 'draw');
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        document.getElementById('turn-indicator').textContent = gameMode === 'ai'
            ? (currentPlayer === 'X' ? getRandomMessage('turn') : getRandomMessage('thinking'))
            : `Player ${currentPlayer}'s Turn`;

        if (gameMode === 'ai' && currentPlayer === 'O') {
            setTimeout(makeAIMove, 500);
        }
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

    document.getElementById('turn-indicator').textContent = gameMode === 'ai'
        ? getRandomMessage('turn')
        : "Player X's Turn";
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
    loadHistory();
    toggleAISettings();
}
