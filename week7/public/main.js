const out = document.getElementById('out');
const input = document.getElementById('agentName');

function show(obj) {
  out.textContent = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0,80)}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Expected JSON, got: ${text.slice(0,80)}`);
  }
  return res.json();
}

document.getElementById('btnList').addEventListener('click', async () => {
  try { show(await fetchJSON('/agents')); }
  catch (e) { show(`Error: ${e.message}`); }
});

document.getElementById('btnOne').addEventListener('click', async () => {
  const name = (input.value || 'Jett').trim();
  try { show(await fetchJSON(`/agents/${encodeURIComponent(name)}`)); }
  catch (e) { show(`Error: ${e.message}`); }
});

document.getElementById('btnData').addEventListener('click', async () => {
  try { show(await fetchJSON('/data')); }
  catch (e) { show(`Error: ${e.message}`); }
});