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
            const isAIWinner = (gameMode === 'ultimate-ai' || tournament.active) && largeWinner === 'O';
            document.getElementById('game-status').textContent = isAIWinner ? getAIWinMessage() : getPlayerWinMessage();
            
            if (tournament.active) {
                setTimeout(() => recordAndNextTournamentMatch(largeWinner), 1500);
            } else {
                saveGame(largeWinner, largeWinner === 'O' ? 'AI wins' : 'Player wins');
            }
        } else if (isLargeBoardDrawn()) {
            ultimateGameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = getRandomMessage('draw');
            
            if (tournament.active) {
                setTimeout(() => recordAndNextTournamentMatch(null), 1500);
            } else {
                saveGame(null, 'Ultimate Tic Tac Toe draw');
            }
        } else {
            currentPlayer = 'X';
            document.getElementById('turn-indicator').textContent = getRandomMessage('turn');
        }
    }
}

function handleSmallCellClick(e) {
    if ((gameMode !== 'ultimate' && gameMode !== 'ultimate-ai') || ultimateGameOver) return;
    if (gameMode === 'ultimate-ai' && currentPlayer === 'O') return;
    if (tournament.active && tournament.currentMatchAIPlayer && currentPlayer === 'O') return;
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
        const isAIWinner = gameMode === 'ultimate-ai' && largeWinner === 'O';
        document.getElementById('game-status').textContent = isAIWinner ? getAIWinMessage() : getPlayerWinMessage();
        saveGame(largeWinner, `${largeWinner} wins Ultimate Tic Tac Toe`);
    } else if (isLargeBoardDrawn()) {
        ultimateGameOver = true;
        document.getElementById('turn-indicator').textContent = '';
        document.getElementById('game-status').textContent = getRandomMessage('draw');
        saveGame(null, 'Ultimate Tic Tac Toe draw');
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        document.getElementById('turn-indicator').textContent = gameMode === 'ultimate-ai' && currentPlayer === 'O' ? getRandomMessage('thinking') : `Player ${currentPlayer}'s Turn (Any Board)`;
        if (tournament.active && tournament.currentMatchAIPlayer && currentPlayer === 'O') setTimeout(makeUltimateAIMove, 1000);
    }
}

// ========== TOURNAMENT FUNCTIONS ==========
function toggleAllAI() {
    tournament.allAI = document.getElementById('all-ai-checkbox').checked;
    updateTournamentUI();
}

// Generate random AI settings for a player
function generateRandomAISettings() {
    const difficulty = TOURNAMENT_AI_DIFFICULTIES[Math.floor(Math.random() * TOURNAMENT_AI_DIFFICULTIES.length)];
    const personality = TOURNAMENT_AI_PERSONALITIES[Math.floor(Math.random() * TOURNAMENT_AI_PERSONALITIES.length)];
    return { difficulty, personality };
}

function updateTournamentUI() {
    const size = parseInt(document.getElementById('tournament-size').value);
    const gameType = document.getElementById('tournament-game-type').value;
    const playersContainer = document.getElementById('tournament-players-container');
    tournament.size = size; tournament.gameType = gameType;
    playersContainer.innerHTML = '';
    
    // Add player selectors based on size - ONLY AI/Human selector
    for (let i = 0; i < size; i++) {
        const playerType = tournament.allAI ? 'ai' : 'human';
        const playerDiv = document.createElement('div');
        playerDiv.className = 'tournament-player-input';
        
        // Only show type selector (AI or Human)
        playerDiv.innerHTML = `
            <span>Player ${i + 1}:</span>
            <select onchange="updatePlayerType(${i})">
                <option value="human">Human</option>
                <option value="ai" ${playerType === 'ai' ? 'selected' : ''}>AI (Random Settings)</option>
            </select>
        `;
        playersContainer.appendChild(playerDiv);
    }
    
    document.getElementById('start-tournament-btn').style.display = 'inline-block';
}

function updatePlayerType(index) {
    // Just update the tournament allAI flag based on all selectors
    const selects = document.querySelectorAll('#tournament-players-container select');
    const allAreAI = Array.from(selects).every(s => s.value === 'ai');
    const someAreAI = Array.from(selects).some(s => s.value === 'ai');
    
    // Update the allAI checkbox
    document.getElementById('all-ai-checkbox').checked = allAreAI;
    tournament.allAI = allAreAI;
}

function startTournament() {
    const size = parseInt(document.getElementById('tournament-size').value);
    const type = document.getElementById('tournament-type').value;
    const gameType = document.getElementById('tournament-game-type').value;
    const aiDifficulty = document.getElementById('tournament-ai-difficulty').value;
    const playersContainer = document.getElementById('tournament-players-container');
    const typeSelects = playersContainer.querySelectorAll('select');
    
    // Get player data - generate random AI settings for AI players
    const players = [];
    for (let i = 0; i < size; i++) {
        const typeSelect = typeSelects[i];
        const type = typeSelect.value;
        
        // Generate random settings for AI players
        let difficulty = null;
        let personality = null;
        if (type === 'ai') {
            const aiSettings = generateRandomAISettings();
            difficulty = aiSettings.difficulty;
            personality = aiSettings.personality;
        }
        
        players.push({
            id: i,
            name: type === 'ai' ? `AI ${i + 1}` : `Player ${i + 1}`,
            type: type,
            difficulty: difficulty,
            personality: personality,
            wins: 0,
            losses: 0,
            draws: 0,
            points: 0
        });
    }
    
    if (players.length < 2) { 
        alert('Please add at least 2 players!'); 
        return; 
    }
    
    // Initialize tournament
    tournament = {
        active: true,
        size: size,
        type: type,
        gameType: gameType,
        aiDifficulty: aiDifficulty,
        allAI: document.getElementById('all-ai-checkbox').checked,
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
    let currentRoundPlayers = [...players];
    tournament.knockoutBracket = [];
    
    while (currentRoundPlayers.length > 1) {
        const roundMatches = [];
        for (let i = 0; i < currentRoundPlayers.length; i += 2) {
            if (i + 1 < currentRoundPlayers.length) {
                roundMatches.push({
                    player1: currentRoundPlayers[i],
                    player2: currentRoundPlayers[i + 1],
                    winner: null,
                    completed: false
                });
            } else {
                // Bye for odd number of players
                roundMatches.push({
                    player1: currentRoundPlayers[i],
                    player2: null,
                    winner: currentRoundPlayers[i].id,
                    completed: true
                });
            }
        }
        tournament.knockoutBracket.push(roundMatches);
        currentRoundPlayers = roundMatches.map(m => 
            m.completed && m.winner ? players.find(p => p.id === m.winner) : null
        ).filter(p => p !== null);
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
    
    document.getElementById('standard-board').style.display = 'none';
    document.getElementById('ultimate-board').style.display = 'none';
    document.getElementById('tournament-display').style.display = 'block';
    
    const gameTypeText = tournament.gameType === 'ultimate' ? 'Ultimate' : 'Standard';
    
    if (tournament.stage === 'group') {
        stageTitle.textContent = `Tournament - Group Stage (Group ${tournament.currentGroupIndex + 1}/${tournament.groups.length}) - ${gameTypeText} Mode`;
        nextBtn.style.display = 'inline-block';
        endBtn.style.display = 'none';
        bracketDiv.innerHTML = generateGroupStageHTML();
    } else if (tournament.stage === 'knockout') {
        const roundNames = ['Final', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32', 'Round of 64'];
        const currentRound = tournament.currentKnockoutRound;
        const roundName = roundNames[currentRound] || `Round ${tournament.knockoutBracket.length - currentRound}`;
        stageTitle.textContent = `Tournament - ${roundName} - ${gameTypeText} Mode`;
        nextBtn.style.display = 'inline-block';
        endBtn.style.display = 'none';
        bracketDiv.innerHTML = generateKnockoutBracketHTML();
    } else {
        stageTitle.textContent = 'Tournament - Completed';
        nextBtn.style.display = 'none';
        endBtn.style.display = 'inline-block';
        bracketDiv.innerHTML = generateTournamentResultsHTML();
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
                const aiDetails = playerObj?.type === 'ai' ? ` (${playerObj.difficulty}, ${playerObj.personality})` : '';
                html += `<tr><td>${idx + 1}</td><td>${result.name}${aiDetails}</td><td>${aiIndicator}</td><td>${result.wins}</td><td>${result.losses}</td><td>${result.draws}</td><td>${result.points}</td></tr>`;
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
        
        const p1Details = player1.type === 'ai' ? ` (${player1.difficulty}, ${player1.personality})` : '';
        const p2Details = player2.type === 'ai' ? ` (${player2.difficulty}, ${player2.personality})` : '';
        
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

// IMPROVED: Generate proper bracket visualization like the image
function generateKnockoutBracketHTML() {
    const bracket = tournament.knockoutBracket;
    const currentRound = tournament.currentKnockoutRound;
    const currentMatch = tournament.currentKnockoutMatch;
    
    // Calculate max rounds for spacing
    const maxRounds = bracket.length;
    
    let html = '<div class="bracket-round-container">';
    
    // Create bracket for each round
    for (let round = 0; round < maxRounds; round++) {
        const roundMatches = bracket[round];
        const roundNames = ['Final', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32', 'Round of 64'];
        const roundName = roundNames[round] || `Round ${maxRounds - round}`;
        
        html += `<div class="round-column">`;
        html += `<div class="round-header">${roundName}</div>`;
        
        // Add matches for this round
        for (let matchIdx = 0; matchIdx < roundMatches.length; matchIdx++) {
            const match = roundMatches[matchIdx];
            const isCurrent = round === currentRound && matchIdx === currentMatch;
            
            // Get player objects
            let player1 = null, player2 = null;
            if (match.player1) {
                player1 = typeof match.player1 === 'object' ? match.player1 : tournament.players.find(p => p.id === match.player1);
            }
            if (match.player2) {
                player2 = typeof match.player2 === 'object' ? match.player2 : tournament.players.find(p => p.id === match.player2);
            }
            
            const isWinner1 = match.completed && match.winner === match.player1?.id;
            const isWinner2 = match.completed && match.winner === match.player2?.id;
            
            // Add connector from previous round (except first round)
            if (round > 0) {
                html += '<div class="connector-line"></div>';
            }
            
            // Match card
            html += `<div class="match-card ${isCurrent ? 'current' : ''} ${match.completed ? 'completed' : ''}">`;
            
            // Team 1
            if (player1) {
                const aiDetails1 = player1.type === 'ai' ? ` (${player1.difficulty}, ${player1.personality})` : '';
                html += `<div class="team-name ${isWinner1 ? 'winner' : ''} ${player1.type === 'ai' ? 'ai' : ''}">
                    👤 ${player1.name}${aiDetails1}${isCurrent ? ' *' : ''}
                </div>`;
            } else {
                html += `<div class="team-name">TBD</div>`;
            }
            
            // VS
            html += `<div class="match-vs">vs</div>`;
            
            // Team 2
            if (player2) {
                const aiDetails2 = player2.type === 'ai' ? ` (${player2.difficulty}, ${player2.personality})` : '';
                html += `<div class="team-name ${isWinner2 ? 'winner' : ''} ${player2?.type === 'ai' ? 'ai' : ''}">
                    👤 ${player2.name}${aiDetails2}${isCurrent ? ' *' : ''}
                </div>`;
            } else {
                html += `<div class="team-name">TBD</div>`;
            }
            
            // Result
            const resultText = match.completed ? (match.winner === null ? 'Draw' : '') : '';
            html += `<div class="match-result">${resultText}</div>`;
            
            html += `</div>`;
            
            // Add connector to next match (except last in round)
            if (matchIdx < roundMatches.length - 1) {
                html += '<div class="connector-line"></div>';
            }
        }
        
        html += '</div>';
    }
    
    html += '</div>';
    
    return html;
}

function generateTournamentResultsHTML() {
    let html = '<div class="tournament-results"><h3>Tournament Final Results</h3>';
    const winner = tournament.players.find(p => p.wins === Math.max(...tournament.players.map(p => p.wins)));
    if (winner) {
        const aiDetails = winner.type === 'ai' ? ` (${winner.difficulty}, ${winner.personality})` : '';
        html += `<div class="tournament-winner">🏆 <strong>${winner.name}${aiDetails}</strong> is the Tournament Champion! 🏆</div>`;
    }
    html += '<table class="final-standings"><tr><th>Rank</th><th>Player</th><th>Type</th><th>Settings</th><th>Wins</th><th>Losses</th><th>Draws</th><th>Points</th></tr>';
    const sortedPlayers = [...tournament.players].sort((a, b) => b.points - a.points || b.wins - a.wins);
    sortedPlayers.forEach((player, idx) => {
        const aiDetails = player.type === 'ai' ? `${player.difficulty}, ${player.personality}` : '-';
        html += `<tr><td>${idx + 1}</td><td>${player.name}</td><td>${player.type === 'ai' ? 'AI' : 'Human'}</td><td>${aiDetails}</td><td>${player.wins}</td><td>${player.losses}</td><td>${player.draws}</td><td>${player.points}</td></tr>`;
    });
    html += '</table></div>';
    return html;
}

function recordAndNextTournamentMatch(winnerSymbol) {
    if (!tournament.active || !tournament.currentMatchPlayers) return;
    const [player1, player2] = tournament.currentMatchPlayers;
    let matchWinner = null;
    if (winnerSymbol === 'X') matchWinner = player1.id;
    else if (winnerSymbol === 'O') matchWinner = player2.id;
    
    if (tournament.stage === 'group') {
        const group = tournament.groups[tournament.currentGroupIndex];
        const currentMatch = group.matches[tournament.currentGroupMatch];
        currentMatch.winner = matchWinner; 
        currentMatch.completed = true;
        
        if (!tournament.groupResults[tournament.currentGroupIndex]) {
            tournament.groupResults[tournament.currentGroupIndex] = [];
        }
        const groupResults = tournament.groupResults[tournament.currentGroupIndex];
        
        let result1 = groupResults.find(r => r.id === player1.id);
        let result2 = groupResults.find(r => r.id === player2.id);
        
        if (!result1) {
            result1 = { id: player1.id, name: player1.name, wins: 0, losses: 0, draws: 0, points: 0, difficulty: player1.difficulty, personality: player1.personality };
            groupResults.push(result1);
        }
        if (!result2) {
            result2 = { id: player2.id, name: player2.name, wins: 0, losses: 0, draws: 0, points: 0, difficulty: player2.difficulty, personality: player2.personality };
            groupResults.push(result2);
        }
        
        if (matchWinner === player1.id) {
            result1.wins++; result2.losses++; result1.points += 3;
            player1.wins++; player2.losses++;
        } else if (matchWinner === player2.id) {
            result2.wins++; result1.losses++; result2.points += 3;
            player2.wins++; player1.losses++;
        } else {
            result1.draws++; result2.draws++; result1.points += 1; result2.points += 1;
            player1.draws++; player2.draws++;
        }
        tournament.currentGroupMatch++;
    } else if (tournament.stage === 'knockout') {
        const roundMatches = tournament.knockoutBracket[tournament.currentKnockoutRound];
        const currentMatch = roundMatches[tournament.currentKnockoutMatch];
        currentMatch.winner = matchWinner; 
        currentMatch.completed = true;
        
        if (matchWinner === player1.id) {
            player1.wins++; player2.losses++;
        } else if (matchWinner === player2.id) {
            player2.wins++; player1.losses++;
        } else {
            player1.draws++; player2.draws++;
        }
        
        if (matchWinner) {
            const winnerPlayer = matchWinner === player1.id ? player1 : player2;
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
        }
        tournament.currentKnockoutMatch++;
    }
    
    displayTournament();
    if (tournament.stage === 'group') startNextGroupMatch();
    else if (tournament.stage === 'knockout') startNextKnockoutMatch();
}

function startNextTournamentMatch() {
    if (tournament.stage === 'group') startNextGroupMatch();
    else if (tournament.stage === 'knockout') startNextKnockoutMatch();
}

function startNextGroupMatch() {
    const group = tournament.groups[tournament.currentGroupIndex];
    const completedMatches = group.matches.filter(m => m.completed).length;
    if (completedMatches >= group.matches.length) {
        tournament.currentGroupIndex++;
        if (tournament.currentGroupIndex >= tournament.groups.length) { 
            advanceToKnockoutStage(); 
            return; 
        }
        tournament.currentGroupMatch = 0;
    }
    const currentMatch = group.matches[tournament.currentGroupMatch];
    if (!currentMatch) { 
        alert('No more matches in this group!'); 
        return; 
    }
    const player1 = group.players.find(p => p.id === currentMatch.player1);
    const player2 = group.players.find(p => p.id === currentMatch.player2);
    tournament.currentMatchPlayers = [player1, player2];
    
    if (tournament.gameType === 'ultimate') {
        gameMode = 'ultimate';
        largeBoard = ['', '', '', '', '', '', '', '', ''];
        smallBoards = Array(9).fill().map(() => Array(9).fill(''));
        ultimateGameOver = false;
    } else {
        gameMode = 'pvp';
    }
    board = ['', '', '', '', '', '', '', '', '']; 
    currentPlayer = 'X'; 
    gameOver = false;
    
    tournament.currentMatchAIPlayer = null;
    if (player1.type === 'ai' && player2.type === 'ai') {
        tournament.currentMatchAIPlayer = Math.random() < 0.5 ? player1 : player2;
        currentPlayer = tournament.currentMatchAIPlayer === player1 ? 'O' : 'X';
    } else if (player1.type === 'ai') {
        tournament.currentMatchAIPlayer = player1;
        currentPlayer = 'X';
    } else if (player2.type === 'ai') {
        tournament.currentMatchAIPlayer = player2;
        currentPlayer = 'X';
    }
    
    if (tournament.currentMatchAIPlayer) {
        const humanPlayer = tournament.currentMatchAIPlayer === player1 ? player2 : player1;
        document.getElementById('turn-indicator').textContent = humanPlayer ? `${humanPlayer.name}'s Turn` : '';
    } else {
        document.getElementById('turn-indicator').textContent = player1 ? `${player1.name}'s Turn` : '';
    }
    
    const p1Details = player1.type === 'ai' ? ` (${player1.difficulty}, ${player1.personality})` : '';
    const p2Details = player2.type === 'ai' ? ` (${player2.difficulty}, ${player2.personality})` : '';
    document.getElementById('game-status').textContent = `Group Stage: ${player1.name}${p1Details} vs ${player2.name}${p2Details}`;
    
    if (tournament.gameType === 'ultimate') {
        document.getElementById('standard-board').style.display = 'none';
        document.getElementById('ultimate-board').style.display = 'block';
    } else {
        document.getElementById('standard-board').style.display = 'grid';
        document.getElementById('ultimate-board').style.display = 'none';
    }
    
    if (player1.type === 'ai' && player2.type === 'ai') {
        tournament.currentMatchAIPlayer = player1;
        currentPlayer = 'O';
        document.getElementById('turn-indicator').textContent = `${player1.name} (AI) thinking...`;
        setTimeout(() => {
            if (tournament.gameType === 'ultimate') makeUltimateAIMove();
            else makeAIMove();
        }, 500);
    }
    
    displayTournament();
}

function advanceToKnockoutStage() {
    const advancingPlayers = [];
    for (let g = 0; g < tournament.groups.length; g++) {
        const groupResults = tournament.groupResults[g] || [];
        const sorted = [...groupResults].sort((a, b) => b.points - a.points);
        advancingPlayers.push(...sorted.slice(0, 2));
    }
    tournament.knockoutBracket = [];
    tournament.stage = 'knockout';
    tournament.currentKnockoutRound = 0;
    tournament.currentKnockoutMatch = 0;
    
    let currentRoundPlayers = [...advancingPlayers];
    while (currentRoundPlayers.length > 1) {
        const roundMatches = [];
        for (let i = 0; i < currentRoundPlayers.length; i += 2) {
            if (i + 1 < currentRoundPlayers.length) {
                roundMatches.push({
                    player1: currentRoundPlayers[i],
                    player2: currentRoundPlayers[i + 1],
                    winner: null,
                    completed: false
                });
            }
        }
        tournament.knockoutBracket.push(roundMatches);
        currentRoundPlayers = roundMatches.map(m => null);
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
    const player1 = currentMatch.player1;
    const player2 = currentMatch.player2;
    
    const player1Obj = typeof player1 === 'object' ? player1 : tournament.players.find(p => p.id === player1);
    const player2Obj = typeof player2 === 'object' ? player2 : tournament.players.find(p => p.id === player2);
    
    tournament.currentMatchPlayers = [player1Obj, player2Obj];
    
    if (tournament.gameType === 'ultimate') {
        gameMode = 'ultimate';
        largeBoard = ['', '', '', '', '', '', '', '', ''];
        smallBoards = Array(9).fill().map(() => Array(9).fill(''));
        ultimateGameOver = false;
    } else {
        gameMode = 'pvp';
    }
    
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameOver = false;
    
    tournament.currentMatchAIPlayer = null;
    if (player1Obj && player2Obj) {
        if (player1Obj.type === 'ai' && player2Obj.type === 'ai') {
            tournament.currentMatchAIPlayer = Math.random() < 0.5 ? player1Obj : player2Obj;
            currentPlayer = tournament.currentMatchAIPlayer === player1Obj ? 'O' : 'X';
        } else if (player1Obj.type === 'ai') {
            tournament.currentMatchAIPlayer = player1Obj;
            currentPlayer = 'X';
        } else if (player2Obj.type === 'ai') {
            tournament.currentMatchAIPlayer = player2Obj;
            currentPlayer = 'X';
        }
    }
    
    if (player1Obj && player2Obj) {
        if (tournament.currentMatchAIPlayer) {
            const humanPlayer = tournament.currentMatchAIPlayer === player1Obj ? player2Obj : player1Obj;
            document.getElementById('turn-indicator').textContent = humanPlayer ? `${humanPlayer.name}'s Turn` : '';
        } else {
            document.getElementById('turn-indicator').textContent = player1Obj ? `${player1Obj.name}'s Turn` : '';
        }
        
        const p1Details = player1Obj.type === 'ai' ? ` (${player1Obj.difficulty}, ${player1Obj.personality})` : '';
        const p2Details = player2Obj.type === 'ai' ? ` (${player2Obj.difficulty}, ${player2Obj.personality})` : '';
        document.getElementById('game-status').textContent = `Knockout: ${player1Obj.name}${p1Details} vs ${player2Obj.name}${p2Details}`;
    }
    
    if (tournament.gameType === 'ultimate') {
        document.getElementById('standard-board').style.display = 'none';
        document.getElementById('ultimate-board').style.display = 'block';
    } else {
        document.getElementById('standard-board').style.display = 'grid';
        document.getElementById('ultimate-board').style.display = 'none';
    }
    
    if (player1Obj && player2Obj && player1Obj.type === 'ai' && player2Obj.type === 'ai') {
        tournament.currentMatchAIPlayer = player1Obj;
        currentPlayer = 'O';
        document.getElementById('turn-indicator').textContent = `${player1Obj.name} (AI) thinking...`;
        setTimeout(() => {
            if (tournament.gameType === 'ultimate') makeUltimateAIMove();
            else makeAIMove();
        }, 500);
    }
    
    displayTournament();
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
        currentMatchAIPlayer: null
    };
    
    document.getElementById('tournament-display').style.display = 'none';
    document.getElementById('tournament-settings').style.display = 'none';
    document.getElementById('standard-board').style.display = 'grid';
    
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
        if (tournament.currentMatchAIPlayer && currentPlayer === 'O') return;
        
        board[index] = currentPlayer;
        e.target.textContent = currentPlayer;
        e.target.classList.add('taken');
        
        const winner = checkWinner(board);
        if (winner) {
            gameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            const [player1, player2] = tournament.currentMatchPlayers;
            document.getElementById('game-status').textContent = `${winner === 'X' ? player1.name : player2.name} wins!`;
            highlightWinner('standard');
            setTimeout(() => recordAndNextTournamentMatch(winner), 1500);
        } else if (checkDraw(board)) {
            gameOver = true;
            document.getElementById('turn-indicator').textContent = '';
            document.getElementById('game-status').textContent = 'Draw!';
            setTimeout(() => recordAndNextTournamentMatch(null), 1500);
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            const [player1, player2] = tournament.currentMatchPlayers;
            if (tournament.currentMatchAIPlayer && currentPlayer === 'O') {
                if (tournament.gameType === 'ultimate') setTimeout(makeUltimateAIMove, 1000);
                else setTimeout(makeAIMove, 500);
            } else {
                const currentPlayerName = currentPlayer === 'X' ? player1.name : player2.name;
                document.getElementById('turn-indicator').textContent = `${currentPlayerName}'s Turn`;
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

// ── Save and Load Functions ───────────────────────────────────────

async function saveGame(winner, result) {
    try {
        const isAIGame = gameMode === 'ai' || gameMode === 'ultimate-ai';
        const learningData = gameMode === 'ultimate-ai' ? {
            aiPersonality: aiPersonality || 'neutral',
            aiDifficulty: aiDifficulty || 'medium',
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
            if (isAIGame && (gameMode === 'ai' || gameMode === 'ultimate-ai')) {
                loadAILearningData();
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
        updateTournamentUI();
        // Reset tournament state when entering tournament mode
        tournament = {
            active: false,
            size: parseInt(document.getElementById('tournament-size').value) || 32,
            type: document.getElementById('tournament-type').value || 'group_knockout',
            gameType: document.getElementById('tournament-game-type').value || 'standard',
            aiDifficulty: document.getElementById('tournament-ai-difficulty').value || 'medium',
            allAI: document.getElementById('all-ai-checkbox').checked,
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

function resetGame() {
    board = ['', '', '', '', '', '', '', '', '', '']; 
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
        cell.classList.remove('taken', 'draw', 'X', 'O'); 
    });
    
    document.querySelectorAll('.large-cell').forEach(cell => { 
        cell.classList.remove('active'); 
    });

    document.getElementById('turn-indicator').textContent = gameMode === 'ai' 
        ? getRandomMessage('turn') 
        : (gameMode === 'ultimate' || gameMode === 'ultimate-ai') 
            ? "Player X's Turn (Any Board)" 
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
