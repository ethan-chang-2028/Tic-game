const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'tic-tac-toe-secret-key',
    resave: false,
    saveUninitialized: false
}));

const usersFilePath = path.join(__dirname, 'data', 'users.json');
const gamesFilePath = path.join(__dirname, 'data', 'games.json');
const statsFilePath = path.join(__dirname, 'data', 'stats.json');
const aiStatsFilePath = path.join(__dirname, 'data', 'ai-stats.json');
const aiLearningFilePath = path.join(__dirname, 'data', 'ai-learning.json');

// Initialize JSON files if they don't exist
const initDataFiles = () => {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    if (!fs.existsSync(usersFilePath)) fs.writeFileSync(usersFilePath, '[]');
    if (!fs.existsSync(gamesFilePath)) fs.writeFileSync(gamesFilePath, '[]');
    if (!fs.existsSync(statsFilePath)) fs.writeFileSync(statsFilePath, '{}');
    if (!fs.existsSync(aiStatsFilePath)) fs.writeFileSync(aiStatsFilePath, '{}');
    if (!fs.existsSync(aiLearningFilePath)) fs.writeFileSync(aiLearningFilePath, '{}');
};
initDataFiles();

function getUsers() {
    if (!fs.existsSync(usersFilePath)) return [];
    return JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
}

function saveUsers(users) {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

function getGames() {
    if (!fs.existsSync(gamesFilePath)) return [];
    return JSON.parse(fs.readFileSync(gamesFilePath, 'utf8'));
}

function saveGames(games) {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    fs.writeFileSync(gamesFilePath, JSON.stringify(games, null, 2));
}

function getStats() {
    if (!fs.existsSync(statsFilePath)) return {};
    return JSON.parse(fs.readFileSync(statsFilePath, 'utf8'));
}

function saveStats(stats) {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2));
}

function getAIStats() {
    if (!fs.existsSync(aiStatsFilePath)) return {};
    return JSON.parse(fs.readFileSync(aiStatsFilePath, 'utf8'));
}

function saveAIStats(stats) {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    fs.writeFileSync(aiStatsFilePath, JSON.stringify(stats, null, 2));
}

// CP10-c2: AI Learning Data
function getAILearning() {
    if (!fs.existsSync(aiLearningFilePath)) return {};
    return JSON.parse(fs.readFileSync(aiLearningFilePath, 'utf8'));
}

function saveAILearning(learning) {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    fs.writeFileSync(aiLearningFilePath, JSON.stringify(learning, null, 2));
}

// Default pattern weights for each personality
const DEFAULT_PATTERN_WEIGHTS = {
    neutral: {
        winSmallBoard: 1000,
        blockSmallBoard: 1000,
        winLargeBoard: 10000,
        blockLargeBoard: 10000,
        centerSmall: 10,
        cornerSmall: 5,
        centerLarge: 10,
        cornerLarge: 5
    },
    mathematician: {
        winSmallBoard: 1500,
        blockSmallBoard: 800,
        winLargeBoard: 10000,
        blockLargeBoard: 10000,
        centerSmall: 30,
        cornerSmall: 15,
        centerLarge: 30,
        cornerLarge: 15
    },
    psychologist: {
        winSmallBoard: 800,
        blockSmallBoard: 1500,
        winLargeBoard: 10000,
        blockLargeBoard: 10000,
        centerSmall: 5,
        cornerSmall: 3,
        centerLarge: 5,
        cornerLarge: 3
    }
};

// --- AUTH ROUTES ---

app.get('/api/me', (req, res) => {
    if (req.session.username) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Username already exists!' });
    }

    users.push({ username, password });
    saveUsers(users);
    res.status(201).json({ message: 'Registered successfully! You can now log in.' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        req.session.username = username;
        res.json({ message: 'Logged in successfully!', username });
    } else {
        res.status(401).json({ error: 'Invalid username or password.' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully!' });
});

// --- GAME ROUTES ---

// Save a finished game with AI learning data
app.post('/api/games', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ error: 'Must be logged in to save a game.' });
    }

    const { winner, result, board, gameMode, aiDifficulty, aiPersonality, learningData } = req.body;

    if (!result || !board) {
        return res.status(400).json({ error: 'Missing required game data.' });
    }

    const games = getGames();

    const newGame = {
        id: Date.now(),
        playedBy: req.session.username,
        winner: winner || null,
        result: result,
        board: board,
        gameMode: gameMode || 'pvp',
        aiDifficulty: aiDifficulty || null,
        aiPersonality: aiPersonality || 'neutral',
        playedAt: new Date().toISOString()
    };

    games.push(newGame);
    saveGames(games);

    // Update player stats
    const stats = getStats();
    if (!stats[req.session.username]) {
        stats[req.session.username] = {};
    }

    // Initialize stats for all game modes
    const allModes = ['pvp', 'ai', 'ultimate', 'ultimate-ai'];
    allModes.forEach(mode => {
        if (!stats[req.session.username][mode]) {
            stats[req.session.username][mode] = { wins: 0, losses: 0, draws: 0 };
        }
    });

    // Update stats based on game mode
    const mode = gameMode || 'pvp';
    if (!stats[req.session.username][mode]) {
        stats[req.session.username][mode] = { wins: 0, losses: 0, draws: 0 };
    }

    if (winner === 'X') {
        stats[req.session.username][mode].wins++;
    } else if (winner === 'O') {
        stats[req.session.username][mode].losses++;
    } else if (result === 'draw') {
        stats[req.session.username][mode].draws++;
    }

    saveStats(stats);

    // Update AI stats for AI modes
    const isAIGame = (gameMode === 'ai' || gameMode === 'ultimate-ai');
    if (isAIGame && aiDifficulty) {
        const aiStats = getAIStats();
        const aiKey = `${aiDifficulty}-${aiPersonality || 'neutral'}`;
        if (!aiStats[aiKey]) {
            aiStats[aiKey] = { 
                wins: 0, 
                losses: 0, 
                draws: 0, 
                difficulty: aiDifficulty, 
                personality: aiPersonality || 'neutral' 
            };
        }

        if (winner === 'O') {
            aiStats[aiKey].wins++;
        } else if (winner === 'X') {
            aiStats[aiKey].losses++;
        } else if (result === 'draw') {
            aiStats[aiKey].draws++;
        }

        saveAIStats(aiStats);
    }

    // CP10-c2: Process AI learning data for Ultimate AI mode
    if (isAIGame && gameMode === 'ultimate-ai' && learningData) {
        processAILearning(learningData, req.session.username);
    }

    res.status(201).json({ message: 'Game saved!', game: newGame });
});

// CP10-c2: Process AI learning data from a game
function processAILearning(learningData, username) {
    const { aiPersonality, moveHistory, outcome } = learningData;
    
    if (!aiPersonality || !moveHistory || !moveHistory.length || !outcome) {
        return; // No valid learning data
    }

    const learning = getAILearning();
    const key = `${username}-${aiPersonality}`;
    
    // Initialize learning data for this user/personality
    if (!learning[key]) {
        learning[key] = {
            user: username,
            personality: aiPersonality,
            patternWeights: { ...DEFAULT_PATTERN_WEIGHTS[aiPersonality] },
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0
        };
    }

    // Update game counts
    learning[key].gamesPlayed++;
    if (outcome === 'ai_win') learning[key].wins++;
    else if (outcome === 'player_win') learning[key].losses++;
    else if (outcome === 'draw') learning[key].draws++;

    // CP10-c2: Adjust weights based on outcome
    const weights = learning[key].patternWeights;
    
    // Analyze move history to identify patterns
    const successfulMoves = [];
    const failedMoves = [];
    
    // For simplicity, we'll adjust weights based on overall outcome
    // In a more advanced implementation, we'd analyze each move's impact
    
    if (outcome === 'ai_win') {
        // AI won - reinforce winning strategies
        weights.winSmallBoard = Math.round(weights.winSmallBoard * 1.05);
        weights.winLargeBoard = Math.round(weights.winLargeBoard * 1.02);
        weights.centerSmall = Math.round(weights.centerSmall * 1.03);
        weights.centerLarge = Math.round(weights.centerLarge * 1.03);
    } else if (outcome === 'player_win') {
        // AI lost - increase blocking and defensive weights
        weights.blockSmallBoard = Math.round(weights.blockSmallBoard * 1.10);
        weights.blockLargeBoard = Math.round(weights.blockLargeBoard * 1.10);
        // Slightly reduce offensive weights
        weights.winSmallBoard = Math.round(weights.winSmallBoard * 0.98);
    } else if (outcome === 'draw') {
        // Draw - slightly increase both offensive and defensive
        weights.winSmallBoard = Math.round(weights.winSmallBoard * 1.02);
        weights.blockSmallBoard = Math.round(weights.blockSmallBoard * 1.02);
    }

    // Save updated learning data
    saveAILearning(learning);
}

// CP10-c2: Get AI learning data for a specific personality
app.get('/api/ai-learning', (req, res) => {
    const { personality, difficulty } = req.query;
    
    if (!req.session.username) {
        return res.status(401).json({ error: 'Must be logged in to access learning data.' });
    }

    const learning = getAILearning();
    const key = `${req.session.username}-${personality || 'neutral'}`;
    
    if (learning[key]) {
        res.json({ 
            learningData: learning[key].patternWeights,
            gamesPlayed: learning[key].gamesPlayed,
            wins: learning[key].wins,
            losses: learning[key].losses,
            draws: learning[key].draws
        });
    } else {
        // Return default weights if no learning data exists
        const defaultPersonality = personality || 'neutral';
        res.json({ 
            learningData: DEFAULT_PATTERN_WEIGHTS[defaultPersonality] || DEFAULT_PATTERN_WEIGHTS.neutral,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0
        });
    }
});

// Get game history for the logged-in user
app.get('/api/games', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ error: 'Must be logged in to view history.' });
    }

    const games = getGames();
    const userGames = games
        .filter(g => g.playedBy === req.session.username)
        .reverse(); // most recent first

    res.json(userGames);
});

// Clear game history for the logged-in user
app.delete('/api/games', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ error: 'Must be logged in to clear history.' });
    }

    let games = getGames();
    games = games.filter(g => g.playedBy !== req.session.username);
    saveGames(games);

    res.json({ message: 'History cleared!' });
});

// Get stats for the logged-in user, separated by game mode
app.get('/api/stats', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ error: 'Must be logged in to view stats.' });
    }

    const stats = getStats();
    const userStats = stats[req.session.username] || {};

    // Ensure all game modes are present
    const allModes = ['pvp', 'ai', 'ultimate', 'ultimate-ai'];
    allModes.forEach(mode => {
        if (!userStats[mode]) {
            userStats[mode] = { wins: 0, losses: 0, draws: 0 };
        }
    });

    // Calculate global stats (across all modes)
    const globalStats = {
        wins: 0,
        losses: 0,
        draws: 0
    };

    allModes.forEach(mode => {
        globalStats.wins += userStats[mode].wins;
        globalStats.losses += userStats[mode].losses;
        globalStats.draws += userStats[mode].draws;
    });

    res.json({ byMode: userStats, global: globalStats });
});

// Get AI stats (global stats for all AI configurations)
app.get('/api/ai-stats', (req, res) => {
    const aiStats = getAIStats();
    
    // Calculate global AI stats (across all AI configurations)
    const globalAIStats = {
        wins: 0,
        losses: 0,
        draws: 0
    };

    for (const [key, stats] of Object.entries(aiStats)) {
        globalAIStats.wins += stats.wins || 0;
        globalAIStats.losses += stats.losses || 0;
        globalAIStats.draws += stats.draws || 0;
    }

    // Calculate win rate
    const totalAIGames = globalAIStats.wins + globalAIStats.losses + globalAIStats.draws;
    const aiWinRate = totalAIGames > 0 ? Math.round((globalAIStats.wins / totalAIGames) * 100) : 0;

    res.json({ 
        byConfiguration: aiStats,
        global: { ...globalAIStats, winRate: aiWinRate } 
    });
});

// Get AI leaderboard (top AI configurations by win rate)
app.get('/api/ai-leaderboard', (req, res) => {
    const aiStats = getAIStats();
    const leaderboard = [];

    // Calculate total wins, games, and win rate for each AI configuration
    for (const [key, stats] of Object.entries(aiStats)) {
        const totalWins = stats.wins || 0;
        const totalGames = (stats.wins || 0) + (stats.losses || 0) + (stats.draws || 0);
        const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

        if (totalGames > 0) {
            leaderboard.push({
                key,
                difficulty: stats.difficulty || 'unknown',
                personality: stats.personality || 'neutral',
                totalWins,
                totalGames,
                winRate
            });
        }
    }

    // Sort by win rate (descending), then by total games
    leaderboard.sort((a, b) => b.winRate - a.winRate || b.totalGames - a.totalGames);

    // Return top 10 AI configurations
    res.json(leaderboard.slice(0, 10));
});

// Get player leaderboard separated by game mode
app.get('/api/leaderboard/by-mode', (req, res) => {
    const stats = getStats();
    const leaderboard = [];

    // Calculate stats for each user in each game mode
    for (const [username, userStats] of Object.entries(stats)) {
        for (const [mode, modeStats] of Object.entries(userStats)) {
            const totalWins = modeStats.wins || 0;
            const totalGames = (modeStats.wins || 0) + (modeStats.losses || 0) + (modeStats.draws || 0);
            const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

            if (totalGames > 0) {
                leaderboard.push({
                    username,
                    gameMode: mode,
                    totalWins,
                    totalGames,
                    winRate
                });
            }
        }
    }

    // Sort by win rate (descending), then by total wins
    leaderboard.sort((a, b) => b.winRate - a.winRate || b.totalWins - a.totalWins);

    // Return top 10
    res.json(leaderboard.slice(0, 10));
});

// Get global leaderboard (top players by total wins)
app.get('/api/leaderboard', (req, res) => {
    const stats = getStats();
    const leaderboard = [];

    // Calculate total wins for each user across all modes
    for (const [username, userStats] of Object.entries(stats)) {
        const totalWins = Object.values(userStats).reduce((sum, modeStats) => {
            return sum + (modeStats?.wins || 0);
        }, 0);

        const totalGames = Object.values(userStats).reduce((sum, modeStats) => {
            return sum + (modeStats?.wins || 0) + 
                          (modeStats?.losses || 0) + 
                          (modeStats?.draws || 0);
        }, 0);

        if (totalGames > 0) {
            leaderboard.push({
                username,
                totalWins,
                totalGames,
                winRate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0
            });
        }
    }

    // Sort by total wins (descending), then by win rate
    leaderboard.sort((a, b) => b.totalWins - a.totalWins || b.winRate - a.winRate);

    // Return top 10 players
    res.json(leaderboard.slice(0, 10));
});

// Get AI leaderboard separated by game mode
app.get('/api/ai-leaderboard/by-mode', (req, res) => {
    const aiStats = getAIStats();
    const leaderboard = [];

    // Calculate stats for each AI config in each game mode
    for (const [key, stats] of Object.entries(aiStats)) {
        // Extract mode from key (format: difficulty-personality)
        // For now, we'll treat all as standard AI since we don't have mode in the key
        const gameMode = 'ai'; // Default, can be enhanced later
        const totalWins = stats.wins || 0;
        const totalGames = (stats.wins || 0) + (stats.losses || 0) + (stats.draws || 0);
        const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

        if (totalGames > 0) {
            leaderboard.push({
                difficulty: stats.difficulty || 'unknown',
                personality: stats.personality || 'neutral',
                gameMode: gameMode,
                totalWins,
                totalGames,
                winRate
            });
        }
    }

    // Sort by win rate (descending), then by total wins
    leaderboard.sort((a, b) => b.winRate - a.winRate || b.totalWins - a.totalWins);

    // Return top 10
    res.json(leaderboard.slice(0, 10));
});

// Reset stats for a specific difficulty
app.post('/api/stats/reset', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ error: 'Must be logged in to reset stats.' });
    }

    const { difficulty } = req.body;
    if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({ error: 'Invalid difficulty.' });
    }

    const stats = getStats();
    if (!stats[req.session.username]) {
        stats[req.session.username] = {};
    }
    stats[req.session.username][difficulty] = { wins: 0, losses: 0, draws: 0 };
    saveStats(stats);

    res.json({ message: `Stats reset for ${difficulty} difficulty!` });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
