import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import low from 'lowdb';
import FileSyncPkg from 'lowdb/adapters/FileSync.js';

const FileSync = FileSyncPkg.default || FileSyncPkg;

// __dirname in ESM:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//DB path
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db.json');

const adapter = new FileSync(DB_PATH);
const db = low(adapter);
db.defaults({ names: [] }).write();

const app = express();
app.use(express.json());

// ./public
app.use(express.static(path.join(__dirname, 'public')));

// homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Save
app.post('/new-name', (req, res) => {
  const { name } = req.body || {};
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return res.status(400).json({ status: 'fail', message: 'name is required' });
  }
  const item = {
    id: Date.now(),
    name: trimmed.slice(0, 80),
    timestamp: Date.now()
  };
  db.get('names').unshift(item).write();
  res.json({ status: 'success', message: 'Name saved', item });
});


app.get('/data', (req, res) => {
  const data = db.get('names').take(100).value();
  res.json({ status: 'success', data });
});

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
