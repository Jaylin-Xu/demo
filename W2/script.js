// Element: click event
// https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event
//
// This part uses GPT to improve the effect and is translated into Chinese to help me understand the principles.

const cloud = document.getElementById('cloud');
const title = document.getElementById('title');
const rain  = document.getElementById('rain');

// 是否正在下雨的状态（开关）
let isRaining = false;

// 记录 setTimeout 定时器，便于恢复时清理
const timers = [];

// 键盘可达性：Enter / Space 也能触发
cloud.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleRain();
  }
});

// 点击事件（参考 MDN：Element click event）
cloud.addEventListener('click', toggleRain);

function toggleRain() {
  if (!isRaining) {
    // —— 从“未下雨”切换到“正在下雨” ——
    isRaining = true;
    cloud.textContent = "🌧️"; // ☁️ → 🌧️
    title.textContent = "It’s raining cats and dogs";

    // 生成一批雨滴
    const count = randInt(50, 80);
    for (let i = 0; i < count; i++) spawnDrop();

  } else {
    // —— 从“正在下雨”切换到“未下雨”（恢复） ——
    isRaining = false;
    cloud.textContent = "☁️"; // 🌧️ → ☁️
    title.textContent = "How's the weather?";

    // 停止并清空所有雨滴
    clearRain();
  }
}

// 生成一个下落的 emoji（猫或狗）
function spawnDrop() {
  const el = document.createElement('div');
  el.className = 'drop';
  el.textContent = Math.random() < 0.5 ? '🐱' : '🐶';

  // 随机水平位置（0% ~ 100%）
  el.style.left = rand(0, 100) + '%';

  // 随机大小（24px ~ 48px）
  el.style.fontSize = rand(24, 48) + 'px';

  // 随机下落时长（2.5s ~ 5s）
  const dur = rand(2.5, 5);
  el.style.animationDuration = dur + 's';

  // 随机延迟（0s ~ 1.5s）
  const delay = rand(0, 1.5);
  el.style.animationDelay = delay + 's';

  rain.appendChild(el);

  // 动画结束后移除节点；同时保存计时器句柄，方便清理
  const total = (dur + delay) * 1000;
  const t = setTimeout(() => el.remove(), total + 50);
  timers.push(t);
}

// 清空所有雨滴 + 清理计时器
function clearRain() {
  // 清理未触发的定时器，避免恢复后仍执行
  while (timers.length) {
    clearTimeout(timers.pop());
  }
  // 移除容器内的所有雨滴
  rain.innerHTML = '';
}

// 小工具函数
function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function randInt(min, max) {
  return Math.floor(rand(min, max));
}
