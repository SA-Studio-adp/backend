import express from "express";
import cors from "cors";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const MOVIES_FILE = path.resolve("./movies.json");
const COLLECTIONS_FILE = path.resolve("./collections.json");
const HTML_FILE = path.resolve("./index.html");

// In-memory logs (resets on restart)
const activityLogs = [];

function logAction(type, message) {
  const timestamp = new Date().toLocaleString("en-US", { timeZone: "UTC" });
  activityLogs.unshift({ timestamp, type, message });
  // Keep only last 50 logs to save memory
  if (activityLogs.length > 50) activityLogs.pop();
}

app.use(cors());
app.use(express.json());

/* ===================== Helpers ===================== */

async function readJSON(file, fallback) {
  try {
    const data = await fs.readFile(file, "utf-8");
    return JSON.parse(data || JSON.stringify(fallback));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

/* ===================== Root ===================== */

// Serve the dashboard
app.get("/", (req, res) => {
  res.sendFile(HTML_FILE);
});

// Endpoint for frontend to fetch logs
app.get("/api/logs", (req, res) => {
  res.json(activityLogs);
});

/* ===================== Movies API ===================== */

app.get("/api/movies", async (req, res, next) => {
  try {
    res.json(await readJSON(MOVIES_FILE, []));
  } catch (err) {
    next(err);
  }
});

app.post("/api/movies", async (req, res, next) => {
  try {
    const movies = await readJSON(MOVIES_FILE, []);
    const { position = "bottom", ...movie } = req.body;

    if (!movie.id) return res.status(400).json({ error: "Movie ID required" });

    const index = movies.findIndex(m => m.id === movie.id);

    if (index >= 0) {
      movies[index] = { ...movies[index], ...movie };
      logAction("MODIFY", `Updated movie: ${movie.title || movie.name}`);
      
      if (position === "top") {
        const [item] = movies.splice(index, 1);
        movies.unshift(item);
      }
    } else {
      position === "top" ? movies.unshift(movie) : movies.push(movie);
      logAction("UPLOAD", `Added new movie: ${movie.title || movie.name}`);
    }

    await writeJSON(MOVIES_FILE, movies);
    res.json({ success: true, count: movies.length });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/movies/:id", async (req, res, next) => {
  try {
    const movies = await readJSON(MOVIES_FILE, []);
    const movieToDelete = movies.find(m => m.id === req.params.id);
    const filtered = movies.filter(m => m.id !== req.params.id);

    if (movies.length === filtered.length) {
      return res.status(404).json({ error: "Movie not found" });
    }

    await writeJSON(MOVIES_FILE, filtered);
    logAction("DELETE", `Deleted movie: ${movieToDelete?.title || req.params.id}`);
    
    res.json({ success: true, count: filtered.length });
  } catch (err) {
    next(err);
  }
});

/* ===================== Collections API ===================== */

app.get("/api/collections", async (req, res, next) => {
  try {
    res.json(await readJSON(COLLECTIONS_FILE, {}));
  } catch (err) {
    next(err);
  }
});

app.get("/api/collections/:id", async (req, res, next) => {
  try {
    const collections = await readJSON(COLLECTIONS_FILE, {});
    const collection = collections[req.params.id];
    if (!collection) return res.status(404).json({ error: "Collection not found" });
    res.json(collection);
  } catch (err) {
    next(err);
  }
});

app.post("/api/collections", async (req, res, next) => {
  try {
    const collections = await readJSON(COLLECTIONS_FILE, {});
    const { id, name, banner, "bg-music": bgMusic, movies = [] } = req.body;

    if (!id || !name) return res.status(400).json({ error: "Collection id/name required" });

    collections[id] = { name, banner: banner || "", "bg-music": bgMusic || "", movies };

    await writeJSON(COLLECTIONS_FILE, collections);
    logAction("MODIFY", `Updated Collection: ${name}`);

    res.json({ success: true, total: Object.keys(collections).length });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/collections/:id", async (req, res, next) => {
  try {
    const collections = await readJSON(COLLECTIONS_FILE, {});
    if (!collections[req.params.id]) return res.status(404).json({ error: "Collection not found" });
    
    const name = collections[req.params.id].name;
    delete collections[req.params.id];

    await writeJSON(COLLECTIONS_FILE, collections);
    logAction("DELETE", `Deleted Collection: ${name}`);

    res.json({ success: true, total: Object.keys(collections).length });
  } catch (err) {
    next(err);
  }
});

/* ===================== Error Handler ===================== */

app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  logAction("ERROR", err.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Backend live on port ${PORT}`);
  logAction("SYSTEM", "Server Started");
});
