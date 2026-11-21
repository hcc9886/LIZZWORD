/* ============================================================
   LIZZWORD · 语音朗读统一封装
   解决四类「点了没声音」的常见问题：
   1. 首次点击时 getVoices() 仍为空：保留 lang，并在 voiceschanged 后刷新；
   2. iOS/Safari 语音队列默认 paused：在用户手势内 resume；
   3. Chrome 的 cancel() → speak() 同步竞态会吞掉新语音：忙时推迟一拍再 speak；
   4. 出错/超时静默失败：通过 onFail 回调交给调用方给出明确提示。
   无语音库时仍会尝试用 lang 朗读，真正失败则由调用方降级。
   ============================================================ */
(function () {
  "use strict";

  const synth = typeof window !== "undefined" && "speechSynthesis" in window
    ? window.speechSynthesis
    : null;
  const Utterance = typeof window !== "undefined" ? window.SpeechSynthesisUtterance : null;

  let voices = [];
  let hooked = false;

  // ------------------------------------------------------------
  // 语速 / 口音偏好（localStorage 持久化，主页面与游戏页共用）
  // ------------------------------------------------------------
  const PREFS_KEY = "lizzword_speech_v1";
  const DEFAULT_PREFS = { rate: 0.9, accent: "us", voiceName: "" };

  function getPrefs() {
    const out = { rate: DEFAULT_PREFS.rate, accent: DEFAULT_PREFS.accent, voiceName: DEFAULT_PREFS.voiceName };
    try {
      const raw = window.localStorage && window.localStorage.getItem(PREFS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) || {};
        if (typeof saved.rate === "number" && saved.rate >= 0.5 && saved.rate <= 1.5) out.rate = saved.rate;
        if (saved.accent === "uk" || saved.accent === "us") out.accent = saved.accent;
        if (typeof saved.voiceName === "string") out.voiceName = saved.voiceName;
      }
    } catch (e) { /* localStorage 不可用时退回默认值 */ }
    return out;
  }

  function setPrefs(patch) {
    const next = getPrefs();
    if (patch) {
      if (typeof patch.rate === "number") {
        next.rate = Math.min(1.5, Math.max(0.5, patch.rate));
      }
      if (patch.accent === "uk" || patch.accent === "us") next.accent = patch.accent;
      if (typeof patch.voiceName === "string") next.voiceName = patch.voiceName;
    }
    try {
      if (window.localStorage) window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch (e) { /* ignore */ }
    return next;
  }

  function accentLang(accent) {
    return accent === "uk" ? "en-GB" : "en-US";
  }

  function supported() {
    return Boolean(synth && typeof Utterance === "function");
  }

  function refresh() {
    if (!synth) return [];
    try {
      voices = synth.getVoices() || [];
    } catch (e) {
      voices = [];
    }
    return voices;
  }

  function hookVoices() {
    if (!synth || hooked) return;
    hooked = true;
    try {
      if (typeof synth.addEventListener === "function") {
        synth.addEventListener("voiceschanged", refresh);
      } else {
        synth.onvoiceschanged = refresh;
      }
    } catch (e) { /* ignore */ }
  }

  // 语音包质量打分：优先自然音/神经音，排掉系统里的搞怪音与朗读腔很重的老音库
  const GOOD_VOICE = [
    "natural", "neural", "premium", "enhanced", "siri", "google",
    "samantha", "aria", "jenny", "ava", "allison", "serena", "daniel", "karen", "moira", "tessa", "oliver", "libby", "sonia", "ryan"
  ];
  const BAD_VOICE = [
    "zarvox", "trinoids", "whisper", "bells", "boing", "bubbles", "cellos", "bahh",
    "jester", "organ", "superstar", "wobble", "albert", "bad news", "good news",
    "ralph", "fred", "kathy", "grandma", "grandpa", "rocko", "shelley", "flo", "eddy", "reed"
  ];

  function scoreVoice(voice, lang) {
    const name = String(voice.name || "").toLowerCase();
    const vlang = String(voice.lang || "").toLowerCase();
    const want = String(lang || "en-US").toLowerCase();
    const base = want.split("-")[0];
    let score = 0;
    if (vlang === want) score += 100;
    else if (vlang.indexOf(base) === 0) score += 40;
    for (const hint of GOOD_VOICE) if (name.indexOf(hint) >= 0) score += 35;
    for (const hint of BAD_VOICE) if (name.indexOf(hint) >= 0) score -= 120;
    if (voice.localService) score += 5; // 本地音库更稳，断网也能读
    if (voice.default) score += 8;
    return score;
  }

  function pickVoice(lang) {
    const list = voices.length ? voices : refresh();
    if (!list.length) return null;
    const want = String(lang || "en-US").toLowerCase();
    const base = want.split("-")[0];
    const saved = getPrefs().voiceName;
    if (saved) {
      const chosen = list.find(function (v) { return String(v.name || "") === saved; });
      if (chosen) return chosen;
    }
    const candidates = list.filter(function (v) {
      const vlang = String(v.lang || "").toLowerCase();
      if (base === "en") return vlang.indexOf("en") === 0;
      return vlang.indexOf(base) === 0;
    });
    if (!candidates.length) return null;
    let best = null;
    let bestScore = -Infinity;
    for (const voice of candidates) {
      const score = scoreVoice(voice, want);
      if (score > bestScore) {
        best = voice;
        bestScore = score;
      }
    }
    return best;
  }

  function resume() {
    if (!synth) return;
    try {
      if (synth.paused) synth.resume();
    } catch (e) { /* ignore */ }
  }

  // 第一次点按/触摸时解锁：Safari 只有在用户手势里 resume 后才会出声
  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("pointerdown", resume, { passive: true });
  }

  // 兜底结束时间按文本长度估算，避免长句才读了一半就被判定结束
  function estimateMs(text, rate) {
    const words = String(text).trim().split(/\s+/).filter(Boolean).length;
    const chars = String(text).length;
    const spoken = Math.max(words * 420, chars * 55);
    return Math.min(90000, Math.max(3000, Math.round(spoken / (rate || 0.9)) + 1200));
  }

  function cancelSynth() {
    if (!synth) return;
    try { synth.cancel(); } catch (e) { /* ignore */ }
  }

  // 朗读队列：speakSequence 一次只跑一条，单条失败继续下一条，只有用户主动取消才整体停
  let seqToken = 0;
  let seqStop = null;

  function stopActiveSeq() {
    seqToken += 1;
    if (seqStop) {
      const stop = seqStop;
      seqStop = null;
      try { stop(); } catch (e) { /* ignore */ }
    }
  }

  function cancel() {
    stopActiveSeq();
    cancelSynth();
  }

  function speakSequence(items, opts) {
    opts = opts || {};
    const list = (Array.isArray(items) ? items : [])
      .map(function (it) { return typeof it === "string" ? { text: it } : it; })
      .filter(function (it) { return it && String(it.text == null ? "" : it.text).trim(); });

    cancel();
    if (!supported()) {
      if (opts.onFail) opts.onFail("unsupported");
      return false;
    }
    if (!list.length) {
      if (opts.onFail) opts.onFail("empty");
      return false;
    }

    const token = seqToken;
    const prefs = getPrefs();
    let index = 0;
    let stopped = false;
    seqStop = function () { stopped = true; };

    function finish() {
      seqStop = null;
      if (opts.onAllEnd) opts.onAllEnd();
    }

    function step() {
      if (stopped || token !== seqToken) return;
      if (index >= list.length) { finish(); return; }
      const item = list[index];
      const at = index;
      index += 1;
      if (opts.onItemStart) opts.onItemStart(item, at);

      const rate = typeof item.rate === "number"
        ? item.rate
        : (typeof opts.rate === "number" ? opts.rate : prefs.rate);

      speak(item.text, {
        _seq: true,
        lang: item.lang || opts.lang || "en-US",
        rate: rate,
        pitch: typeof item.pitch === "number" ? item.pitch : opts.pitch,
        timeout: item.timeout || opts.timeout,
        endTimeout: item.endTimeout || opts.endTimeout,
        onStart: function () { if (opts.onStart) opts.onStart(item, at); },
        onEnd: function () {
          if (stopped || token !== seqToken) return;
          if (opts.onItemEnd) opts.onItemEnd(item, at);
          step();
        },
        onFail: function (reason) {
          if (stopped || token !== seqToken) return;
          if (opts.onItemFail) opts.onItemFail(reason, item, at);
          if (reason === "empty") { step(); return; }
          if (opts.onFail) opts.onFail(reason, item, at);
          step();
        }
      });
    }

    step();
    return true;
  }

  // 长句按标点切成小段再依次朗读，句子之间自然停顿，听起来不像一口气念完
  function splitSentences(text, maxLen) {
    const limit = maxLen || 120;
    const value = String(text || "").trim();
    if (value.length <= limit) return [value];
    const parts = value.split(/(?<=[.!?;:,\u3002\uff0c\uff1b\uff1a])\s*/);
    const out = [];
    let buffer = "";
    for (const part of parts) {
      if (!part) continue;
      const joined = buffer ? buffer.replace(/\s+$/, "") + " " + part : part;
      if (joined.length > limit && buffer) {
        out.push(buffer.trim());
        buffer = part;
      } else {
        buffer = joined;
      }
    }
    if (buffer.trim()) out.push(buffer.trim());
    return out.filter(Boolean);
  }

  function speakNatural(text, opts) {
    opts = opts || {};
    const chunks = splitSentences(text, opts.maxLen || 120);
    if (chunks.length <= 1) return speak(text, opts);
    return speakSequence(chunks.map(function (chunk) {
      return { text: chunk, lang: opts.lang, rate: opts.rate, pitch: opts.pitch };
    }), {
      rate: opts.rate,
      lang: opts.lang,
      onStart: opts.onStart,
      onAllEnd: opts.onEnd,
      onFail: opts.onFail
    });
  }

  function speak(text, opts) {
    opts = opts || {};
    // 直接点单个朗读时打断整条队列；队列内部调用带 _seq 标记，不会打断自己
    if (!opts._seq) stopActiveSeq();
    if (!supported()) {
      if (opts.onFail) opts.onFail("unsupported");
      return false;
    }
    const value = String(text == null ? "" : text);
    if (!value) {
      if (opts.onFail) opts.onFail("empty");
      return false;
    }

    let busy = false;
    try { busy = Boolean(synth.speaking || synth.pending); } catch (e) { /* ignore */ }
    cancelSynth();
    resume();
    refresh();

    let settled = false;
    let started = false;
    let ended = false;
    let startTimer = 0;
    let endTimer = 0;
    let keepAlive = 0;

    // Chrome 会在约 15 秒后静默停掉长句朗读，靠周期性 resume 续命
    function startKeepAlive() {
      if (keepAlive || !synth) return;
      keepAlive = window.setInterval(function () {
        let speaking = false;
        try { speaking = Boolean(synth.speaking); } catch (e) { /* ignore */ }
        if (!speaking) { stopKeepAlive(); return; }
        resume();
      }, 10000);
    }

    function stopKeepAlive() {
      if (keepAlive) {
        window.clearInterval(keepAlive);
        keepAlive = 0;
      }
    }

    function clearTimers() {
      if (startTimer) {
        window.clearTimeout(startTimer);
        startTimer = 0;
      }
      if (endTimer) {
        window.clearTimeout(endTimer);
        endTimer = 0;
      }
      stopKeepAlive();
    }

    function deliverEnd() {
      if (ended) return;
      ended = true;
      clearTimers();
      if (opts.onEnd) opts.onEnd();
    }

    function startedOk() {
      if (settled) return;
      settled = true;
      started = true;
      if (startTimer) {
        window.clearTimeout(startTimer);
        startTimer = 0;
      }
      // 有些浏览器会触发 onstart 却始终没有 onend，让按钮不能一直卡在“朗读中”
      // 调用方给的固定上限只作下限，长文本按长度估算，否则句子读一半就被判定结束
      const estimate = estimateMs(value, opts.rate);
      const floorMs = Number(opts.endTimeout) || 0;
      endTimer = window.setTimeout(deliverEnd, Math.max(floorMs, estimate));
      startKeepAlive();
      if (opts.onStart) opts.onStart();
    }

    function fail(reason) {
      if (settled) return;
      settled = true;
      clearTimers();
      if (opts.onFail) opts.onFail(reason);
    }

    function start() {
      resume();
      let utter;
      try {
        utter = new Utterance(value);
      } catch (e) {
        fail("exception");
        return;
      }
      utter.lang = opts.lang || "en-US";
      utter.rate = opts.rate || 0.9;
      utter.pitch = typeof opts.pitch === "number" ? opts.pitch : 1;
      utter.volume = 1;
      const voice = pickVoice(utter.lang);
      if (voice) utter.voice = voice;

      utter.onstart = startedOk;
      utter.onend = function () {
        if (!started) startedOk();
        deliverEnd();
      };
      utter.onerror = function (event) {
        fail((event && event.error) || "error");
      };

      try {
        synth.speak(utter);
      } catch (e) {
        fail("exception");
        return;
      }

      startTimer = window.setTimeout(function () {
        if (!settled) fail("timeout");
      }, opts.timeout || 1800);
    }

    // cancel 与 speak 同步执行时，Chrome 偶尔会把新语音直接吞掉
    if (busy) {
      window.setTimeout(start, 80);
    } else {
      start();
    }
    return true;
  }

  window.LZSpeech = {
    supported: supported,
    speak: speak,
    speakSequence: speakSequence,
    speakNatural: speakNatural,
    splitSentences: splitSentences,
    scoreVoice: scoreVoice,
    cancel: cancel,
    refresh: refresh,
    getPrefs: getPrefs,
    setPrefs: setPrefs,
    accentLang: accentLang,
    voices: function () { return (voices.length ? voices : refresh()).slice(); },
    voiceFor: pickVoice,
    estimateMs: estimateMs,
    hasEnglishVoice: function () { return Boolean(pickVoice("en-US")); }
  };

  hookVoices();
  refresh();
})();
