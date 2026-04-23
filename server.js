const express = require('express');
const path = require('path');
const session = require('express-session'); // Bring in express-session
const app = express();

// Use port 8080 as Replit expects
const port = 8080;

// Set up the session middleware
app.use(session({
  secret: 'my-super-secret-key', // In a real app, this goes in .env!
  resave: false,
  saveUninitialized: false
}));

// We also need this to read the data sent from your HTML forms!
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Serve all static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// ... the rest of your routes will go here ...
// ... the rest of your routes will go here ...

// Start the server and listen on the port
app.listen(port, () => {
  console.log(`Server is up and running on http://localhost:${port}`);
});