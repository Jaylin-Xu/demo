// Quick references
const $ = (s) => document.querySelector(s);
const LS_KEY = 'slang_mini_db_v2';

// Seed data (EN + ZH); display as initial examples
const seed = [
  { id: 1, term: 'FYP',  language: 'en', meaning: 'For You Page; personalized feed on TikTok.', votes: 3 },
  { id: 2, term: 'YYDS', language: 'zh', meaning: '“Forever the God”; means the greatest/GOAT.', votes: 5 },
  { id: 3, term: 'orz',  language: 'en', meaning: 'Emoticon (kneeling/face-down). Shows frustration/admiration.', votes: 1 },
  { id: 4, term: '666', language: 'zh', meaning: '“牛逼;In Chinese internet slang, 666 means awesome or Good job.', votes: 6 }
];

// One-like-per-refresh tracker (resets on page reload)
const votedThisRefresh = new Set();

//Read the string stored in local, if nothing is stored, display the seed data, else return the stored data
function loadDB(){
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) {
    localStorage.setItem(LS_KEY, JSON.stringify(seed));
    return seed.slice(); //prevents mutation of seed
  }
  return JSON.parse(raw); 
}

//Takes an array of data and store it in localStorage
function saveDB(arr){
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

// Render list
function render(list){
  const box = $('#results');
  const empty = $('#empty');

  if(!list.length){ //returns empty message if the search returned no matching result 
    box.innerHTML = '';
    empty.hidden = false;
    $('#q').classList.add('shake','error'); //shake animation for a brief second
    setTimeout(()=> $('#q').classList.remove('shake','error'), 450);
    return;
  }

  empty.hidden = true; //hide the empty message again
  box.innerHTML = list.map(d => {
    const voted = votedThisRefresh.has(d.id); //check if the slang is liked 
    return  ` 
      <div class="item" data-id="${d.id}">
        <div>
          <b>${d.term}</b>
          <span class="badge">${d.language.toUpperCase()}</span>
        </div>

        <div class="muted view-meaning">${escapeHTML(d.meaning)}</div>

        <div class="actions">
          <button class="btn-ghost btn-like" ${voted ? 'disabled' : ''}>
            👍 ${d.votes}${voted ? ' (voted)' : ''}
          </button>
          <button class="btn-ghost btn-edit">Edit</button>
        </div>

        <!-- Inline editor (hidden by default) -->
        <div class="editor" style="display:none; margin-top:6px;">
          <div class="row">
            <input class="edit-term" value="${escapeAttr(d.term)}" />
            <select class="edit-language">
              <option value="en" ${d.language==='en'?'selected':''}>EN</option>
              <option value="zh" ${d.language==='zh'?'selected':''}>ZH</option>
            </select>
          </div>
          <div class="row">
            <textarea class="edit-meaning" placeholder="Meaning *">${escapeHTML(d.meaning)}</textarea>
          </div>
          <div class="actions">
            <button class="btn-ghost btn-cancel">Cancel</button>
            <button class="btn-ghost btn-save">Save</button>
          </div>
        </div>
      </div>
    `; //return a templated dictionary with the slang, its language, and meaning
  }).join('');
}

// Basic search (keyword + language)
function doSearch(){
  const q = $('#q').value.trim().toLowerCase(); //not case sensitive
  const lang = $('#lang').value;
  const db = loadDB();

  const list = db.filter(d=>{ //filter through the stored keywords to find matches
    const hitLang = (lang==='all') ? true : d.language===lang;
    const hay = (d.term + ' ' + d.meaning).toLowerCase();
    const hitQ = q ? hay.includes(q) : true;
    return hitLang && hitQ;
  }).sort((a,b)=> b.id - a.id);

  render(list); //call the render function to display result
}

// Escape helpers to avoid accidental HTML injection in this simple demo
function escapeHTML(s){
  return String(s).replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' //converts speical characters to format suitable for html
  }[m]));
}
function escapeAttr(s){ return escapeHTML(s); }

// Adds an event listner "click" for a seires of buttons
$('#results').addEventListener('click', (e)=>{
  const item = e.target.closest('.item'); //find the closest card associated to a click
  if(!item) return;
  const id = Number(item.dataset.id);
  const db = loadDB();
  const idx = db.findIndex(x=>x.id===id); //find the entry's id within the localStorage dictionary
  if(idx===-1) return;

  // Like
  if(e.target.closest('.btn-like')){
    if(votedThisRefresh.has(id)) return; // exit if already liked this refresh
    db[idx].votes += 1; //else increase the number of likes by one
    saveDB(db);
    votedThisRefresh.add(id);
    doSearch();
    return;
  }

  // Converts between read-only mode and edit mode
  if(e.target.closest('.btn-edit')){
    const editor = item.querySelector('.editor');
    const view = item.querySelector('.view-meaning');
    const isOpen = editor.style.display !== 'none';
    editor.style.display = isOpen ? 'none' : 'block';
    view.style.display = isOpen ? '' : 'none';
    return;
  }

  // Cancel edit
  if(e.target.closest('.btn-cancel')){
    const editor = item.querySelector('.editor');
    const view = item.querySelector('.view-meaning');
    editor.style.display = 'none';
    view.style.display = '';
    return;
  }

  // Save edit
  if(e.target.closest('.btn-save')){
    const termEl = item.querySelector('.edit-term');
    const langEl = item.querySelector('.edit-language');
    const meaningEl = item.querySelector('.edit-meaning');

    // Check if all inputs are non-empty
    let ok = true;
    [termEl, langEl, meaningEl].forEach(el=>{
      if(!el.value.trim()){
        el.classList.add('shake','error');
        setTimeout(()=> el.classList.remove('shake'), 450);
        ok = false;
      }else{
        el.classList.remove('error');
      }
    });
    if(!ok) return;

    // simple duplicate check: same term + language
    const dup = db.find((d,i)=> i!==idx &&
      d.term.toLowerCase()===termEl.value.trim().toLowerCase() &&
      d.language===langEl.value
    );
    if(dup){
      termEl.classList.add('shake','error');
      setTimeout(()=> termEl.classList.remove('shake'), 450);
      alert('Duplicate term in the same language.');
      return;
    }

    // apply changes and save to localStorage
    db[idx].term = termEl.value.trim();
    db[idx].language = langEl.value;
    db[idx].meaning = meaningEl.value.trim();

    saveDB(db);
    doSearch();
    return;
  }
});

// Submit new term upon clicking the submit button
$('#btnAdd').addEventListener('click', ()=>{
  const term = $('#term');
  const language = $('#language');
  const meaning = $('#meaning');

  // Check if all inputs are non-empty
  let ok = true;
  [term, language, meaning].forEach(el=>{
    if(!el.value.trim()){
      el.classList.add('shake','error');
      setTimeout(()=> el.classList.remove('shake'), 450);
      ok = false;
    }else{
      el.classList.remove('error');
    }
  });
  if(!ok) return;

  const db = loadDB();

  // duplicate: same term + language
  const dup = db.find(d =>
    d.term.toLowerCase() === term.value.trim().toLowerCase() &&
    d.language === language.value
  );
  if(dup){
    term.classList.add('shake','error');
    setTimeout(()=> term.classList.remove('shake'), 450);
    alert('This term already exists in the selected language.');
    return;
  }
``//Insert new entry to the top of the list
  db.unshift({
    id: Date.now(),
    term: term.value.trim(),
    language: language.value,
    meaning: meaning.value.trim(),
    votes: 0
  });

  saveDB(db);

  // clear form and refresh list
  term.value = '';
  language.value = '';
  meaning.value = '';
  doSearch();
});

// Search when button is clicked
$('#btnSearch').addEventListener('click', doSearch);
// Don't need to click box to search upon entering the website
$('#q').addEventListener('keydown', (e)=>{ if(e.key==='Enter') doSearch(); }); 
// When language selection changed, automatically search again 
$('#lang').addEventListener('change', doSearch);

// Searches for all entries upon entering the page so it displays the current stored list
doSearch(); 
