/* ==================== 全局元素与状态 ==================== */
const danmakuBox = document.getElementById('danmaku');
let spawnBtn = null;   // Start/Pause（Yes 模式）
let battleBtn = null;  // Go to Battlefield（Yes -> Quiz）
const card       = document.getElementById('meaningCard');
const closeCard  = document.getElementById('closeCard');
const wordText   = document.getElementById('wordText');
const meanText   = document.getElementById('meanText');

const choiceGroup = document.getElementById('choiceGroup');
const btnNo  = document.getElementById('btnNo');
const btnYes = document.getElementById('btnYes');
const subtitle   = document.getElementById('subtitle');   // Yes 后显示副标题
const startMount = document.getElementById('startMount'); // 按钮挂载点

// 全屏渐黑与结尾白字
const noOverlay = document.getElementById('noOverlay');
const noMessage = document.getElementById('noMessage');

// ✅ Quiz 相关
const quiz        = document.getElementById('quiz');
const quizWordEl  = document.getElementById('quizWord');
const quizOptsEl  = document.getElementById('quizOptions');
const quizHintEl  = document.getElementById('quizHint');

// —— Quiz 提示语显示时长（毫秒）与工具函数 ——（正确=绿色、错误=红色）
const HINT_SHOW_MS_CORRECT = 1400;
const HINT_SHOW_MS_WRONG   = 1400;
let   quizHintTimer = null;

function setQuizHint(msg, type){ // type: 'success' | 'error'
  clearQuizHint();
  quizHintEl.textContent = msg;
  quizHintEl.classList.toggle('success', type === 'success');
  quizHintEl.classList.toggle('error',   type === 'error');
}
function clearQuizHint(){
  if (quizHintTimer) { clearTimeout(quizHintTimer); quizHintTimer = null; }
  quizHintEl.textContent = '';
  quizHintEl.classList.remove('success','error');
}

let WORDS = [];
let running = false;          // YES：是否正在播放
let spawnTimer = null;        // YES：生成定时器
let selectedBullet = null;    // 当前被“点击并暂停”的弹幕
let mode = 'idle';            // 'idle' | 'yes' | 'quiz' | 'no'

/* 轨道（YES 防重叠/防追尾） */
let lanes = [];               // 每项 { last: HTMLElement|null }
let laneHeight = 42;          // 轨道高度
let minGap = 24;              // 前后车最小水平距离（像素）

/* ---------------- NO 模式（更多弹幕 + 2 秒后再变暗 + 交错处“墨水扩散变大”） --------------- */
const NO_SPAWN_DURATION_MS = 2600; // 生成时长
const NO_MAX_BULLETS       = 80;   // 在场上限
const NO_DURATION_MIN      = 6;
const NO_DURATION_MAX      = 10;
const NO_PAIR_EVERY_FRAME  = true;
let   noToggleLeft         = true;
let   noFrameTick          = 0;

/* NO 模式：交错处局部渗墨 */
let inkCanvas = null;
let inkCtx = null;
let inkAnimId = null;

const CELL_SIZE         = 28;
const GROW_PER_FRAME    = 0.10;
const DECAY_PER_FRAME   = 0.025;
const MAX_ENERGY        = 1.00;
const GROW_MULTIPLIER   = 2.2;
const CELLS_DRAW_LIMIT  = 120;
let   overlapCells      = new Map(); // "gx,gy" -> {energy, x, y, baseR, lastSeen}

/* ==================== 语音合成（中文发音） ==================== */
// 使用浏览器 Web Speech API 朗读中文词汇
let zhVoice = null;
let voicesLoaded = false;

// 加载可用声音，优先挑选 zh-CN / zh / Chinese
function loadVoices(){
  const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  if (!voices || !voices.length) return;
  zhVoice = voices.find(v => /zh[-_]CN/i.test(v.lang)) ||
            voices.find(v => /^zh/i.test(v.lang)) ||
            voices.find(v => /chinese/i.test(v.name)) ||
            null;
  voicesLoaded = true;
}

if ('speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
}

/** 朗读中文：点击弹幕或 Quiz 大词时触发 */
function speakZh(text){
  if (!('speechSynthesis' in window)) return;
  if (!text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  if (zhVoice) u.voice = zhVoice;
  u.rate = 0.95;
  u.pitch = 1.0;
  u.volume = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/* ==================== 小工具：隐藏/移除顶部按钮（Start / Go to Battlefield） ==================== */
function hideTopControls(){
  startMount.innerHTML = '';
  // 同时把副标题也收起来，画面更“干净”
  subtitle.hidden = true;
}

/* ==================== 初始化（DOM 就绪后） ==================== */
window.addEventListener('DOMContentLoaded', async () => {
  subtitle.hidden = true;
  startMount.innerHTML = '';

  if (noOverlay) { noOverlay.style.pointerEvents = 'none'; noOverlay.hidden = true; noOverlay.style.opacity = '0'; }
  if (noMessage) { noMessage.style.pointerEvents = 'none'; noMessage.hidden = true; noMessage.style.opacity = '0'; }

  // 载入词库
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Failed to load data.json');
    WORDS = await res.json();
  } catch {
    // 兜底词库
    WORDS = [
      { word: '内卷', meaning: 'Involution; people compete excessively without real progress.' },
      { word: '摆烂', meaning: 'Give up trying; do the bare minimum on purpose.' },
      { word: 'YYDS', meaning: 'GOAT; the Greatest of All Time.' },
      { word: '躺平', meaning: 'Lie flat; opt out of rat race for minimalism.' },
      { word: '破防', meaning: "Mentally 'broken'; can't keep defenses up." }
    ];
  }

  // 轨道
  initLanes();
  window.addEventListener('resize', debounce(() => {
    initLanes();
    sizeInkCanvas();
  }, 150));

  /* ===== 左键：Battlefield（先 Quiz） ===== */
  btnNo.addEventListener('click', () => {
    if (mode !== 'idle') return;
    mode = 'quiz';
    openQuiz();
  });

  /* ===== YES：显示副标题 + Start + Go to Battlefield ===== */
  btnYes.addEventListener('click', () => {
    if (mode !== 'idle') return;
    mode = 'yes';

    if (choiceGroup && choiceGroup.parentNode) choiceGroup.remove();
    subtitle.hidden = false;

    // 动态按钮组
    const group = document.createElement('div');
    group.className = 'btn-group';

    // Start / Pause
    spawnBtn = document.createElement('button');
    spawnBtn.id = 'spawnBtn';
    spawnBtn.className = 'btn';
    spawnBtn.type = 'button';
    spawnBtn.setAttribute('aria-pressed', 'false');
    spawnBtn.setAttribute('aria-label', 'Start or pause the danmaku flow');
    spawnBtn.textContent = 'Start';
    group.appendChild(spawnBtn);

    // Go to Battlefield
    battleBtn = document.createElement('button');
    battleBtn.id = 'btnGotoBattle';
    battleBtn.className = 'btn';
    battleBtn.type = 'button';
    battleBtn.setAttribute('aria-label', 'Go to Battlefield');
    battleBtn.textContent = 'Go to Battlefield';
    group.appendChild(battleBtn);

    startMount.innerHTML = '';
    startMount.appendChild(group);

    // Start/Pause 行为
    spawnBtn.addEventListener('click', () => {
      running = !running;
      spawnBtn.textContent = running ? 'Pause' : 'Start';
      spawnBtn.setAttribute('aria-pressed', String(running));
      if (running) { resumeAll(); startSpawning(); }
      else { stopSpawning(); pauseAll(); }
    });

    // 训练场 → 战场
    battleBtn.addEventListener('click', goToBattlefieldFromYes);
  });

  // 释义卡片关闭（Yes 模式）
  closeCard.addEventListener('click', () => {
    card.setAttribute('aria-hidden', 'true');
    if (selectedBullet) {
      selectedBullet.dataset.locked = 'false';
      selectedBullet.classList.remove('is-selected');
      selectedBullet.style.animationPlayState = running ? 'running' : 'paused';
      selectedBullet = null;
    }
  });

  /* ===== ✅ Quiz 弹窗“大词”点击即可朗读（一次绑定，后续换题仍生效） ===== */
  if (quizWordEl) {
    // 无障碍 & 键盘触发
    quizWordEl.setAttribute('tabindex', '0');
    quizWordEl.setAttribute('role', 'button');
    quizWordEl.setAttribute('aria-label', 'Play Chinese pronunciation');
    const speakQuizWord = () => {
      const txt = (quizWordEl.textContent || '').trim();
      if (txt) speakZh(txt);
    };
    quizWordEl.addEventListener('click', speakQuizWord);
    quizWordEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        speakQuizWord();
      }
    });
  }
});

/* ============== 从 Training Ground 跳转到 Battlefield（进入 Quiz） ============== */
function goToBattlefieldFromYes(){
  if (mode !== 'yes') return;

  running = false;
  stopSpawning();
  pauseAll();

  // 关闭释义卡片
  card.setAttribute('aria-hidden', 'true');
  if (selectedBullet) {
    selectedBullet.dataset.locked = 'false';
    selectedBullet.classList.remove('is-selected');
    selectedBullet = null;
  }

  // 清空弹幕区，进入 Quiz（此处保留按钮，等真正触发动画时再隐藏）
  danmakuBox.innerHTML = '';
  subtitle.hidden = false; // 仍可显示提示；触发动画时会统一隐藏

  mode = 'quiz';
  openQuiz();
}

/* ==================== ✅ Quiz 逻辑 ==================== */
/** 打开 Quiz：渲染一题并展示 */
function openQuiz(){
  // 进入 Quiz 时保留顶部按钮；真正触发 NO 动画时再隐藏
  danmakuBox.innerHTML = '';
  quiz.setAttribute('aria-hidden','false');
  renderOneQuestion();
}

/** 生成并渲染一道题（随机词 + 三个选项，其中一个正确） */
function renderOneQuestion(){
  if (!Array.isArray(WORDS) || WORDS.length < 3) {
    WORDS = [
      { word: '内卷', meaning: 'Involution; people compete excessively without real progress.' },
      { word: '摆烂', meaning: 'Give up trying; do the bare minimum on purpose.' },
      { word: 'YYDS', meaning: 'GOAT; the Greatest of All Time.' }
    ];
  }

  const correctIndex = Math.floor(Math.random() * WORDS.length);
  const correctItem = WORDS[correctIndex];

  const wrongPool = WORDS.map((w, i) => ({...w, _i:i})).filter(w => w._i !== correctIndex);
  shuffleInPlace(wrongPool);
  const wrongMeanings = wrongPool.slice(0, 2).map(w => w.meaning);

  const options = [
    { text: correctItem.meaning, correct: true  },
    { text: wrongMeanings[0],   correct: false },
    { text: wrongMeanings[1],   correct: false }
  ];
  shuffleInPlace(options);

  quizWordEl.textContent = correctItem.word;
  quizOptsEl.innerHTML = '';
  clearQuizHint();

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-btn';
    btn.type = 'button';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => {
      if (opt.correct) {
        setQuizHint('✔ Correct!', 'success');

        // ✅ 关键点：即将触发战场动画时，立刻隐藏顶部按钮与副标题
        hideTopControls();

        quizHintTimer = setTimeout(() => {
          quiz.setAttribute('aria-hidden','true');
          mode = 'no';
          if (choiceGroup && choiceGroup.parentNode) choiceGroup.remove();
          startNoMode();
        }, HINT_SHOW_MS_CORRECT);
      } else {
        setQuizHint('✖ Try another one…', 'error');
        quizHintTimer = setTimeout(() => {
          renderOneQuestion();
        }, HINT_SHOW_MS_WRONG);
      }
    });
    quizOptsEl.appendChild(btn);
  });
}

/* ==================== YES：轨道与生成 ==================== */
function initLanes() {
  const boxH = danmakuBox.clientHeight || 0;
  const count = Math.max(1, Math.floor(boxH / laneHeight));
  lanes = new Array(count).fill(0).map(() => ({ last: null }));

  const bullets = Array.from(danmakuBox.querySelectorAll('.bullet'));
  bullets.forEach(b => {
    const top = parseFloat(b.style.top || '0');
    let idx = Math.round(top / laneHeight);
    idx = Math.max(0, Math.min(count - 1, idx));
    b.style.top = `${idx * laneHeight}px`;
    b.dataset.lane = String(idx);
    lanes[idx].last = lanes[idx].last || b;
  });
}

function startSpawning() {
  if (spawnTimer) return;
  for (let i = 0; i < 4; i++) spawnOne();
  spawnTimer = setInterval(spawnOne, 500);
}
function stopSpawning() { clearInterval(spawnTimer); spawnTimer = null; }

function pauseAll() {
  document.querySelectorAll('.bullet').forEach(b => {
    b.style.animationPlayState = 'paused';
  });
}
function resumeAll() {
  document.querySelectorAll('.bullet').forEach(b => {
    if (b.dataset.locked !== 'true') {
      b.style.animationPlayState = 'running';
    }
  });
}

function pickSafeLane() {
  if (!lanes.length) initLanes();
  const W = danmakuBox.clientWidth;
  for (let i = 0; i < lanes.length; i++) {
    const last = lanes[i].last;
    if (!last) return i;
    const rect = last.getBoundingClientRect();
    const boxRect = danmakuBox.getBoundingClientRect();
    const lastRight = rect.right - boxRect.left;
    if (lastRight < W - minGap) return i;
  }
  return -1;
}

/** 给弹幕绑定“中文发音”点击（并保持既有行为） */
function attachPronounceClick(el, word, extraHandler){
  el.addEventListener('click', (evt) => {
    speakZh(word); // 先朗读
    if (typeof extraHandler === 'function') extraHandler(evt); // 再执行原逻辑
  });
}

function spawnOne() {
  if (mode !== 'yes' || !running || !WORDS.length) return;
  const laneIndex = pickSafeLane();
  if (laneIndex === -1) return;

  const item = WORDS[Math.floor(Math.random() * WORDS.length)];
  const span = document.createElement('span');
  span.className = 'bullet';
  span.textContent = item.word;

  span.style.top = `${laneIndex * laneHeight}px`;
  span.dataset.lane = String(laneIndex);

  const duration = 12 + Math.random() * 12; // 12s ~ 24s
  span.style.animationDuration = `${duration}s`;

  // 原本的点击逻辑（暂停、选中、高亮、弹出释义卡）
  const originalHandler = () => {
    if (selectedBullet && selectedBullet !== span) {
      selectedBullet.dataset.locked = 'false';
      selectedBullet.classList.remove('is-selected');
      selectedBullet.style.animationPlayState = running ? 'running' : 'paused';
    }
    selectedBullet = span;
    span.dataset.locked = 'true';
    span.style.animationPlayState = 'paused';
    span.classList.add('is-selected');

    const wordItem = WORDS.find(w => w.word === item.word) || item;
    wordText.textContent = wordItem.word;
    meanText.textContent = wordItem.meaning || '';
    card.setAttribute('aria-hidden', 'false');
  };

  // 用“带发音”的包装点击
  attachPronounceClick(span, item.word, originalHandler);

  span.addEventListener('animationend', () => {
    if (span.dataset.locked === 'true') return;
    const li = Number(span.dataset.lane || '-1');
    if (li >= 0 && lanes[li] && lanes[li].last === span) lanes[li].last = null;
    span.remove();
  });

  danmakuBox.appendChild(span);
  lanes[laneIndex].last = span;

  if (!running) span.style.animationPlayState = 'paused';
}

/* ==================== NO：更多弹幕 + 交错处“墨水扩散变大” + 2 秒后再黑屏 ==================== */
function startNoMode() {
  // 再保险：进入动画时再次隐藏所有顶部控件
  hideTopControls();

  running = false;
  stopSpawning();
  pauseAll();

  ensureInkCanvas();
  startOverlapInkLoop();

  // —— 延迟 2 秒 —— 再开始全屏渐黑
  setTimeout(() => {
    noOverlay.hidden = false;
    // 触发过渡
    // eslint-disable-next-line no-unused-expressions
    noOverlay.offsetHeight;
    noOverlay.style.opacity = '1';
  }, 2000);

  // 在 2.6s 内生成更多弹幕：每帧对射 + 间隔单发
  const tStart = performance.now();
  const pump = () => {
    const now = performance.now();
    if (now - tStart < NO_SPAWN_DURATION_MS) {
      const current = danmakuBox.querySelectorAll('.bullet.inky').length;
      if (current < NO_MAX_BULLETS) {
        const y = pickNoY();
        spawnNoWord(true,  y + rand(-8, 8));  // 左→右
        spawnNoWord(false, y + rand(-8, 8));  // 右→左

        noFrameTick++;
        if (noFrameTick % 2 === 0) {
          const sideLeft = noToggleLeft; noToggleLeft = !noToggleLeft;
          spawnNoWord(sideLeft, pickNoY());
        }
      }
      requestAnimationFrame(pump);
    }
  };
  requestAnimationFrame(pump);

  // 5 秒后：白字提示
  setTimeout(() => {
    noMessage.hidden = false;
    // eslint-disable-next-line no-unused-expressions
    noMessage.offsetHeight;
    noMessage.style.opacity = '1';
  }, 5000);
}

function pickNoY() {
  const h = danmakuBox.clientHeight || 0;
  const margin = h * 0.2;
  return Math.max(0, Math.min(h - 10, margin + Math.random() * (h - margin * 2)));
}

// NO：生成一条（指定左右与 y）
function spawnNoWord(fromLeft, y) {
  if (!WORDS.length) return;

  const current = danmakuBox.querySelectorAll('.bullet.inky').length;
  if (current >= NO_MAX_BULLETS) return;

  const item = WORDS[Math.floor(Math.random() * WORDS.length)];
  const span = document.createElement('span');
  span.className = 'bullet inky';
  span.textContent = item.word;

  const boxH = danmakuBox.clientHeight || 0;
  const yy = Math.max(0, Math.min(boxH - 10, Math.floor((y ?? pickNoY()))));
  span.style.top = `${yy}px`;

  span.classList.add(fromLeft ? 'from-left' : 'from-right');

  const duration = NO_DURATION_MIN + Math.random() * (NO_DURATION_MAX - NO_DURATION_MIN);
  span.style.animationDuration = `${duration}s`;

  // 战场模式也支持点击发音（只读，不弹卡片/不暂停）
  attachPronounceClick(span, item.word, null);

  span.addEventListener('animationend', () => span.remove());
  danmakuBox.appendChild(span);
}

/* ==================== 交错检测 + “扩散变大”的局部渗墨 ==================== */
function ensureInkCanvas() {
  if (inkCanvas && inkCanvas.parentNode) return;
  inkCanvas = document.createElement('canvas');
  inkCanvas.style.position = 'absolute';
  inkCanvas.style.inset = '0';
  inkCanvas.style.pointerEvents = 'none';
  inkCanvas.style.zIndex = '2'; // 在 .bullet（1）之上，但低于卡片/遮罩
  inkCanvas.className = 'ink-canvas';
  danmakuBox.style.position = 'relative';
  danmakuBox.appendChild(inkCanvas);
  inkCtx = inkCanvas.getContext('2d');
  sizeInkCanvas();
}

function sizeInkCanvas() {
  if (!inkCanvas) return;
  const rect = danmakuBox.getBoundingClientRect();
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  inkCanvas.width  = Math.max(1, Math.floor(rect.width  * dpr));
  inkCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
  inkCanvas.style.width  = rect.width + 'px';
  inkCanvas.style.height = rect.height + 'px';
  inkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function startOverlapInkLoop() {
  cancelAnimationFrame(inkAnimId);
  overlapCells.clear();

  const Y_NEAR = 18;
  const X_NEAR = 90;

  const loop = () => {
    if (!inkCtx) return;

    // 清空
    inkCtx.globalCompositeOperation = 'source-over';
    inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);

    const lefts  = Array.from(danmakuBox.querySelectorAll('.bullet.inky.from-left'));
    const rights = Array.from(danmakuBox.querySelectorAll('.bullet.inky.from-right'));
    const boxRect = danmakuBox.getBoundingClientRect();

    // 交错检测 -> 网格能量
    if (lefts.length && rights.length) {
      const stepL = Math.ceil(lefts.length  / 28) || 1;
      const stepR = Math.ceil(rights.length / 28) || 1;

      for (let i = 0; i < lefts.length; i += stepL) {
        const L = lefts[i].getBoundingClientRect();
        const Lx = L.left - boxRect.left + L.width/2;
        const Ly = L.top  - boxRect.top  + L.height/2;

        for (let j = 0; j < rights.length; j += stepR) {
          const R = rights[j].getBoundingClientRect();
          const Rx = R.left - boxRect.left + R.width/2;
          const Ry = R.top  - boxRect.top  + R.height/2;

          if (Math.abs(Ly - Ry) < Y_NEAR && Math.abs(Lx - Rx) < X_NEAR) {
            const cx = (Lx + Rx) / 2;
            const cy = (Ly + Ry) / 2;
            const fs = (parseFloat(getComputedStyle(lefts[i]).fontSize) + parseFloat(getComputedStyle(rights[j]).fontSize)) / 2 || 24;
            const baseR = fs * 0.24;

            const gx = Math.floor(cx / CELL_SIZE);
            const gy = Math.floor(cy / CELL_SIZE);
            const key = `${gx},${gy}`;

            const cell = overlapCells.get(key) || { energy: 0, x: cx, y: cy, baseR, lastSeen: performance.now() };
            cell.energy = Math.min(MAX_ENERGY, cell.energy + GROW_PER_FRAME);
            cell.x = cell.x * 0.7 + cx * 0.3;
            cell.y = cell.y * 0.7 + cy * 0.3;
            cell.baseR = cell.baseR * 0.7 + baseR * 0.3;
            cell.lastSeen = performance.now();
            overlapCells.set(key, cell);
          }
        }
      }
    }

    // 绘制能量圈
    inkCtx.save();
    inkCtx.filter = 'blur(1.2px)';
    inkCtx.globalCompositeOperation = 'multiply';

    const now = performance.now();
    let drawn = 0;
    for (const [key, cell] of overlapCells) {
      if (now - cell.lastSeen > 40) cell.energy = Math.max(0, cell.energy - DECAY_PER_FRAME);
      if (cell.energy <= 0) { overlapCells.delete(key); continue; }
      if (drawn >= CELLS_DRAW_LIMIT) break;

      const radius = cell.baseR * (1 + cell.energy * GROW_MULTIPLIER);
      const alpha1 = 0.05 + cell.energy * 0.12;
      const alpha2 = 0.03 + cell.energy * 0.08;

      inkCtx.beginPath();
      inkCtx.fillStyle = `rgba(0,0,0,${alpha1})`;
      inkCtx.arc(cell.x, cell.y, radius, 0, Math.PI * 2);
      inkCtx.fill();

      inkCtx.beginPath();
      inkCtx.fillStyle = `rgba(0,0,0,${alpha2})`;
      inkCtx.arc(cell.x, cell.y, radius * 1.22, 0, Math.PI * 2);
      inkCtx.fill();

      drawn++;
    }

    inkCtx.restore();
    inkAnimId = requestAnimationFrame(loop);
  };

  inkAnimId = requestAnimationFrame(loop);
}

/* ==================== 工具 ==================== */
function rand(a,b){ return a + Math.random() * (b - a); }
function debounce(fn, wait) { let t = null; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); }; }
function shuffleInPlace(arr){
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
