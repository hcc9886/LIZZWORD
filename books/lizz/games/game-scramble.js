/* ============================================================
   小游戏三 · 字母重组（Letter Scramble）
   根据中文释义与音标，把打乱的字母按顺序拼回单词。
   10 题一局，可用 3 次「提示首字母」，每次提示会扣分。
   ============================================================ */
(function () {
  "use strict";

  const G = window.LZG;
  if (!G) return;

  const QUESTIONS = 10;
  const HINTS = 3;

  const ICON = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round">
      <rect x="2.5" y="3.5" width="8.4" height="8.4" rx="2"/>
      <rect x="13.1" y="3.5" width="8.4" height="8.4" rx="2" fill="#fff8ec"/>
      <rect x="2.5" y="13.1" width="8.4" height="8.4" rx="2" fill="#fff8ec"/>
      <rect x="13.1" y="13.1" width="8.4" height="8.4" rx="2"/>
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
          <h2>把字母拼回原来的单词</h2>
          <p class="lzg-intro-lead">
            先看中文释义与音标，再依次点击下方字母。拼满之后会自动判定，
            拼错也能马上看到正确拼写。
          </p>
          <ul class="lzg-rules">
            <li>一局 10 题，每题 4–10 个字母。</li>
            <li>整局可用 3 次「提示首字母」，每次会少得 40 分。</li>
            <li>点已放好的字母可以撤回，从该位置重新拼。</li>
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
        hintsLeft: HINTS,
        hintUsed: false,
        locked: true,
        used: {},
        word: null,
        tiles: [],
        slots: []
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
      while (guard < 60) {
        guard++;
        const item = G.pools.scramble[Math.floor(Math.random() * G.pools.scramble.length)];
        if (!item) continue;
        const key = item.word.toLowerCase();
        if (state.used[key]) continue;
        state.used[key] = true;
        return item;
      }
      return G.pools.scramble[Math.floor(Math.random() * G.pools.scramble.length)];
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
      state.locked = false;
      state.hintUsed = false;
      state.slots = [];

      const word = pickWord();
      state.word = word;

      const letters = word.word.split("");
      let scrambled = letters;
      for (let i = 0; i < 20; i++) {
        scrambled = G.shuffle(letters);
        if (scrambled.join("").toLowerCase() !== word.word.toLowerCase()) break;
      }

      state.tiles = scrambled.map(function (ch, index) {
        return { id: "t" + index + "_" + state.index, ch: ch, used: false };
      });

      stage.innerHTML = `
        <div class="lzg-hud">
          <div class="lzg-stat"><b data-time>${G.formatTime(timer.elapsed())}</b><span>用时</span></div>
          <div class="lzg-stat"><b data-qno>${state.index} / ${QUESTIONS}</b><span>题号</span></div>
          <div class="lzg-stat"><b data-combo>${state.combo > 0 ? "×" + state.combo : "0"}</b><span>连击</span></div>
          <div class="lzg-stat"><b data-score>${state.score}</b><span>得分</span></div>
        </div>
        <div class="lzg-progress"><i data-bar style="width:${(state.index - 1) / QUESTIONS * 100}%"></i></div>
        <div class="lzg-scramble" data-scramble>
          <div class="lzg-scramble-meaning">
            <p class="lzg-scramble-tag">根据释义拼出单词</p>
            <p class="lzg-scramble-zh">${G.escapeHtml(word.zh)}</p>
            <p class="lzg-scramble-ipa">${G.escapeHtml(word.ipa)}</p>
            <p class="lzg-scramble-count">${letters.length} 个字母 · 剩余提示 ${state.hintsLeft} 次</p>
          </div>
          <div class="lzg-slots" data-slots></div>
          <div class="lzg-tiles" data-tiles></div>
          <div class="lzg-scramble-tools">
            <button type="button" class="lzg-btn lzg-btn-ghost lzg-btn-sm" data-hint>提示首字母</button>
            <button type="button" class="lzg-btn lzg-btn-ghost lzg-btn-sm" data-undo>撤一步</button>
          </div>
        </div>
        <p class="lzg-tip" data-tip aria-live="polite">依次点击字母，拼满后自动判定</p>`;

      renderTiles();
      renderSlots();
      updateHints();
    }

    function renderTiles() {
      const holder = stage.querySelector("[data-tiles]");
      if (!holder) return;
      holder.innerHTML = state.tiles.map(function (tile) {
        return `
          <button type="button" class="lzg-tile${tile.used ? " is-used" : ""}"
                  data-tile="${G.escapeHtml(tile.id)}" aria-label="字母 ${G.escapeHtml(tile.ch)}">
            ${G.escapeHtml(tile.ch)}
          </button>`;
      }).join("");
    }

    function renderSlots() {
      const holder = stage.querySelector("[data-slots]");
      if (!holder || !state.word) return;
      const total = state.word.word.length;
      let html = "";
      for (let i = 0; i < total; i++) {
        const tile = state.slots[i];
        html += `
          <span class="lzg-slot${tile ? " is-filled" : ""}" data-slot="${i}">
            ${tile ? G.escapeHtml(tile.ch) : ""}
          </span>`;
      }
      holder.innerHTML = html;
    }

    function updateHints() {
      const hintBtn = stage.querySelector("[data-hint]");
      if (!hintBtn) return;
      const disabled = state.hintsLeft <= 0 || state.hintUsed || state.slots.length > 0 || state.locked;
      hintBtn.disabled = disabled;
      hintBtn.style.opacity = disabled ? "0.45" : "";
      hintBtn.textContent = state.hintsLeft > 0
        ? "提示首字母（剩 " + state.hintsLeft + "）"
        : "提示已用完";
    }

    function chooseTile(id) {
      if (!state || state.locked || !state.word) return;
      const tile = state.tiles.find(function (t) { return t.id === id; });
      if (!tile || tile.used) return;
      if (state.slots.length >= state.word.word.length) return;

      tile.used = true;
      state.slots.push(tile);
      renderTiles();
      renderSlots();
      updateHints();

      if (state.slots.length >= state.word.word.length) {
        state.locked = true;
        updateHints();
        setTip("拼满了，正在判定…");
        later(checkAnswer, 240);
      }
    }

    function undoTo(index) {
      if (!state || state.locked) return;
      const removeFrom = Math.min(index, state.slots.length - 1);
      if (removeFrom < 0) return;
      const removed = state.slots.splice(removeFrom);
      removed.forEach(function (tile) { tile.used = false; });
      renderTiles();
      renderSlots();
      updateHints();
      setTip("已撤回，重新拼一次");
    }

    function useHint() {
      if (!state || state.locked || !state.word) return;
      if (state.hintsLeft <= 0 || state.hintUsed || state.slots.length > 0) return;

      const first = state.word.word[0];
      const tile = state.tiles.find(function (t) {
        return !t.used && t.ch.toLowerCase() === first.toLowerCase();
      });
      if (!tile) return;

      state.hintUsed = true;
      state.hintsLeft--;
      tile.used = true;
      state.slots.push(tile);
      renderTiles();
      renderSlots();
      updateHints();
      setTip("首字母已放好，继续拼剩下的字母");
    }

    function checkAnswer() {
      if (!state || !state.word) return;
      const guess = state.slots.map(function (t) { return t.ch; }).join("").toLowerCase();
      const answer = state.word.word.toLowerCase();
      const right = guess === answer;
      const slots = Array.prototype.slice.call(stage.querySelectorAll("[data-slot]"));
      const box = stage.querySelector("[data-scramble]");

      if (right) {
        state.combo++;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        state.correct++;
        const gain = (120 - (state.hintUsed ? 40 : 0)) + (state.combo - 1) * 25;
        state.score += Math.max(20, gain);
        slots.forEach(function (node) { node.classList.add("is-right"); });
        if (box) box.classList.add("is-good");
        setTip("拼对了 · +" + Math.max(20, gain) + " 分", "good");
        updateHud();
        later(function () {
          if (!state) return;
          if (state.index >= QUESTIONS) finish();
          else nextQuestion();
        }, 1000);
        return;
      }

      state.combo = 0;
      slots.forEach(function (node) { node.classList.add("is-warn"); });
      if (box) box.classList.add("is-bad");
      setTip("这次拼写不对，正确答案是 " + state.word.word, "bad");
      updateHud();

      const holder = stage.querySelector("[data-scramble]");
      if (holder) {
        const reveal = document.createElement("div");
        reveal.className = "lzg-reveal";
        reveal.innerHTML = `<b>${G.escapeHtml(state.word.word)}</b> ` +
          `${G.escapeHtml(state.word.ipa)} · ${G.escapeHtml(state.word.zh)}`;
        holder.appendChild(reveal);
      }

      later(function () {
        if (!state) return;
        if (state.index >= QUESTIONS) finish();
        else nextQuestion();
      }, 1700);
    }

    function finish() {
      if (!state) return;
      timer.stop();
      const elapsed = timer.elapsed();
      const isNew = api.saveScore({ score: state.score, time: elapsed });
      const accuracy = Math.round(state.correct / QUESTIONS * 100);
      const hintsUsed = HINTS - state.hintsLeft;

      let praise;
      if (state.correct === QUESTIONS) praise = "10 个单词全部拼对，字母顺序很稳。";
      else if (state.correct >= 7) praise = "拼写底子不错，错的词再拼一次就记住了。";
      else praise = "先按音标读一遍再拼，字母顺序会更容易想起来。";

      stage.innerHTML = `
        <div class="lzg-result">
          <p class="lzg-result-kicker">字母重组 · 完成</p>
          <p class="lzg-result-score">${state.score}<small>分</small></p>
          ${isNew ? '<span class="lzg-result-new">新的最佳成绩</span>' : ""}
          <p class="lzg-result-note">${praise}</p>
          <div class="lzg-result-stats">
            <div class="lzg-result-stat"><b>${state.correct} / ${QUESTIONS}</b><span>拼对</span></div>
            <div class="lzg-result-stat"><b>${accuracy}%</b><span>正确率</span></div>
            <div class="lzg-result-stat"><b>${hintsUsed}</b><span>使用提示</span></div>
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

      if (event.target.closest("[data-hint]")) {
        useHint();
        return;
      }

      if (event.target.closest("[data-undo]")) {
        undoTo(state ? state.slots.length - 1 : -1);
        return;
      }

      const tile = event.target.closest("[data-tile]");
      if (tile) {
        chooseTile(tile.dataset.tile);
        return;
      }

      const slot = event.target.closest("[data-slot]");
      if (slot) undoTo(Number(slot.dataset.slot));
    });

    renderIntro();

    return function () {
      clearLater();
      if (timer) timer.stop();
      G.tts.cancel();
    };
  }

  G.register({
    id: "scramble",
    title: "字母重组",
    tagline: "看释义与音标，把打乱的字母拼回去",
    desc: "10 题 · 点选字母拼写，附 3 次首字母提示",
    icon: ICON,
    mount: mount
  });
})();
