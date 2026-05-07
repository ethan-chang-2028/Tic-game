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

// ── AI Learning Data ───────────────────────────────────────
let aiLearningData = {
    neutral: null,
    mathematician: null,
    psychologist: null
};
let aiMoveHistory = [];

// Available AI personalities for tournaments
const TOURNAMENT_AI_PERSONALITIES = ['neutral', 'mathematician', 'psychologist'];
const TOURNAMENT_AI_DIFFICULTIES = ['easy', 'medium'];

// ── Tournament State ───────────────────────────────────────
let tournament = {
    active: false,
    size: 32,
    type: 'group_knockout',
    gameType: 'standard',
    aiDifficulty: 'medium',
    allAI: true,
    stage: 'setup',
    players: [],
    groups: [],
    groupResults: {},
    knockoutBracket: [],
    currentGroupIndex: 0,
    currentGroupMatch: 0,
    currentKnockoutRound: 0,
    currentKnockoutMatch: 0,
    matchHistory: [],
    currentMatchPlayers: null,
    currentMatchAIPlayer: null
};

const WIN_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]              // diagonals
];

// Reset game state for new matches
function resetGame() {
    currentPlayer = 'X';
    board = ['', '', '', '', '', '', '', '', ''];
    gameOver = false;
    largeBoard = ['', '', '', '', '', '', '', '', ''];
    smallBoards = Array(9).fill().map(() => Array(9).fill(''));
    ultimateGameOver = false;
    
    // Reset UI
    document.querySelectorAll('#standard-board .cell').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'winner');
    });
    document.querySelectorAll('.small-cell').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'winner');
    });
    document.querySelectorAll('.large-cell-winner').forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'draw');
    });
    document.getElementById('turn-indicator').textContent = 'Your Turn';
    document.getElementById('game-status').textContent = '';
}

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

// ── AI Personalities with Varied Responses and Patterns ────────────────────
const personalities = {
    neutral: {
        aiWin: ["AI wins! 🎉", "AI wins! Good game!", "AI wins! Try again!", "AI wins! You'll get it next time!"],
        playerWin: ["You got me this time...", "Nice move!", "Well played!", "I'll get you next time!", "You won this round!", "Good strategy!"],
        draw: ["It's a draw! 🤝", "A tie! Close game!", "Draw! Want a rematch?", "No winner this time!"],
        thinking: ["AI is thinking...", "Calculating...", "Making a move...", "Processing..."],
        turn: ["Your Turn", "Your move", "Go ahead", "Make your move"],
        patternWeights: {
            winSmallBoard: 1000,
            blockSmallBoard: 1000,
            winLargeBoard: 10000,
            blockLargeBoard: 10000,
            centerSmall: 10,
            cornerSmall: 5,
            centerLarge: 10,
            cornerLarge: 5
        }
    },
    mathematician: {
        aiWin: ["AI wins by the power of logic! ∫√∑", "AI wins! The numbers don't lie.", "AI wins! A calculated victory.", "AI wins! x + y = victory!"],
        playerWin: ["Your strategy was... unexpected. Recalculating...", "An anomaly in the data!", "I need to recalibrate my algorithms.", "That was statistically unlikely!", "My calculations were off by a factor of π!", "You found the flaw in my logic matrix!"],
        draw: ["A perfect equilibrium! 1-1=0", "The game is in balance.", "A draw! The math checks out.", "Symmetry achieved!"],
        thinking: ["Calculating optimal move...", "Running simulations...", "Solving the equation...", "Analyzing probabilities..."],
        turn: ["Your move, human.", "Input your coordinates.", "What's your next variable?", "Your turn to solve."],
        patternWeights: {
            winSmallBoard: 1500,
            blockSmallBoard: 800,
            winLargeBoard: 10000,
            blockLargeBoard: 10000,
            centerSmall: 30,
            cornerSmall: 15,
            centerLarge: 30,
            cornerLarge: 15
        }
    },
    psychologist: {
        aiWin: ["AI wins! I knew you'd pick that spot. 😉", "AI wins! Your patterns are predictable.", "AI wins! I'm inside your head.", "AI wins! Did you see that coming?"],
        playerWin: ["Interesting... you outsmarted me. Let's analyze that.", "Fascinating choice! Tell me more.", "Your subconscious led you well.", "I didn't expect that. Well done!", "Your psychological profile is more complex than I calculated!", "You broke my behavioral prediction model!"],
        draw: ["A stalemate. Your subconscious is strong.", "A draw! We're equally matched.", "No winner. The mind is complex.", "A tie. What were you thinking?"],
        thinking: ["Analyzing your patterns...", "Reading your mind...", "Predicting your next move...", "Studying your behavior..."],
        turn: ["What's your next move?", "Show me your strategy.", "Where will you go?", "Your turn to reveal yourself."],
        patternWeights: {
            winSmallBoard: 800,
            blockSmallBoard: 1500,
            winLargeBoard: 10000,
            blockLargeBoard: 10000,
            centerSmall: 5,
            cornerSmall: 3,
            centerLarge: 5,
            cornerLarge: 3
        }
    }
};

// Helper to get the effective personality for messages
function getEffectivePersonality() {
    if (gameMode === 'ai' || gameMode === 'ultimate-ai') {
        return aiPersonality || 'neutral';
    }
    if (tournament.active && tournament.currentMatchAIPlayer) {
        return tournament.currentMatchAIPlayer.personality || 'neutral';
    }
    return 'neutral';
}

// Helper to get player win message (AI loses)
function getPlayerWinMessage() {
    const p = personalities[getEffectivePersonality()] || personalities.neutral;
    if (!p || !p.playerWin || p.playerWin.length === 0) {
        return "You win! Well played!";
    }
    const randomIndex = Math.floor(Math.random() * p.playerWin.length);
    return p.playerWin[randomIndex];
}

// Helper to get AI win message
function getAIWinMessage() {
    const p = personalities[getEffectivePersonality()] || personalities.neutral;
    if (!p || !p.aiWin || p.aiWin.length === 0) {
        return "AI wins! 🎉";
    }
    const randomIndex = Math.floor(Math.random() * p.aiWin.length);
    return p.aiWin[randomIndex];
}

// Backward compatible getRandomMessage for other message types
function getRandomMessage(type, winner) {
    const p = personalities[getEffectivePersonality()] || personalities.neutral;
    if (!p) return '';
    const messages = p[type];
    if (!messages || messages.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
}

// Get the current pattern weights (combining default + learned)
function getCurrentPatternWeights() {
    const personality = getEffectivePersonality();
    const defaultWeights = personalities[personality]?.patternWeights || personalities.neutral.patternWeights;
    const learnedWeights = aiLearningData[personality] || {};
    return { ...defaultWeights, ...learnedWeights };
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

function getRandomMove(board) {
    const emptyCells = board.map((cell, index) => cell === '' ? index : null).filter(val => val !== null);
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

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

function getAIMove(board) {
    const effectiveDifficulty = tournament.active ? tournament.aiDifficulty : aiDifficulty;
    if (effectiveDifficulty === 'easy') return getRandomMove(board);
    if (effectiveDifficulty === 'medium') return getMediumMove(board);
    if (effectiveDifficulty === 'hard') return getHardMove(board);
    return getRandomMove(board);
}

// Modified makeAIMove for tournament support
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
            if (tournament.active) {
                setTimeout(() => recordAndNextTournamentMatch(winner), 1500);
            } else {
                saveGame(winner, winner === 'O' ? 'AI wins' : 'Player wins');
            }
        } else if (checkDraw(board)) {
            gameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = getRandomMessage('draw');
            if (tournament.active) {
                setTimeout(() => recordAndNextTournamentMatch(null), 1500);
            } else {
                saveGame(null, 'draw');
            }
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

// ── Ultimate Tic Tac Toe: AI Logic ────────────
function getAvailableUltimateMoves() {
    const moves = [];
    for (let largeIndex = 0; largeIndex < 9; largeIndex++) {
        if (isSmallBoardFinished(largeIndex)) continue;
        for (let smallIndex = 0; smallIndex < 9; smallIndex++) {
            if (smallBoards[largeIndex][smallIndex] === '') {
                moves.push({ largeIndex, smallIndex });
            }
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
        const tempLargeBoard = [...largeBoard];
        tempLargeBoard[largeIndex] = playerSymbol;
        if (checkWinner(tempLargeBoard) === playerSymbol) score += weights.winLargeBoard || 10000;
        else score += weights.winSmallBoard || 1000;
    }
    smallBoards[largeIndex][smallIndex] = opponentSymbol;
    if (checkSmallBoardWinner(largeIndex) === opponentSymbol) {
        const tempLargeBoard = [...largeBoard];
        tempLargeBoard[largeIndex] = opponentSymbol;
        if (checkWinner(tempLargeBoard) === opponentSymbol) score += weights.blockLargeBoard || 10000;
        else score += weights.blockSmallBoard || 1000;
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
    if (effectiveDifficulty === 'easy') {
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
    let bestMove = null, bestScore = -Infinity;
    for (const move of availableMoves) {
        const score = evaluateUltimateMove(move.largeIndex, move.smallIndex, true);
        if (score > bestScore) { bestScore = score; bestMove = move; }
    }
    let randomness = 0.2;
    if (personality === 'mathematician') randomness = 0.1;
    if (personality === 'psychologist') randomness = 0.3;
    if (effectiveDifficulty === 'medium' && Math.random() < randomness) {
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
    return bestMove;
}

function recordAIMove(largeIndex, smallIndex, score, boardSnapshot) {
    if (gameMode !== 'ultimate-ai') return;
    aiMoveHistory.push({ largeIndex, smallIndex, score, boardSnapshot: { largeBoard: [...largeBoard], smallBoards: smallBoards.map(arr => [...arr]) }, timestamp: Date.now() });
}
