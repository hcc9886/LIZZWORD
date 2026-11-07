/* ============================================================
   小游戏四 · 听音选词（Listen & Choose）
   用 speechSynthesis 朗读英文单词，从四个英文单词里选出听到的那个。
   无语音或朗读失败时，自动降级为「看音标选词」，保证 file:// 也能玩。
   12 题一局。
   ============================================================ */
(function () {
  "use strict";

  const G = window.LZG;
  if (!G) return;

  const QUESTIONS = 12;

  const ICON = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 9.3v5.4h3.1l4.2 3.4V5.9L7.1 9.3H4Z"/>
      <path d="M14.8 9.2a4.1 4.1 0 0 1 0 5.6"/>
      <path d="M17.6 6.6a7.6 7.6 0 0 1 0 10.8"/>
    </svg>`;

  const SPEAKER = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 9.3v5.4h3.1l4.2 3.4V5.9L7.1 9.3H4Z"/>
      <path d="M14.8 9.2a4.1 4.1 0 0 1 0 5.6"/>
      <path d="M17.6 6.6a7.6 7.6 0 0 1 0 10.8"/>
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
      G.tts.cancel();

      const hasTts = G.tts.supported();
      stage.innerHTML = `
        <div class="lzg-intro">
          <div class="lzg-intro-icon">${ICON}</div>
          <h2>听发音，选出这个单词</h2>
          <p class="lzg-intro-lead">
            每题会自动朗读一个英文单词，你从四个单词里选出听到的那个。
            如果浏览器没有可用的英文语音，会自动改为看音标选词。
          </p>
          <ul class="lzg-rules">
            <li>一局 12 题，可随时点圆形按钮重听。</li>
            <li>连续答对累积连击，得分逐题提高。</li>
            <li>${hasTts ? "本机语音合成接口可用；若没有声音会自动改用音标。" : "本机暂未检测到语音合成，将使用音标模式。"}</li>
          </ul>
          <div class="lzg-intro-actions">
            <button type="button" class="lzg-btn lzg-btn-primary" data-start>开始游戏</button>
          </div>
        </div>`;
    }

    function begin() {
      if (timer) timer.stop();
      clearLater();
      G.tts.cancel();

      state = {
        index: 0,
        correct: 0,
        combo: 0,
        maxCombo: 0,
        score: 0,
        locked: true,
        answered: false,
        used: {},
        word: null,
        options: [],
        mode: G.tts.supported() ? "tts" : "ipa"
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
        const item = G.pools.listen[Math.floor(Math.random() * G.pools.listen.length)];
        if (!item) continue;
        const key = item.word.toLowerCase();
        if (state.used[key]) continue;
        state.used[key] = true;
        return item;
      }
      return G.pools.listen[Math.floor(Math.random() * G.pools.listen.length)];
    }

    function hudMarkup() {
      return `
        <div class="lzg-hud">
          <div class="lzg-stat"><b data-time>${G.formatTime(timer.elapsed())}</b><span>用时</span></div>
          <div class="lzg-stat"><b data-qno>${state.index} / ${QUESTIONS}</b><span>题号</span></div>
          <div class="lzg-stat"><b data-combo>${state.combo > 0 ? "×" + state.combo : "0"}</b><span>连击</span></div>
          <div class="lzg-stat"><b data-score>${state.score}</b><span>得分</span></div>
        </div>
        <div class="lzg-progress"><i data-bar style="width:${(state.index - 1) / QUESTIONS * 100}%"></i></div>`;
    }

    function renderQuestion() {
      if (!state || !state.word) return;

      const word = state.word;
      const isTts = state.mode === "tts";

      stage.innerHTML = hudMarkup() + `
        <div class="lzg-listen-card">
          <p class="lzg-listen-label">${isTts ? "听发音，选出正确的单词" : "语音不可用 · 看音标选词"}</p>
          ${isTts
            ? `<button type="button" class="lzg-listen-orb" data-speak aria-label="再听一次">${SPEAKER}</button>`
            : `<p class="lzg-listen-ipa">${G.escapeHtml(word.ipa)}</p>`}
          <p class="lzg-listen-hint">${isTts
            ? "没听清可以重复播放，反复听清尾音更容易分辨。"
            : "浏览器没有可用的英文语音，改为根据音标选择单词。"}</p>
          <button type="button" class="lzg-listen-fallback" data-switch>
            ${isTts ? "语音没声音？改用音标" : "再试一次语音播放"}
          </button>
        </div>
        <div class="lzg-options lzg-listen-options" data-options>
          ${state.options.map(function (item, index) {
            return `
              <button type="button" class="lzg-option" data-opt="${index}">
                ${G.escapeHtml(item.word)}
              </button>`;
          }).join("")}
        </div>
        <p class="lzg-tip" data-tip aria-live="polite">${isTts
          ? "点击圆形按钮可以重听"
          : "根据音标选出对应的单词"}</p>`;

      if (isTts && !state.answered) {
        // 让首帧先渲染，再开始朗读
        later(speakCurrent, 60);
      }
    }

    function speakCurrent() {
      if (!state || state.mode !== "tts" || state.answered) return;
      const orb = stage.querySelector("[data-speak]");
      if (orb) orb.classList.add("is-playing");

      G.tts.speak(state.word.word, {
        rate: 0.88,
        timeout: 1500,
        onStart: function () {
          if (orb) orb.classList.add("is-playing");
        },
        onEnd: function () {
          if (orb) orb.classList.remove("is-playing");
        },
        onFail: function () {
          if (orb) orb.classList.remove("is-playing");
          if (!state || state.answered || state.mode !== "tts") return;
          state.mode = "ipa";
          setTip("没有听到语音，已切换到音标模式");
          renderQuestion();
        }
      });
    }

    function nextQuestion() {
      if (!state) return;
      if (state.index >= QUESTIONS) {
        finish();
        return;
      }

      state.index++;
      state.answered = false;
      state.locked = false;

      const word = pickWord();
      state.word = word;
      state.options = G.quiz(word, "listen").options;

      renderQuestion();
    }

    function choose(index) {
      if (!state || state.locked || state.answered) return;
      const picked = state.options[index];
      if (!picked) return;

      state.answered = true;
      state.locked = true;

      const buttons = Array.prototype.slice.call(stage.querySelectorAll("[data-opt]"));
      buttons.forEach(function (btn) { btn.disabled = true; });

      const isRight = picked.word === state.word.word;
      let gain = 0;

      if (isRight) {
        state.combo++;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        gain = 110 + (state.combo - 1) * 30;
        state.score += gain;
        state.correct++;
        if (buttons[index]) buttons[index].classList.add("is-right");
        setTip("听对了 · +" + gain + " 分", "good");
      } else {
        state.combo = 0;
        if (buttons[index]) buttons[index].classList.add("is-wrong");
        buttons.forEach(function (btn) {
          const item = state.options[Number(btn.dataset.opt)];
          if (item && item.word === state.word.word) btn.classList.add("is-right");
        });
        setTip("这次没听准，正确答案已标出", "bad");
      }

      const qno = stage.querySelector("[data-qno]");
      const combo = stage.querySelector("[data-combo]");
      const scoreEl = stage.querySelector("[data-score]");
      const bar = stage.querySelector("[data-bar]");
      if (qno) qno.textContent = state.index + " / " + QUESTIONS;
      if (combo) combo.textContent = state.combo > 0 ? "×" + state.combo : "0";
      if (scoreEl) scoreEl.textContent = state.score;
      if (bar) bar.style.width = (state.index / QUESTIONS * 100) + "%";

      const card = stage.querySelector(".lzg-listen-card");
      if (card) {
        const reveal = document.createElement("div");
        reveal.className = "lzg-reveal";
        reveal.innerHTML = `<b>${G.escapeHtml(state.word.word)}</b> ` +
          `${G.escapeHtml(state.word.ipa)} · ${G.escapeHtml(state.word.zh)}`;
        card.appendChild(reveal);
      }

      if (state.mode === "tts") {
        G.tts.speak(state.word.word, { rate: 0.88, timeout: 1500 });
      }

      later(function () {
        if (!state) return;
        if (state.index >= QUESTIONS) finish();
        else nextQuestion();
      }, isRight ? 1150 : 1750);
    }

    function finish() {
      if (!state) return;
      timer.stop();
      G.tts.cancel();
      const elapsed = timer.elapsed();
      const isNew = api.saveScore({ score: state.score, time: elapsed });
      const accuracy = Math.round(state.correct / QUESTIONS * 100);

      let praise;
      if (state.correct === QUESTIONS) praise = "12 个词都听准了，辨音很稳。";
      else if (state.correct >= 9) praise = "大部分尾音都抓住了，继续保持。";
      else praise = "先听清音节数，再看选项里的拼写差异，会更容易选对。";

      stage.innerHTML = `
        <div class="lzg-result">
          <p class="lzg-result-kicker">听音选词 · 完成</p>
          <p class="lzg-result-score">${state.score}<small>分</small></p>
          ${isNew ? '<span class="lzg-result-new">新的最佳成绩</span>' : ""}
          <p class="lzg-result-note">${praise}</p>
          <div class="lzg-result-stats">
            <div class="lzg-result-stat"><b>${state.correct} / ${QUESTIONS}</b><span>听对</span></div>
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

      if (event.target.closest("[data-speak]")) {
        speakCurrent();
        return;
      }

      const switchBtn = event.target.closest("[data-switch]");
      if (switchBtn) {
        if (!state || state.answered) return;
        G.tts.cancel();
        state.mode = state.mode === "tts" ? "ipa" : "tts";
        setTip(state.mode === "ipa" ? "已切换到音标模式" : "再试一次语音播放");
        renderQuestion();
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
    id: "listen",
    title: "听音选词",
    tagline: "听英文发音，从四个单词里找出它",
    desc: "12 题 · 自动朗读，无语音时改用音标",
    icon: ICON,
    mount: mount
  });
})();
