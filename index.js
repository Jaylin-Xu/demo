const path = require('path');
const express = require('express');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
db.defaults({ names: [] }).write(); // init collection

const app = express();

app.use(express.json());

// serve ./public
app.use(express.static(path.join(__dirname, 'public')));

// homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST /new-name  -> save a name
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

// GET /data  -> return recent names
app.get('/data', (req, res) => {
  const data = db.get('names').take(100).value();
  res.json({ status: 'success', data });
});

const PORT = 8888; // fixed port as you requested
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
