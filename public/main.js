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
    gameType: 'standard', // 'standard' or 'ultimate'
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
    let diff = aiDifficulty;
    if (tournament.active && tournament.currentMatchAIPlayer) {
        diff = tournament.currentMatchAIPlayer.difficulty || 'medium';
    }
    if (diff === 'easy') return getRandomMove(board);
    if (diff === 'medium') return getMediumMove(board);
    if (diff === 'hard') return getHardMove(board);
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

        // Record move for AI learning
        if (gameMode === 'ai') {
            recordAIMove(aiMove, 0, 0, [...board]);
        }
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
                setTimeout(() => resetGame(), 2000);
            }
        } else if (checkDraw(board)) {
            gameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = getRandomMessage('draw');
            if (tournament.active) {
                setTimeout(() => recordAndNextTournamentMatch(null), 1500);
            } else {
                saveGame(null, 'draw');
                setTimeout(() => resetGame(), 2000);
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
    // Use per-player difficulty in tournament, else global aiDifficulty
    let effectiveDifficulty = aiDifficulty;
    if (tournament.active && tournament.currentMatchAIPlayer) {
        effectiveDifficulty = tournament.currentMatchAIPlayer.difficulty || 'medium';
    } else if (tournament.active) {
        effectiveDifficulty = tournament.aiDifficulty || 'medium';
    }
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
    // Record for learning in any AI game
    if (gameMode !== 'ai' && gameMode !== 'ultimate-ai' && !tournament.active) return;
    aiMoveHistory.push({ largeIndex, smallIndex, score, boardSnapshot: { largeBoard: [...largeBoard], smallBoards: smallBoards.map(arr => [...arr]) }, timestamp: Date.now() });
}

// Modified makeUltimateAIMove for tournament support - FIXED
function makeUltimateAIMove() {
    if (ultimateGameOver) return;
    
    // Use tournament AI personality if in tournament mode
    const effectivePersonality = tournament.active && tournament.currentMatchAIPlayer 
        ? tournament.currentMatchAIPlayer.personality 
        : aiPersonality;
    
    // Temporarily set AI personality for this move
    const originalPersonality = aiPersonality;
    if (tournament.active && tournament.currentMatchAIPlayer) {
        aiPersonality = tournament.currentMatchAIPlayer.personality;
    }
    
    const aiMove = getUltimateAIMove();
    
    // Restore original personality
    aiPersonality = originalPersonality;
    
    if (aiMove) {
        const { largeIndex, smallIndex } = aiMove;
        
        // Record the move for learning
        const boardSnapshot = {
            largeBoard: [...largeBoard],
            smallBoards: smallBoards.map(arr => [...arr])
        };
        const score = evaluateUltimateMove(largeIndex, smallIndex, true);
        recordAIMove(largeIndex, smallIndex, score, boardSnapshot);
        
        // Make the move
        smallBoards[largeIndex][smallIndex] = 'O';
        const cell = document.querySelector(`.small-cell[data-large-index="${largeIndex}"][data-small-index="${smallIndex}"]`);
        if (cell) { cell.textContent = 'O'; cell.classList.add('taken'); }

        // Check if this small board is now won
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

        // Check if the large board is won
        const largeWinner = checkLargeBoardWinner();
        if (largeWinner) {
            ultimateGameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            
            if (tournament.active) {
                const [p1, p2] = tournament.currentMatchPlayers;
                document.getElementById('game-status').textContent = `${largeWinner === 'X' ? p1.name : p2.name} wins!`;
                setTimeout(() => recordAndNextTournamentMatch(largeWinner), 1500);
            } else {
                const isAIWinner = gameMode === 'ultimate-ai' && largeWinner === 'O';
                document.getElementById('game-status').textContent = isAIWinner ? getAIWinMessage() : getPlayerWinMessage();
                saveGame(largeWinner, largeWinner === 'O' ? 'AI wins' : 'Player wins');
                setTimeout(() => resetGame(), 2000);
            }
        } else if (isLargeBoardDrawn()) {
            ultimateGameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = getRandomMessage('draw');
            
            if (tournament.active) {
                setTimeout(() => recordAndNextTournamentMatch(null), 1500);
            } else {
                saveGame(null, 'Ultimate Tic Tac Toe draw');
                setTimeout(() => resetGame(), 2000);
            }
        } else {
            currentPlayer = 'X';
            document.getElementById('turn-indicator').textContent = getRandomMessage('turn');
        }
    }
}

function handleSmallCellClick(e) {
    if (ultimateGameOver) return;
    // In tournament ultimate mode, allow clicks; block only if it's AI's turn
    if (!tournament.active && (gameMode !== 'ultimate' && gameMode !== 'ultimate-ai')) return;
    if (!tournament.active && gameMode === 'ultimate-ai' && currentPlayer === 'O') return;

    if (tournament.active) {
        // Block if AI vs AI (auto)
        if (tournament.aiX && tournament.aiO) return;
        // Block if it's the AI player's turn
        const aiPlayer = tournament.currentMatchAIPlayer;
        if (aiPlayer && tournament.currentMatchPlayers) {
            const [p1, p2] = tournament.currentMatchPlayers;
            const aiSymbol = aiPlayer === p1 ? 'X' : 'O';
            if (currentPlayer === aiSymbol) return;
        }
    }

    const largeIndex = parseInt(e.target.getAttribute('data-large-index'));
    const smallIndex = parseInt(e.target.getAttribute('data-small-index'));
    if (isSmallBoardFinished(largeIndex) || smallBoards[largeIndex][smallIndex] !== '') return;
    smallBoards[largeIndex][smallIndex] = currentPlayer;
    e.target.textContent = currentPlayer;
    e.target.classList.add('taken');
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
        ultimateGameOver = true;
        document.getElementById('turn-indicator').textContent = '';
        if (tournament.active) {
            const [p1, p2] = tournament.currentMatchPlayers;
            document.getElementById('game-status').textContent = `${largeWinner === 'X' ? p1.name : p2.name} wins!`;
            setTimeout(() => recordAndNextTournamentMatch(largeWinner), 1500);
        } else {
            const isAIWinner = gameMode === 'ultimate-ai' && largeWinner === 'O';
            document.getElementById('game-status').textContent = isAIWinner ? getAIWinMessage() : getPlayerWinMessage();
            saveGame(largeWinner, `${largeWinner} wins Ultimate Tic Tac Toe`);
            setTimeout(() => resetGame(), 2000);
        }
    } else if (isLargeBoardDrawn()) {
        ultimateGameOver = true;
        document.getElementById('turn-indicator').textContent = '';
        if (tournament.active) {
            document.getElementById('game-status').textContent = 'Draw!';
            setTimeout(() => recordAndNextTournamentMatch(null), 1500);
        } else {
            document.getElementById('game-status').textContent = getRandomMessage('draw');
            saveGame(null, 'Ultimate Tic Tac Toe draw');
            setTimeout(() => resetGame(), 2000);
        }
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        if (tournament.active && tournament.currentMatchAIPlayer) {
            const [p1, p2] = tournament.currentMatchPlayers;
            const aiPlayer = tournament.currentMatchAIPlayer;
            const aiSymbol = aiPlayer === p1 ? 'X' : 'O';
            if (currentPlayer === aiSymbol) {
                document.getElementById('turn-indicator').textContent = `${aiPlayer.name} thinking...`;
                setTimeout(() => makeTournamentAIMove(aiPlayer), 600);
            } else {
                const humanName = currentPlayer === 'X' ? p1.name : p2.name;
                document.getElementById('turn-indicator').textContent = `${humanName}'s Turn`;
            }
        } else if (!tournament.active) {
            document.getElementById('turn-indicator').textContent = gameMode === 'ultimate-ai' && currentPlayer === 'O' ? getRandomMessage('thinking') : `Player ${currentPlayer}'s Turn (Any Board)`;
            if (gameMode === 'ultimate-ai' && currentPlayer === 'O') setTimeout(makeUltimateAIMove, 600);
        } else {
            // Human vs human tournament ultimate
            const [p1, p2] = tournament.currentMatchPlayers;
            const name = currentPlayer === 'X' ? p1.name : p2.name;
            document.getElementById('turn-indicator').textContent = `${name}'s Turn`;
        }
    }
}

// ========== TOURNAMENT FUNCTIONS ==========
// ── Tournament roster state ─────────────────────────────────
let humanSlots = []; // array of { id, name } for human players added to tournament

function _getTournamentSize() {
    return parseInt(document.getElementById('tournament-size').value) || 32;
}

function _updateRosterCounts() {
    const size = _getTournamentSize();
    const humanCount = humanSlots.length;
    const aiCount = size - humanCount;
    const countsEl = document.getElementById('tourn-roster-counts');
    const addBtn = document.querySelector('.tourn-add-player-btn');
    if (countsEl) {
        countsEl.innerHTML =
            `<strong>${aiCount}</strong> AI player${aiCount !== 1 ? 's' : ''} &nbsp;+&nbsp; ` +
            `<strong>${humanCount}</strong> human player${humanCount !== 1 ? 's' : ''} &nbsp;=&nbsp; ` +
            `<strong>${size}</strong> total`;
    }
    if (addBtn) addBtn.disabled = humanCount >= size;
}

function _renderHumanSlots() {
    const container = document.getElementById('tournament-human-slots');
    if (!container) return;
    container.innerHTML = '';
    humanSlots.forEach((slot, idx) => {
        const div = document.createElement('div');
        div.className = 'tourn-human-slot';
        div.innerHTML = `
            <span class="slot-label">Player ${idx + 1}</span>
            <input type="text" value="${slot.name}" placeholder="Enter name…"
                   oninput="humanSlots[${idx}].name = this.value">
            <button class="slot-remove" onclick="removeHumanPlayerSlot(${idx})" title="Remove player">✕</button>
        `;
        container.appendChild(div);
    });
    _updateRosterCounts();
}

function addHumanPlayerSlot() {
    const size = _getTournamentSize();
    if (humanSlots.length >= size) return;
    const id = Date.now() + humanSlots.length;
    humanSlots.push({ id, name: `Player ${humanSlots.length + 1}` });
    _renderHumanSlots();
}

function removeHumanPlayerSlot(idx) {
    humanSlots.splice(idx, 1);
    humanSlots.forEach((s, i) => {
        if (/^Player \d+$/.test(s.name)) s.name = `Player ${i + 1}`;
    });
    _renderHumanSlots();
}

function toggleAllAI() { updateTournamentUI(); }

// Generate random AI settings for a player
function generateRandomAISettings() {
    const difficulty = TOURNAMENT_AI_DIFFICULTIES[Math.floor(Math.random() * TOURNAMENT_AI_DIFFICULTIES.length)];
    const personality = TOURNAMENT_AI_PERSONALITIES[Math.floor(Math.random() * TOURNAMENT_AI_PERSONALITIES.length)];
    return { difficulty, personality };
}

function updateTournamentUI() {
    const size = _getTournamentSize();
    if (humanSlots.length > size) humanSlots = humanSlots.slice(0, size);
    _renderHumanSlots();
    document.getElementById('start-tournament-btn').style.display = 'inline-block';
}

function updatePlayerType(index) { /* no-op */ }

function startTournament() {
    const size = _getTournamentSize();
    const type = document.getElementById('tournament-type').value;
    const gameType = document.getElementById('tournament-game-type').value;
    const aiDiff = document.getElementById('tournament-ai-difficulty').value;

    const humanCount = humanSlots.length;
    const aiCount = size - humanCount;
    let aiCounter = 1;

    // Shuffle positions so humans land in random bracket slots
    const positions = Array.from({ length: size }, (_, i) => i);
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    const humanPositions = positions.slice(0, humanCount);
    const humanPosSet = new Set(humanPositions);

    const players = [];
    let humanIdx = 0;
    for (let i = 0; i < size; i++) {
        if (humanPosSet.has(i)) {
            const slot = humanSlots[humanIdx++];
            players.push({
                id: i,
                name: (slot && slot.name.trim()) ? slot.name.trim() : `Player ${humanIdx}`,
                type: 'human',
                difficulty: null, personality: null,
                wins: 0, losses: 0, draws: 0, points: 0
            });
        } else {
            const aiSettings = generateRandomAISettings();
            players.push({
                id: i,
                name: `AI ${aiCounter++}`,
                type: 'ai',
                difficulty: aiSettings.difficulty,
                personality: aiSettings.personality,
                wins: 0, losses: 0, draws: 0, points: 0
            });
        }
    }

    if (players.length < 2) {
        alert('Please add at least 2 players!');
        return;
    }

    tournament = {
        active: true,
        size: size,
        type: type,
        gameType: gameType,
        aiDifficulty: aiDiff,
        allAI: humanCount === 0,
        stage: type === 'single_elimination' ? 'knockout' : 'group',
        players: players,
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
    
    if (type === 'single_elimination') {
        generateSingleEliminationBracket();
    } else {
        generateTournamentGroups();
    }
    
    displayTournament();
    
    if (type === 'single_elimination') {
        startNextKnockoutMatch();
    } else {
        startNextGroupMatch();
    }
}

function generateSingleEliminationBracket() {
    const { players } = tournament;
    tournament.knockoutBracket = [];

    // Build first round with actual players
    const firstRoundMatches = [];
    for (let i = 0; i < players.length; i += 2) {
        if (i + 1 < players.length) {
            firstRoundMatches.push({
                player1: players[i],
                player2: players[i + 1],
                winner: null,
                completed: false
            });
        } else {
            firstRoundMatches.push({
                player1: players[i],
                player2: null,
                winner: players[i].id,
                completed: true
            });
        }
    }
    tournament.knockoutBracket.push(firstRoundMatches);

    // Pre-build all subsequent rounds as TBD slots
    let prevRoundSize = firstRoundMatches.length;
    while (prevRoundSize > 1) {
        const nextSize = Math.ceil(prevRoundSize / 2);
        const nextRound = [];
        for (let i = 0; i < nextSize; i++) {
            nextRound.push({ player1: null, player2: null, winner: null, completed: false });
        }
        tournament.knockoutBracket.push(nextRound);
        prevRoundSize = nextSize;
    }
}

function generateTournamentGroups() {
    const { size, players } = tournament;
    const groupSize = 4;
    const numGroups = Math.ceil(size / groupSize);
    const shuffledPlayers = [...players];
    
    // Shuffle players randomly
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }
    
    tournament.groups = [];
    for (let g = 0; g < numGroups; g++) {
        const groupPlayers = shuffledPlayers.slice(g * groupSize, (g + 1) * groupSize);
        tournament.groups.push({
            id: g,
            players: groupPlayers.map(p => ({ ...p })),
            matches: [],
            completed: false
        });
        tournament.groupResults[g] = [];
    }
    
    // Generate round-robin matches for each group
    for (let g = 0; g < numGroups; g++) {
        const group = tournament.groups[g];
        for (let i = 0; i < group.players.length; i++) {
            for (let j = i + 1; j < group.players.length; j++) {
                group.matches.push({
                    player1: group.players[i].id,
                    player2: group.players[j].id,
                    winner: null,
                    completed: false
                });
            }
        }
    }
}

function displayTournament() {
    const bracketDiv = document.getElementById('tournament-bracket');
    const stageTitle = document.getElementById('tournament-stage-title');
    const nextBtn = document.getElementById('next-match-btn');
    const endBtn = document.getElementById('end-tournament-btn');
    
    // Always show tournament display panel
    document.getElementById('tournament-display').style.display = 'block';
    
    const gameTypeText = tournament.gameType === 'ultimate' ? 'Ultimate' : 'Standard';
    
    if (tournament.stage === 'finished') {
        stageTitle.textContent = 'Tournament — Complete!';
        nextBtn.style.display = 'none';
        endBtn.style.display = 'inline-block';
        // Hide game boards when tournament is over
        document.getElementById('standard-board').style.display = 'none';
        document.getElementById('ultimate-board').style.display = 'none';
        bracketDiv.innerHTML = generateTournamentResultsHTML();
        return;
    }

    // During active tournament: hide boards by default; startNextMatch shows correct one
    if (tournament.stage === 'tiebreaker') {
        const tb = tournament.pendingTiebreaker;
        stageTitle.textContent = `Tiebreaker — Group ${tb ? tb.groupIndex + 1 : '?'} (${gameTypeText})`;
        nextBtn.style.display = 'none';
        endBtn.style.display = 'none';
        bracketDiv.innerHTML = generateGroupStageHTML();
    } else if (tournament.stage === 'group') {
        stageTitle.textContent = `Group Stage — Group ${tournament.currentGroupIndex + 1} / ${tournament.groups.length} (${gameTypeText})`;
        nextBtn.style.display = 'none'; // AI vs AI is automatic; button only for human matches
        endBtn.style.display = 'none';
        bracketDiv.innerHTML = generateGroupStageHTML();
    } else if (tournament.stage === 'knockout') {
        const maxRounds = tournament.knockoutBracket.length;
        const roundFromEnd = maxRounds - 1 - tournament.currentKnockoutRound;
        const roundNames = ['Final', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32', 'Round of 64'];
        const roundName = roundNames[roundFromEnd] || `Round ${tournament.currentKnockoutRound + 1}`;
        stageTitle.textContent = `Knockout — ${roundName} (${gameTypeText})`;
        nextBtn.style.display = 'none';
        endBtn.style.display = 'none';
        bracketDiv.innerHTML = generateKnockoutBracketHTML();
    }
}

// IMPROVED: Generate HTML for group stage with better visualization
function generateGroupStageHTML() {
    const group = tournament.groups[tournament.currentGroupIndex];
    const matches = group.matches;
    let html = '<div class="group-stage-display">';
    
    // Show all groups summary
    for (let g = 0; g < tournament.groups.length; g++) {
        const gGroup = tournament.groups[g];
        html += `<div class="tournament-group ${g === tournament.currentGroupIndex ? 'active' : ''}">`;
        html += `<h4>Group ${g + 1}</h4>`;
        
        // Show group standings
        if (tournament.groupResults[g] && tournament.groupResults[g].length > 0) {
            html += '<table class="group-standings">';
            html += '<tr><th>Rank</th><th>Player</th><th>Type</th><th>W</th><th>L</th><th>D</th><th>Pts</th></tr>';
            const sortedResults = [...tournament.groupResults[g]].sort((a, b) => b.points - a.points);
            sortedResults.forEach((result, idx) => {
                const playerObj = gGroup.players.find(p => p.id === result.id);
                const aiIndicator = playerObj?.type === 'ai' ? 'AI' : 'Human';
                const aiDetails = '';
                html += `<tr><td>${idx + 1}</td><td>${result.name}</td><td>${aiIndicator}</td><td>${result.wins}</td><td>${result.losses}</td><td>${result.draws}</td><td>${result.points}</td></tr>`;
            });
            html += '</table>';
        }
        html += '</div>';
    }
    
    html += '</div>';
    
    // Show current group matches
    html += '<div class="current-group-matches">';
    html += `<h4>Current Group ${tournament.currentGroupIndex + 1} Matches</h4>`;
    html += '<table class="match-list">';
    html += '<tr><th>Match</th><th>Player 1</th><th>vs</th><th>Player 2</th><th>Result</th></tr>';
    
    matches.forEach((match, idx) => {
        const player1 = group.players.find(p => p.id === match.player1);
        const player2 = group.players.find(p => p.id === match.player2);
        const isCurrent = idx === tournament.currentGroupMatch;
        const resultText = match.completed ? (match.winner === null ? 'Draw' : (match.winner === match.player1 ? 'W' : 'L')) : '';
        
        const p1Details = '';
        const p2Details = '';
        
        html += `<tr class="${isCurrent ? 'current-match' : ''}">`;
        html += `<td>${idx + 1}</td>`;
        html += `<td>${player1.name}${p1Details}${isCurrent ? ' *' : ''}</td>`;
        html += `<td>vs</td>`;
        html += `<td>${player2.name}${p2Details}${isCurrent ? ' *' : ''}</td>`;
        html += `<td>${resultText}</td>`;
        html += `</tr>`;
    });
    
    html += '</table>';
    html += '</div>';
    
    return html;
}

function generateKnockoutBracketHTML() {
    const bracket = tournament.knockoutBracket;
    const currentRound = tournament.currentKnockoutRound;
    const currentMatch = tournament.currentKnockoutMatch;
    const totalRounds = bracket.length;
    const numSideRounds = totalRounds - 1;

    // Each match box is 2 rows of ~22px = 44px total, plus 2px border
    const MATCH_H = 46;
    const BASE_GAP = 10; // gap between matches in round 0

    // Gap between consecutive matches in round r
    function gapForRound(r) {
        if (r === 0) return BASE_GAP;
        return (MATCH_H + gapForRound(r - 1)) * 2 - MATCH_H;
    }

    // Top offset for first match in round r so it aligns with its two source matches
    function topOffsetForRound(r) {
        if (r === 0) return 0;
        const prevGap = gapForRound(r - 1);
        return topOffsetForRound(r - 1) + (MATCH_H + prevGap) / 2;
    }

    function getName(p) {
        if (!p) return 'TBD';
        const o = typeof p === 'object' ? p : tournament.players.find(x => x.id === p);
        return o ? o.name : 'TBD';
    }
    function getObj(p) {
        if (!p) return null;
        return typeof p === 'object' ? p : tournament.players.find(x => x.id === p);
    }
    function won(match, slot) {
        if (!match.completed) return false;
        const p = slot === 1 ? match.player1 : match.player2;
        const o = getObj(p);
        return o && match.winner === o.id;
    }

    function renderMatch(match, rIdx, mIdx, isFinal) {
        const isCur = rIdx === currentRound && mIdx === currentMatch;
        const w1 = won(match, 1), w2 = won(match, 2);
        const cls = ['bk-match', isFinal ? 'bk-final-match' : '', isCur ? 'current' : '', match.completed ? 'completed' : ''].filter(Boolean).join(' ');
        const stub = isFinal ? '' : '<div class="bk-stub"></div>';
        return `<div class="${cls}">
            <div class="bk-team${w1 ? ' bk-winner' : ''}">${getName(match.player1)}</div>
            <div class="bk-team${w2 ? ' bk-winner' : ''}">${getName(match.player2)}</div>
            ${stub}
        </div>`;
    }

    const roundLabels = ['Round of 64', 'Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals'];

    function buildCol(roundIdx, side) {
        const roundMatches = bracket[roundIdx];
        const half = Math.ceil(roundMatches.length / 2);
        const matches = side === 'left' ? roundMatches.slice(0, half) : roundMatches.slice(half);
        const topOff = topOffsetForRound(roundIdx);
        const gap = gapForRound(roundIdx);
        const li = Math.max(0, roundLabels.length - numSideRounds + roundIdx);
        const label = roundLabels[li] || `Round ${roundIdx + 1}`;

        let inner = '';
        matches.forEach((m, i) => {
            const globalIdx = side === 'left' ? i : half + i;
            const mt = i === 0 ? topOff : gap;
            inner += `<div style="margin-top:${mt}px;position:relative">${renderMatch(m, roundIdx, globalIdx, false)}</div>`;
        });

        // Vertical connector lines joining pairs of matches feeding into the next round
        let vlines = '';
        const labelH = 24; // approximate label height offset
        for (let i = 0; i + 1 < matches.length; i += 2) {
            // Calculate centre Y of each match relative to the column (excluding label)
            const topMatchCY = topOff + i * (MATCH_H + gap) + MATCH_H / 2;
            const botMatchCY = topOff + (i + 1) * (MATCH_H + gap) + MATCH_H / 2;
            const lineTop = topMatchCY + labelH;
            const lineHeight = botMatchCY - topMatchCY;
            const stubX = side === 'left' ? 'right:-24px' : 'left:-24px';
            vlines += `<div style="position:absolute;${stubX};top:${lineTop}px;width:1.5px;height:${lineHeight}px;background:#bbb;pointer-events:none"></div>`;
        }

        return `<div class="bk-col bk-col-${side}" style="position:relative"><div class="bk-round-label">${label}</div>${inner}${vlines}</div>`;
    }

    let leftHTML = '';
    for (let r = 0; r < numSideRounds; r++) leftHTML += buildCol(r, 'left');

    let rightHTML = '';
    for (let r = numSideRounds - 1; r >= 0; r--) rightHTML += buildCol(r, 'right');

    const fm = bracket[totalRounds - 1]?.[0];
    const finalTopOff = topOffsetForRound(numSideRounds);
    const finalHTML = fm ? `<div class="bk-col bk-col-final">
        <div class="bk-round-label">Final</div>
        <div style="margin-top:${finalTopOff}px">${renderMatch(fm, totalRounds - 1, 0, true)}</div>
    </div>` : '';

    return `<div class="bk-bracket">${leftHTML}${finalHTML}${rightHTML}</div>`;
}

function generateTournamentResultsHTML() {
    let html = '<div class="tournament-results"><h3>🏆 Tournament Final Results</h3>';
    const winner = tournament.players.find(p => p.wins === Math.max(...tournament.players.map(p => p.wins)));
    if (winner) {
        html += `<div class="tournament-winner">🏆 <strong>${winner.name}</strong> is the Tournament Champion! 🏆</div>`;
    }
    html += '<table class="final-standings"><tr><th>Rank</th><th>Player</th><th>Type</th><th>Wins</th><th>Losses</th><th>Draws</th><th>Points</th></tr>';
    const sortedPlayers = [...tournament.players].sort((a, b) => b.points - a.points || b.wins - a.wins);
    sortedPlayers.forEach((player, idx) => {
        html += `<tr><td>${idx + 1}</td><td>${player.name}</td><td>${player.type === 'ai' ? 'AI' : 'Human'}</td><td>${player.wins}</td><td>${player.losses}</td><td>${player.draws}</td><td>${player.points}</td></tr>`;
    });
    html += '</table></div>';
    return html;
}

// Save AI learning data for each AI player after a tournament match and reload their weights
async function saveTournamentMatchAILearning(player1, player2, winnerSymbol) {
    const players = [
        { player: player1, symbol: 'X' },
        { player: player2, symbol: 'O' }
    ];
    for (const { player, symbol } of players) {
        if (player.type !== 'ai') continue;
        const personality = player.personality || 'neutral';
        const difficulty = player.difficulty || 'medium';
        const outcome = winnerSymbol === symbol ? 'ai_win' : (winnerSymbol === null ? 'draw' : 'player_win');
        const learningData = {
            aiPersonality: personality,
            aiDifficulty: difficulty,
            moveHistory: aiMoveHistory,
            outcome
        };
        try {
            const response = await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    winner: winnerSymbol,
                    result: winnerSymbol ? `${winnerSymbol} wins` : 'draw',
                    board: (tournament.gameType === 'ultimate')
                        ? { largeBoard, smallBoards }
                        : board,
                    gameMode: tournament.gameType === 'ultimate' ? 'ultimate-ai' : 'ai',
                    aiDifficulty: difficulty,
                    aiPersonality: personality,
                    learningData,
                    tournamentData: {
                        tournament: { size: tournament.size, type: tournament.type, gameType: tournament.gameType },
                        matchResult: { winner: winnerSymbol, result: winnerSymbol ? `${winnerSymbol} wins` : 'draw' }
                    }
                })
            });
            if (response.ok) {
                // Reload this AI's updated weights so future matches benefit
                const learnRes = await fetch(`/api/ai-learning?personality=${personality}&difficulty=${difficulty}`);
                if (learnRes.ok) {
                    const learnData = await learnRes.json();
                    aiLearningData[personality] = learnData.learningData || {};
                }
            }
        } catch (err) {
            console.error('Error saving tournament AI learning:', err);
        }
    }
    aiMoveHistory = [];
}

function recordAndNextTournamentMatch(winnerSymbol) {
    if (!tournament.active || !tournament.currentMatchPlayers) return;
    const [player1, player2] = tournament.currentMatchPlayers;
    let matchWinner = null;
    if (winnerSymbol === 'X') matchWinner = player1.id;
    else if (winnerSymbol === 'O') matchWinner = player2.id;

    // Save AI learning data for each AI player in this match
    saveTournamentMatchAILearning(player1, player2, winnerSymbol);

    if (tournament.stage === 'tiebreaker') {
        const tb = tournament.pendingTiebreaker;
        if (!tb) return;
        const match = tb.matches[tb.matchIndex];
        match.completed = true;
        match.winner = matchWinner;

        if (matchWinner === null) {
            // Draw in tiebreaker: allow up to 2 rematches, then count as a draw and move on
            match.drawCount = (match.drawCount || 0) + 1;
            const tbDmp1 = tournament.players.find(p => p.id === player1.id) || player1;
            const tbDmp2 = tournament.players.find(p => p.id === player2.id) || player2;
            if (match.drawCount >= 2) {
                // Count as completed draw — move on
                match.completed = true;
                match.winner = null;
                tbDmp1.draws++; tbDmp2.draws++;
            } else {
                // Rematch
                match.completed = false;
                match.winner = null;
                tbDmp1.draws++; tbDmp2.draws++;
            }
            tournament.aiX = null; tournament.aiO = null;
            displayTournament();
            setTimeout(() => startTiebreakerMatch(), 500);
            return;
        }

        tb.scores[matchWinner] = (tb.scores[matchWinner] || 0) + 1;
        const tbMp1 = tournament.players.find(p => p.id === player1.id) || player1;
        const tbMp2 = tournament.players.find(p => p.id === player2.id) || player2;
        if (matchWinner === player1.id) { tbMp1.wins++; tbMp2.losses++; }
        else { tbMp2.wins++; tbMp1.losses++; }
        tb.matchIndex++;
        tournament.aiX = null; tournament.aiO = null;
        displayTournament();
        setTimeout(() => startTiebreakerMatch(), 400);
        return;
    } else if (tournament.stage === 'group') {
        const group = tournament.groups[tournament.currentGroupIndex];
        const currentMatch = group.matches[tournament.currentGroupMatch];
        currentMatch.winner = matchWinner; 
        currentMatch.completed = true;
        
        if (!tournament.groupResults[tournament.currentGroupIndex]) {
            tournament.groupResults[tournament.currentGroupIndex] = [];
        }
        const groupResults = tournament.groupResults[tournament.currentGroupIndex];

        // Always resolve against master player objects so points/wins/losses are consistent
        const mp1 = tournament.players.find(p => p.id === player1.id) || player1;
        const mp2 = tournament.players.find(p => p.id === player2.id) || player2;

        // groupResults entries ARE the master objects — push reference if not present
        if (!groupResults.find(r => r.id === mp1.id)) groupResults.push(mp1);
        if (!groupResults.find(r => r.id === mp2.id)) groupResults.push(mp2);
        
        if (matchWinner === player1.id) {
            mp1.wins++; mp2.losses++; mp1.points += 3;
        } else if (matchWinner === player2.id) {
            mp2.wins++; mp1.losses++; mp2.points += 3;
        } else {
            mp1.draws++; mp2.draws++; mp1.points += 1; mp2.points += 1;
        }
        tournament.currentGroupMatch++;
    } else if (tournament.stage === 'knockout') {
        const roundMatches = tournament.knockoutBracket[tournament.currentKnockoutRound];
        const currentMatch = roundMatches[tournament.currentKnockoutMatch];

        const mp1 = tournament.players.find(p => p.id === player1.id) || player1;
        const mp2 = tournament.players.find(p => p.id === player2.id) || player2;

        // Draw in knockout = rematch: reset the match and replay it
        if (matchWinner === null) {
            currentMatch.winner = null;
            currentMatch.completed = false;
            mp1.draws++;
            mp2.draws++;
            displayTournament();
            if (tournament.stage === 'knockout') startNextKnockoutMatch();
            return;
        }

        currentMatch.winner = matchWinner;
        currentMatch.completed = true;
        
        if (matchWinner === player1.id) {
            mp1.wins++; mp1.points += 3; mp2.losses++;
        } else {
            mp2.wins++; mp2.points += 3; mp1.losses++;
        }
        
        // Advance winner to pre-created TBD slot in next round
        const winnerPlayer = matchWinner === player1.id ? mp1 : mp2;
        if (tournament.currentKnockoutRound + 1 < tournament.knockoutBracket.length) {
            const nextRoundMatches = tournament.knockoutBracket[tournament.currentKnockoutRound + 1];
            const nextMatchIndex = Math.floor(tournament.currentKnockoutMatch / 2);
            if (nextRoundMatches[nextMatchIndex]) {
                if (tournament.currentKnockoutMatch % 2 === 0) {
                    nextRoundMatches[nextMatchIndex].player1 = winnerPlayer;
                } else {
                    nextRoundMatches[nextMatchIndex].player2 = winnerPlayer;
                }
            }
        }
        tournament.currentKnockoutMatch++;
    }
    
    displayTournament();
    if (tournament.stage === 'tiebreaker') startTiebreakerMatch();
    else if (tournament.stage === 'group') startNextGroupMatch();
    else if (tournament.stage === 'knockout') startNextKnockoutMatch();
}

function startNextTournamentMatch() {
    if (tournament.stage === 'tiebreaker') startTiebreakerMatch();
    else if (tournament.stage === 'group') startNextGroupMatch();
    else if (tournament.stage === 'knockout') startNextKnockoutMatch();
}

function startNextGroupMatch() {
    let group = tournament.groups[tournament.currentGroupIndex];
    const completedMatches = group.matches.filter(m => m.completed).length;
    if (completedMatches >= group.matches.length) {
        tournament.currentGroupIndex++;
        if (tournament.currentGroupIndex >= tournament.groups.length) { 
            advanceToKnockoutStage(); 
            return; 
        }
        tournament.currentGroupMatch = 0;
        group = tournament.groups[tournament.currentGroupIndex];
    }
    const currentMatch = group.matches[tournament.currentGroupMatch];
    if (!currentMatch) return;

    const player1 = group.players.find(p => p.id === currentMatch.player1);
    const player2 = group.players.find(p => p.id === currentMatch.player2);
    tournament.currentMatchPlayers = [player1, player2];

    // Reset game state
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameOver = false;

    if (tournament.gameType === 'ultimate') {
        largeBoard = ['', '', '', '', '', '', '', '', ''];
        smallBoards = Array(9).fill().map(() => Array(9).fill(''));
        ultimateGameOver = false;
        document.getElementById('standard-board').style.display = 'none';
        document.getElementById('ultimate-board').style.display = 'block';
    } else {
        document.getElementById('standard-board').style.display = 'grid';
        document.getElementById('ultimate-board').style.display = 'none';
    }

    clearBoardUI();



    const bothAI = player1.type === 'ai' && player2.type === 'ai';
    const p1IsAI = player1.type === 'ai';
    const p2IsAI = player2.type === 'ai';

    tournament.currentMatchAIPlayer = null;

    if (bothAI) {
        // AI vs AI: fully automatic, X goes first (player1 is X-side AI)
        tournament.currentMatchAIPlayer = player1; // tracks "the AI that moves as O"
        // We run both sides: player1 plays as X-AI, player2 as O-AI
        // Use a flag to alternate who is "the current AI"
        tournament.aiX = player1;
        tournament.aiO = player2;
        currentPlayer = 'X';
        document.getElementById('turn-indicator').textContent = `${player1.name} vs ${player2.name} (Auto)`;
        document.getElementById('game-status').textContent = `Group: ${player1.name} vs ${player2.name}`;
        displayTournament();
        setTimeout(() => runAIvsAIMove(), 400);
    } else if (p1IsAI) {
        // AI is player1 = X side; AI moves first
        tournament.currentMatchAIPlayer = player1;
        currentPlayer = 'X';
        document.getElementById('turn-indicator').textContent = `${player2.name}'s Turn`;
        document.getElementById('game-status').textContent = `Group: ${player1.name} vs ${player2.name}`;
        displayTournament();
        setTimeout(() => makeTournamentAIMove(player1), 500);
    } else if (p2IsAI) {
        // AI is player2 = O side; human goes first
        tournament.currentMatchAIPlayer = player2;
        currentPlayer = 'X';
        document.getElementById('turn-indicator').textContent = `${player1.name}'s Turn`;
        document.getElementById('game-status').textContent = `Group: ${player1.name} vs ${player2.name}`;
        displayTournament();
    } else {
        // Human vs Human
        tournament.currentMatchAIPlayer = null;
        document.getElementById('turn-indicator').textContent = `${player1.name}'s Turn`;
        document.getElementById('game-status').textContent = `Group: ${player1.name} vs ${player2.name}`;
        displayTournament();
    }
}

function advanceToKnockoutStage() {
    const tw = tournament.tiebreakerWinners || {};

    // Check if any group still needs a tiebreaker
    for (let g = 0; g < tournament.groups.length; g++) {
        if (tw[g]) continue; // already resolved

        const groupResults = tournament.groupResults[g] || [];
        const sorted = [...groupResults].sort((a, b) => b.points - a.points);
        if (sorted.length < 2) continue;

        const secondPoints = sorted[1].points;
        const tiedFor2nd = sorted.filter((r, i) => i >= 1 && r.points === secondPoints);

        if (tiedFor2nd.length > 1) {
            tournament.pendingTiebreaker = {
                groupIndex: g,
                tiedPlayers: tiedFor2nd.map(r => tournament.players.find(p => p.id === r.id)).filter(Boolean),
                tiedPlayerIndex: 0
            };
            startTiebreakerMatch();
            return;
        }
    }

    // All tiebreakers resolved — pick top 2 from each group
    const advancingPlayers = [];
    for (let g = 0; g < tournament.groups.length; g++) {
        if (tw[g]) {
            // Use tiebreaker-determined advancement order
            tw[g].forEach(id => {
                const p = tournament.players.find(x => x.id === id);
                if (p) advancingPlayers.push(p);
            });
        } else {
            const groupResults = tournament.groupResults[g] || [];
            const sorted = [...groupResults].sort((a, b) => b.points - a.points);
            sorted.slice(0, 2).forEach(result => {
                const p = tournament.players.find(x => x.id === result.id);
                if (p) advancingPlayers.push(p);
            });
        }
    }

    buildKnockoutBracket(advancingPlayers);
}

function startTiebreakerMatch() {
    const tb = tournament.pendingTiebreaker;
    if (!tb) return;

    const players = tb.tiedPlayers;
    // Round-robin among tied players: play every combination
    // Build remaining tiebreaker matches if not built yet
    if (!tb.matches) {
        tb.matches = [];
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                tb.matches.push({ p1: players[i], p2: players[j], winner: null, completed: false, drawCount: 0 });
            }
        }
        tb.matchIndex = 0;
        tb.scores = {};
        tb.round = (tb.round || 0) + 1;
        players.forEach(p => { tb.scores[p.id] = 0; });
    }

    // Find next incomplete match
    while (tb.matchIndex < tb.matches.length && tb.matches[tb.matchIndex].completed) {
        tb.matchIndex++;
    }

    if (tb.matchIndex >= tb.matches.length) {
        // All tiebreaker matches done — pick winner by score
        const sortedByScore = [...players].sort((a, b) => (tb.scores[b.id] || 0) - (tb.scores[a.id] || 0));
        const topScore = tb.scores[sortedByScore[0].id] || 0;
        const stillTied = sortedByScore.filter(p => (tb.scores[p.id] || 0) === topScore);

        // If still tied after 2 tiebreaker rounds, resolve by random pick to prevent infinite loop
        if (stillTied.length > 1 && (tb.round || 1) >= 2) {
            const tbWinner = stillTied[Math.floor(Math.random() * stillTied.length)];
            const g = tb.groupIndex;
            const groupResults = tournament.groupResults[g];
            const sorted = [...groupResults].sort((a, b) => b.points - a.points);
            const firstId = sorted[0].id;
            tournament.pendingTiebreaker = null;
            tournament.tiebreakerWinners = tournament.tiebreakerWinners || {};
            tournament.tiebreakerWinners[g] = [firstId, tbWinner.id];
            advanceToKnockoutStage();
            return;
        }

        // If still tied, run another tiebreaker round
        if (stillTied.length > 1) {
            tb.matches = null; // Reset matches for another round
            tb.tiedPlayers = stillTied;
            tb.round = (tb.round || 1) + 1;
            startTiebreakerMatch();
            return;
        }

        // Clear winner — resolve
        const tbWinner = sortedByScore[0];
        const g = tb.groupIndex;
        const groupResults = tournament.groupResults[g];
        const sorted = [...groupResults].sort((a, b) => b.points - a.points);
        const firstId = sorted[0].id;
        tournament.pendingTiebreaker = null;
        tournament.tiebreakerWinners = tournament.tiebreakerWinners || {};
        tournament.tiebreakerWinners[g] = [firstId, tbWinner.id];
        advanceToKnockoutStage();
        return;
    }

    const match = tb.matches[tb.matchIndex];
    tournament.currentMatchPlayers = [match.p1, match.p2];
    tournament.stage = 'tiebreaker';

    document.getElementById('game-status').textContent =
        `Tiebreaker (Group ${tb.groupIndex + 1}): ${match.p1.name} vs ${match.p2.name}`;

    // Reset board and start match
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameOver = false;
    largeBoard = ['', '', '', '', '', '', '', '', ''];
    smallBoards = Array(9).fill().map(() => Array(9).fill(''));
    ultimateGameOver = false;
    clearBoardUI();

    if (tournament.gameType === 'ultimate') {
        document.getElementById('standard-board').style.display = 'none';
        document.getElementById('ultimate-board').style.display = 'block';
    } else {
        document.getElementById('standard-board').style.display = 'grid';
        document.getElementById('ultimate-board').style.display = 'none';
    }

    const p1 = match.p1, p2 = match.p2;
    const bothAI = p1.type === 'ai' && p2.type === 'ai';

    if (bothAI) {
        tournament.aiX = p1;
        tournament.aiO = p2;
        tournament.currentMatchAIPlayer = null;
        document.getElementById('turn-indicator').textContent = `${p1.name} vs ${p2.name} (Tiebreaker)`;
        displayTournament();
        setTimeout(() => runAIvsAIMove(), 400);
    } else if (p1.type === 'ai') {
        tournament.currentMatchAIPlayer = p1;
        tournament.aiX = null; tournament.aiO = null;
        document.getElementById('turn-indicator').textContent = `${p2.name}'s Turn`;
        displayTournament();
        setTimeout(() => makeTournamentAIMove(p1), 500);
    } else if (p2.type === 'ai') {
        tournament.currentMatchAIPlayer = p2;
        tournament.aiX = null; tournament.aiO = null;
        document.getElementById('turn-indicator').textContent = `${p1.name}'s Turn`;
        displayTournament();
    } else {
        tournament.currentMatchAIPlayer = null;
        tournament.aiX = null; tournament.aiO = null;
        document.getElementById('turn-indicator').textContent = `${p1.name}'s Turn`;
        displayTournament();
    }
}

function buildKnockoutBracket(advancingPlayers) {
    tournament.knockoutBracket = [];
    tournament.stage = 'knockout';
    tournament.currentKnockoutRound = 0;
    tournament.currentKnockoutMatch = 0;
    
    let currentRoundPlayers = [...advancingPlayers];
    // Build first round with actual players
    const firstRoundMatches = [];
    for (let i = 0; i < currentRoundPlayers.length; i += 2) {
        if (i + 1 < currentRoundPlayers.length) {
            firstRoundMatches.push({
                player1: currentRoundPlayers[i],
                player2: currentRoundPlayers[i + 1],
                winner: null,
                completed: false
            });
        } else {
            // Bye - odd player advances automatically
            firstRoundMatches.push({
                player1: currentRoundPlayers[i],
                player2: null,
                winner: currentRoundPlayers[i].id,
                completed: true
            });
        }
    }
    tournament.knockoutBracket.push(firstRoundMatches);

    // Pre-build all subsequent rounds as TBD slots so the bracket renders fully
    let prevRoundSize = firstRoundMatches.length;
    while (prevRoundSize > 1) {
        const nextSize = Math.ceil(prevRoundSize / 2);
        const nextRound = [];
        for (let i = 0; i < nextSize; i++) {
            nextRound.push({ player1: null, player2: null, winner: null, completed: false });
        }
        tournament.knockoutBracket.push(nextRound);
        prevRoundSize = nextSize;
    }
    
    startNextKnockoutMatch();
}

function startNextKnockoutMatch() {
    if (tournament.currentKnockoutRound >= tournament.knockoutBracket.length) {
        tournament.stage = 'finished';
        displayTournament();
        return;
    }
    
    const roundMatches = tournament.knockoutBracket[tournament.currentKnockoutRound];
    
    // Skip completed matches
    while (tournament.currentKnockoutMatch < roundMatches.length && 
           roundMatches[tournament.currentKnockoutMatch].completed) {
        tournament.currentKnockoutMatch++;
    }
    
    if (tournament.currentKnockoutMatch >= roundMatches.length) {
        tournament.currentKnockoutRound++;
        tournament.currentKnockoutMatch = 0;
        startNextKnockoutMatch();
        return;
    }
    
    const currentMatch = roundMatches[tournament.currentKnockoutMatch];
    const player1Obj = typeof currentMatch.player1 === 'object' ? currentMatch.player1 : tournament.players.find(p => p.id === currentMatch.player1);
    const player2Obj = typeof currentMatch.player2 === 'object' ? currentMatch.player2 : tournament.players.find(p => p.id === currentMatch.player2);

    if (!player1Obj || !player2Obj) {
        // Players not yet determined — wait
        displayTournament();
        return;
    }

    tournament.currentMatchPlayers = [player1Obj, player2Obj];

    // Reset game state
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameOver = false;

    if (tournament.gameType === 'ultimate') {
        largeBoard = ['', '', '', '', '', '', '', '', ''];
        smallBoards = Array(9).fill().map(() => Array(9).fill(''));
        ultimateGameOver = false;
        document.getElementById('standard-board').style.display = 'none';
        document.getElementById('ultimate-board').style.display = 'block';
    } else {
        document.getElementById('standard-board').style.display = 'grid';
        document.getElementById('ultimate-board').style.display = 'none';
    }

    // Reset cell UI
    clearBoardUI();

    const bothAI = player1Obj.type === 'ai' && player2Obj.type === 'ai';
    const p1IsAI = player1Obj.type === 'ai';
    const p2IsAI = player2Obj.type === 'ai';

    tournament.currentMatchAIPlayer = null;

    if (bothAI) {
        tournament.aiX = player1Obj;
        tournament.aiO = player2Obj;
        currentPlayer = 'X';
        document.getElementById('turn-indicator').textContent = `${player1Obj.name} vs ${player2Obj.name} (Auto)`;
        document.getElementById('game-status').textContent = `Knockout: ${player1Obj.name} vs ${player2Obj.name}`;
        displayTournament();
        setTimeout(() => runAIvsAIMove(), 400);
    } else if (p1IsAI) {
        tournament.currentMatchAIPlayer = player1Obj;
        currentPlayer = 'X';
        document.getElementById('turn-indicator').textContent = `${player2Obj.name}'s Turn`;
        document.getElementById('game-status').textContent = `Knockout: ${player1Obj.name} vs ${player2Obj.name}`;
        displayTournament();
        setTimeout(() => makeTournamentAIMove(player1Obj), 500);
    } else if (p2IsAI) {
        tournament.currentMatchAIPlayer = player2Obj;
        currentPlayer = 'X';
        document.getElementById('turn-indicator').textContent = `${player1Obj.name}'s Turn`;
        document.getElementById('game-status').textContent = `Knockout: ${player1Obj.name} vs ${player2Obj.name}`;
        displayTournament();
    } else {
        tournament.currentMatchAIPlayer = null;
        document.getElementById('turn-indicator').textContent = `${player1Obj.name}'s Turn`;
        document.getElementById('game-status').textContent = `Knockout: ${player1Obj.name} vs ${player2Obj.name}`;
        displayTournament();
    }
}

// Get AI move using a specific player's difficulty (for per-player difficulty in AI vs AI)
function getTournamentAIMove(player) {
    const diff = player.difficulty || 'medium';
    const savedPersonality = aiPersonality;
    // Temporarily set personality so getCurrentPatternWeights uses this player's learned data
    aiPersonality = player.personality || 'neutral';
    // Also set currentMatchAIPlayer so getUltimateAIMove picks up the right difficulty
    const savedAIPlayer = tournament.currentMatchAIPlayer;
    tournament.currentMatchAIPlayer = player;

    let move;
    if (tournament.gameType === 'ultimate') {
        move = getUltimateAIMove();
    } else {
        if (diff === 'easy') move = getRandomMove(board);
        else if (diff === 'medium') move = getMediumMove(board);
        else if (diff === 'hard') move = getHardMove(board);
        else move = getRandomMove(board);
    }

    aiPersonality = savedPersonality;
    tournament.currentMatchAIPlayer = savedAIPlayer;
    return move;
}

// AI vs AI: runs one move for the current player, then schedules the other
function runAIvsAIMove() {
    if (!tournament.active || !tournament.currentMatchPlayers) return;
    const [player1, player2] = tournament.currentMatchPlayers;
    // player1 = X side, player2 = O side
    const currentAIPlayer = currentPlayer === 'X' ? tournament.aiX : tournament.aiO;

    if (tournament.gameType === 'ultimate') {
        if (ultimateGameOver) return;
        const aiMove = getTournamentAIMove(currentAIPlayer);
        if (!aiMove) return;
        const { largeIndex, smallIndex } = aiMove;
        // Record move for AI learning
        const score = evaluateUltimateMove(largeIndex, smallIndex, true);
        recordAIMove(largeIndex, smallIndex, score, { largeBoard: [...largeBoard], smallBoards: smallBoards.map(a => [...a]) });
        smallBoards[largeIndex][smallIndex] = currentPlayer;
        const cell = document.querySelector(`.small-cell[data-large-index="${largeIndex}"][data-small-index="${smallIndex}"]`);
        if (cell) { cell.textContent = currentPlayer; cell.classList.add('taken'); }

        const smallWinner = checkSmallBoardWinner(largeIndex);
        if (smallWinner) {
            largeBoard[largeIndex] = smallWinner;
            const lc = document.querySelector(`.large-cell[data-large-index="${largeIndex}"] .large-cell-winner`);
            if (lc) { lc.textContent = smallWinner; lc.classList.add('taken'); }
            highlightWinner('small', largeIndex);
        } else if (isSmallBoardDrawn(largeIndex)) {
            largeBoard[largeIndex] = 'draw';
            const lc = document.querySelector(`.large-cell[data-large-index="${largeIndex}"] .large-cell-winner`);
            if (lc) { lc.textContent = 'Draw'; lc.classList.add('draw'); }
        }

        const largeWinner = checkLargeBoardWinner();
        if (largeWinner) {
            ultimateGameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            const winner = largeWinner === 'X' ? player1 : player2;
            document.getElementById('game-status').textContent = `${winner.name} wins!`;
            setTimeout(() => recordAndNextTournamentMatch(largeWinner), 1200);
            return;
        } else if (isLargeBoardDrawn()) {
            ultimateGameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = 'Draw!';
            setTimeout(() => recordAndNextTournamentMatch(null), 1200);
            return;
        }
    } else {
        if (gameOver) return;
        const move = getTournamentAIMove(currentAIPlayer);
        if (move === null) return;
        // Record move for AI learning
        recordAIMove(move, 0, 0, [...board]);
        board[move] = currentPlayer;
        const cells = document.querySelectorAll('#standard-board .cell');
        cells[move].textContent = currentPlayer;
        cells[move].classList.add('taken');

        const winner = checkWinner(board);
        if (winner) {
            gameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            const winnerPlayer = winner === 'X' ? player1 : player2;
            document.getElementById('game-status').textContent = `${winnerPlayer.name} wins!`;
            highlightWinner('standard');
            setTimeout(() => recordAndNextTournamentMatch(winner), 1200);
            return;
        } else if (checkDraw(board)) {
            gameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = 'Draw!';
            setTimeout(() => recordAndNextTournamentMatch(null), 1200);
            return;
        }
    }

    // Switch player and schedule next move
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    const nextAI = currentPlayer === 'X' ? tournament.aiX : tournament.aiO;
    document.getElementById('turn-indicator').textContent = `${nextAI.name} thinking...`;
    setTimeout(() => runAIvsAIMove(), 300);
}

// AI move for human-vs-AI tournament matches, using the AI player's own difficulty/personality
function makeTournamentAIMove(aiPlayer) {
    if (!tournament.active) return;

    if (tournament.gameType === 'ultimate') {
        if (ultimateGameOver) return;
        const aiMove = getTournamentAIMove(aiPlayer);
        if (!aiMove) return;
        const { largeIndex, smallIndex } = aiMove;
        const symbol = currentPlayer; // AI plays as currentPlayer (O if p2 is AI, X if p1 is AI)
        smallBoards[largeIndex][smallIndex] = symbol;
        const cell = document.querySelector(`.small-cell[data-large-index="${largeIndex}"][data-small-index="${smallIndex}"]`);
        if (cell) { cell.textContent = symbol; cell.classList.add('taken'); }

        const smallWinner = checkSmallBoardWinner(largeIndex);
        if (smallWinner) {
            largeBoard[largeIndex] = smallWinner;
            const lc = document.querySelector(`.large-cell[data-large-index="${largeIndex}"] .large-cell-winner`);
            if (lc) { lc.textContent = smallWinner; lc.classList.add('taken'); }
            highlightWinner('small', largeIndex);
        } else if (isSmallBoardDrawn(largeIndex)) {
            largeBoard[largeIndex] = 'draw';
            const lc = document.querySelector(`.large-cell[data-large-index="${largeIndex}"] .large-cell-winner`);
            if (lc) { lc.textContent = 'Draw'; lc.classList.add('draw'); }
        }

        const [p1, p2] = tournament.currentMatchPlayers;
        const largeWinner = checkLargeBoardWinner();
        if (largeWinner) {
            ultimateGameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = `${largeWinner === 'X' ? p1.name : p2.name} wins!`;
            setTimeout(() => recordAndNextTournamentMatch(largeWinner), 1500);
        } else if (isLargeBoardDrawn()) {
            ultimateGameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = 'Draw!';
            setTimeout(() => recordAndNextTournamentMatch(null), 1500);
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            const [p1, p2] = tournament.currentMatchPlayers;
            const humanName = aiPlayer === p1 ? p2.name : p1.name;
            document.getElementById('turn-indicator').textContent = `${humanName}'s Turn`;
        }
    } else {
        if (gameOver) return;
        const move = getTournamentAIMove(aiPlayer);
        if (move === null) return;
        const symbol = currentPlayer;
        board[move] = symbol;
        const cells = document.querySelectorAll('#standard-board .cell');
        cells[move].textContent = symbol;
        cells[move].classList.add('taken');

        const [p1, p2] = tournament.currentMatchPlayers;
        const winner = checkWinner(board);
        if (winner) {
            gameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = `${winner === 'X' ? p1.name : p2.name} wins!`;
            highlightWinner('standard');
            setTimeout(() => recordAndNextTournamentMatch(winner), 1500);
        } else if (checkDraw(board)) {
            gameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = 'Draw!';
            setTimeout(() => recordAndNextTournamentMatch(null), 1500);
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            const humanName = aiPlayer === p1 ? p2.name : p1.name;
            document.getElementById('turn-indicator').textContent = `${humanName}'s Turn`;
        }
    }
}

function nextTournamentMatch() {
    startNextTournamentMatch();
}

function endTournament() {
    tournament = {
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
        currentMatchAIPlayer: null,
        aiX: null,
        aiO: null,
        pendingTiebreaker: null,
        tiebreakerWinners: {}
    };
    
    humanSlots = [];
    document.getElementById('tournament-display').style.display = 'none';
    document.getElementById('tournament-settings').style.display = 'none';
    document.getElementById('standard-board').style.display = 'grid';
    document.getElementById('ultimate-board').style.display = 'none';
    
    gameMode = 'pvp';
    document.getElementById('game-mode').value = 'pvp';
    toggleGameMode();
}

function handleCellClick(e) {
    if (gameMode === 'ai' && currentPlayer === 'O') return;
    if (gameMode === 'ultimate' || gameMode === 'ultimate-ai') return;
    
    if (tournament.active) {
        const index = parseInt(e.target.getAttribute('data-index'));
        if (board[index] !== '' || gameOver) return;

        // Block clicks if it's an AI turn or an AI vs AI match
        const isAIvsAI = tournament.aiX && tournament.aiO;
        if (isAIvsAI) return; // fully automatic
        const aiPlayer = tournament.currentMatchAIPlayer;
        const [p1, p2] = tournament.currentMatchPlayers;
        // Determine which symbol the AI plays
        const aiSymbol = aiPlayer === p1 ? 'X' : 'O';
        if (aiPlayer && currentPlayer === aiSymbol) return;
        
        board[index] = currentPlayer;
        e.target.textContent = currentPlayer;
        e.target.classList.add('taken');
        
        const winner = checkWinner(board);
        if (winner) {
            gameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = `${winner === 'X' ? p1.name : p2.name} wins!`;
            highlightWinner('standard');
            setTimeout(() => recordAndNextTournamentMatch(winner), 1500);
        } else if (checkDraw(board)) {
            gameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = 'Draw!';
            setTimeout(() => recordAndNextTournamentMatch(null), 1500);
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            if (aiPlayer && currentPlayer === aiSymbol) {
                document.getElementById('turn-indicator').textContent = `${aiPlayer.name} thinking...`;
                setTimeout(() => makeTournamentAIMove(aiPlayer), 500);
            } else {
                const humanName = currentPlayer === 'X' ? p1.name : p2.name;
                document.getElementById('turn-indicator').textContent = `${humanName}'s Turn`;
            }
        }
        return;
    }
    
    const index = parseInt(e.target.getAttribute('data-index'));
    if (board[index] !== '' || gameOver) return;
    
    board[index] = currentPlayer;
    e.target.textContent = currentPlayer;
    e.target.classList.add('taken');
    
    const winner = checkWinner(board);
    if (winner) {
        gameOver = true;
        document.getElementById('turn-indicator').textContent = '';
        const isAIWinner = (gameMode === 'ai' || gameMode === 'ultimate-ai') && winner === 'O';
        document.getElementById('game-status').textContent = isAIWinner ? getAIWinMessage() : getPlayerWinMessage();
        highlightWinner('standard');
        saveGame(winner, winner === 'O' ? 'AI wins' : 'Player wins');
        setTimeout(() => resetGame(), 2000);
    } else if (checkDraw(board)) {
        gameOver = true;
        document.getElementById('turn-indicator').textContent = '';
        document.getElementById('game-status').textContent = getRandomMessage('draw');
        saveGame(null, 'draw');
        setTimeout(() => resetGame(), 2000);
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

// ── Save and Load Functions ───────────────────────────────────────

async function saveGame(winner, result) {
    try {
        const isAIGame = gameMode === 'ai' || gameMode === 'ultimate-ai' || 
                         (tournament.active && tournament.currentMatchPlayers && 
                          tournament.currentMatchPlayers.some(p => p.type === 'ai'));
        const effectivePersonality = (tournament.active && tournament.currentMatchAIPlayer)
            ? tournament.currentMatchAIPlayer.personality
            : (aiPersonality || 'neutral');
        const effectiveDifficulty = (tournament.active && tournament.currentMatchAIPlayer)
            ? tournament.currentMatchAIPlayer.difficulty
            : (aiDifficulty || 'medium');

        const learningData = isAIGame ? {
            aiPersonality: effectivePersonality,
            aiDifficulty: effectiveDifficulty,
            moveHistory: aiMoveHistory,
            outcome: winner === 'O' ? 'ai_win' : winner ? 'player_win' : 'draw'
        } : null;
        
        const tournamentData = tournament.active ? {
            tournament: {
                size: tournament.size,
                type: tournament.type,
                gameType: tournament.gameType
            },
            matchResult: { winner: winner, result: result }
        } : null;
        
        const response = await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                winner,
                result,
                board: (gameMode === 'ultimate' || gameMode === 'ultimate-ai' || tournament.gameType === 'ultimate')
                    ? { largeBoard, smallBoards }
                    : board,
                gameMode: gameMode,
                aiDifficulty: isAIGame ? aiDifficulty : null,
                aiPersonality: isAIGame ? aiPersonality : null,
                learningData: learningData,
                tournamentData: tournamentData,
                playedAt: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            loadHistory();
            if (isAIGame) {
                // Always reload learning data after any AI game so next game benefits
                const pKey = effectivePersonality;
                const dKey = effectiveDifficulty;
                const learnRes = await fetch(`/api/ai-learning?personality=${pKey}&difficulty=${dKey}`);
                if (learnRes.ok) {
                    const learnData = await learnRes.json();
                    aiLearningData[pKey] = learnData.learningData || {};
                }
            }
            setTimeout(() => refreshAllStats(), 300);
        } else {
            console.warn('Game not saved (not logged in?)');
        }
        aiMoveHistory = [];
    } catch (err) {
        console.error('Error saving game:', err);
    }
}

async function loadAILearningData() {
    if (!aiPersonality) return;
    try {
        const response = await fetch(`/api/ai-learning?personality=${aiPersonality}&difficulty=${aiDifficulty || 'medium'}`, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            const data = await response.json();
            aiLearningData[aiPersonality] = data.learningData || {};
        } else {
            console.warn('Could not load AI learning data');
        }
    } catch (err) {
        console.error('Error loading AI learning data:', err);
    }
}

async function refreshAllStats() {
    try {
        const statsElements = document.querySelectorAll('.stat-value, .global-stat-value');
        statsElements.forEach(el => el.textContent = '...');
        await Promise.all([
            loadStats(),
            loadLeaderboard(),
            loadLeaderboardByMode(),
            loadAIStats(),
            loadAILeaderboard(),
            loadAILeaderboardByMode()
        ]);
    } catch (err) {
        console.error('Error refreshing stats:', err);
    }
}

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
            const resultText = game.result === 'draw' ? 'Draw' : `${game.winner} wins`;
            
            const gameModeDisplay = {
                'pvp': 'Player vs Player',
                'ai': 'Player vs AI',
                'ultimate': 'Ultimate Tic Tac Toe (PvP)',
                'ultimate-ai': 'Ultimate Tic Tac Toe (vs AI)',
                'tournament': 'Tournament'
            }[game.gameMode] || game.gameMode;
            
            let gameDisplay = (game.gameMode === 'ultimate' || game.gameMode === 'ultimate-ai' || 
                (game.tournamentData && game.tournamentData.tournament && game.tournamentData.tournament.gameType === 'ultimate'))
                ? '<p>Ultimate Tic Tac Toe</p>'
                : `<div class="mini-board">${game.board.map((cell, i) => `<span class="mini-cell" data-index="${i}">${cell}</span>`).join('')}</div>`;
            
            const difficultyInfo = game.aiDifficulty
                ? `<div class="game-meta">Mode: ${gameModeDisplay}<br>Difficulty: ${game.aiDifficulty}, Personality: ${game.aiPersonality || 'neutral'}</div>`
                : `<div class="game-meta">Mode: ${gameModeDisplay}</div>`;
            
            const tournamentInfo = game.tournamentData
                ? `<div class="game-meta">Tournament: ${game.tournamentData.tournament?.size} players, ${game.tournamentData.tournament?.type === 'single_elimination' ? 'Single Elimination' : 'Group + Knockout'}, ${game.tournamentData.tournament?.gameType || 'standard'} mode</div>`
                : '';
            
            return `<div class="history-card"><div class="history-meta"><span class="history-result">${resultText}</span><span class="history-date">${date}</span></div>${difficultyInfo}${tournamentInfo}${gameDisplay}</div>`;
        }).join('');
    } catch (err) {
        historyList.innerHTML = '<p>Could not load history.</p>';
        console.error(err);
    }
}

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            console.warn('Not logged in or no stats available.');
            return;
        }
        const data = await response.json();
        const byMode = data.byMode || {};
        const global = data.global || { wins: 0, losses: 0, draws: 0 };
        
        const byDifficulty = {};
        ['easy', 'medium', 'hard'].forEach(difficulty => {
            const diffStats = byMode[difficulty] || { wins: 0, losses: 0, draws: 0 };
            byDifficulty[difficulty] = diffStats;
            document.getElementById(`${difficulty}-wins`).textContent = diffStats.wins;
            document.getElementById(`${difficulty}-losses`).textContent = diffStats.losses;
            document.getElementById(`${difficulty}-draws`).textContent = diffStats.draws;
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
            <tr><td>${index + 1}</td><td>${entry.username}</td><td>${entry.totalWins}</td><td>${entry.totalGames}</td><td>${entry.winRate}%</td></tr>
        `).join('');
    } catch (err) {
        console.error('Error loading player leaderboard:', err);
    }
}

async function loadLeaderboardByMode() {
    try {
        const response = await fetch('/api/leaderboard/by-mode');
        if (!response.ok) {
            console.warn('Could not load player leaderboard by mode.');
            return;
        }
        const leaderboard = await response.json();
        const leaderboardBody = document.getElementById('leaderboard-by-mode-body');
        if (leaderboard.length === 0) {
            leaderboardBody.innerHTML = '<tr><td colspan="6">No players on the leaderboard yet.</td></tr>';
            return;
        }
        const gameModeNames = {
            'pvp': 'PvP',
            'ai': 'vs AI',
            'ultimate': 'Ultimate PvP',
            'ultimate-ai': 'Ultimate vs AI',
            'tournament': 'Tournament'
        };
        leaderboardBody.innerHTML = leaderboard.map((entry, index) => {
            const modeDisplay = gameModeNames[entry.gameMode] || entry.gameMode;
            return `
                <tr><td>${index + 1}</td><td>${entry.username}</td><td>${modeDisplay}</td><td>${entry.totalWins}</td><td>${entry.totalGames}</td><td>${entry.winRate}%</td></tr>
            `;
        }).join('');
    } catch (err) {
        console.error('Error loading player leaderboard by mode:', err);
    }
}

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
            <tr><td>${index + 1}</td><td>${entry.difficulty}</td><td>${entry.personality}</td><td>${entry.totalWins}</td><td>${entry.totalGames}</td><td>${entry.winRate}%</td></tr>
        `).join('');
    } catch (err) {
        console.error('Error loading AI leaderboard:', err);
    }
}

async function loadAILeaderboardByMode() {
    try {
        const response = await fetch('/api/ai-leaderboard/by-mode');
        if (!response.ok) {
            console.warn('Could not load AI leaderboard by mode.');
            return;
        }
        const aiLeaderboard = await response.json();
        const aiLeaderboardBody = document.getElementById('ai-leaderboard-by-mode-body');
        if (aiLeaderboard.length === 0) {
            aiLeaderboardBody.innerHTML = '<tr><td colspan="7">No AI configurations on the leaderboard yet.</td></tr>';
            return;
        }
        const gameModeNames = {
            'ai': 'Standard vs AI',
            'ultimate-ai': 'Ultimate vs AI'
        };
        aiLeaderboardBody.innerHTML = aiLeaderboard.map((entry, index) => {
            const modeDisplay = gameModeNames[entry.gameMode] || entry.gameMode;
            return `
                <tr><td>${index + 1}</td><td>${entry.difficulty}</td><td>${entry.personality}</td><td>${modeDisplay}</td><td>${entry.totalWins}</td><td>${entry.totalGames}</td><td>${entry.winRate}%</td></tr>
            `;
        }).join('');
    } catch (err) {
        console.error('Error loading AI leaderboard by mode:', err);
    }
}

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

// FIXED: Prevent tournament from being triggered by game mode switch
function toggleGameMode() {
    const modeSelect = document.getElementById('game-mode');
    const newGameMode = modeSelect.value;
    
    // If we're switching FROM tournament mode, reset tournament
    if (gameMode === 'tournament' && newGameMode !== 'tournament') {
        tournament = {
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
    }
    
    gameMode = newGameMode;
    const difficultySection = document.getElementById('difficulty-section');
    const personalitySection = document.getElementById('personality-section');
    const standardBoard = document.getElementById('standard-board');
    const ultimateBoard = document.getElementById('ultimate-board');
    const tournamentSettings = document.getElementById('tournament-settings');
    const tournamentDisplay = document.getElementById('tournament-display');
    
    difficultySection.style.display = 'none';
    personalitySection.style.display = 'none';
    tournamentSettings.style.display = 'none';
    tournamentDisplay.style.display = 'none';
    
    if (gameMode === 'ai') {
        difficultySection.style.display = 'flex';
        personalitySection.style.display = 'flex';
        standardBoard.style.display = 'grid';
        ultimateBoard.style.display = 'none';
        if (aiDifficulty === null) aiDifficulty = 'medium';
        if (aiPersonality === null) aiPersonality = 'neutral';
        document.getElementById('ai-difficulty').value = aiDifficulty;
        document.getElementById('ai-personality').value = aiPersonality;
        loadAILearningData();
    } else if (gameMode === 'ultimate' || gameMode === 'ultimate-ai') {
        if (gameMode === 'ultimate-ai') {
            difficultySection.style.display = 'flex';
            personalitySection.style.display = 'flex';
            if (aiDifficulty === null) aiDifficulty = 'medium';
            if (aiPersonality === null) aiPersonality = 'neutral';
            document.getElementById('ai-difficulty').value = aiDifficulty;
            document.getElementById('ai-personality').value = aiPersonality;
            loadAILearningData();
        } else {
            difficultySection.style.display = 'none';
            personalitySection.style.display = 'none';
        }
        standardBoard.style.display = 'none';
        ultimateBoard.style.display = 'block';
    } else if (gameMode === 'tournament') {
        tournamentSettings.style.display = 'block';
        standardBoard.style.display = 'none';
        ultimateBoard.style.display = 'none';
        tournamentDisplay.style.display = 'none';
        humanSlots = []; // reset human players when re-entering tournament setup
        updateTournamentUI();
        // Reset tournament state when entering tournament mode
        tournament = {
            active: false,
            size: parseInt(document.getElementById('tournament-size').value) || 32,
            type: document.getElementById('tournament-type').value || 'group_knockout',
            gameType: document.getElementById('tournament-game-type').value || 'standard',
            aiDifficulty: document.getElementById('tournament-ai-difficulty').value || 'medium',
            allAI: document.getElementById('all-ai-checkbox')?.checked ?? true,
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
    } else {
        standardBoard.style.display = 'grid';
        ultimateBoard.style.display = 'none';
        aiDifficulty = null;
        aiPersonality = null;
    }
    resetGame();
}

function setAIDifficulty() { 
    aiDifficulty = document.getElementById('ai-difficulty').value; 
}

function setAIPersonality() { 
    aiPersonality = document.getElementById('ai-personality').value; 
    if (gameMode === 'ai' || gameMode === 'ultimate-ai') {
        loadAILearningData();
    }
}

function clearBoardUI() {
    // Standard board
    document.querySelectorAll('#standard-board .cell').forEach(c => {
        c.textContent = ''; c.className = 'cell';
    });
    // Ultimate board - small cells
    document.querySelectorAll('.small-cell').forEach(c => {
        c.textContent = ''; c.classList.remove('taken', 'winner');
    });
    // Ultimate board - large cell winner overlays
    document.querySelectorAll('.large-cell-winner').forEach(c => {
        c.textContent = ''; c.className = 'large-cell-winner';
    });
    // Ultimate board - large cell state
    document.querySelectorAll('.large-cell').forEach(c => {
        c.classList.remove('active', 'winner-X', 'winner-O', 'draw', 'won');
    });
}


function resetGame() {
    // If a tournament is active, abort it cleanly
    if (tournament.active) {
        tournament.active = false;
        tournament.aiX = null;
        tournament.aiO = null;
        tournament.currentMatchPlayers = null;
        tournament.currentMatchAIPlayer = null;
        tournament.stage = 'setup';
        document.getElementById('tournament-display').style.display = 'none';
    }

    board = ['', '', '', '', '', '', '', '', '']; // exactly 9
    currentPlayer = 'X'; 
    gameOver = false; 
    ultimateGameOver = false;

    largeBoard = ['', '', '', '', '', '', '', '', '']; 
    smallBoards = Array(9).fill().map(() => Array(9).fill(''));

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
        cell.className = 'large-cell-winner'; // reset ALL classes back to base
    });
    
    document.querySelectorAll('.large-cell').forEach(cell => { 
        cell.classList.remove('active', 'winner-X', 'winner-O', 'draw');
    });

    // Show/hide the correct board for the current mode
    const standardBoard = document.getElementById('standard-board');
    const ultimateBoard = document.getElementById('ultimate-board');
    if (gameMode === 'ultimate' || gameMode === 'ultimate-ai') {
        standardBoard.style.display = 'none';
        ultimateBoard.style.display = 'block';
    } else if (gameMode === 'tournament') {
        standardBoard.style.display = 'none';
        ultimateBoard.style.display = 'none';
    } else {
        standardBoard.style.display = 'grid';
        ultimateBoard.style.display = 'none';
    }

    document.getElementById('turn-indicator').textContent = 
        (gameMode === 'ai') ? getRandomMessage('turn') 
        : (gameMode === 'ultimate' || gameMode === 'ultimate-ai') ? "Player X's Turn (Any Board)" 
        : "Player X's Turn";
    
    document.getElementById('game-status').textContent = '';
    aiMoveHistory = [];
}

function initBoard() {
    document.querySelectorAll('#standard-board .cell').forEach(cell => { 
        cell.addEventListener('click', handleCellClick); 
    });
    
    document.querySelectorAll('.small-cell').forEach(cell => { 
        cell.addEventListener('click', handleSmallCellClick); 
    });
}

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
    if (response.ok) showGame(data.username); 
    else document.getElementById('auth-message').textContent = data.error; 
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
    aiLearningData = {
        neutral: null,
        mathematician: null,
        psychologist: null
    };
    
    tournament = {
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
}

function showGame(username) { 
    document.getElementById('auth-section').style.display = 'none'; 
    document.getElementById('game-section').style.display = 'block'; 
    document.getElementById('welcome-message').textContent = `Welcome, ${username}!`; 
    loadHistory(); 
    refreshAllStats(); 
    toggleGameMode(); 
}
