// ── Game state ──────────────────────────────────────────────
let currentPlayer = 'X';
let board = ['', '', '', '', '', '', '', '', ''];
let gameOver = false;
let gameMode = 'pvp';
let aiDifficulty = null;
let aiPersonality = null;

// ── Ultimate Tic Tac Toe state ──────────────────────────────
let largeBoard = ['', '', '', '', '', '', '', '', '']; // Tracks winner of each small board
let smallBoards = Array(9).fill().map(() => Array(9).fill('')); // 9 small boards, each with 9 cells
let ultimateGameOver = false;

const WIN_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]              // diagonals
];

// ── Win / draw detection ─────────────────────────────────────
function checkWinner(board) {
    for (const [a, b, c] of WIN_COMBOS) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

function checkDraw(board) {
    return board.every(cell => cell !== '');
}

// ── Highlight the winning cells green ────────────────────────
function highlightWinner(boardType, boardIndex = null) {
    for (const [a, b, c] of WIN_COMBOS) {
        if (boardType === 'standard') {
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                const cells = document.querySelectorAll('#standard-board .cell');
                cells[a].classList.add('winner');
                cells[b].classList.add('winner');
                cells[c].classList.add('winner');
                break;
            }
        } else if (boardType === 'small' && boardIndex !== null) {
            if (smallBoards[boardIndex][a] && smallBoards[boardIndex][a] === smallBoards[boardIndex][b] && smallBoards[boardIndex][a] === smallBoards[boardIndex][c]) {
                const smallCells = document.querySelectorAll(`.small-board[data-large-index="${boardIndex}"] .small-cell`);
                smallCells[a].classList.add('winner');
                smallCells[b].classList.add('winner');
                smallCells[c].classList.add('winner');
                break;
            }
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
    const winner = checkWinner(board);
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (checkDraw(board)) return 0;

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
function getRandomMove(board) {
    const emptyCells = board.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

// ── AI Logic: Medium (Block/Win + Random) ─────────────────────
function getMediumMove(board) {
    for (let i = 0; i < WIN_COMBOS.length; i++) {
        const [a, b, c] = WIN_COMBOS[i];
        if (board[a] === 'O' && board[b] === 'O' && board[c] === '') return c;
        if (board[a] === 'O' && board[c] === 'O' && board[b] === '') return b;
        if (board[b] === 'O' && board[c] === 'O' && board[a] === '') return a;
    }
    for (let i = 0; i < WIN_COMBOS.length; i++) {
        const [a, b, c] = WIN_COMBOS[i];
        if (board[a] === 'X' && board[b] === 'X' && board[c] === '') return c;
        if (board[a] === 'X' && board[c] === 'X' && board[b] === '') return b;
        if (board[b] === 'X' && board[c] === 'X' && board[a] === '') return a;
    }
    if (board[4] === '') return 4;
    const corners = [0, 2, 6, 8].filter(i => board[i] === '');
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
    return getRandomMove(board);
}

// ── AI Logic: Hard (Minimax) ──────────────────────────────────
function getHardMove(board) {
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
function getAIMove(board) {
    if (aiDifficulty === 'easy') return getRandomMove(board);
    if (aiDifficulty === 'medium') return getMediumMove(board);
    if (aiDifficulty === 'hard') return getHardMove(board);
    return getRandomMove(board);
}

// ── Standard Tic Tac Toe: AI Move ────────────────────────────
function makeAIMove() {
    if (gameOver) return;
    const aiMove = getAIMove(board);
    if (aiMove !== null) {
        board[aiMove] = 'O';
        const cells = document.querySelectorAll('#standard-board .cell');
        cells[aiMove].textContent = 'O';
        cells[aiMove].classList.add('taken');

        const winner = checkWinner(board);
        if (winner) {
            gameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = getRandomMessage('win', winner);
            highlightWinner('standard');
            saveGame(winner, winner === 'O' ? 'AI wins' : 'Player wins');
        } else if (checkDraw(board)) {
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

// ── Ultimate Tic Tac Toe: Check if a small board is won or drawn ────
function checkSmallBoardWinner(largeIndex) {
    return checkWinner(smallBoards[largeIndex]);
}

function isSmallBoardDrawn(largeIndex) {
    return checkDraw(smallBoards[largeIndex]);
}

function isSmallBoardFinished(largeIndex) {
    return checkSmallBoardWinner(largeIndex) !== null || isSmallBoardDrawn(largeIndex);
}

// ── Ultimate Tic Tac Toe: Check if the large board is won or drawn ────
function checkLargeBoardWinner() {
    return checkWinner(largeBoard);
}

function isLargeBoardDrawn() {
    return largeBoard.every(cell => cell !== '');
}

// ── Ultimate Tic Tac Toe: Handle small cell click ────────────
function handleSmallCellClick(e) {
    if (gameMode !== 'ultimate' || ultimateGameOver) return;
    
    const largeIndex = parseInt(e.target.getAttribute('data-large-index'));
    const smallIndex = parseInt(e.target.getAttribute('data-small-index'));
    
    // Check if the small board is already won
    if (isSmallBoardFinished(largeIndex)) {
        alert(`This small board is already finished!`);
        return;
    }
    
    // Check if the cell is already taken
    if (smallBoards[largeIndex][smallIndex] !== '') {
        return;
    }
    
    // Make the move
    smallBoards[largeIndex][smallIndex] = currentPlayer;
    e.target.textContent = currentPlayer;
    e.target.classList.add('taken');
    
    // Check if this small board is now won
    const smallWinner = checkSmallBoardWinner(largeIndex);
    if (smallWinner) {
        largeBoard[largeIndex] = smallWinner;
        const largeCellWinner = document.querySelector(`.large-cell[data-large-index="${largeIndex}"] .large-cell-winner`);
        if (largeCellWinner) {
            largeCellWinner.textContent = smallWinner;
            largeCellWinner.classList.add('taken');
        }
        highlightWinner('small', largeIndex);
    } else if (isSmallBoardDrawn(largeIndex)) {
        largeBoard[largeIndex] = 'draw';
        const largeCellWinner = document.querySelector(`.large-cell[data-large-index="${largeIndex}"] .large-cell-winner`);
        if (largeCellWinner) {
            largeCellWinner.textContent = 'Draw';
            largeCellWinner.classList.add('draw');
        }
    }
    
    // Check if the large board is won
    const largeWinner = checkLargeBoardWinner();
    if (largeWinner) {
        ultimateGameOver = true;
        document.getElementById('turn-indicator').textContent = '';
        document.getElementById('game-status').textContent = `Player ${largeWinner} wins the Ultimate Game! 🎉`;
        saveGame(largeWinner, `${largeWinner} wins Ultimate Tic Tac Toe`);
    } else if (isLargeBoardDrawn()) {
        ultimateGameOver = true;
        document.getElementById('turn-indicator').textContent = '';
        document.getElementById('game-status').textContent = 'Ultimate Game is a draw!';
        saveGame(null, 'Ultimate Tic Tac Toe draw');
    } else {
        // Switch player
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        document.getElementById('turn-indicator').textContent = `Player ${currentPlayer}'s Turn (Any Board)`;
    }
}

// ── Save a finished game to the server ───────────────────────
async function saveGame(winner, result) {
    try {
        const response = await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                winner,
                result,
                board: gameMode === 'ultimate' ? { largeBoard, smallBoards } : board,
                gameMode,
                aiDifficulty: gameMode === 'ai' ? aiDifficulty : null,
                aiPersonality: gameMode === 'ai' ? aiPersonality : null
            })
        });
        if (response.ok) {
            loadHistory();
            setTimeout(() => refreshAllStats(), 300);
        } else {
            console.warn('Game not saved (not logged in?)');
        }
    } catch (err) {
        console.error('Error saving game:', err);
    }
}

// ── Refresh all CP08-stats (stats and leaderboards) ─────────
async function refreshAllStats() {
    try {
        const statsElements = document.querySelectorAll('.stat-value, .global-stat-value');
        statsElements.forEach(el => el.textContent = '...');
        await Promise.all([
            loadStats(),
            loadLeaderboard(),
            loadAIStats(),
            loadAILeaderboard()
        ]);
    } catch (err) {
        console.error('Error refreshing stats:', err);
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
                ? 'Draw'
                : `${game.winner} wins`;

            let gameDisplay;
            if (game.gameMode === 'ultimate') {
                gameDisplay = '<p>Ultimate Tic Tac Toe</p>';
            } else {
                const cells = game.board.map((cell, i) =>
                    `<span class="mini-cell" data-index="${i}">${cell}</span>`
                ).join('');
                gameDisplay = `<div class="mini-board">${cells}</div>`;
            }

            const difficultyInfo = game.aiDifficulty ? 
                `<div class="game-meta">Difficulty: ${game.aiDifficulty}, Personality: ${game.aiPersonality || 'neutral'}</div>` : '';

            return `
                <div class="history-card">
                    <div class="history-meta">
                        <span class="history-result">${resultText}</span>
                        <span class="history-date">${date}</span>
                    </div>
                    ${difficultyInfo}
                    ${gameDisplay}
                </div>
            `;
        }).join('');

    } catch (err) {
        historyList.innerHTML = '<p>Could not load history.</p>';
        console.error(err);
    }
}

// ── Load and display player stats (by difficulty + global) ───
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            console.warn('Not logged in or no stats available.');
            return;
        }

        const data = await response.json();
        const byDifficulty = data.byDifficulty || {};
        const global = data.global || { wins: 0, losses: 0, draws: 0 };

        ['easy', 'medium', 'hard'].forEach(difficulty => {
            const difficultyStats = byDifficulty[difficulty] || { wins: 0, losses: 0, draws: 0 };
            document.getElementById(`${difficulty}-wins`).textContent = difficultyStats.wins;
            document.getElementById(`${difficulty}-losses`).textContent = difficultyStats.losses;
            document.getElementById(`${difficulty}-draws`).textContent = difficultyStats.draws;
        });

        document.getElementById('global-wins').textContent = global.wins;
        document.getElementById('global-losses').textContent = global.losses;
        document.getElementById('global-draws').textContent = global.draws;

        const totalGames = global.wins + global.losses + global.draws;
        const winRate = totalGames > 0 ? Math.round((global.wins / totalGames) * 100) : 0;
        document.getElementById('global-win-rate').textContent = `${winRate}%`;

    } catch (err) {
        console.error('Error loading player stats:', err);
    }
}

// ── Load and display AI stats (global) ───────────────────────
async function loadAIStats() {
    try {
        const response = await fetch('/api/ai-stats');
        if (!response.ok) {
            console.warn('Could not load AI stats.');
            return;
        }

        const data = await response.json();
        const globalAI = data.global || { wins: 0, losses: 0, draws: 0, winRate: 0 };

        document.getElementById('ai-global-wins').textContent = globalAI.wins;
        document.getElementById('ai-global-losses').textContent = globalAI.losses;
        document.getElementById('ai-global-draws').textContent = globalAI.draws;
        document.getElementById('ai-global-win-rate').textContent = `${globalAI.winRate}%`;

    } catch (err) {
        console.error('Error loading AI stats:', err);
    }
}

// ── Load and display player leaderboard ──────────────────────
async function loadLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
            console.warn('Could not load player leaderboard.');
            return;
        }

        const leaderboard = await response.json();
        const leaderboardBody = document.getElementById('leaderboard-body');

        if (leaderboard.length === 0) {
            leaderboardBody.innerHTML = '<tr><td colspan="5">No players on the leaderboard yet.</td></tr>';
            return;
        }

        leaderboardBody.innerHTML = leaderboard.map((entry, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${entry.username}</td>
                <td>${entry.totalWins}</td>
                <td>${entry.totalGames}</td>
                <td>${entry.winRate}%</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Error loading player leaderboard:', err);
    }
}

// ── Load and display AI leaderboard ──────────────────────────
async function loadAILeaderboard() {
    try {
        const response = await fetch('/api/ai-leaderboard');
        if (!response.ok) {
            console.warn('Could not load AI leaderboard.');
            return;
        }

        const aiLeaderboard = await response.json();
        const aiLeaderboardBody = document.getElementById('ai-leaderboard-body');

        if (aiLeaderboard.length === 0) {
            aiLeaderboardBody.innerHTML = '<tr><td colspan="6">No AI configurations on the leaderboard yet.</td></tr>';
            return;
        }

        aiLeaderboardBody.innerHTML = aiLeaderboard.map((entry, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${entry.difficulty}</td>
                <td>${entry.personality}</td>
                <td>${entry.totalWins}</td>
                <td>${entry.totalGames}</td>
                <td>${entry.winRate}%</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Error loading AI leaderboard:', err);
    }
}

// ── Reset stats for a specific difficulty ──────────────────
async function resetStats(difficulty) {
    if (!confirm(`Are you sure you want to reset your ${difficulty} difficulty stats?`)) return;
    
    try {
        const response = await fetch('/api/stats/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ difficulty })
        });
        
        if (response.ok) {
            refreshAllStats();
            alert(`Stats reset for ${difficulty} difficulty!`);
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to reset stats.');
        }
    } catch (err) {
        console.error('Error resetting stats:', err);
    }
}

// ── Clear game history for the logged-in user ──────────────
async function clearHistory() {
    if (!confirm('Are you sure you want to clear your game history?')) return;
    try {
        const response = await fetch('/api/games', { method: 'DELETE' });
        if (response.ok) {
            loadHistory();
            refreshAllStats();
            alert('History cleared!');
        } else {
            alert('Failed to clear history.');
        }
    } catch (err) {
        console.error('Error clearing history:', err);
    }
}

// ── Toggle game mode settings visibility ────────────────────
function toggleGameMode() {
    const modeSelect = document.getElementById('game-mode');
    gameMode = modeSelect.value;
    const difficultySection = document.getElementById('difficulty-section');
    const personalitySection = document.getElementById('personality-section');
    const standardBoard = document.getElementById('standard-board');
    const ultimateBoard = document.getElementById('ultimate-board');

    if (gameMode === 'ai') {
        difficultySection.style.display = 'flex';
        personalitySection.style.display = 'flex';
        standardBoard.style.display = 'grid';
        ultimateBoard.style.display = 'none';
        if (aiDifficulty === null) aiDifficulty = 'medium';
        if (aiPersonality === null) aiPersonality = 'neutral';
        document.getElementById('ai-difficulty').value = aiDifficulty;
        document.getElementById('ai-personality').value = aiPersonality;
    } else if (gameMode === 'ultimate') {
        difficultySection.style.display = 'none';
        personalitySection.style.display = 'none';
        standardBoard.style.display = 'none';
        ultimateBoard.style.display = 'block';
        aiDifficulty = null;
        aiPersonality = null;
    } else {
        difficultySection.style.display = 'none';
        personalitySection.style.display = 'none';
        standardBoard.style.display = 'grid';
        ultimateBoard.style.display = 'none';
        aiDifficulty = null;
        aiPersonality = null;
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

// ── Standard Tic Tac Toe: Cell click handler ────────────────
function handleCellClick(e) {
    if (gameMode === 'ai' && currentPlayer === 'O') return;
    if (gameMode === 'ultimate') return;
    const index = parseInt(e.target.getAttribute('data-index'));
    if (board[index] !== '' || gameOver) return;

    board[index] = currentPlayer;
    e.target.textContent = currentPlayer;
    e.target.classList.add('taken');

    const winner = checkWinner(board);
    if (winner) {
        gameOver = true;
        document.getElementById('turn-indicator').textContent = '';
        document.getElementById('game-status').textContent = getRandomMessage('win', winner);
        highlightWinner('standard');
        saveGame(winner, winner === 'O' ? 'AI wins' : 'Player wins');
    } else if (checkDraw(board)) {
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

// ── Reset the game ───────────────────────────────────────────
function resetGame() {
    // Reset standard board
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameOver = false;
    ultimateGameOver = false;

    // Reset ultimate board
    largeBoard = ['', '', '', '', '', '', '', '', ''];
    smallBoards = Array(9).fill().map(() => Array(9).fill(''));

    // Reset UI for standard board
    document.querySelectorAll('#standard-board .cell').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'winner');
    });

    // Reset UI for ultimate board
    document.querySelectorAll('.small-cell').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'winner');
    });
    document.querySelectorAll('.large-cell-winner').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'draw', 'X', 'O');
    });
    document.querySelectorAll('.large-cell').forEach(cell => {
        cell.classList.remove('active');
    });

    // Reset status
    document.getElementById('turn-indicator').textContent = gameMode === 'ai'
        ? getRandomMessage('turn')
        : gameMode === 'ultimate'
            ? "Player X's Turn (Any Board)"
            : "Player X's Turn";
    document.getElementById('game-status').textContent = '';
}

// ── Attach click listeners ──────────────────────────────────
function initBoard() {
    // Standard board listeners
    document.querySelectorAll('#standard-board .cell').forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    // Ultimate board listeners
    document.querySelectorAll('.small-cell').forEach(cell => {
        cell.addEventListener('click', handleSmallCellClick);
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
    aiDifficulty = null;
    aiPersonality = null;
}

function showGame(username) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('game-section').style.display = 'block';
    document.getElementById('welcome-message').textContent = `Welcome, ${username}!`;
    loadHistory();
    refreshAllStats();
    toggleGameMode();
}
