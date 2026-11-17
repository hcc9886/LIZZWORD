/* ============================================================
   LIZZWORD · 单词小游戏核心
   词池优先取主程序写下的词书快照（lizzword_games_bridge_v1）：
   已学词 → 本书全部词 → games-words.js 内联兜底，难度跟随背词进度。
   成绩写入独立的 lizzword_games_v1，不触碰主程序与 Lizz 的状态键。
   ============================================================ */
(function () {
  "use strict";

  const RAW = window.LIZZWORD_GAME_WORDS || [];
  const STORE_KEY = "lizzword_games_v1";
  const BRIDGE_KEY = "lizzword_games_bridge_v1";
  const GAMES = [];

  // 低于这个可玩词量就退回上一级范围，否则一局里全是重复词
  const MIN_SCOPE_WORDS = 8;
  const MODE_MIN = { all: 4, match: 6, scramble: 4, flash: 4, listen: 4 };

  function normalizeRows(list) {
    const seen = Object.create(null);
    const rows = [];
    (Array.isArray(list) ? list : []).forEach(function (item) {
      if (!item || !item.word || !item.zh) return;
      const word = String(item.word).trim();
      const zh = String(item.zh).trim();
      if (!word || !zh || word.length > 24 || /[一-龥]/.test(word)) return;
      const key = word.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      rows.push({ word: word, ipa: item.ipa || "", zh: zh });
    });
    return rows;
  }

  function readBridge() {
    try {
      const raw = window.localStorage.getItem(BRIDGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.v !== 1 || !Array.isArray(data.words)) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  const builtinWords = normalizeRows(RAW);
  const bridge = readBridge();
  const bookWords = bridge ? normalizeRows(bridge.words) : [];
  const learnedSet = Object.create(null);
  (bridge && Array.isArray(bridge.learned) ? bridge.learned : []).forEach(function (word) {
    learnedSet[String(word).toLowerCase()] = true;
  });
  const learnedWords = bookWords.filter(function (item) {
    return learnedSet[item.word.toLowerCase()];
  });

  let scope = "builtin";
  let words = builtinWords;
  if (learnedWords.length >= MIN_SCOPE_WORDS) {
    scope = "learned";
    words = learnedWords;
  } else if (bookWords.length >= MIN_SCOPE_WORDS) {
    scope = "book";
    words = bookWords;
  }

  const context = {
    bookId: scope === "builtin" ? "" : String(bridge.bookId || ""),
    bookName: scope === "builtin" ? "" : String(bridge.bookName || ""),
    scope: scope,
    learnedCount: learnedWords.length,
    bookCount: bookWords.length,
    totalCount: words.length,
    playable: {}
  };

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
  // 中文释义在当前词池内唯一的词，才能安全用于「英文↔中文」配对。
  const zhCount = {};
  words.forEach(function (item) {
    zhCount[item.zh] = (zhCount[item.zh] || 0) + 1;
  });

  // 词量不够时放宽外观限制（长度），但绝不放宽配对所需的释义唯一性
  function fit(strict, relaxed, mode) {
    return strict.length >= MODE_MIN[mode] ? strict : relaxed;
  }

  const uniqueZh = words.filter(function (item) {
    return zhCount[item.zh] === 1;
  });

  // 字母重组要把单词拆成字母块，只有纯字母词条能进这一池；
  // 题面只给中文释义，所以释义必须唯一，否则 accept / acceptance 都算对
  const spellable = words.filter(function (item) {
    return /^[A-Za-z]+$/.test(item.word) && zhCount[item.zh] === 1;
  });

  const pools = {
    all: byWord(words),
    match: byWord(fit(uniqueZh.filter(function (item) {
      return item.zh.length <= 6 && item.word.length <= 10;
    }), uniqueZh.filter(function (item) {
      return item.zh.length <= 12 && item.word.length <= 16;
    }), "match")),
    scramble: byWord(fit(spellable.filter(function (item) {
      return item.word.length >= 4 && item.word.length <= 10;
    }), spellable.filter(function (item) {
      return item.word.length >= 3 && item.word.length <= 14;
    }), "scramble")),
    flash: byWord(fit(words.filter(function (item) {
      return item.zh.length <= 8;
    }), words, "flash")),
    listen: byWord(fit(words.filter(function (item) {
      return item.zh.length <= 8;
    }), words, "listen"))
  };

  Object.keys(MODE_MIN).forEach(function (mode) {
    context.playable[mode] = pools[mode].length >= MODE_MIN[mode];
  });

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

  /* ---------- 积分奖励（写入 Lizz 商店同一账户） ---------- */
  const LIZZ_KEY = (typeof window.LIZZWORD_LIZZ_KEY === "string" && window.LIZZWORD_LIZZ_KEY)
    ? window.LIZZWORD_LIZZ_KEY
    : "lizzword_lizz_v1";
  const MAX_LEDGER = 30;
  const GAME_PASS_RATE = 80;
  const GAME_POINTS = 10;

  function todayKey() {
    const d = new Date();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }

  function readLizzFull() {
    try {
      const raw = localStorage.getItem(LIZZ_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (e) { /* ignore */ }
    return {};
  }

  function shopPoints(shop) {
    const n = Math.floor(Number(shop && shop.points) || 0);
    return Math.max(0, Math.min(999999, n));
  }

  function getShopPoints() {
    return shopPoints(readLizzFull().shop);
  }

  // 读盘 → 累加 → 立即写盘，保留其它字段，避免覆盖已有积分/装扮
  function addShopPoints(amount) {
    const full = readLizzFull();
    const shop = full.shop && typeof full.shop === "object" ? full.shop : {};
    const before = shopPoints(shop);
    const next = Math.min(999999, before + amount);
    // 商店余额＝累计获得 − 累计花掉：只写 points 会在下次归一化时被抹掉，
    // 所以已有累计值的存档必须同步抬高 earned（旧存档留给商店模块迁移）
    if (shop.earned != null || shop.spent != null) {
      const spent = Math.max(0, Math.floor(Number(shop.spent) || 0));
      const earned = Math.max(0, Math.floor(Number(shop.earned) || 0));
      shop.spent = spent;
      shop.earned = Math.min(9999999, Math.max(earned + (next - before), next + spent));
    }
    shop.points = next;

    const ledger = Array.isArray(shop.ledger)
      ? shop.ledger.filter(function (row) {
          return row && typeof row === "object" && Number(row.amount) > 0;
        })
      : [];
    ledger.push({
      at: Date.now(),
      date: todayKey(),
      type: "games",
      amount: amount
    });
    shop.ledger = ledger.slice(-MAX_LEDGER);

    full.shop = shop;
    if (typeof full.v === "undefined") full.v = 1;
    full.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(LIZZ_KEY, JSON.stringify(full));
    } catch (e) {
      /* 隐私模式或容量不足时静默降级 */
    }
    try {
      document.dispatchEvent(new CustomEvent("lizzword:shop-changed", {
        detail: { points: next }
      }));
    } catch (e) { /* ignore */ }
    return next;
  }

  function newRoundId(gameId) {
    return String(gameId || "game") + "-" + Date.now().toString(36) + "-" +
      Math.random().toString(36).slice(2, 8);
  }

  // 达到 80% 才加 10 分；同一局（roundId）只发一次，不扣分
  function awardPoints(gameId, roundId, accuracy) {
    const rate = Math.max(0, Math.min(100, Math.round(Number(accuracy) || 0)));
    const qualified = rate >= GAME_PASS_RATE;
    const data = readStore();
    const last = data.lastReward && typeof data.lastReward === "object" ? data.lastReward : null;
    const total = getShopPoints();

    if (!qualified) {
      data.lastReward = {
        gameId: gameId,
        roundId: roundId,
        rate: rate,
        qualified: false,
        points: 0,
        at: Date.now()
      };
      writeStore(data);
      return { qualified: false, rate: rate, points: 0, total: total, duplicate: false };
    }

    if (last && last.roundId === roundId && last.qualified) {
      return { qualified: true, rate: rate, points: 0, total: total, duplicate: true };
    }

    const next = addShopPoints(GAME_POINTS);
    data.lastReward = {
      gameId: gameId,
      roundId: roundId,
      rate: rate,
      qualified: true,
      points: GAME_POINTS,
      at: Date.now()
    };
    writeStore(data);
    return { qualified: true, rate: rate, points: GAME_POINTS, total: next, duplicate: false };
  }

  function rewardBlock(reward) {
    if (!reward) return "";
    if (!reward.qualified) {
      return `<div class="lzg-result-reward">` +
        `<b>未达标</b> · 本局正确率 ${reward.rate}%，低于 80%，本局不加分 · ` +
        `当前总积分 <b>${reward.total}</b></div>`;
    }
    if (reward.duplicate) {
      return `<div class="lzg-result-reward is-qualified">` +
        `<b>已达标</b> · 本局正确率 ${reward.rate}%，10 积分已领取，不重复发放 · ` +
        `当前总积分 <b>${reward.total}</b></div>`;
    }
    return `<div class="lzg-result-reward is-qualified">` +
      `<b>已达标</b> · 本局正确率 ${reward.rate}%，奖励 <b>+${reward.points}</b> 积分 · ` +
      `当前总积分 <b>${reward.total}</b></div>`;
  }

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
    context: context,
    modeMin: MODE_MIN,
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
    newRoundId: newRoundId,
    awardPoints: awardPoints,
    rewardBlock: rewardBlock,
    getShopPoints: getShopPoints,
    tts: tts,
    toast: toast,
    register: register,
    games: games
  };
})();
