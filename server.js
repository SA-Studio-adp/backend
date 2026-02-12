const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const MOVIES_FILE = path.join(__dirname, 'movies.json');
const LOGS_FILE = path.join(__dirname, 'logs.json');

// Initialize files
if (!fs.existsSync(MOVIES_FILE)) fs.writeFileSync(MOVIES_FILE, JSON.stringify([]));
if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, JSON.stringify([]));

const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 4));

const addLog = (type, message) => {
    const logs = readJSON(LOGS_FILE);
    logs.unshift({ timestamp: new Date().toLocaleString(), type, message });
    writeJSON(LOGS_FILE, logs.slice(0, 100));
};

// GET Movies
app.get('/api/movies', (req, res) => res.json(readJSON(MOVIES_FILE)));

// ADD Movie (Always to Top)
app.post('/api/movies', (req, res) => {
    const movies = readJSON(MOVIES_FILE);
    movies.unshift(req.body); // Forcefully adds to index 0
    writeJSON(MOVIES_FILE, movies);
    addLog('UPLOAD', `Added to Top: ${req.body.id}`);
    res.status(201).json({ success: true });
});

// UPDATE Movie
app.put('/api/movies/:id', (req, res) => {
    let movies = readJSON(MOVIES_FILE);
    const index = movies.findIndex(m => m.id === req.params.id);
    if (index !== -1) {
        movies[index] = req.body;
        writeJSON(MOVIES_FILE, movies);
        addLog('MODIFY', `Updated: ${req.params.id}`);
        return res.json({ success: true });
    }
    res.status(404).json({ error: "Not found" });
});

// DELETE Movie
app.delete('/api/movies/:id', (req, res) => {
    let movies = readJSON(MOVIES_FILE);
    movies = movies.filter(m => m.id !== req.params.id);
    writeJSON(MOVIES_FILE, movies);
    addLog('DELETE', `Removed: ${req.params.id}`);
    res.json({ success: true });
});

app.get('/api/logs', (req, res) => res.json(readJSON(LOGS_FILE)));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
