/* ============================================================
   小游戏二 · 快闪辨义（Flash Recall）
   单词闪现约 0.9 秒后隐去，再从四个中文释义里选出正确的一项。
   12 题一局，连击越高得分越高。
   ============================================================ */
(function () {
  "use strict";

  const G = window.LZG;
  if (!G) return;

  const QUESTIONS = 12;
  const FLASH_MS = 900;

  const ICON = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13.2 2.5 5.8 13.2h5.1l-1 8.3 7.3-10.7h-5.1l1.1-8.3Z"/>
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
          <h2>看清它，然后选出意思</h2>
          <p class="lzg-intro-lead">
            每个单词只会闪现约 0.9 秒，随后消失。回忆它的中文释义，
            从四个选项里选出正确的一项。
          </p>
          <ul class="lzg-rules">
            <li>一局 12 题，每题四选一。</li>
            <li>连续答对累积连击，得分逐题提高。</li>
            <li>答错会立刻显示正确答案，方便当场记住。</li>
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
        index: 0,
        correct: 0,
        combo: 0,
        maxCombo: 0,
        score: 0,
        locked: true,
        used: {},
        options: [],
        answer: null
      };

      timer = G.createTimer(function (ms) {
        const node = stage.querySelector("[data-time]");
        if (node) node.textContent = G.formatTime(ms);
      });
      timer.start();

      nextQuestion();
    }

    function pickWord() {
      let guard = 0;
      while (guard < 50) {
        guard++;
        const item = G.pools.flash[Math.floor(Math.random() * G.pools.flash.length)];
        if (!item) continue;
        const key = item.word.toLowerCase();
        if (state.used[key]) continue;
        state.used[key] = true;
        return item;
      }
      return G.pools.flash[Math.floor(Math.random() * G.pools.flash.length)];
    }

    function hudMarkup() {
      return `
        <div class="lzg-hud">
          <div class="lzg-stat"><b data-time>${G.formatTime(timer.elapsed())}</b><span>用时</span></div>
          <div class="lzg-stat"><b data-qno>0 / ${QUESTIONS}</b><span>题号</span></div>
          <div class="lzg-stat"><b data-combo>0</b><span>连击</span></div>
          <div class="lzg-stat"><b data-score>0</b><span>得分</span></div>
        </div>
        <div class="lzg-progress"><i data-bar style="width:0%"></i></div>`;
    }

    function updateHud() {
      if (!state) return;
      const qno = stage.querySelector("[data-qno]");
      const combo = stage.querySelector("[data-combo]");
      const score = stage.querySelector("[data-score]");
      const bar = stage.querySelector("[data-bar]");
      if (qno) qno.textContent = state.index + " / " + QUESTIONS;
      if (combo) combo.textContent = state.combo > 0 ? "×" + state.combo : "0";
      if (score) score.textContent = state.score;
      if (bar) bar.style.width = (state.index / QUESTIONS * 100) + "%";
    }

    function nextQuestion() {
      if (!state) return;
      if (state.index >= QUESTIONS) {
        finish();
        return;
      }

      state.index++;
      state.locked = true;

      const word = pickWord();
      const built = G.quiz(word, "flash");
      state.answer = word;
      state.options = built.options;

      stage.innerHTML = hudMarkup() + `
        <div class="lzg-flash-card is-flashing" data-flash style="--flash-ms:${FLASH_MS}ms">
          <p class="lzg-flash-label" data-flash-label>记住这个单词</p>
          <div class="lzg-flash-word">${G.escapeHtml(word.word)}</div>
          <div class="lzg-flash-count"><i></i></div>
        </div>
        <div data-options></div>
        <p class="lzg-tip" data-tip aria-live="polite">词会马上消失，然后选出它的中文释义</p>`;

      updateHud();

      later(function () {
        if (!state) return;
        const card = stage.querySelector("[data-flash]");
        if (card) {
          card.classList.remove("is-flashing");
          card.classList.add("is-hidden");
        }
        const label = stage.querySelector("[data-flash-label]");
        if (label) label.textContent = "它是什么意思？";

        const holder = stage.querySelector("[data-options]");
        if (!holder) return;

        holder.innerHTML = `
          <div class="lzg-options">
            ${state.options.map(function (item, index) {
              return `
                <button type="button" class="lzg-option" data-opt="${index}">
                  ${G.escapeHtml(item.zh)}
                </button>`;
            }).join("")}
          </div>`;

        state.locked = false;
        setTip("选出刚才那个词的正确释义");
      }, FLASH_MS);
    }

    function choose(index) {
      if (!state || state.locked) return;
      const picked = state.options[index];
      if (!picked) return;

      state.locked = true;

      const buttons = Array.prototype.slice.call(stage.querySelectorAll("[data-opt]"));
      buttons.forEach(function (btn) { btn.disabled = true; });

      const isRight = picked.word === state.answer.word;
      let gain = 0;

      if (isRight) {
        state.combo++;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        gain = 100 + (state.combo - 1) * 30;
        state.score += gain;
        state.correct++;
        if (buttons[index]) buttons[index].classList.add("is-right");
        setTip("答对了 · +" + gain + " 分", "good");
      } else {
        state.combo = 0;
        if (buttons[index]) buttons[index].classList.add("is-wrong");
        buttons.forEach(function (btn) {
          const item = state.options[Number(btn.dataset.opt)];
          if (item && item.word === state.answer.word) btn.classList.add("is-right");
        });
        setTip("这次没选对，正确答案已标出", "bad");
      }

      updateHud();

      const holder = stage.querySelector("[data-options]");
      if (holder) {
        const reveal = document.createElement("div");
        reveal.className = "lzg-reveal";
        reveal.innerHTML = `<b>${G.escapeHtml(state.answer.word)}</b> ` +
          `${G.escapeHtml(state.answer.zh)}`;
        holder.appendChild(reveal);
      }

      later(function () {
        if (!state) return;
        if (state.index >= QUESTIONS) finish();
        else nextQuestion();
      }, isRight ? 1100 : 1650);
    }

    function finish() {
      if (!state) return;
      timer.stop();
      const elapsed = timer.elapsed();
      const accuracy = Math.round(state.correct / QUESTIONS * 100);
      const isNew = api.saveScore({ score: state.score, time: elapsed });

      let praise;
      if (state.correct === QUESTIONS) praise = "12 题全对，词义反应很快。";
      else if (state.correct >= 9) praise = "大部分词都能一眼认出，保持这个节奏。";
      else praise = "答错的词已经在结果里露出了，下一局会更有印象。";

      stage.innerHTML = `
        <div class="lzg-result">
          <p class="lzg-result-kicker">快闪辨义 · 完成</p>
          <p class="lzg-result-score">${state.score}<small>分</small></p>
          ${isNew ? '<span class="lzg-result-new">新的最佳成绩</span>' : ""}
          <p class="lzg-result-note">${praise}</p>
          <div class="lzg-result-stats">
            <div class="lzg-result-stat"><b>${state.correct} / ${QUESTIONS}</b><span>答对</span></div>
            <div class="lzg-result-stat"><b>${accuracy}%</b><span>正确率</span></div>
            <div class="lzg-result-stat"><b>×${state.maxCombo}</b><span>最高连击</span></div>
            <div class="lzg-result-stat"><b>${G.formatTime(elapsed)}</b><span>用时</span></div>
          </div>
          <div class="lzg-result-actions">
            <button type="button" class="lzg-btn lzg-btn-primary" data-replay>再来一局</button>
            <button type="button" class="lzg-btn lzg-btn-ghost" data-home>换个小游戏</button>
          </div>
        </div>`;
    }

    stage.addEventListener("click", function (event) {
      if (event.target.closest("[data-start]") || event.target.closest("[data-replay]")) {
        begin();
        return;
      }
      const option = event.target.closest("[data-opt]");
      if (option) choose(Number(option.dataset.opt));
    });

    renderIntro();

    return function () {
      clearLater();
      if (timer) timer.stop();
      G.tts.cancel();
    };
  }

  G.register({
    id: "flash",
    title: "快闪辨义",
    tagline: "单词闪现之后，快速选出中文释义",
    desc: "12 题 · 0.9 秒记忆窗口，四选一",
    icon: ICON,
    mount: mount
  });
})();
