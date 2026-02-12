const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Data File Paths
const MOVIES_FILE = path.join(__dirname, 'movies.json');
const LOGS_FILE = path.join(__dirname, 'logs.json');

// Initialize files if they don't exist
if (!fs.existsSync(MOVIES_FILE)) fs.writeFileSync(MOVIES_FILE, JSON.stringify([]));
if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, JSON.stringify([]));

// Helpers
const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 4));

const addLog = (message) => {
    const logs = readJSON(LOGS_FILE);
    logs.unshift({ timestamp: new Date().toLocaleString(), message });
    writeJSON(LOGS_FILE, logs.slice(0, 100)); // Keep last 100 logs
};

// API: Get Movies
app.get('/api/movies', (req, res) => {
    res.json(readJSON(MOVIES_FILE));
});

// API: Add Movie
app.post('/api/movies', (req, res) => {
    const movieData = req.body;
    const movies = readJSON(MOVIES_FILE);
    
    movies.unshift(movieData);
    writeJSON(MOVIES_FILE, movies);
    
    addLog(`Added Movie: ${movieData.id} (TMDB: ${movieData.tmdb_id})`);
    res.status(201).json({ success: true });
});

// API: Get Logs
app.get('/api/logs', (req, res) => {
    res.json(readJSON(LOGS_FILE));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
