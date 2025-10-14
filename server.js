// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- lowdb setup ---
const adapter = new JSONFile(path.join(__dirname, "db.json"));
const defaultData = { entries: [] }; // you can rename "entries" to "moods", "recipes", etc.
const db = new Low(adapter, defaultData);
await db.read();
db.data ||= defaultData;

// --- middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Route 1: serve static index.html from /public (handled by express.static)
// Also keep a direct handler if you want:
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route 2: POST /new-data → store incoming data in lowdb
app.post("/new-data", async (req, res) => {
  // Simple validation
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ ok: false, error: "No data provided" });
  }

  const item = {
    ...req.body,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };

  db.data.entries.push(item);
  await db.write();

  res.json({ ok: true, message: "Saved!", item });
});

// Route 3: GET /data → return all stored data
app.get("/data", async (_req, res) => {
  // Always good to re-read in case external writers exist
  await db.read();
  res.json({ ok: true, entries: db.data.entries });
});

// Health check (handy for Render)
app.get("/health", (_req, res) => res.send("OK"));

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
