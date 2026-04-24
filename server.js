import express from 'express';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'tic-tac-toe-secret-key',
  resave: false,
  saveUninitialized: false,
}));

const usersFilePath = path.join(__dirname, 'data', 'users.json');

function getUsers() {
  const data = fs.readFileSync(usersFilePath, 'utf8');
  return data.trim() ? JSON.parse(data) : [];
}

function saveUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  users.push({ username, password });
  saveUsers(users);
  res.json({ message: 'Registration successful! You can now log in.' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.user = user.username;
    res.json({ message: 'Login successful!', username: user.username });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out successfully' }));
});

app.get('/api/me', (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
