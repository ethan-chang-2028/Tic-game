// Modified makeUltimateAIMove for tournament support
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
        if (tournament.active) {
            setTimeout(() => recordAndNextTournamentMatch(largeWinner), 1500);
        } else {
            saveGame(largeWinner, `${largeWinner} wins Ultimate Tic Tac Toe`);
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
    
    // Add player selectors based on size
    for (let i = 0; i < size; i++) {
        const playerType = tournament.allAI ? 'ai' : 'human';
        const playerDiv = document.createElement('div');
        playerDiv.className = 'tournament-player-input';
        
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
    const selects = document.querySelectorAll('#tournament-players-container select');
    const allAreAI = Array.from(selects).every(s => s.value === 'ai');
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
    
    // Handle byes for non-power-of-2 sizes
    const targetSize = Math.pow(2, Math.ceil(Math.log2(players.length)));
    while (currentRoundPlayers.length < targetSize) {
        currentRoundPlayers.push(null); // Byes
    }
    
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
                // Bye
                roundMatches.push({
                    player1: currentRoundPlayers[i],
                    player2: null,
                    winner: currentRoundPlayers[i]?.id || null,
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

function advanceToKnockoutStage() {
    // Sort all players by points and take top 16 (or adjust based on tournament size)
    const allResults = [];
    for (let g = 0; g < tournament.groups.length; g++) {
        allResults.push(...tournament.groupResults[g]);
    }
    
    // Sort by points, then wins, then draws
    allResults.sort((a, b) => b.points - a.points || b.wins - a.wins || b.draws - a.draws);
    
    // Take top players for knockout (adjust as needed)
    const knockoutPlayers = allResults.slice(0, Math.min(16, allResults.length));
    tournament.players = tournament.players.filter(p => knockoutPlayers.some(r => r.id === p.id));
    tournament.stage = 'knockout';
    tournament.currentKnockoutRound = 0;
    tournament.currentKnockoutMatch = 0;
    tournament.knockoutBracket = [];
    generateSingleEliminationBracket();
    startNextKnockoutMatch();
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
        const roundNames = ['Final', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32', 'Round of 64', 'Round of 128', 'Round of 256', 'Round of 512', 'Round of 1024'];
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

function generateGroupStageHTML() {
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
                html += `<tr><td>${idx + 1}</td><td>${playerObj?.name || 'Unknown'}${aiDetails}</td><td>${aiIndicator}</td><td>${result.wins}</td><td>${result.losses}</td><td>${result.draws}</td><td>${result.points}</td></tr>`;
            });
            html += '</table>';
        }
        
        // Show matches
        html += '<div class="group-matches">';
        gGroup.matches.forEach((match, mIdx) => {
            const player1 = gGroup.players.find(p => p.id === match.player1);
            const player2 = gGroup.players.find(p => p.id === match.player2);
            const player1Name = player1 ? `${player1.name}${player1.type === 'ai' ? ` (${player1.difficulty}, ${player1.personality})` : ''}` : 'Bye';
            const player2Name = player2 ? `${player2.name}${player2.type === 'ai' ? ` (${player2.difficulty}, ${player2.personality})` : ''}` : 'Bye';
            const winnerName = match.winner !== null && match.completed ? (match.winner === match.player1 ? player1Name : player2Name) : 'TBD';
            const matchStatus = match.completed ? (match.winner === null ? 'Draw' : 'Completed') : 'Pending';
            html += `<div class="group-match ${match.completed ? 'completed' : ''} ${g === tournament.currentGroupIndex && mIdx === tournament.currentGroupMatch ? 'current' : ''}">`;
            html += `<span>${player1Name} vs ${player2Name}</span>`;
            html += `<span class="match-result">${matchStatus}: ${winnerName === 'TBD' ? '' : winnerName}</span>`;
            html += '</div>';
        });
        html += '</div></div>';
    }
    html += '</div>';
    return html;
}

function generateKnockoutBracketHTML() {
    let html = '<div class="knockout-bracket">';
    tournament.knockoutBracket.forEach((round, roundIdx) => {
        html += `<div class="knockout-round">`;
        html += `<h4>Round ${tournament.knockoutBracket.length - roundIdx}</h4>`;
        round.forEach((match, matchIdx) => {
            const player1 = match.player1 ? tournament.players.find(p => p.id === match.player1.id) : null;
            const player2 = match.player2 ? tournament.players.find(p => p.id === match.player2.id) : null;
            const player1Name = player1 ? `${player1.name}${player1.type === 'ai' ? ` (${player1.difficulty}, ${player1.personality})` : ''}` : 'Bye';
            const player2Name = player2 ? `${player2.name}${player2.type === 'ai' ? ` (${player2.difficulty}, ${player2.personality})` : ''}` : 'Bye';
            const winnerName = match.winner !== null && match.completed ? (match.winner === match.player1?.id ? player1Name : player2Name) : 'TBD';
            const matchStatus = match.completed ? (match.winner === null ? 'Draw' : 'Completed') : 'Pending';
            html += `<div class="knockout-match ${match.completed ? 'completed' : ''} ${roundIdx === tournament.currentKnockoutRound && matchIdx === tournament.currentKnockoutMatch ? 'current' : ''}">`;
            html += `<div class="match-players">${player1Name} vs ${player2Name}</div>`;
            html += `<div class="match-result">${matchStatus}: ${winnerName === 'TBD' ? '' : winnerName}</div>`;
            html += '</div>';
        });
        html += '</div>';
    });
    html += '</div>';
    return html;
}

function generateTournamentResultsHTML() {
    let html = '<div class="tournament-results">';
    html += '<h3>Final Standings</h3>';
    html += '<table class="final-standings">';
    html += '<tr><th>Rank</th><th>Player</th><th>Type</th><th>W</th><th>L</th><th>D</th><th>Pts</th></tr>';
    
    const sortedPlayers = [...tournament.players].sort((a, b) => b.points - a.points || b.wins - a.wins || b.draws - a.draws);
    sortedPlayers.forEach((player, idx) => {
        const aiIndicator = player.type === 'ai' ? 'AI' : 'Human';
        const aiDetails = player.type === 'ai' ? ` (${player.difficulty}, ${player.personality})` : '';
        html += `<tr><td>${idx + 1}</td><td>${player.name}${aiDetails}</td><td>${aiIndicator}</td><td>${player.wins}</td><td>${player.losses}</td><td>${player.draws}</td><td>${player.points}</td></tr>`;
    });
    
    html += '</table>';
    html += '</div>';
    return html;
}

function recordAndNextTournamentMatch(winner) {
    if (!tournament.active) return;

    const match = tournament.stage === 'group'
        ? tournament.groups[tournament.currentGroupIndex].matches[tournament.currentGroupMatch]
        : tournament.knockoutBracket[tournament.currentKnockoutRound][tournament.currentKnockoutMatch];

    // Record the result
    match.winner = winner;
    match.completed = true;

    // Update player stats
    const player1 = tournament.players.find(p => p.id === match.player1?.id);
    const player2 = tournament.players.find(p => p.id === match.player2?.id);

    if (player1) {
        if (winner === player1.id) player1.wins++;
        else if (winner === player2?.id) player1.losses++;
        else if (winner === null) player1.draws++;
    }
    if (player2) {
        if (winner === player2.id) player2.wins++;
        else if (winner === player1?.id) player2.losses++;
        else if (winner === null) player2.draws++;
    }

    // Award points for group stage
    if (tournament.stage === 'group') {
        if (winner === null) {
            if (player1) player1.points += 1;
            if (player2) player2.points += 1;
        } else {
            const winnerObj = tournament.players.find(p => p.id === winner);
            if (winnerObj) winnerObj.points += 3;
        }
        
        // Update group results
        const groupResults = tournament.groupResults[tournament.currentGroupIndex] || [];
        const existingPlayer1 = groupResults.find(r => r.id === player1?.id);
        const existingPlayer2 = groupResults.find(r => r.id === player2?.id);
        
        if (player1) {
            if (existingPlayer1) {
                existingPlayer1.wins = player1.wins;
                existingPlayer1.losses = player1.losses;
                existingPlayer1.draws = player1.draws;
                existingPlayer1.points = player1.points;
            } else {
                groupResults.push({ id: player1.id, wins: player1.wins, losses: player1.losses, draws: player1.draws, points: player1.points });
            }
        }
        if (player2) {
            if (existingPlayer2) {
                existingPlayer2.wins = player2.wins;
                existingPlayer2.losses = player2.losses;
                existingPlayer2.draws = player2.draws;
                existingPlayer2.points = player2.points;
            } else {
                groupResults.push({ id: player2.id, wins: player2.wins, losses: player2.losses, draws: player2.draws, points: player2.points });
            }
        }
        tournament.groupResults[tournament.currentGroupIndex] = groupResults;
    }

    // Advance to next match
    if (tournament.stage === 'group') {
        tournament.currentGroupMatch++;
        const group = tournament.groups[tournament.currentGroupIndex];
        if (tournament.currentGroupMatch >= group.matches.length) {
            tournament.currentGroupIndex++;
            tournament.currentGroupMatch = 0;
            if (tournament.currentGroupIndex >= tournament.groups.length) {
                // All groups completed, move to knockout
                if (tournament.type === 'group_knockout') {
                    advanceToKnockoutStage();
                } else {
                    endTournament();
                }
            }
        }
        startNextGroupMatch();
    } else {
        tournament.currentKnockoutMatch++;
        const round = tournament.knockoutBracket[tournament.currentKnockoutRound];
        if (tournament.currentKnockoutMatch >= round.length) {
            tournament.currentKnockoutRound++;
            tournament.currentKnockoutMatch = 0;
            if (tournament.currentKnockoutRound >= tournament.knockoutBracket.length) {
                endTournament();
                return;
            }
        }
        startNextKnockoutMatch();
    }
    
    displayTournament();
}

function startNextGroupMatch() {
    const group = tournament.groups[tournament.currentGroupIndex];
    if (!group) return;
    
    if (tournament.currentGroupMatch >= group.matches.length) {
        return;
    }

    const match = group.matches[tournament.currentGroupMatch];
    if (match.completed) {
        tournament.currentGroupMatch++;
        startNextGroupMatch();
        return;
    }

    tournament.currentMatchPlayers = [
        tournament.players.find(p => p.id === match.player1),
        tournament.players.find(p => p.id === match.player2)
    ].filter(p => p !== undefined);

    // Reset game state
    resetGame();

    // Set up the match
    const player1 = tournament.currentMatchPlayers[0];
    const player2 = tournament.currentMatchPlayers[1];

    if (player1.type === 'ai' && player2.type === 'ai') {
        // AI vs AI: auto-play
        tournament.currentMatchAIPlayer = player1;
        gameMode = tournament.gameType === 'ultimate' ? 'ultimate-ai' : 'ai';
        aiPersonality = player1.personality;
        aiDifficulty = player1.difficulty;
        currentPlayer = 'X';
        if (tournament.gameType === 'ultimate') {
            setTimeout(makeUltimateAIMove, 1000);
        } else {
            setTimeout(makeAIMove, 1000);
        }
    } else if (player1.type === 'ai') {
        // AI vs Human
        tournament.currentMatchAIPlayer = player1;
        gameMode = tournament.gameType === 'ultimate' ? 'ultimate-ai' : 'ai';
        aiPersonality = player1.personality;
        aiDifficulty = player1.difficulty;
        currentPlayer = 'X';
    } else if (player2.type === 'ai') {
        // Human vs AI
        tournament.currentMatchAIPlayer = player2;
        gameMode = tournament.gameType === 'ultimate' ? 'ultimate-ai' : 'ai';
        aiPersonality = player2.personality;
        aiDifficulty = player2.difficulty;
        currentPlayer = 'X';
    } else {
        // Human vs Human
        gameMode = tournament.gameType;
        currentPlayer = 'X';
    }

    displayTournament();
    updateGameUI();
}

function startNextKnockoutMatch() {
    const round = tournament.knockoutBracket[tournament.currentKnockoutRound];
    if (!round) return;
    
    if (tournament.currentKnockoutMatch >= round.length) {
        return;
    }

    const match = round[tournament.currentKnockoutMatch];
    if (match.completed) {
        tournament.currentKnockoutMatch++;
        startNextKnockoutMatch();
        return;
    }

    tournament.currentMatchPlayers = [
        match.player1 ? tournament.players.find(p => p.id === match.player1.id) : null,
        match.player2 ? tournament.players.find(p => p.id === match.player2.id) : null
    ].filter(p => p !== null);

    if (tournament.currentMatchPlayers.length < 2) {
        // Bye: auto-advance
        match.winner = tournament.currentMatchPlayers[0]?.id || null;
        match.completed = true;
        tournament.currentKnockoutMatch++;
        startNextKnockoutMatch();
        return;
    }

    // Reset game state
    resetGame();

    // Set up the match
    const player1 = tournament.currentMatchPlayers[0];
    const player2 = tournament.currentMatchPlayers[1];

    if (player1.type === 'ai' && player2.type === 'ai') {
        // AI vs AI: auto-play
        tournament.currentMatchAIPlayer = player1;
        gameMode = tournament.gameType === 'ultimate' ? 'ultimate-ai' : 'ai';
        aiPersonality = player1.personality;
        aiDifficulty = player1.difficulty;
        currentPlayer = 'X';
        if (tournament.gameType === 'ultimate') {
            setTimeout(makeUltimateAIMove, 1000);
        } else {
            setTimeout(makeAIMove, 1000);
        }
    } else if (player1.type === 'ai') {
        // AI vs Human
        tournament.currentMatchAIPlayer = player1;
        gameMode = tournament.gameType === 'ultimate' ? 'ultimate-ai' : 'ai';
        aiPersonality = player1.personality;
        aiDifficulty = player1.difficulty;
        currentPlayer = 'X';
    } else if (player2.type === 'ai') {
        // Human vs AI
        tournament.currentMatchAIPlayer = player2;
        gameMode = tournament.gameType === 'ultimate' ? 'ultimate-ai' : 'ai';
        aiPersonality = player2.personality;
        aiDifficulty = player2.difficulty;
        currentPlayer = 'X';
    } else {
        // Human vs Human
        gameMode = tournament.gameType;
        currentPlayer = 'X';
    }

    displayTournament();
    updateGameUI();
}

function endTournament() {
    tournament.active = false;
    tournament.stage = 'completed';
    displayTournament();
    document.getElementById('standard-board').style.display = 'none';
    document.getElementById('ultimate-board').style.display = 'none';
}

// ── Save/Load Game ────────────────────────────────────────

function saveGame(winner, result) {
    if (!tournament.active) {
        fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                winner,
                result,
                board,
                gameMode,
                aiDifficulty,
                aiPersonality,
                learningData: gameMode === 'ultimate-ai' ? { aiPersonality, moveHistory: aiMoveHistory, outcome: winner === 'O' ? 'ai_win' : winner === 'X' ? 'player_win' : 'draw' } : null
            })
        });
    }
}

function updateGameUI() {
    if (gameMode === 'standard' || gameMode === 'ai') {
        document.getElementById('standard-board').style.display = 'grid';
        document.getElementById('ultimate-board').style.display = 'none';
    } else if (gameMode === 'ultimate' || gameMode === 'ultimate-ai') {
        document.getElementById('standard-board').style.display = 'none';
        document.getElementById('ultimate-board').style.display = 'grid';
    }
}
