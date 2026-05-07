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
window.onload = checkAuth;

// Game state
let currentPlayer = 'X';
let board = ['', '', '', '', '', '', '', '', ''];
let gameOver = false;
let gameMode = 'pvp';
let aiDifficulty = null;
let aiPersonality = null;
let largeBoard = ['', '', '', '', '', '', '', '', ''];
let smallBoards = Array(9).fill().map(() => Array(9).fill(''));
let ultimateGameOver = false;
let aiLearningData = { neutral: null, mathematician: null, psychologist: null };
let aiMoveHistory = [];
const TOURNAMENT_AI_PERSONALITIES = ['neutral', 'mathematician', 'psychologist'];
const TOURNAMENT_AI_DIFFICULTIES = ['easy', 'medium'];
let tournament = {
    active: false, size: 32, type: 'group_knockout', gameType: 'standard',
    aiDifficulty: 'medium', allAI: true, stage: 'setup', players: [], groups: [],
    groupResults: {}, knockoutBracket: [], currentGroupIndex: 0, currentGroupMatch: 0,
    currentKnockoutRound: 0, currentKnockoutMatch: 0, matchHistory: [],
    currentMatchPlayers: null, currentMatchAIPlayer: null
};
const WIN_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]
];
function resetGame() {
    currentPlayer = 'X'; board = ['', '', '', '', '', '', '', '', ''];
    gameOver = false; largeBoard = ['', '', '', '', '', '', '', '', ''];
    smallBoards = Array(9).fill().map(() => Array(9).fill('')); ultimateGameOver = false;
    document.querySelectorAll('#standard-board .cell').forEach(cell => {
        cell.textContent = ''; cell.classList.remove('taken', 'winner');
    });
    document.querySelectorAll('.small-cell').forEach(cell => {
        cell.textContent = ''; cell.classList.remove('taken', 'winner');
    });
    document.querySelectorAll('.large-cell-winner').forEach(cell => {
        cell.textContent = ''; cell.classList.remove('taken', 'draw');
    });
    document.getElementById('turn-indicator').textContent = 'Your Turn';
    document.getElementById('game-status').textContent = '';
}
function checkWinner(b) {
    for (const [a, b, c] of WIN_COMBOS) if (b[a] && b[a] === b[b] && b[a] === b[c]) return b[a];
    return null;
}
function checkDraw(b) { return b.every(cell => cell !== ''); }
function highlightWinner(type, idx = null) {
    for (const [a, b, c] of WIN_COMBOS) {
        if (type === 'standard' && board[a] && board[a] === board[b] && board[a] === board[c]) {
            document.querySelectorAll('#standard-board .cell').forEach((cell, i) => {
                if ([a, b, c].includes(i)) cell.classList.add('winner');
            });
            break;
        } else if (type === 'small' && idx !== null && smallBoards[idx][a] && 
                   smallBoards[idx][a] === smallBoards[idx][b] && smallBoards[idx][a] === smallBoards[idx][c]) {
            document.querySelectorAll(`.small-board[data-large-index="${idx}"] .small-cell`).forEach((cell, i) => {
                if ([a, b, c].includes(i)) cell.classList.add('winner');
            });
            break;
        }
    }
}
const personalities = {
    neutral: {
        aiWin: ["AI wins! 🎉", "AI wins! Good game!", "AI wins! Try again!", "AI wins! You'll get it next time!"],
        playerWin: ["You got me this time...", "Nice move!", "Well played!", "I'll get you next time!", "You won this round!", "Good strategy!"],
        draw: ["It's a draw! 🤝", "A tie! Close game!", "Draw! Want a rematch?", "No winner this time!"],
        thinking: ["AI is thinking...", "Calculating...", "Making a move...", "Processing..."],
        turn: ["Your Turn", "Your move", "Go ahead", "Make your move"],
        patternWeights: { winSmallBoard: 1000, blockSmallBoard: 1000, winLargeBoard: 10000, blockLargeBoard: 10000, centerSmall: 10, cornerSmall: 5, centerLarge: 10, cornerLarge: 5 }
    },
    mathematician: {
        aiWin: ["AI wins by the power of logic! ∫√∑", "AI wins! The numbers don't lie.", "AI wins! A calculated victory.", "AI wins! x + y = victory!"],
        playerWin: ["Your strategy was... unexpected. Recalculating...", "An anomaly in the data!", "I need to recalibrate my algorithms.", "That was statistically unlikely!", "My calculations were off by a factor of π!", "You found the flaw in my logic matrix!"],
        draw: ["A perfect equilibrium! 1-1=0", "The game is in balance.", "A draw! The math checks out.", "Symmetry achieved!"],
        thinking: ["Calculating optimal move...", "Running simulations...", "Solving the equation...", "Analyzing probabilities..."],
        turn: ["Your move, human.", "Input your coordinates.", "What's your next variable?", "Your turn to solve."],
        patternWeights: { winSmallBoard: 1500, blockSmallBoard: 800, winLargeBoard: 10000, blockLargeBoard: 10000, centerSmall: 30, cornerSmall: 15, centerLarge: 30, cornerLarge: 15 }
    },
    psychologist: {
        aiWin: ["AI wins! I knew you'd pick that spot. 😉", "AI wins! Your patterns are predictable.", "AI wins! I'm inside your head.", "AI wins! Did you see that coming?"],
        playerWin: ["Interesting... you outsmarted me. Let's analyze that.", "Fascinating choice! Tell me more.", "Your subconscious led you well.", "I didn't expect that. Well done!", "Your psychological profile is more complex than I calculated!", "You broke my behavioral prediction model!"],
        draw: ["A stalemate. Your subconscious is strong.", "A draw! We're equally matched.", "No winner. The mind is complex.", "A tie. What were you thinking?"],
        thinking: ["Analyzing your patterns...", "Reading your mind...", "Predicting your next move...", "Studying your behavior..."],
        turn: ["What's your next move?", "Show me your strategy.", "Where will you go?", "Your turn to reveal yourself."],
        patternWeights: { winSmallBoard: 800, blockSmallBoard: 1500, winLargeBoard: 10000, blockLargeBoard: 10000, centerSmall: 5, cornerSmall: 3, centerLarge: 5, cornerLarge: 3 }
    }
};
function getEffectivePersonality() {
    if (gameMode === 'ai' || gameMode === 'ultimate-ai') return aiPersonality || 'neutral';
    if (tournament.active && tournament.currentMatchAIPlayer) return tournament.currentMatchAIPlayer.personality || 'neutral';
    return 'neutral';
}
function getPlayerWinMessage() {
    const p = personalities[getEffectivePersonality()] || personalities.neutral;
    return p.playerWin ? p.playerWin[Math.floor(Math.random() * p.playerWin.length)] : "You win! Well played!";
}
function getAIWinMessage() {
    const p = personalities[getEffectivePersonality()] || personalities.neutral;
    return p.aiWin ? p.aiWin[Math.floor(Math.random() * p.aiWin.length)] : "AI wins! 🎉";
}
function getRandomMessage(type) {
    const p = personalities[getEffectivePersonality()] || personalities.neutral;
    return p[type] ? p[type][Math.floor(Math.random() * p[type].length)] : '';
}
function getCurrentPatternWeights() {
    const personality = getEffectivePersonality();
    const defaultWeights = personalities[personality]?.patternWeights || personalities.neutral.patternWeights;
    return { ...defaultWeights, ...(aiLearningData[personality] || {}) };
}
function minimax(b, depth, isMaximizing) {
    const winner = checkWinner(b);
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (checkDraw(b)) return 0;
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < b.length; i++) {
            if (b[i] === '') { b[i] = 'O'; let score = minimax(b, depth + 1, false); b[i] = ''; bestScore = Math.max(score, bestScore); }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < b.length; i++) {
            if (b[i] === '') { b[i] = 'X'; let score = minimax(b, depth + 1, true); b[i] = ''; bestScore = Math.min(score, bestScore); }
        }
        return bestScore;
    }
}
function getRandomMove(b) {
    const emptyCells = b.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}
function getMediumMove(b) {
    for (const [a, b, c] of WIN_COMBOS) {
        if (b[a] === 'O' && b[b] === 'O' && b[c] === '') return c;
        if (b[a] === 'O' && b[c] === 'O' && b[b] === '') return b;
        if (b[b] === 'O' && b[c] === 'O' && b[a] === '') return a;
    }
    for (const [a, b, c] of WIN_COMBOS) {
        if (b[a] === 'X' && b[b] === 'X' && b[c] === '') return c;
        if (b[a] === 'X' && b[c] === 'X' && b[b] === '') return b;
        if (b[b] === 'X' && b[c] === 'X' && b[a] === '') return a;
    }
    if (b[4] === '') return 4;
    const corners = [0, 2, 6, 8].filter(i => b[i] === '');
    return corners.length > 0 ? corners[Math.floor(Math.random() * corners.length)] : getRandomMove(b);
}
function getHardMove(b) {
    let bestScore = -Infinity, bestMove = null;
    for (let i = 0; i < b.length; i++) {
        if (b[i] === '') { b[i] = 'O'; let score = minimax(b, 0, false); b[i] = ''; if (score > bestScore) { bestScore = score; bestMove = i; } }
    }
    return bestMove;
}
function getAIMove(b) {
    const effectiveDifficulty = tournament.active ? tournament.aiDifficulty : aiDifficulty;
    if (effectiveDifficulty === 'easy') return getRandomMove(b);
    if (effectiveDifficulty === 'medium') return getMediumMove(b);
    if (effectiveDifficulty === 'hard') return getHardMove(b);
    return getRandomMove(b);
}
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
            const isAIWinner = (gameMode === 'ai' || gameMode === 'ultimate-ai' || tournament.active) && winner === 'O';
            document.getElementById('game-status').textContent = isAIWinner ? getAIWinMessage() : getPlayerWinMessage();
            highlightWinner('standard');
            if (tournament.active) setTimeout(() => recordAndNextTournamentMatch(winner), 1500);
            else saveGame(winner, winner === 'O' ? 'AI wins' : 'Player wins');
        } else if (checkDraw(board)) {
            gameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = getRandomMessage('draw');
            if (tournament.active) setTimeout(() => recordAndNextTournamentMatch(null), 1500);
            else saveGame(null, 'draw');
        } else {
            currentPlayer = 'X';
            document.getElementById('turn-indicator').textContent = getRandomMessage('turn');
        }
    }
}
function checkSmallBoardWinner(largeIndex) { return checkWinner(smallBoards[largeIndex]); }
function isSmallBoardDrawn(largeIndex) { return checkDraw(smallBoards[largeIndex]); }
function isSmallBoardFinished(largeIndex) { return checkSmallBoardWinner(largeIndex) !== null || isSmallBoardDrawn(largeIndex); }
function checkLargeBoardWinner() { return checkWinner(largeBoard); }
function isLargeBoardDrawn() { return largeBoard.every(cell => cell !== ''); }
function getAvailableUltimateMoves() {
    const moves = [];
    for (let largeIndex = 0; largeIndex < 9; largeIndex++) {
        if (isSmallBoardFinished(largeIndex)) continue;
        for (let smallIndex = 0; smallIndex < 9; smallIndex++) {
            if (smallBoards[largeIndex][smallIndex] === '') moves.push({ largeIndex, smallIndex });
        }
    }
    return moves;
}
function evaluateUltimateMove(largeIndex, smallIndex, isAI) {
    const weights = getCurrentPatternWeights();
    const playerSymbol = isAI ? 'O' : 'X';
    const opponentSymbol = isAI ? 'X' : 'O';
    let score = 0;
    const originalValue = smallBoards[largeIndex][smallIndex];
    smallBoards[largeIndex][smallIndex] = playerSymbol;
    if (checkSmallBoardWinner(largeIndex) === playerSymbol) {
        const tempLargeBoard = [...largeBoard]; tempLargeBoard[largeIndex] = playerSymbol;
        score += checkWinner(tempLargeBoard) === playerSymbol ? (weights.winLargeBoard || 10000) : (weights.winSmallBoard || 1000);
    }
    smallBoards[largeIndex][smallIndex] = opponentSymbol;
    if (checkSmallBoardWinner(largeIndex) === opponentSymbol) {
        const tempLargeBoard = [...largeBoard]; tempLargeBoard[largeIndex] = opponentSymbol;
        score += checkWinner(tempLargeBoard) === opponentSymbol ? (weights.blockLargeBoard || 10000) : (weights.blockSmallBoard || 1000);
    }
    smallBoards[largeIndex][smallIndex] = playerSymbol;
    if (smallIndex === 4) score += weights.centerSmall || 10;
    if ([0, 2, 6, 8].includes(smallIndex)) score += weights.cornerSmall || 5;
    if (largeIndex === 4) score += weights.centerLarge || 10;
    if ([0, 2, 6, 8].includes(largeIndex)) score += weights.cornerLarge || 5;
    smallBoards[largeIndex][smallIndex] = originalValue;
    return score;
}
function getUltimateAIMove() {
    const availableMoves = getAvailableUltimateMoves();
    if (availableMoves.length === 0) return null;
    const personality = getEffectivePersonality();
    const effectiveDifficulty = tournament.active ? tournament.aiDifficulty : aiDifficulty;
    if (effectiveDifficulty === 'easy') return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    let bestMove = null, bestScore = -Infinity;
    for (const move of availableMoves) {
        const score = evaluateUltimateMove(move.largeIndex, move.smallIndex, true);
        if (score > bestScore) { bestScore = score; bestMove = move; }
    }
    let randomness = personality === 'mathematician' ? 0.1 : personality === 'psychologist' ? 0.3 : 0.2;
    if (effectiveDifficulty === 'medium' && Math.random() < randomness) return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    return bestMove;
}
function recordAIMove(largeIndex, smallIndex, score, boardSnapshot) {
    if (gameMode !== 'ultimate-ai') return;
    aiMoveHistory.push({ largeIndex, smallIndex, score, boardSnapshot: { largeBoard: [...largeBoard], smallBoards: smallBoards.map(arr => [...arr]) }, timestamp: Date.now() });
}
function makeUltimateAIMove() {
    if (ultimateGameOver) return;
    const effectivePersonality = tournament.active && tournament.currentMatchAIPlayer ? tournament.currentMatchAIPlayer.personality : aiPersonality;
    const originalPersonality = aiPersonality;
    if (tournament.active && tournament.currentMatchAIPlayer) aiPersonality = tournament.currentMatchAIPlayer.personality;
    const aiMove = getUltimateAIMove();
    aiPersonality = originalPersonality;
    if (aiMove) {
        const { largeIndex, smallIndex } = aiMove;
        const boardSnapshot = { largeBoard: [...largeBoard], smallBoards: smallBoards.map(arr => [...arr]) };
        const score = evaluateUltimateMove(largeIndex, smallIndex, true);
        recordAIMove(largeIndex, smallIndex, score, boardSnapshot);
        smallBoards[largeIndex][smallIndex] = 'O';
        const cell = document.querySelector(`.small-cell[data-large-index="${largeIndex}"][data-small-index="${smallIndex}"]`);
        if (cell) { cell.textContent = 'O'; cell.classList.add('taken'); }
        const smallWinner = checkSmallBoardWinner(largeIndex);
        if (smallWinner) {
            largeBoard[largeIndex] = smallWinner;
            const largeCellWinner = document.querySelector(`.large-cell[data-large-index="${largeIndex}"] .large-cell-winner`);
            if (largeCellWinner) { largeCellWinner.textContent = smallWinner; largeCellWinner.classList.add('taken'); }
            highlightWinner('small', largeIndex);
        } else if (isSmallBoardDrawn(largeIndex)) {
            largeBoard[largeIndex] = 'draw';
            const largeCellWinner = document.querySelector(`.large-cell[data-large-index="${largeIndex}"] .large-cell-winner`);
            if (largeCellWinner) { largeCellWinner.textContent = 'Draw'; largeCellWinner.classList.add('draw'); }
        }
        const largeWinner = checkLargeBoardWinner();
        if (largeWinner) {
            ultimateGameOver = true; document.getElementById('turn-indicator').textContent = '';
            const isAIWinner = (gameMode === 'ultimate-ai' || tournament.active) && largeWinner === 'O';
            document.getElementById('game-status').textContent = isAIWinner ? getAIWinMessage() : getPlayerWinMessage();
            if (tournament.active) setTimeout(() => recordAndNextTournamentMatch(largeWinner), 1500);
            else saveGame(largeWinner, largeWinner === 'O' ? 'AI wins' : 'Player wins');
        } else if (isLargeBoardDrawn()) {
            ultimateGameOver = true; document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = getRandomMessage('draw');
            if (tournament.active) setTimeout(() => recordAndNextTournamentMatch(null), 1500);
            else saveGame(null, 'Ultimate Tic Tac Toe draw');
        } else { currentPlayer = 'X'; document.getElementById('turn-indicator').textContent = getRandomMessage('turn'); }
    }
}
function handleSmallCellClick(e) {
    if ((gameMode !== 'ultimate' && gameMode !== 'ultimate-ai') || ultimateGameOver) return;
    if (gameMode === 'ultimate-ai' && currentPlayer === 'O') return;
    if (tournament.active && tournament.currentMatchAIPlayer && currentPlayer === 'O') return;
    const largeIndex = parseInt(e.target.getAttribute('data-large-index'));
    const smallIndex = parseInt(e.target.getAttribute('data-small-index'));
    if (isSmallBoardFinished(largeIndex) || smallBoards[largeIndex][smallIndex] !== '') return;
    smallBoards[largeIndex][smallIndex] = currentPlayer; e.target.textContent = currentPlayer; e.target.classList.add('taken');
    const smallWinner = checkSmallBoardWinner(largeIndex);
    if (smallWinner) {
        largeBoard[largeIndex] = smallWinner;
        const largeCellWinner = document.querySelector(`.large-cell[data-large-index="${largeIndex}"] .large-cell-winner`);
        if (largeCellWinner) { largeCellWinner.textContent = smallWinner; largeCellWinner.classList.add('taken'); }
        highlightWinner('small', largeIndex);
    } else if (isSmallBoardDrawn(largeIndex)) {
        largeBoard[largeIndex] = 'draw';
        const largeCellWinner = document.querySelector(`.large-cell[data-large-index="${largeIndex}"] .large-cell-winner`);
        if (largeCellWinner) { largeCellWinner.textContent = 'Draw'; largeCellWinner.classList.add('draw'); }
    }
    const largeWinner = checkLargeBoardWinner();
    if (largeWinner) {
        ultimateGameOver = true; document.getElementById('turn-indicator').textContent = '';
        const isAIWinner = gameMode === 'ultimate-ai' && largeWinner === 'O';
        document.getElementById('game-status').textContent = isAIWinner ? getAIWinMessage() : getPlayerWinMessage();
        if (tournament.active) setTimeout(() => recordAndNextTournamentMatch(largeWinner), 1500);
        else saveGame(largeWinner, `${largeWinner} wins Ultimate Tic Tac Toe`);
    } else if (isLargeBoardDrawn()) {
        ultimateGameOver = true; document.getElementById('turn-indicator').textContent = '';
        document.getElementById('game-status').textContent = getRandomMessage('draw');
        if (tournament.active) setTimeout(() => recordAndNextTournamentMatch(null), 1500);
        else saveGame(null, 'Ultimate Tic Tac Toe draw');
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        document.getElementById('turn-indicator').textContent = gameMode === 'ultimate-ai' && currentPlayer === 'O' ? getRandomMessage('thinking') : `Player ${currentPlayer}'s Turn (Any Board)`;
        if (tournament.active && tournament.currentMatchAIPlayer && currentPlayer === 'O') setTimeout(makeUltimateAIMove, 1000);
    }
}
function toggleAllAI() { tournament.allAI = document.getElementById('all-ai-checkbox').checked; updateTournamentUI(); }
function generateRandomAISettings() {
    return {
        difficulty: TOURNAMENT_AI_DIFFICULTIES[Math.floor(Math.random() * TOURNAMENT_AI_DIFFICULTIES.length)],
        personality: TOURNAMENT_AI_PERSONALITIES[Math.floor(Math.random() * TOURNAMENT_AI_PERSONALITIES.length)]
    };
}
function updateTournamentUI() {
    const size = parseInt(document.getElementById('tournament-size').value);
    const gameType = document.getElementById('tournament-game-type').value;
    const playersContainer = document.getElementById('tournament-players-container');
    tournament.size = size; tournament.gameType = gameType; playersContainer.innerHTML = '';
    for (let i = 0; i < size; i++) {
        const playerType = tournament.allAI ? 'ai' : 'human';
        const playerDiv = document.createElement('div'); playerDiv.className = 'tournament-player-input';
        playerDiv.innerHTML = `<span>Player ${i + 1}:</span><select onchange="updatePlayerType(${i})"><option value="human">Human</option><option value="ai" ${playerType === 'ai' ? 'selected' : ''}>AI (Random Settings)</option></select>`;
        playersContainer.appendChild(playerDiv);
    }
    document.getElementById('start-tournament-btn').style.display = 'inline-block';
}
function updatePlayerType(index) {
    const selects = document.querySelectorAll('#tournament-players-container select');
    const allAreAI = Array.from(selects).every(s => s.value === 'ai');
    document.getElementById('all-ai-checkbox').checked = allAreAI; tournament.allAI = allAreAI;
}
function startTournament() {
    const size = parseInt(document.getElementById('tournament-size').value);
    const type = document.getElementById('tournament-type').value;
    const gameType = document.getElementById('tournament-game-type').value;
    const aiDifficulty = document.getElementById('tournament-ai-difficulty').value;
    const playersContainer = document.getElementById('tournament-players-container');
    const typeSelects = playersContainer.querySelectorAll('select');
    const players = [];
    for (let i = 0; i < size; i++) {
        const typeSelect = typeSelects[i]; const type = typeSelect.value;
        let difficulty = null, personality = null;
        if (type === 'ai') { const aiSettings = generateRandomAISettings(); difficulty = aiSettings.difficulty; personality = aiSettings.personality; }
        players.push({ id: i, name: type === 'ai' ? `AI ${i + 1}` : `Player ${i + 1}`, type, difficulty, personality, wins: 0, losses: 0, draws: 0, points: 0 });
    }
    if (players.length < 2) { alert('Please add at least 2 players!'); return; }
    tournament = { active: true, size, type, gameType, aiDifficulty, allAI: document.getElementById('all-ai-checkbox').checked, stage: type === 'single_elimination' ? 'knockout' : 'group', players, groups: [], groupResults: {}, knockoutBracket: [], currentGroupIndex: 0, currentGroupMatch: 0, currentKnockoutRound: 0, currentKnockoutMatch: 0, matchHistory: [], currentMatchPlayers: null, currentMatchAIPlayer: null };
    if (type === 'single_elimination') generateSingleEliminationBracket(); else generateTournamentGroups();
    displayTournament();
    if (type === 'single_elimination') startNextKnockoutMatch(); else startNextGroupMatch();
}
function generateSingleEliminationBracket() {
    const { players } = tournament; let currentRoundPlayers = [...players]; tournament.knockoutBracket = [];
    const targetSize = Math.pow(2, Math.ceil(Math.log2(players.length)));
    while (currentRoundPlayers.length < targetSize) currentRoundPlayers.push(null);
    while (currentRoundPlayers.length > 1) {
        const roundMatches = [];
        for (let i = 0; i < currentRoundPlayers.length; i += 2) {
            if (i + 1 < currentRoundPlayers.length) roundMatches.push({ player1: currentRoundPlayers[i], player2: currentRoundPlayers[i + 1], winner: null, completed: false });
            else roundMatches.push({ player1: currentRoundPlayers[i], player2: null, winner: currentRoundPlayers[i]?.id || null, completed: true });
        }
        tournament.knockoutBracket.push(roundMatches);
        currentRoundPlayers = roundMatches.map(m => m.completed && m.winner ? players.find(p => p.id === m.winner) : null).filter(p => p !== null);
    }
}
function generateTournamentGroups() {
    const { size, players } = tournament; const groupSize = 4; const numGroups = Math.ceil(size / groupSize);
    const shuffledPlayers = [...players];
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }
    tournament.groups = []; tournament.groupResults = {};
    for (let g = 0; g < numGroups; g++) {
        const groupPlayers = shuffledPlayers.slice(g * groupSize, (g + 1) * groupSize);
        tournament.groups.push({ id: g, players: groupPlayers.map(p => ({ ...p })), matches: [], completed: false });
        tournament.groupResults[g] = [];
    }
    for (let g = 0; g < numGroups; g++) {
        const group = tournament.groups[g];
        for (let i = 0; i < group.players.length; i++) {
            for (let j = i + 1; j < group.players.length; j++) {
                group.matches.push({ player1: group.players[i].id, player2: group.players[j].id, winner: null, completed: false });
            }
        }
    }
}
function advanceToKnockoutStage() {
    const allResults = []; for (let g = 0; g < tournament.groups.length; g++) allResults.push(...tournament.groupResults[g]);
    allResults.sort((a, b) => b.points - a.points || b.wins - a.wins || b.draws - a.draws);
    const knockoutPlayers = allResults.slice(0, Math.min(16, allResults.length));
    tournament.players = tournament.players.filter(p => knockoutPlayers.some(r => r.id === p.id));
    tournament.stage = 'knockout'; tournament.currentKnockoutRound = 0; tournament.currentKnockoutMatch = 0; tournament.knockoutBracket = [];
    generateSingleEliminationBracket(); startNextKnockoutMatch();
}
function displayTournament() {
    const bracketDiv = document.getElementById('tournament-bracket'); const stageTitle = document.getElementById('tournament-stage-title');
    const nextBtn = document.getElementById('next-match-btn'); const endBtn = document.getElementById('end-tournament-btn');
    document.getElementById('standard-board').style.display = 'none'; document.getElementById('ultimate-board').style.display = 'none';
    document.getElementById('tournament-display').style.display = 'block';
    const gameTypeText = tournament.gameType === 'ultimate' ? 'Ultimate' : 'Standard';
    if (tournament.stage === 'group') {
        stageTitle.textContent = `Tournament - Group Stage (Group ${tournament.currentGroupIndex + 1}/${tournament.groups.length}) - ${gameTypeText} Mode`;
        nextBtn.style.display = 'inline-block'; endBtn.style.display = 'none'; bracketDiv.innerHTML = generateGroupStageHTML();
    } else if (tournament.stage === 'knockout') {
        const roundNames = ['Final', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32', 'Round of 64', 'Round of 128', 'Round of 256', 'Round of 512', 'Round of 1024'];
        const currentRound = tournament.currentKnockoutRound; const roundName = roundNames[currentRound] || `Round ${tournament.knockoutBracket.length - currentRound}`;
        stageTitle.textContent = `Tournament - ${roundName} - ${gameTypeText} Mode`; nextBtn.style.display = 'inline-block'; endBtn.style.display = 'none';
        bracketDiv.innerHTML = generateKnockoutBracketHTML();
    } else {
        stageTitle.textContent = 'Tournament - Completed'; nextBtn.style.display = 'none'; endBtn.style.display = 'inline-block';
        bracketDiv.innerHTML = generateTournamentResultsHTML();
    }
}
function generateGroupStageHTML() {
    let html = '<div class="group-stage-display">';
    for (let g = 0; g < tournament.groups.length; g++) {
        const gGroup = tournament.groups[g]; html += `<div class="tournament-group ${g === tournament.currentGroupIndex ? 'active' : ''}"><h4>Group ${g + 1}</h4>`;
        if (tournament.groupResults[g] && tournament.groupResults[g].length > 0) {
            html += '<table class="group-standings"><tr><th>Rank</th><th>Player</th><th>Type</th><th>W</th><th>L</th><th>D</th><th>Pts</th></tr>';
            const sortedResults = [...tournament.groupResults[g]].sort((a, b) => b.points - a.points);
            sortedResults.forEach((result, idx) => {
                const playerObj = gGroup.players.find(p => p.id === result.id);
                const aiIndicator = playerObj?.type === 'ai' ? 'AI' : 'Human';
                const aiDetails = playerObj?.type === 'ai' ? ` (${playerObj.difficulty}, ${playerObj.personality})` : '';
                html += `<tr><td>${idx + 1}</td><td>${playerObj?.name || 'Unknown'}${aiDetails}</td><td>${aiIndicator}</td><td>${result.wins}</td><td>${result.losses}</td><td>${result.draws}</td><td>${result.points}</td></tr>`;
            }); html += '</table>';
        }
        html += '<div class="group-matches">';
        gGroup.matches.forEach((match, mIdx) => {
            const player1 = gGroup.players.find(p => p.id === match.player1); const player2 = gGroup.players.find(p => p.id === match.player2);
            const player1Name = player1 ? `${player1.name}${player1.type === 'ai' ? ` (${player1.difficulty}, ${player1.personality})` : ''}` : 'Bye';
            const player2Name = player2 ? `${player2.name}${player2.type === 'ai' ? ` (${player2.difficulty}, ${player2.personality})` : ''}` : 'Bye';
            const winnerName = match.winner !== null && match.completed ? (match.winner === match.player1 ? player1Name : player2Name) : 'TBD';
            const matchStatus = match.completed ? (match.winner === null ? 'Draw' : 'Completed') : 'Pending';
            html += `<div class="group-match ${match.completed ? 'completed' : ''} ${g === tournament.currentGroupIndex && mIdx === tournament.currentGroupMatch ? 'current' : ''}"><span>${player1Name} vs ${player2Name}</span><span class="match-result">${matchStatus}: ${winnerName === 'TBD' ? '' : winnerName}</span></div>`;
        }); html += '</div></div>';
    } html += '</div>'; return html;
}
function generateKnockoutBracketHTML() {
    let html = '<div class="knockout-bracket">';
    tournament.knockoutBracket.forEach((round, roundIdx) => {
        html += `<div class="knockout-round"><h4>Round ${tournament.knockoutBracket.length - roundIdx}</h4>`;
        round.forEach((match, matchIdx) => {
            const player1 = match.player1 ? tournament.players.find(p => p.id === match.player1.id) : null;
            const player2 = match.player2 ? tournament.players.find(p => p.id === match.player2.id) : null;
            const player1Name = player1 ? `${player1.name}${player1.type === 'ai' ? ` (${player1.difficulty}, ${player1.personality})` : ''}` : 'Bye';
            const player2Name = player2 ? `${player2.name}${player2.type === 'ai' ? ` (${player2.difficulty}, ${player2.personality})` : ''}` : 'Bye';
            const winnerName = match.winner !== null && match.completed ? (match.winner === match.player1?.id ? player1Name : player2Name) : 'TBD';
            const matchStatus = match.completed ? (match.winner === null ? 'Draw' : 'Completed') : 'Pending';
            html += `<div class="knockout-match ${match.completed ? 'completed' : ''} ${roundIdx === tournament.currentKnockoutRound && matchIdx === tournament.currentKnockoutMatch ? 'current' : ''}"><div class="match-players">${player1Name} vs ${player2Name}</div><div class="match-result">${matchStatus}: ${winnerName === 'TBD' ? '' : winnerName}</div></div>`;
        }); html += '</div>';
    }); html += '</div>'; return html;
}
function generateTournamentResultsHTML() {
    let html = '<div class="tournament-results"><h3>Final Standings</h3><table class="final-standings"><tr><th>Rank</th><th>Player</th><th>Type</th><th>W</th><th>L</th><th>D</th><th>Pts</th></tr>';
    const sortedPlayers = [...tournament.players].sort((a, b) => b.points - a.points || b.wins - a.wins || b.draws - a.draws);
    sortedPlayers.forEach((player, idx) => {
        const aiIndicator = player.type === 'ai' ? 'AI' : 'Human';
        const aiDetails = player.type === 'ai' ? ` (${player.difficulty}, ${player.personality})` : '';
        html += `<tr><td>${idx + 1}</td><td>${player.name}${aiDetails}</td><td>${aiIndicator}</td><td>${player.wins}</td><td>${player.losses}</td><td>${player.draws}</td><td>${player.points}</td></tr>`;
    }); html += '</table></div>'; return html;
}
function recordAndNextTournamentMatch(winner) {
    if (!tournament.active) return;
    const match = tournament.stage === 'group' ? tournament.groups[tournament.currentGroupIndex].matches[tournament.currentGroupMatch] : tournament.knockoutBracket[tournament.currentKnockoutRound][tournament.currentKnockoutMatch];
    match.winner = winner; match.completed = true;
    const player1 = tournament.players.find(p => p.id === match.player1?.id); const player2 = tournament.players.find(p => p.id === match.player2?.id);
    if (player1) { if (winner === player1.id) player1.wins++; else if (winner === player2?.id) player1.losses++; else if (winner === null) player1.draws++; }
    if (player2) { if (winner === player2.id) player2.wins++; else if (winner === player1?.id) player2.losses++; else if (winner === null) player2.draws++; }
    if (tournament.stage === 'group') {
        if (winner === null) { if (player1) player1.points += 1; if (player2) player2.points += 1; } else { const winnerObj = tournament.players.find(p => p.id === winner); if (winnerObj) winnerObj.points += 3; }
        let groupResults = tournament.groupResults[tournament.currentGroupIndex] || [];
        [player1, player2].forEach(p => { if (p) { const existing = groupResults.find(r => r.id === p.id); if (existing) { existing.wins = p.wins; existing.losses = p.losses; existing.draws = p.draws; existing.points = p.points; } else { groupResults.push({ id: p.id, wins: p.wins, losses: p.losses, draws: p.draws, points: p.points }); } } }); tournament.groupResults[tournament.currentGroupIndex] = groupResults;
    }
    if (tournament.stage === 'group') {
        tournament.currentGroupMatch++; const group = tournament.groups[tournament.currentGroupIndex];
        if (tournament.currentGroupMatch >= group.matches.length) { tournament.currentGroupIndex++; tournament.currentGroupMatch = 0;
            if (tournament.currentGroupIndex >= tournament.groups.length) { if (tournament.type === 'group_knockout') advanceToKnockoutStage(); else endTournament(); }
        } startNextGroupMatch();
    } else {
        tournament.currentKnockoutMatch++; const round = tournament.knockoutBracket[tournament.currentKnockoutRound];
        if (tournament.currentKnockoutMatch >= round.length) { tournament.currentKnockoutRound++; tournament.currentKnockoutMatch = 0;
            if (tournament.currentKnockoutRound >= tournament.knockoutBracket.length) { endTournament(); return; }
        } startNextKnockoutMatch();
    } displayTournament();
}
function startNextGroupMatch() {
    const group = tournament.groups[tournament.currentGroupIndex]; if (!group) return; if (tournament.currentGroupMatch >= group.matches.length) return;
    const match = group.matches[tournament.currentGroupMatch]; if (match.completed) { tournament.currentGroupMatch++; startNextGroupMatch(); return; }
    tournament.currentMatchPlayers = [tournament.players.find(p => p.id === match.player1), tournament.players.find(p => p.id === match.player2)].filter(p => p !== undefined); resetGame();
    const player1 = tournament.currentMatchPlayers[0]; const player2 = tournament.currentMatchPlayers[1];
    if (player1.type === 'ai' && player2.type === 'ai') {
        tournament.currentMatchAIPlayer = player1; gameMode = tournament.gameType === 'ultimate' ? 'ultimate-ai' : 'ai';
        aiPersonality = player1.personality; aiDifficulty = player1.difficulty; currentPlayer = 'X';
        if (tournament.gameType === 'ultimate') setTimeout(makeUltimateAIMove, 1000); else setTimeout(makeAIMove, 1000);
    } else if (player1.type === 'ai') {
        tournament.currentMatchAIPlayer = player1; gameMode = tournament.gameType === 'ultimate' ? 'ultimate-ai' : 'ai';
        aiPersonality = player1.personality; aiDifficulty = player1.difficulty; currentPlayer = 'X';
    } else if (player2.type === 'ai') {
        tournament.currentMatchAIPlayer = player2; gameMode = tournament.gameType === 'ultimate' ? 'ultimate-ai' : 'ai';
        aiPersonality = player2.personality; aiDifficulty = player2.difficulty; currentPlayer = 'X';
    } else { gameMode = tournament.gameType; currentPlayer = 'X'; }
    displayTournament(); updateGameUI();
}
function startNextKnockoutMatch() {
    const round = tournament.knockoutBracket[tournament.currentKnockoutRound]; if (!round) return; if (tournament.currentKnockoutMatch >= round.length) return;
    const match = round[tournament.currentKnockoutMatch]; if (match.completed) { tournament.currentKnockoutMatch++; startNextKnockoutMatch(); return; }
    tournament.currentMatchPlayers = [match.player1 ? tournament.players.find(p => p.id === match.player1.id) : null, match.player2 ? tournament.players.find(p => p.id === match.player2.id) : null].filter(p => p !== null);
    if (tournament.currentMatchPlayers.length < 2) { match.winner = tournament.currentMatchPlayers[0]?.id || null; match.completed = true; tournament.currentKnockoutMatch++; startNextKnockoutMatch(); return; }
    resetGame(); const player1 = tournament.currentMatchPlayers[0]; const player2 = tournament.currentMatchPlayers[1];
    if (player1.type === 'ai' && player2.type === 'ai') {
        tournament.currentMatchAIPlayer = player1; gameMode = tournament.gameType === 'ultimate' ? 'ultimate-ai' : 'ai';
        aiPersonality = player1.personality; aiDifficulty = player1.difficulty; currentPlayer = 'X';
        if (tournament.gameType === 'ultimate') setTimeout(makeUltimateAIMove, 1000); else setTimeout(makeAIMove, 1000);
    } else if (player1.type === 'ai') {
        tournament.currentMatchAIPlayer = player1; gameMode = tournament.gameType === 'ultimate' ? 'ultimate-ai' : 'ai';
        aiPersonality = player1.personality; aiDifficulty = player1.difficulty; currentPlayer = 'X';
    } else if (player2.type === 'ai') {
        tournament.currentMatchAIPlayer = player2; gameMode = tournament.gameType === 'ultimate' ? 'ultimate-ai' : 'ai';
        aiPersonality = player2.personality; aiDifficulty = player2.difficulty; currentPlayer = 'X';
    } else { gameMode = tournament.gameType; currentPlayer = 'X'; }
    displayTournament(); updateGameUI();
}
function endTournament() { tournament.active = false; tournament.stage = 'completed'; displayTournament();
    document.getElementById('standard-board').style.display = 'none'; document.getElementById('ultimate-board').style.display = 'none';
}
function saveGame(winner, result) {
    if (!tournament.active) fetch('/api/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ winner, result, board, gameMode, aiDifficulty, aiPersonality, learningData: gameMode === 'ultimate-ai' ? { aiPersonality, moveHistory: aiMoveHistory, outcome: winner === 'O' ? 'ai_win' : winner === 'X' ? 'player_win' : 'draw' } : null }) });
}
function updateGameUI() {
    if (gameMode === 'standard' || gameMode === 'ai') { document.getElementById('standard-board').style.display = 'grid'; document.getElementById('ultimate-board').style.display = 'none'; }
    else if (gameMode === 'ultimate' || gameMode === 'ultimate-ai') { document.getElementById('standard-board').style.display = 'none'; document.getElementById('ultimate-board').style.display = 'grid'; }
}
function toggleGameMode() { const mode = document.getElementById('game-mode').value; gameMode = mode; updateGameUI(); }
function setAIDifficulty() { aiDifficulty = document.getElementById('ai-difficulty').value; }
function setAIPersonality() { aiPersonality = document.getElementById('ai-personality').value; }

// Initialize board clicks
document.querySelectorAll('#standard-board .cell').forEach(cell => cell.addEventListener('click', function() {
    if (gameOver || (gameMode === 'ai' && currentPlayer === 'O') || (tournament.active && tournament.currentMatchAIPlayer && currentPlayer === 'O')) return;
    const index = parseInt(this.getAttribute('data-index'));
    if (board[index] === '') {
        board[index] = currentPlayer; this.textContent = currentPlayer; this.classList.add('taken');
        const winner = checkWinner(board);
        if (winner) {
            gameOver = true; document.getElementById('turn-indicator').textContent = '';
            const isAIWinner = (gameMode === 'ai' || tournament.active) && winner === 'O';
            document.getElementById('game-status').textContent = isAIWinner ? getAIWinMessage() : getPlayerWinMessage();
            highlightWinner('standard');
            if (tournament.active) setTimeout(() => recordAndNextTournamentMatch(winner), 1500);
            else saveGame(winner, winner === 'O' ? 'AI wins' : 'Player wins');
        } else if (checkDraw(board)) {
            gameOver = true; document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = getRandomMessage('draw');
            if (tournament.active) setTimeout(() => recordAndNextTournamentMatch(null), 1500);
            else saveGame(null, 'draw');
        } else {
            currentPlayer = 'X' === currentPlayer ? 'O' : 'X';
            document.getElementById('turn-indicator').textContent = gameMode === 'ai' && currentPlayer === 'O' ? getRandomMessage('thinking') : `Player ${currentPlayer}'s Turn`;
            if (tournament.active && tournament.currentMatchAIPlayer && currentPlayer === 'O') setTimeout(makeAIMove, 1000);
            else if (gameMode === 'ai' && currentPlayer === 'O') setTimeout(makeAIMove, 1000);
        }
    }
}));
document.querySelectorAll('.small-cell').forEach(cell => cell.addEventListener('click', handleSmallCellClick));

// Game mode toggle
function toggleGameMode() {
    const mode = document.getElementById('game-mode').value;
    gameMode = mode;
    document.getElementById('difficulty-section').style.display = (mode === 'ai' || mode === 'ultimate-ai' || mode === 'tournament') ? 'block' : 'none';
    document.getElementById('personality-section').style.display = (mode === 'ai' || mode === 'ultimate-ai' || mode === 'tournament') ? 'block' : 'none';
    document.getElementById('tournament-settings').style.display = (mode === 'tournament') ? 'block' : 'none';
    updateGameUI();
}

// Initialize on load
window.onload = function() {
    checkAuth();
    toggleGameMode();
    document.getElementById('game-mode').addEventListener('change', toggleGameMode);
};