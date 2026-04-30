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

// Initialize JSON files if they don't exist
const initDataFiles = () => {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    if (!fs.existsSync(usersFilePath)) fs.writeFileSync(usersFilePath, '[]');
    if (!fs.existsSync(gamesFilePath)) fs.writeFileSync(gamesFilePath, '[]');
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

// Save a finished game
app.post('/api/games', (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ error: 'Must be logged in to save a game.' });
    }

    const { winner, result, board } = req.body;

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
        playedAt: new Date().toISOString()
    };

    games.push(newGame);
    saveGames(games);

    res.status(201).json({ message: 'Game saved!', game: newGame });
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});