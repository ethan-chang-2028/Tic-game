// server.js
const express = require('express');
const path = require('path');
const app = express();

// Use Replit's default port or 8080 as a fallback
const PORT = process.env.PORT || 8080;

// Tell Express to serve all static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Set up your main route to send the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running and listening on port ${PORT}`);
});