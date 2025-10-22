const $ = (id) => document.getElementById(id);
const msg = $('msg');
const list = $('list');

function fmt(t) {
  try { return new Date(t).toLocaleString(); } catch { return String(t); }
}

function prependItem(item) {
  const div = document.createElement('div');
  div.className = 'item';
  div.innerHTML = `
    <span><b>${item.name}</b></span>
    <span class="time">${fmt(item.timestamp)}</span>
  `;
  list.prepend(div);
}

async function submitName() {
  msg.textContent = '';
  const name = $('nameInput').value.trim();
  if (!name) { msg.textContent = 'Please enter a name.'; return; }

  try {
    const res = await fetch('/new-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (data.status === 'success') {
      msg.textContent = `Saved! Hello, ${data.item.name}!`;
      $('nameInput').value = '';
      prependItem(data.item);
    } else {
      msg.textContent = 'Save failed.';
    }
  } catch {
    msg.textContent = 'Network error.';
  }
}

async function loadNames() {
  msg.textContent = '';
  try {
    const res = await fetch('/data');
    const result = await res.json();
    const names = Array.isArray(result.data) ? result.data : [];
    list.innerHTML = '';
    names.forEach(prependItem);
  } catch {
    msg.textContent = 'Load failed.';
  }
}

$('submitBtn').addEventListener('click', submitName);
$('loadBtn').addEventListener('click', loadNames);

// auto-load on open
loadNames();