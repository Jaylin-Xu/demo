/* ==================== 全局元素与状态 ==================== */
const danmakuBox = document.getElementById('danmaku');
let spawnBtn = null; // “Start” 按钮在点 Yes 后动态创建
const card       = document.getElementById('meaningCard');
const closeCard  = document.getElementById('closeCard');
const wordText   = document.getElementById('wordText');
const meanText   = document.getElementById('meanText');

const choiceGroup = document.getElementById('choiceGroup');
const btnNo  = document.getElementById('btnNo');
const btnYes = document.getElementById('btnYes');
const subtitle   = document.getElementById('subtitle');   // Yes 后显示副标题
const startMount = document.getElementById('startMount'); // Start 按钮挂载点

// 全屏渐黑与结尾白字
const noOverlay = document.getElementById('noOverlay');
const noMessage = document.getElementById('noMessage');

// ✅ Quiz 相关
const quiz        = document.getElementById('quiz');
const quizWordEl  = document.getElementById('quizWord');
const quizOptsEl  = document.getElementById('quizOptions');
const quizHintEl  = document.getElementById('quizHint');

// —— Quiz 提示语显示时长（毫秒）与工具函数 ——
// （需求：提示显示更久一些，并带颜色。正确=绿色、错误=红色）
const HINT_SHOW_MS_CORRECT = 1400; // 正确提示显示时长
const HINT_SHOW_MS_WRONG   = 1400; // 错误提示显示时长
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
const NO_SPAWN_DURATION_MS = 2600; // 生成时长（更久一点，数量“多一些”）
const NO_MAX_BULLETS       = 80;   // 在场上限（保证不会卡）
const NO_DURATION_MIN      = 6;    // 更慢（上一版设定保留）
const NO_DURATION_MAX      = 10;
const NO_PAIR_EVERY_FRAME  = true; // 每帧生成一组“对射对”，明显增多
let   noToggleLeft         = true; // 交替单发补充
let   noFrameTick          = 0;    // 节拍计数

/* NO 模式：只在“交错/相遇”处做局部渗墨点，并且“扩散范围从小变大” */
let inkCanvas = null;
let inkCtx = null;
let inkAnimId = null;

// 交错渗墨的“能量格子”（随时间叠加 -> 半径变大）
const CELL_SIZE         = 28;   // 空间网格尺寸（像素）
const GROW_PER_FRAME    = 0.10; // 每次检测到交错时的增长量
const DECAY_PER_FRAME   = 0.025;// 无交错时的衰减
const MAX_ENERGY        = 1.00; // 上限
const GROW_MULTIPLIER   = 2.2;  // 半径放大倍数影响（基于 baseR）
const CELLS_DRAW_LIMIT  = 120;  // 每帧最多绘制的格子数（性能保护）
let   overlapCells      = new Map(); // key: "gx,gy" -> {energy, x, y, baseR, lastSeen}

/* ==================== 初始化（DOM 就绪后） ==================== */
window.addEventListener('DOMContentLoaded', async () => {
  // 初始：只显示问题与 No/Yes；副标题隐藏；Start 不在 DOM
  subtitle.hidden = true;
  startMount.innerHTML = '';

  // 全屏渐黑层 & 白字：初始不可见且不拦截点击
  if (noOverlay) { noOverlay.style.pointerEvents = 'none'; noOverlay.hidden = true; noOverlay.style.opacity = '0'; }
  if (noMessage) { noMessage.style.pointerEvents = 'none'; noMessage.hidden = true; noMessage.style.opacity = '0'; }

  // 载入词库
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Failed to load data.json');
    WORDS = await res.json();
  } catch {
    // 兜底词库（至少 3 个，保证 Quiz 有 2 个错误选项可选）
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

  /* ===== ✅ 修改点：左键 -> 先 Quiz，再进入 NO 动画 ===== */
  btnNo.addEventListener('click', () => {
    if (mode !== 'idle') return;
    mode = 'quiz';
    // 左键后立即显示 Quiz（不立刻进入 no）
    openQuiz();
  });

  /* ===== YES：显示副标题 + 仅显示 Start（原逻辑不变） ===== */
  btnYes.addEventListener('click', () => {
    if (mode !== 'idle') return;
    mode = 'yes';

    if (choiceGroup && choiceGroup.parentNode) choiceGroup.remove(); // 移除按钮组
    subtitle.hidden = false; // 需求：Yes 后出现副标题

    // 动态创建 Start 按钮
    const group = document.createElement('div');
    group.className = 'btn-group';
    spawnBtn = document.createElement('button');
    spawnBtn.id = 'spawnBtn';
    spawnBtn.className = 'btn';
    spawnBtn.type = 'button';
    spawnBtn.setAttribute('aria-pressed', 'false');
    spawnBtn.setAttribute('aria-label', 'Start or pause the danmaku flow');
    spawnBtn.textContent = 'Start';
    group.appendChild(spawnBtn);
    startMount.innerHTML = '';
    startMount.appendChild(group);

    // Start/Pause
    spawnBtn.addEventListener('click', () => {
      running = !running;
      spawnBtn.textContent = running ? 'Pause' : 'Start';
      spawnBtn.setAttribute('aria-pressed', String(running));
      if (running) { resumeAll(); startSpawning(); }
      else { stopSpawning(); pauseAll(); }
    });
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
});

/* ==================== ✅ Quiz 逻辑 ==================== */
/** 打开 Quiz：渲染一题并展示 */
function openQuiz(){
  // 进入 Quiz 前：隐藏副标题、复位弹幕区
  subtitle.hidden = true;
  danmakuBox.innerHTML = '';
  // 显示弹窗
  quiz.setAttribute('aria-hidden','false');
  renderOneQuestion();
}

/** 生成并渲染一道题（随机词 + 三个选项，其中一个正确） */
function renderOneQuestion(){
  if (!Array.isArray(WORDS) || WORDS.length < 3) {
    // 极端兜底（不太会发生）：不足 3 个则重复造假答案
    WORDS = [
      { word: '内卷', meaning: 'Involution; people compete excessively without real progress.' },
      { word: '摆烂', meaning: 'Give up trying; do the bare minimum on purpose.' },
      { word: 'YYDS', meaning: 'GOAT; the Greatest of All Time.' }
    ];
  }

  // 1) 随机抽一个“正确词条”
  const correctIndex = Math.floor(Math.random() * WORDS.length);
  const correctItem = WORDS[correctIndex];

  // 2) 组装两个“错误释义”（从不同词随机取 meaning）
  const wrongPool = WORDS
    .map((w, i) => ({...w, _i:i}))
    .filter(w => w._i !== correctIndex);

  shuffleInPlace(wrongPool);
  const wrongMeanings = wrongPool.slice(0, 2).map(w => w.meaning);

  // 3) 组装选项并打乱
  const options = [
    { text: correctItem.meaning, correct: true  },
    { text: wrongMeanings[0],   correct: false },
    { text: wrongMeanings[1],   correct: false }
  ];
  shuffleInPlace(options);

  // 4) 渲染到 UI
  quizWordEl.textContent = correctItem.word;
  quizOptsEl.innerHTML = '';
  clearQuizHint(); // 清空并移除颜色类

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-btn';
    btn.type = 'button';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => {
      // 正确：关闭 Quiz -> 进入 NO 模式动画（先展示绿色提示一段时间）
      if (opt.correct) {
        setQuizHint('✔ Correct!', 'success');
        quizHintTimer = setTimeout(() => {
          quiz.setAttribute('aria-hidden','true');

          // 与旧版本行为一致：进入 NO 模式
          mode = 'no';
          if (choiceGroup && choiceGroup.parentNode) choiceGroup.remove(); // 选对后再移除按钮组，避免并行操作
          startNoMode();
        }, HINT_SHOW_MS_CORRECT);
      } else {
        // 错误：显示红色提示一段时间后，刷新下一题（直到选对）
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

  span.addEventListener('click', () => {
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
  });

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
  running = false;
  stopSpawning();
  pauseAll();

  // 准备“交错渗墨”画布（只画局部点，不做整面黑）
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

  // 在 2.6s 内生成更多弹幕：每帧一组“对射对”，并隔帧补一条单发（左右交替）
  const tStart = performance.now();
  const pump = () => {
    const now = performance.now();
    if (now - tStart < NO_SPAWN_DURATION_MS) {
      const current = danmakuBox.querySelectorAll('.bullet.inky').length;
      if (current < NO_MAX_BULLETS) {
        // 对射对：两侧同时、相近 y，容易在中线交错
        const y = pickNoY();
        spawnNoWord(true,  y + rand(-8, 8));  // left -> right
        spawnNoWord(false, y + rand(-8, 8));  // right -> left

        // 隔帧补一条
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

  // 5 秒后：白字提示（时间点保持不变）
  setTimeout(() => {
    noMessage.hidden = false;
    // eslint-disable-next-line no-unused-expressions
    noMessage.offsetHeight;
    noMessage.style.opacity = '1';
  }, 5000);
}

// 更可能相遇的 y（中部 60% 区域）
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

  // 更慢：6~10s（“放慢 2 倍”的保留设定）
  const duration = NO_DURATION_MIN + Math.random() * (NO_DURATION_MAX - NO_DURATION_MIN);
  span.style.animationDuration = `${duration}s`;

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

  const Y_NEAR = 18;  // y 方向“接近”阈值
  const X_NEAR = 90;  // x 方向“接近”阈值

  const loop = () => {
    if (!inkCtx) return;

    // 每帧清空（不留整面拖影）
    inkCtx.globalCompositeOperation = 'source-over';
    inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);

    const lefts  = Array.from(danmakuBox.querySelectorAll('.bullet.inky.from-left'));
    const rights = Array.from(danmakuBox.querySelectorAll('.bullet.inky.from-right'));

    const boxRect = danmakuBox.getBoundingClientRect();

    // 1) 侦测交错：把接近的位置“投票”到网格里 -> 累积能量（能量越大，半径越大）
    if (lefts.length && rights.length) {
      const stepL = Math.ceil(lefts.length  / 28) || 1;   // 抽样，控复杂度
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
            // 累积能量（限制上限），位置轻微跟随
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

    // 2) 绘制：能量越大 -> 半径越大、透明度稍强；并做轻度衰减
    inkCtx.save();
    inkCtx.filter = 'blur(1.2px)';
    inkCtx.globalCompositeOperation = 'multiply';

    const now = performance.now();
    let drawn = 0;
    for (const [key, cell] of overlapCells) {
      // 衰减（无“投票”会慢慢消退）
      if (now - cell.lastSeen > 40) cell.energy = Math.max(0, cell.energy - DECAY_PER_FRAME);

      if (cell.energy <= 0) { overlapCells.delete(key); continue; }
      if (drawn >= CELLS_DRAW_LIMIT) break;

      const radius = cell.baseR * (1 + cell.energy * GROW_MULTIPLIER);
      const alpha1 = 0.05 + cell.energy * 0.12;
      const alpha2 = 0.03 + cell.energy * 0.08;

      // 主圈
      inkCtx.beginPath();
      inkCtx.fillStyle = `rgba(0,0,0,${alpha1})`;
      inkCtx.arc(cell.x, cell.y, radius, 0, Math.PI * 2);
      inkCtx.fill();

      // 外扩一层
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
