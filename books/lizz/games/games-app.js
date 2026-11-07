/* ============================================================
   LIZZWORD · 小游戏入口与路由
   首页 → 选择游戏；#match / #flash / #scramble / #listen
   ============================================================ */
(function () {
  "use strict";

  const G = window.LZG;
  const app = document.getElementById("lzg-app");
  if (!G || !app) return;

  let currentCleanup = null;
  let currentId = "home";

  const FOX = `
    <svg class="lzg-fox" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M11 9 L27 18 L37 18 L53 9 L53 31 Q53 49 32 55 Q11 49 11 31 Z"
            fill="#f4b26f" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
      <path d="M14.5 13 L25.5 18.5 L19 21 Z" fill="#fff3e2"/>
      <path d="M49.5 13 L38.5 18.5 L45 21 Z" fill="#fff3e2"/>
      <ellipse cx="32" cy="42.5" rx="8.5" ry="6" fill="#fff6ea"/>
      <circle cx="24" cy="32.5" r="2.2" fill="#4a3b32"/>
      <circle cx="40" cy="32.5" r="2.2" fill="#4a3b32"/>
      <path d="M29.5 39.5 Q32 42 34.5 39.5" fill="none" stroke="#4a3b32" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`;

  const ICONS = {
    match: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="7.5" width="10.5" height="13" rx="2.5"/>
        <rect x="10.5" y="3.5" width="10.5" height="13" rx="2.5" fill="#fff8ec"/>
        <path d="M6.2 11.5h4M6.2 14.5h4"/>
      </svg>`,
    flash: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M13.2 2.5 5.8 13.2h5.1l-1 8.3 7.3-10.7h-5.1l1.1-8.3Z"/>
      </svg>`,
    scramble: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round">
        <rect x="2.5" y="3.5" width="8.4" height="8.4" rx="2"/>
        <rect x="13.1" y="3.5" width="8.4" height="8.4" rx="2" fill="#fff8ec"/>
        <rect x="2.5" y="13.1" width="8.4" height="8.4" rx="2" fill="#fff8ec"/>
        <rect x="13.1" y="13.1" width="8.4" height="8.4" rx="2"/>
      </svg>`,
    listen: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 9.3v5.4h3.1l4.2 3.4V5.9L7.1 9.3H4Z"/>
        <path d="M14.8 9.2a4.1 4.1 0 0 1 0 5.6"/>
        <path d="M17.6 6.6a7.6 7.6 0 0 1 0 10.8"/>
      </svg>`
  };

  function header(isHome, title) {
    if (isHome) {
      return `
        <div class="lzg-bar">
          <a class="lzg-back" href="index.html">← 首页</a>
          <span class="lzg-bar-title">单词小游戏</span>
          <span class="lzg-bar-tag">LIZZWORD</span>
        </div>`;
    }
    return `
      <div class="lzg-bar">
        <button type="button" class="lzg-back" data-home>← 游戏</button>
        <span class="lzg-bar-title">${G.escapeHtml(title)}</span>
        <span class="lzg-bar-tag">小游戏</span>
      </div>`;
  }

  function bestText(best) {
    return best ? "最佳 " + best.score + " 分" : "未挑战";
  }

  function renderHome() {
    currentId = "home";
    document.title = "单词小游戏 · LIZZWORD";

    const cards = G.games().map(function (game) {
      const best = G.getBest(game.id);
      return `
        <a class="lzg-card" href="#${game.id}">
          <span class="lzg-card-icon">${game.icon || ICONS[game.id] || ""}</span>
          <span class="lzg-card-body">
            <span class="lzg-card-title">${G.escapeHtml(game.title)}</span>
            <span class="lzg-card-desc">${G.escapeHtml(game.desc || "")}</span>
            <span class="lzg-card-best">${bestText(best)}</span>
          </span>
          <span class="lzg-card-arrow" aria-hidden="true">›</span>
        </a>`;
    }).join("");

    app.innerHTML = header(true) + `
      <div class="lzg-hero">
        ${FOX}
        <div>
          <h1>单词小游戏</h1>
          <p>四款轻量小游戏，单局 3–5 分钟。围着词义回忆与拼写反复练习，不打断原有背词节奏。</p>
        </div>
      </div>
      <div class="lzg-games">${cards}</div>
      <div class="lzg-home-foot">
        可玩词条 ${G.words.length} 个 · 成绩只保存在本机浏览器
      </div>`;

    currentCleanup = null;
  }

  function openGame(id) {
    const game = G.games().find(function (item) { return item.id === id; });
    if (!game) {
      renderHome();
      return;
    }

    currentId = id;
    document.title = game.title + " · LIZZWORD";

    const best = G.getBest(id);

    app.innerHTML = header(false, "单词小游戏") + `
      <div class="lzg-game-head">
        <div>
          <h1>${G.escapeHtml(game.title)}</h1>
          <p>${G.escapeHtml(game.tagline || "")}</p>
        </div>
        <span class="lzg-best-chip" data-best-chip>${bestText(best)}</span>
      </div>
      <div id="lzg-stage"></div>`;

    const stage = app.querySelector("#lzg-stage");
    const chip = app.querySelector("[data-best-chip]");

    const api = {
      toast: G.toast,
      home: function () {
        location.hash = "home";
      },
      saveScore: function (result) {
        const isNew = G.saveBest(game.id, result);
        const nextBest = G.getBest(game.id);
        if (chip) chip.textContent = bestText(nextBest);
        return isNew;
      },
      getBest: function () {
        return G.getBest(game.id);
      }
    };

    try {
      currentCleanup = game.mount(stage, api) || null;
    } catch (err) {
      console.error("[小游戏] 启动失败", err);
      stage.innerHTML = '<div class="lzg-panel"><p class="lzg-tip is-bad">这个游戏暂时没有加载成功，请返回后重试。</p></div>';
    }
  }

  function route() {
    const raw = String(location.hash || "").replace(/^#\/?/, "");
    const id = raw || "home";

    if (currentCleanup) {
      try { currentCleanup(); } catch (e) { /* ignore */ }
      currentCleanup = null;
    }
    G.tts.cancel();

    if (id === "home") {
      renderHome();
      return;
    }
    openGame(id);
  }

  window.addEventListener("hashchange", route);
  route();

  app.addEventListener("click", function (event) {
    if (event.target.closest("[data-home]")) {
      event.preventDefault();
      location.hash = "home";
    }
  });
})();
