/* ============================================================
   LIZZWORD · 单词小游戏核心
   词池来自 games-words.js（脚本内联，不经过 fetch）。
   成绩写入独立的 lizzword_games_v1，不触碰主程序与 Lizz 的状态键。
   ============================================================ */
(function () {
  "use strict";

  const RAW = window.LIZZWORD_GAME_WORDS || [];
  const STORE_KEY = "lizzword_games_v1";
  const GAMES = [];

  const words = RAW.map(function (item) {
    return { word: item.word, ipa: item.ipa, zh: item.zh };
  }).filter(function (item) {
    return item.word && item.zh;
  });

  /* ---------- 基础工具 ---------- */
  function shuffle(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function sample(list, count) {
    return shuffle(list).slice(0, count);
  }

  function pickWords(pool, count) {
    return sample(pool, count);
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function formatTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function byWord(list) {
    return list.slice().sort(function (a, b) {
      return a.word.toLowerCase().localeCompare(b.word.toLowerCase());
    });
  }

  /* ---------- 词池 ---------- */
  // 中文释义在本词池内唯一的词，才能安全用于「英文↔中文」配对。
  const zhCount = {};
  words.forEach(function (item) {
    zhCount[item.zh] = (zhCount[item.zh] || 0) + 1;
  });

  const pools = {
    all: byWord(words),
    match: byWord(words.filter(function (item) {
      return zhCount[item.zh] === 1 && item.zh.length <= 6 && item.word.length <= 10;
    })),
    flash: byWord(words.filter(function (item) {
      return item.zh.length <= 8;
    }))
  };

  // 为一题生成若干个不重复、且中文释义不与正确答案重复的干扰项
  function optionsFor(correct, count, mode) {
    const pool = pools[mode] || pools.all;
    const picked = [];
    let guard = 0;
    while (picked.length < count && guard < pool.length * 6) {
      guard++;
      const item = pool[Math.floor(Math.random() * pool.length)];
      if (!item) continue;
      if (item.word.toLowerCase() === correct.word.toLowerCase()) continue;
      if (item.zh === correct.zh) continue;
      if (picked.some(function (p) { return p.word.toLowerCase() === item.word.toLowerCase(); })) continue;
      picked.push(item);
    }
    return picked;
  }

  function quiz(correct, mode) {
    const distractors = optionsFor(correct, 3, mode);
    return { options: shuffle([correct].concat(distractors)), answer: correct };
  }

  /* ---------- 计时器 ---------- */
  function createTimer(onTick) {
    let startedAt = 0;
    let accumulated = 0;
    let intervalId = 0;
    let running = false;

    function now() {
      return accumulated + (running ? (performance.now() - startedAt) : 0);
    }

    function tick() {
      if (typeof onTick === "function") onTick(now());
    }

    return {
      start: function () {
        if (running) return;
        running = true;
        startedAt = performance.now();
        intervalId = window.setInterval(tick, 250);
        tick();
      },
      stop: function () {
        if (!running) return;
        accumulated += performance.now() - startedAt;
        running = false;
        window.clearInterval(intervalId);
        tick();
      },
      elapsed: now
    };
  }

  /* ---------- 成绩存储 ---------- */
  function readStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return { version: 1, best: {} };
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return { version: 1, best: {} };
      if (!data.best || typeof data.best !== "object") data.best = {};
      return data;
    } catch (e) {
      return { version: 1, best: {} };
    }
  }

  function writeStore(data) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (e) {
      /* 隐私模式或容量不足时静默降级 */
    }
  }

  function getBest(id) {
    const data = readStore();
    const item = data.best[id];
    return item && typeof item === "object" ? item : null;
  }

  function saveBest(id, result) {
    const data = readStore();
    const prev = data.best[id];
    const isNew = !prev || result.score > (prev.score || 0);
    if (isNew) {
      data.best[id] = {
        score: result.score,
        time: result.time || 0,
        at: Date.now()
      };
      writeStore(data);
    }
    return isNew;
  }

  /* ---------- 语音合成 ---------- */
  const tts = (function () {
    const synth = typeof window !== "undefined" && "speechSynthesis" in window
      ? window.speechSynthesis
      : null;
    let voices = [];

    function loadVoices() {
      if (!synth) return [];
      try {
        voices = synth.getVoices() || [];
      } catch (e) {
        voices = [];
      }
      return voices;
    }

    function pickVoice() {
      if (!voices.length) loadVoices();
      const list = voices;
      const byLang = function (re) {
        return list.find(function (v) { return re.test(v.lang || ""); });
      };
      return byLang(/en[-_]US/i) || byLang(/en[-_]GB/i) || byLang(/en[-_]AU/i) || byLang(/^en/i) || null;
    }

    function supported() {
      if (!synth) return false;
      try {
        return typeof window.SpeechSynthesisUtterance === "function";
      } catch (e) {
        return false;
      }
    }

    function cancel() {
      if (!synth) return;
      try { synth.cancel(); } catch (e) { /* ignore */ }
    }

    function speak(text, opts) {
      opts = opts || {};
      if (!supported()) {
        if (opts.onFail) opts.onFail("unsupported");
        return false;
      }
      cancel();
      const utter = new window.SpeechSynthesisUtterance(String(text));
      utter.lang = "en-US";
      utter.rate = opts.rate || 0.9;
      utter.pitch = 1;
      utter.volume = 1;
      const voice = pickVoice();
      if (voice) utter.voice = voice;

      let settled = false;
      let timerId = 0;

      function startOk() {
        if (settled) return;
        settled = true;
        window.clearTimeout(timerId);
        if (opts.onStart) opts.onStart();
      }

      function fail(reason) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timerId);
        if (opts.onFail) opts.onFail(reason);
      }

      utter.onstart = startOk;
      utter.onerror = function () { fail("error"); };
      utter.onend = function () {
        if (!settled) startOk();
        if (opts.onEnd) opts.onEnd();
      };

      try {
        synth.speak(utter);
      } catch (e) {
        fail("exception");
        return false;
      }

      timerId = window.setTimeout(function () {
        if (!settled) fail("timeout");
      }, opts.timeout || 1600);

      return true;
    }

    if (synth) {
      loadVoices();
      if (typeof synth.addEventListener === "function") {
        synth.addEventListener("voiceschanged", loadVoices);
      } else {
        synth.onvoiceschanged = loadVoices;
      }
    }

    return {
      supported: supported,
      speak: speak,
      cancel: cancel,
      loadVoices: loadVoices
    };
  })();

  /* ---------- 浮动提示 ---------- */
  let toastTimer = 0;
  function toast(text, ms) {
    let node = document.querySelector(".lzg-toast");
    if (!node) {
      node = document.createElement("div");
      node.className = "lzg-toast";
      node.setAttribute("role", "status");
      document.body.appendChild(node);
    }
    node.textContent = text;
    node.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      node.classList.remove("is-on");
    }, ms || 1700);
  }

  /* ---------- 注册 ---------- */
  function register(game) {
    if (game && game.id) GAMES.push(game);
  }

  function games() {
    return GAMES.slice();
  }

  window.LZG = {
    words: words,
    pools: pools,
    shuffle: shuffle,
    sample: sample,
    pickWords: pickWords,
    optionsFor: optionsFor,
    quiz: quiz,
    escapeHtml: escapeHtml,
    formatTime: formatTime,
    createTimer: createTimer,
    getBest: getBest,
    saveBest: saveBest,
    tts: tts,
    toast: toast,
    register: register,
    games: games
  };
})();
