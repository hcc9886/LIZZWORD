/* ============================================================
   小游戏四 · 听音选词（Listen & Choose）
   用 speechSynthesis 朗读英文单词，从四个英文单词里选出听到的那个。
   首题由用户点击喇叭触发朗读（保证用户手势），之后自动朗读。
   朗读失败时给出明确提示并提供「跳过本题」，界面上不出现音标。
   12 题一局。
   ============================================================ */
(function () {
  "use strict";

  const G = window.LZG;
  if (!G) return;

  // 统一走 window.LZSpeech；未加载时直接按「语音不可用」处理，不再回落到旧 G.tts
  const voice = window.LZSpeech || null;

  function voiceOk() {
    return Boolean(voice && voice.supported());
  }

  function voiceStop() {
    if (voice) voice.cancel();
  }

  function voiceRead(text, opts) {
    opts = opts || {};
    if (!voice) {
      if (opts.onFail) opts.onFail("unsupported");
      return false;
    }
    opts.lang = "en-US";
    opts.rate = 0.88;
    // 真机上首次朗读可能被策略延迟，超时放宽到 3 秒，避免还没出声就判失败
    opts.timeout = 3000;
    opts.endTimeout = 2500;
    return voice.speak(text, opts);
  }

  // 把底层失败原因翻译成用户能看懂、能照着操作的提示
  function voiceFailText(reason) {
    const value = String(reason || "");
    if (value === "not-allowed") {
      return "浏览器暂时拦了自动播放，请再点一下喇叭；仍无声可检查手机静音开关。";
    }
    if (value === "unsupported") {
      return "当前浏览器不支持语音朗读，可以点「跳过本题」继续。";
    }
    if (value === "language-unavailable" || value === "voice-unavailable") {
      return "系统没有可用的英文语音包，可点喇叭重试，或跳过本题。";
    }
    if (value === "audio-busy" || value === "audio-hardware" || value === "synthesis-failed" || value === "synthesis-unavailable") {
      return "语音播放失败，请检查设备声音后点喇叭重试，或跳过本题。";
    }
    if (value === "timeout") {
      return "没有听到声音：可能缺少英文语音包，或手机静音/音量过低。点喇叭重试，或跳过本题。";
    }
    return "没有听到语音，点喇叭重试，或跳过本题。";
  }

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
      voiceStop();

      const hasTts = voiceOk();
      stage.innerHTML = `
        <div class="lzg-intro">
          <div class="lzg-intro-icon">${ICON}</div>
          <h2>听发音，选出这个单词</h2>
          <p class="lzg-intro-lead">
            第一题请先点一下圆形喇叭听发音，之后会继续自动朗读。
            听不清可以随时重听；如果设备没有声音，可以点「跳过本题」继续。
          </p>
          <ul class="lzg-rules">
            <li>一局 12 题，点圆形喇叭即可重听。</li>
            <li>连续答对累积连击，得分逐题提高。</li>
            <li>${hasTts ? "本机语音合成接口可用；若没有声音，可点「跳过本题」继续。" : "本机暂未检测到语音合成，进入后可点「跳过本题」继续。"}</li>
          </ul>
          <div class="lzg-intro-actions">
            <button type="button" class="lzg-btn lzg-btn-primary" data-start>开始游戏</button>
          </div>
        </div>`;
    }

    function begin() {
      if (timer) timer.stop();
      clearLater();
      voiceStop();

      state = {
        roundId: G.newRoundId("listen"),
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
        // 首题不自动朗读：必须有真实点击，后续题才允许自动读
        autoRead: false,
        failNotified: false
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

      const needsTap = !state.autoRead;

      stage.innerHTML = hudMarkup() + `
        <div class="lzg-listen-card">
          <p class="lzg-listen-label">听发音，选出正确的单词</p>
          <button type="button" class="lzg-listen-orb" data-speak aria-label="点击听音">${SPEAKER}</button>
          <p class="lzg-listen-hint">${needsTap
            ? "先点一下上方喇叭听发音；听不到可以跳过本题。"
            : "没听清可以重复播放，反复听清尾音更容易分辨。"}</p>
          <button type="button" class="lzg-listen-fallback" data-skip>跳过本题</button>
        </div>
        <div class="lzg-options lzg-listen-options" data-options>
          ${state.options.map(function (item, index) {
            return `
              <button type="button" class="lzg-option" data-opt="${index}">
                ${G.escapeHtml(item.word)}
              </button>`;
          }).join("")}
        </div>
        <p class="lzg-tip" data-tip aria-live="polite">${needsTap
          ? "点击喇叭听发音"
          : "点击圆形按钮可以重听"}</p>`;

      if (state.autoRead && !state.answered) {
        // 用户已经用真实点击听过一次，后续题可以自动朗读
        later(speakCurrent, 60);
      }
    }

    function speakCurrent() {
      if (!state || state.answered) return;

      const orb = stage.querySelector("[data-speak]");
      if (orb) orb.classList.add("is-playing");

      voiceRead(state.word.word, {
        onStart: function () {
          if (!state) return;
          state.autoRead = true;
          if (orb) orb.classList.add("is-playing");
          const hint = stage.querySelector(".lzg-listen-hint");
          if (hint) hint.textContent = "没听清可以重复播放，反复听清尾音更容易分辨。";
          setTip("点击圆形按钮可以重听");
        },
        onEnd: function () {
          if (orb) orb.classList.remove("is-playing");
        },
        onFail: function (reason) {
          if (orb) orb.classList.remove("is-playing");
          if (!state || state.answered) return;
          if (reason === "canceled" || reason === "interrupted") return;
          // 失败后不再自动朗读，下一题必须由用户点击，避免连续静默失败
          state.autoRead = false;
          const hint = stage.querySelector(".lzg-listen-hint");
          if (hint) hint.textContent = "点一下上方喇叭重试；听不到可以点「跳过本题」。";
          const text = voiceFailText(reason);
          setTip(text, "bad");
          if (!state.failNotified) {
            state.failNotified = true;
            api.toast(text, 3000);
          }
        }
      });
    }

    function nextQuestion() {
      if (!state) return;
      if (state.index >= QUESTIONS) {
        finish();
        return;
      }

      // 切题先停掉上一句，避免叠音
      voiceStop();

      state.index++;
      state.answered = false;
      state.locked = false;

      const word = pickWord();
      state.word = word;
      state.options = G.quiz(word, "listen").options;

      renderQuestion();
    }

    // 不依赖语音的兜底：跳过本题，比赛继续，界面上不出现音标
    function skipQuestion() {
      if (!state || state.locked || state.answered) return;
      state.answered = true;
      state.locked = true;
      voiceStop();
      Array.prototype.forEach.call(stage.querySelectorAll("[data-opt]"), function (btn) {
        btn.disabled = true;
      });
      setTip("已跳过本题，进入下一题", "bad");
      later(function () {
        if (!state) return;
        if (state.index >= QUESTIONS) finish();
        else nextQuestion();
      }, 600);
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
          `${G.escapeHtml(state.word.zh)}`;
        card.appendChild(reveal);
      }

      // 作答点击本身也是用户手势，再补读一次答案
      voiceRead(state.word.word);

      later(function () {
        if (!state) return;
        if (state.index >= QUESTIONS) finish();
        else nextQuestion();
      }, isRight ? 1150 : 1750);
    }

    function finish() {
      if (!state) return;
      timer.stop();
      voiceStop();
      const elapsed = timer.elapsed();
      const isNew = api.saveScore({ score: state.score, time: elapsed });
      const accuracy = Math.round(state.correct / QUESTIONS * 100);
      const reward = G.awardPoints("listen", state.roundId, accuracy);

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
          ${G.rewardBlock(reward)}
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

      if (event.target.closest("[data-skip]")) {
        skipQuestion();
        return;
      }

      const option = event.target.closest("[data-opt]");
      if (option) choose(Number(option.dataset.opt));
    });

    renderIntro();

    return function () {
      clearLater();
      if (timer) timer.stop();
      voiceStop();
    };
  }

  G.register({
    id: "listen",
    title: "听音选词",
    tagline: "听英文发音，从四个单词里找出它",
    desc: "12 题 · 点击听音，听不到可跳过",
    icon: ICON,
    mount: mount
  });
})();
