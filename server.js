const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static browser files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Set up express-session
app.use(session({
    secret: 'tic-tac-toe-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Path to your users data
const usersFilePath = path.join(__dirname, 'data', 'users.json');

// Helper function to read users
function getUsers() {
    if (!fs.existsSync(usersFilePath)) {
        return [];
    }
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
}

// Helper function to save users
function saveUsers(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// --- ACCOUNTS ROUTES ---

// 0. Check current session (called by main.js on page load)
app.get('/api/me', (req, res) => {
    if (req.session.username) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).json({ error: 'Not logged in.' });
    }
});

// 1. Register
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

// 2. Login
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

// 3. Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully!' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});