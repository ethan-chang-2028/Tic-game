const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse incoming JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static browser files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Set up express-session
app.use(session({
    secret: 'tic-tac-toe-secret-key', // In production, this goes in .env!
    resave: false,
    saveUninitialized: false
}));

// Path to your users data
const usersFilePath = path.join(__dirname, 'data', 'users.json');

// Helper function to read users
function getUsers() {
    // If the file doesn't exist yet, return an empty array
    if (!fs.existsSync(usersFilePath)) {
        return [];
    }
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
}

// Helper function to save users
function saveUsers(users) {
    // Writes the array back to data/users.json cleanly formatted
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// --- ACCOUNTS ROUTES ---

// 1. Register
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();

    // Check if user already exists
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Username already exists!' });
    }

    // Save plaintext password for learning purposes
    users.push({ username, password });
    saveUsers(users);

    res.status(201).json({ message: 'Registered successfully! You can now log in.' });
});

// 2. Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();

    // Find a matching username and password
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        req.session.username = username; // Save user to session
        res.json({ message: 'Logged in successfully!' });
    } else {
        res.status(401).json({ error: 'Invalid username or password.' });
    }
});

// 3. Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully!' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});