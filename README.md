<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <!-- icon -->   <!-- emoji icon；GPT5 Assist -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔮</text></svg>">
    <title>Fortune Bank</title>
  <!-- Link external stylesheet -->
  <link rel="stylesheet" href="../A fortune-telling service website/style.css" />
</head>

<body>
  <!-- Header + simple nav-->
  <header class="site-header" role="banner" aria-label="Site header">
    <div class="container header-inner">
      <nav class="nav" aria-label="Primary">
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#testimonials">Testimonials</a>
        <a class="btn btn-outline" href="#cta">Start Reading</a>
      </nav>
    </div>
  </header>

  <!-- Hero Section: big promise + Call To Action + animated 🔮✨-->
  <section class="hero" aria-label="Hero section">
    <!-- Starfield background layer (pure CSS dots + animation) -->
    <div class="stars" aria-hidden="true"></div>
    <div class="container hero-inner">
      <div class="hero-copy">
        <!-- Headline kept concise and on-brief -->
        <h1>Deposit Your Destiny</h1>
        <p class="sub">
          Private fortune-telling for new millionaires. Let the stars guide your next step.
        </p>
        <a id="cta" class="btn btn-primary" href="#services" aria-label="Start your reading">🔮 Start Reading</a>
      </div>

      <!-- Decorative/semantic figure: animated “crystal ball” -->
     <div class="crystal-emoji" role="img" aria-label="Crystal ball">🔮</div>
    </div>
  </section>

  <!-- Services: clear cards, simple explanation-->
  <section id="services" class="section" aria-labelledby="services-title">
    <div class="container">
      <h2 id="services-title">Services</h2>
      <p class="lead">
        Provide fortune-telling/divination services (horoscope, tarot, palm reading, crystal ball, etc.) <br>
        to answer: “How to keep wealth”, “Future investment directions”, and “Love & relationships”.
      </p>

      <div class="cards">
        <article class="card">
          <h3>Horoscope</h3>
          <p>Daily and monthly insights for your sign.</p>
          <button class="link-btn" type="button">Learn More →</button>
        </article>

        <article class="card">
          <h3>Tarot</h3>
          <p>Cards for money, career, and love.</p>
          <button class="link-btn" type="button">Draw Cards →</button>
        </article>

        <article class="card">
          <h3>Palm Reading</h3>
          <p>Life line, head line, heart line</p>
          <button class="link-btn" type="button">Read My Palm →</button>
        </article>

        <article class="card">
          <h3>Hexagram</h3>
          <p>An ancient Chinese divination method that uses six yin-yang lines to form a hexagram, then interprets it through the I Ching (Book of Changes).</p>
          <button class="link-btn" type="button">See the Vision →</button>
        </article>
      </div>
    </div>
  </section>

  <!--  About -->
  <section id="about" class="section" aria-labelledby="about-title">
    <div class="container two-col">
      <div>
        <h2 id="about-title">About Us</h2>
        <p>
          We serve newly wealthy clients with private readings tailored to real-world questions:  <br>
          wealth keeping, next investments, and relationships.  <br>
          Discreet, premium, and to the point.
        </p>
        <ul class="ticks">
          <li>Designed for new millionaires</li>
          <li>Clear answers in simple words</li>
          <li>Private, secure, and fast</li>
        </ul>
      </div>
      <div class="about-panel" aria-hidden="true">
        <div class="sigil">✶</div>
        <div class="about-glow"></div>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section id="testimonials" class="section" aria-labelledby="testimonials-title">
    <div class="container">
      <h2 id="testimonials-title">Testimonials</h2>

      <div class="testi-wrap">
        <blockquote class="testi">
          “Text 1”
          <cite>— User 1</cite>
        </blockquote>

        <blockquote class="testi">
          “Text 2”
          <cite>— User 2</cite>
        </blockquote>

        <blockquote class="testi">
          “Text 3”
          <cite>— User 3</cite>
        </blockquote>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="site-footer" role="contentinfo">
    <div class="container footer-inner">
      <p>© 2025 Fortune Bank. All rights reserved.</p>
      <nav aria-label="Footer">
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="#">Contact</a>
      </nav>
    </div>
  </footer>
</body>
</html>

/* black-gold color */
:root{
  --bg: #0b0b10;           
  --bg-soft: #11131a;      /* card/section surface */
  --text: #e6e6ea;         /* main text */
  --muted: #b9b9c0;        /* subtle text */
  --gold: #d4af37;        
  --gold-2: #f1d073;       
  --accent: #8a6cff;     
  --radius: 16px;
  --shadow: 0 10px 30px rgba(0,0,0,.45);
}

* { box-sizing: border-box; }
html, body { height: 100%; }
body{
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 16px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", sans-serif;
}

/* Setting */
.container{
  width: min(1120px, 92vw);
  margin: 0 auto;
}
.section{
  padding: 72px 0;
}
.lead{
  color: var(--muted);
  margin-top: 8px;
}

/* Header */
.site-header{
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(to bottom, rgba(11,11,16,.9), rgba(11,11,16,.6));
  backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(212,175,55,.12);
}
.header-inner{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
}
.logo{
  font-weight: 700;
  letter-spacing: .5px;
  color: var(--gold);
  font-size: 20px;
}
.nav a{
  color: var(--text);
  text-decoration: none;
  margin-left: 18px;
  opacity: .9;
}
.nav a:hover{ opacity: 1; color: var(--gold); }

/* Buttons */
.btn{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
  transition: transform .2s ease, box-shadow .2s ease, color .2s ease, background .2s ease;
  will-change: transform;
}
.btn-primary{
  background: linear-gradient(135deg, var(--gold), var(--gold-2));
  color: #2a2300;
  box-shadow: 0 0 32px rgba(212,175,55,.25);
}
.btn-primary:hover{
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 0 44px rgba(212,175,55,.4);
}
.btn-outline{
  border: 1px solid rgba(212,175,55,.5);
  color: var(--gold);
  padding: 10px 16px;
}
.btn-outline:hover{
  background: rgba(212,175,55,.08);
  transform: translateY(-1px);
}

/* Hero Section*/
.hero{
  position: relative;
  overflow: clip;
  padding: 80px 0 96px;
  background:
    radial-gradient(1200px 600px at 80% -10%, rgba(138,108,255,.15), transparent 60%),
    radial-gradient(800px 400px at 20% 0%, rgba(212,175,55,.12), transparent 55%);
  border-bottom: 1px solid rgba(212,175,55,.12);
}
.hero-inner{
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 36px;
  align-items: center;
}
.hero h1{
  font-size: clamp(36px, 6vw, 56px);
  line-height: 1.1;
  margin: 0 0 10px 0;
  letter-spacing: .2px;
}
.hero .sub{
  color: var(--muted);
  margin-bottom: 22px;
}



/* 🔮+✨ emoji；GPT 5 */
.crystal-emoji {
  font-size: 150px;       /* 调整水晶球大小 */
  text-align: center;
  margin: 40px auto;
  position: relative;     /* 方便伪元素定位 */
  display: inline-block;  /* 保证定位有效 */
  cursor: pointer;
  transition: transform 0.3s ease;
}

.crystal-emoji:hover {
  transform: scale(1.05);  /* 鼠标悬停时稍微放大 */
}

.crystal-emoji::after {
  content: "✨";           /* 默认附加的 emoji */
  font-size: 48px;         /* ✨ 的大小 */
  position: absolute;
  top: -10px;              /* 距离 🔮 上方 */
  right: -30px;            /* 距离 🔮 右侧 */
  opacity: 0;              /* 默认不显示 */
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.crystal-emoji:hover::after {
  opacity: 1;              /* 悬停时显示 */
  transform: translateY(-6px);  /* 轻微漂浮效果 */
}



/* Cards (Services) */
.cards{
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.card{
  background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.0));
  border: 1px solid rgba(212,175,55,.18);
  border-radius: var(--radius);
  padding: 18px;
  box-shadow: var(--shadow);
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
}
.card h3{ margin: 2px 0 8px; color: var(--gold); }
.card p{ color: var(--muted); margin: 0 0 12px; }
.card:hover{
  transform: translateY(-4px);
  border-color: rgba(212,175,55,.35);
  box-shadow: 0 12px 42px rgba(0,0,0,.55);
}
.link-btn{
  background: transparent;
  border: none;
  color: var(--gold);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}
.link-btn:hover{ text-decoration: underline; }

/* About */
.two-col{
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 28px;
  align-items: center;
}
.ticks{
  list-style: none;
  padding: 0;
  margin: 14px 0 0;
}
.ticks li{
  margin: 6px 0;
}
.ticks li::before{
  content: "✓";
  color: var(--gold);
  margin-right: 8px;
}
.about-panel{
  position: relative;
  height: 240px;
  border-radius: var(--radius);
  background: radial-gradient(120px 120px at 70% 30%, rgba(212,175,55,.2), transparent 60%), var(--bg-soft);
  border: 1px solid rgba(212,175,55,.15);
  overflow: hidden;
}
.about-glow{
  position: absolute;
  inset: -40%;
  background: radial-gradient(circle at 50% 50%, rgba(212,175,55,.15), transparent 55%);
  animation: slow-pan 12s linear infinite;
}
@keyframes slow-pan{
  0%{ transform: translate(0,0); }
  50%{ transform: translate(-6%, 4%); }
  100%{ transform: translate(0,0); }
}
.sigil{
  position: absolute;
  right: 16px; bottom: 14px;
  font-size: 42px;
  color: rgba(212,175,55,.55);
}

/* Testimonials */
.testi-wrap{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 18px;
}
.testi{
  margin: 0;
  background: var(--bg-soft);
  border: 1px solid rgba(212,175,55,.14);
  border-radius: var(--radius);
  padding: 18px;
  color: var(--text);
  box-shadow: var(--shadow);
}
.testi cite{
  display: block;
  margin-top: 10px;
  color: var(--gold);
  font-style: normal;
  opacity: .9;
}

/* Footer */
.site-footer{
  border-top: 1px solid rgba(212,175,55,.12);
  padding: 26px 0 40px;
  background: linear-gradient(to top, rgba(11,11,16,1), rgba(11,11,16,.6));
}
.footer-inner{
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.site-footer a{
  color: var(--muted);
  text-decoration: none;
  margin-left: 14px;
}
.site-footer a:hover{ color: var(--gold); }

/* 响应式样式 (Responsive CSS)；GPT5  */
@media (max-width: 960px){
  .hero-inner{ grid-template-columns: 1fr; text-align: center; }
  .crystal{ width: min(320px, 80%); }
  .two-col{ grid-template-columns: 1fr; }
  .cards{ grid-template-columns: repeat(2, 1fr); }
  .testi-wrap{ grid-template-columns: 1fr; }
  .nav a{ margin-left: 12px; }
}
@media (max-width: 520px){
  .cards{ grid-template-columns: 1fr; }
  .logo{ font-size: 18px; }
  .nav{ display: none; } /* keep header minimal on very small screens */
}
