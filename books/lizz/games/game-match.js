/* ============================================================
   小游戏一 · 翻牌配对（Memory Match）
   英文卡与中文卡全部背面朝上，一次翻一张，翻两张判断是否成对。
   3 关 × 每关 6 对；连击越高单次得分越高。
   ============================================================ */
(function () {
  "use strict";

  const G = window.LZG;
  if (!G) return;

  const ROUNDS = 3;
  const PAIRS_PER_ROUND = 6;
  const TOTAL_PAIRS = ROUNDS * PAIRS_PER_ROUND;

  const ICON = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="7.5" width="10.5" height="13" rx="2.5"/>
      <rect x="10.5" y="3.5" width="10.5" height="13" rx="2.5" fill="#fff8ec"/>
      <path d="M6.2 11.5h4M6.2 14.5h4"/>
    </svg>`;

  const PAW = `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <ellipse cx="12" cy="15.2" rx="5.4" ry="4.2"/>
      <ellipse cx="5.9" cy="10.3" rx="2.2" ry="2.7" transform="rotate(-16 5.9 10.3)"/>
      <ellipse cx="10.1" cy="6.7" rx="2.1" ry="2.6" transform="rotate(-6 10.1 6.7)"/>
      <ellipse cx="14.2" cy="6.6" rx="2.1" ry="2.6" transform="rotate(8 14.2 6.6)"/>
      <ellipse cx="18.2" cy="10.1" rx="2.2" ry="2.7" transform="rotate(16 18.2 10.1)"/>
    </svg>`;

  function mount(stage, api) {
    let state = null;
    let timer = null;
    const timeouts = new Set();

    function later(fn, ms) {
      const id = window.setTimeout(function () {
        timeouts.delete(id);
        fn();
      }, ms);
      timeouts.add(id);
      return id;
    }

    function clearLater() {
      timeouts.forEach(function (id) { window.clearTimeout(id); });
      timeouts.clear();
    }

    function setTip(text, kind) {
      const tip = stage.querySelector("[data-tip]");
      if (!tip) return;
      tip.textContent = text;
      tip.classList.remove("is-good", "is-bad");
      if (kind) tip.classList.add(kind === "good" ? "is-good" : "is-bad");
    }

    function updateHud() {
      if (!state) return;
      const steps = stage.querySelector("[data-steps]");
      const combo = stage.querySelector("[data-combo]");
      const score = stage.querySelector("[data-score]");
      const bar = stage.querySelector("[data-bar]");
      const pairs = stage.querySelector("[data-pairs]");
      if (steps) steps.textContent = state.attempts;
      if (combo) combo.textContent = state.combo > 0 ? "×" + state.combo : "0";
      if (score) score.textContent = state.score;
      if (bar) bar.style.width = (state.matchedTotal / TOTAL_PAIRS * 100) + "%";
      if (pairs) pairs.textContent = "本轮已配对 " + state.pairInRound + " / " + PAIRS_PER_ROUND;
    }

    function renderIntro() {
      state = null;
      if (timer) {
        timer.stop();
        timer = null;
      }
      clearLater();
      stage.innerHTML = `
        <div class="lzg-intro">
          <div class="lzg-intro-icon">${ICON}</div>
          <h2>翻开两张，找出一对</h2>
          <p class="lzg-intro-lead">
            英文卡和它的中文释义卡各一张，全部背面朝上。一次只能翻一张，
            连续翻开两张后判断是否对应。
          </p>
          <ul class="lzg-rules">
            <li>3 关，每关 6 对；配对成功即锁定，配对失败会翻回。</li>
            <li>连续配对成功会累积连击，单次得分更高。</li>
            <li>计时从第一次翻牌开始，成绩只保存在本机。</li>
          </ul>
          <div class="lzg-intro-actions">
            <button type="button" class="lzg-btn lzg-btn-primary" data-start>开始游戏</button>
          </div>
        </div>`;
    }

    function begin() {
      if (timer) timer.stop();
      clearLater();

      state = {
        roundId: G.newRoundId("match"),
        round: 1,
        matchedTotal: 0,
        pairInRound: 0,
        attempts: 0,
        combo: 0,
        maxCombo: 0,
        score: 0,
        first: null,
        lock: false,
        started: false,
        used: {},
        cards: {}
      };

      stage.innerHTML = `
        <div class="lzg-hud">
          <div class="lzg-stat"><b data-time>00:00</b><span>用时</span></div>
          <div class="lzg-stat"><b data-steps>0</b><span>步数</span></div>
          <div class="lzg-stat"><b data-combo>0</b><span>连击</span></div>
          <div class="lzg-stat"><b data-score>0</b><span>得分</span></div>
        </div>
        <div class="lzg-progress"><i data-bar></i></div>
        <div class="lzg-roundline">
          <span data-round>第 1 关 / 共 ${ROUNDS} 关</span>
          <span data-pairs>本轮已配对 0 / ${PAIRS_PER_ROUND}</span>
        </div>
        <div class="lzg-board" data-board></div>
        <p class="lzg-tip" data-tip aria-live="polite">翻开任意一张开始计时</p>`;

      timer = G.createTimer(function (ms) {
        const node = stage.querySelector("[data-time]");
        if (node) node.textContent = G.formatTime(ms);
      });

      renderRound();
    }

    function renderRound() {
      state.pairInRound = 0;
      state.first = null;
      state.lock = false;

      const pairs = G.pickWords(G.pools.match, PAIRS_PER_ROUND).filter(function (item) {
        const key = item.word.toLowerCase();
        if (state.used[key]) return false;
        state.used[key] = true;
        return true;
      });

      // 极端情况下词池不足，补足到 6 对
      let guard = 0;
      while (pairs.length < PAIRS_PER_ROUND && guard < 30) {
        guard++;
        const extra = G.pickWords(G.pools.match, PAIRS_PER_ROUND);
        extra.forEach(function (item) {
          if (pairs.length >= PAIRS_PER_ROUND) return;
          if (pairs.some(function (p) { return p.word === item.word; })) return;
          pairs.push(item);
        });
      }

      const cards = [];
      pairs.forEach(function (item, index) {
        cards.push({ id: index, side: "en", item: item });
        cards.push({ id: index, side: "zh", item: item });
      });

      const shuffled = G.shuffle(cards);
      state.cards = {};
      shuffled.forEach(function (card) {
        state.cards[card.id + ":" + card.side] = card;
      });

      const board = stage.querySelector("[data-board]");
      if (!board) return;

      board.innerHTML = shuffled.map(function (card) {
        const label = card.side === "en"
          ? '<span class="lzg-mcard-en">' + G.escapeHtml(card.item.word) + '</span>'
          : '<span class="lzg-mcard-zh">' + G.escapeHtml(card.item.zh) + '</span>';
        return `
          <button type="button" class="lzg-mcard" data-id="${card.id}" data-side="${card.side}"
                  aria-label="未翻开的卡片">
            <span class="lzg-mcard-inner">
              <span class="lzg-mcard-face lzg-mcard-back">${PAW}</span>
              <span class="lzg-mcard-face lzg-mcard-front">${label}</span>
            </span>
          </button>`;
      }).join("");

      const round = stage.querySelector("[data-round]");
      if (round) round.textContent = "第 " + state.round + " 关 / 共 " + ROUNDS + " 关";
      setTip("翻开任意一张开始计时");
      updateHud();
    }

    function cardLabel(card) {
      const item = card && card.item;
      if (!item) return "翻开的卡片";
      if (card.classList.contains("is-matched")) {
        return "已配对：" + item.word + "，" + item.zh;
      }
      return card.dataset.side === "en"
        ? "英文卡：" + item.word
        : "中文卡：" + item.zh;
    }

    function onFlip(card) {
      if (!state || state.lock) return;
      if (card.classList.contains("is-open") || card.classList.contains("is-matched")) return;

      if (!state.started) {
        state.started = true;
        timer.start();
      }

      const cardData = state.cards[card.dataset.id + ":" + card.dataset.side];
      if (!cardData) return;

      card.classList.add("is-open");
      card.setAttribute("aria-label", cardLabel(card));

      if (!state.first) {
        state.first = { node: card, data: cardData };
        setTip("再翻一张，看看是不是它的中文或英文");
        return;
      }

      const first = state.first;
      state.first = null;
      state.lock = true;
      state.attempts++;

      const same = first.data.id === cardData.id;

      if (same) {
        state.combo++;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        state.score += 100 + (state.combo - 1) * 30;
        state.pairInRound++;
        state.matchedTotal++;

        first.node.classList.add("is-matched");
        card.classList.add("is-matched");
        first.node.setAttribute("aria-label", cardLabel(first.node));
        card.setAttribute("aria-label", cardLabel(card));

        setTip("配对成功：" + cardData.item.word + " = " + cardData.item.zh + " · +" +
          (100 + (state.combo - 1) * 30) + " 分", "good");
        updateHud();

        state.lock = false;

        if (state.pairInRound >= PAIRS_PER_ROUND) {
          state.lock = true;
          later(nextRound, 950);
        }
        return;
      }

      state.combo = 0;
      first.node.classList.add("is-wrong");
      card.classList.add("is-wrong");
      setTip("不是一对，记住它们的位置再试", "bad");
      updateHud();

      later(function () {
        first.node.classList.remove("is-open", "is-wrong");
        card.classList.remove("is-open", "is-wrong");
        first.node.setAttribute("aria-label", "未翻开的卡片");
        card.setAttribute("aria-label", "未翻开的卡片");
        state.lock = false;
        setTip("再翻两张继续");
      }, 780);
    }

    function nextRound() {
      if (!state) return;
      if (state.round >= ROUNDS) {
        finish();
        return;
      }
      state.round++;
      G.toast("第 " + state.round + " 关开始");
      renderRound();
    }

    function finish() {
      if (!state) return;
      timer.stop();
      const elapsed = timer.elapsed();
      const accuracy = state.attempts ? Math.round(state.matchedTotal / state.attempts * 100) : 0;

      const isNew = api.saveScore({ score: state.score, time: elapsed });
      const reward = G.awardPoints("match", state.roundId, accuracy);

      let praise;
      if (accuracy >= 90) praise = "几乎没走弯路，位置记得很稳。";
      else if (accuracy >= 70) praise = "大部分位置都记住了，再来一局会更快。";
      else praise = "翻错也是记忆线索，下一局先默念词义再翻。";

      stage.innerHTML = `
        <div class="lzg-result">
          <p class="lzg-result-kicker">翻牌配对 · 完成</p>
          <p class="lzg-result-score">${state.score}<small>分</small></p>
          ${isNew ? '<span class="lzg-result-new">新的最佳成绩</span>' : ""}
          <p class="lzg-result-note">${praise} 成绩只保存在本机浏览器。</p>
          <div class="lzg-result-stats">
            <div class="lzg-result-stat"><b>${G.formatTime(elapsed)}</b><span>用时</span></div>
            <div class="lzg-result-stat"><b>${state.attempts}</b><span>步数</span></div>
            <div class="lzg-result-stat"><b>×${state.maxCombo}</b><span>最高连击</span></div>
            <div class="lzg-result-stat"><b>${accuracy}%</b><span>配对准确率</span></div>
          </div>
          ${G.rewardBlock(reward)}
          <div class="lzg-result-actions">
            <button type="button" class="lzg-btn lzg-btn-primary" data-replay>再来一局</button>
            <button type="button" class="lzg-btn lzg-btn-ghost" data-home>换个小游戏</button>
          </div>
        </div>`;
    }

    stage.addEventListener("click", function (event) {
      const start = event.target.closest("[data-start]");
      if (start) {
        begin();
        return;
      }

      const replay = event.target.closest("[data-replay]");
      if (replay) {
        begin();
        return;
      }

      const card = event.target.closest(".lzg-mcard");
      if (card) onFlip(card);
    });

    renderIntro();

    return function () {
      clearLater();
      if (timer) timer.stop();
      G.tts.cancel();
    };
  }

  G.register({
    id: "match",
    title: "翻牌配对",
    tagline: "英文与中文，一对一对翻出来",
    desc: "3 关 · 每关 6 对，翻开两张找出对应",
    icon: ICON,
    mount: mount
  });
})();
