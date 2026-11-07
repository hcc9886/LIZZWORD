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

  function pickVoice(lang) {
    const list = voices.length ? voices : refresh();
    if (!list.length) return null;
    const want = String(lang || "en-US").toLowerCase();
    const base = want.split("-")[0];
    return list.find(function (v) { return String(v.lang || "").toLowerCase() === want; })
      || list.find(function (v) { return /^en[-_]us/i.test(v.lang || ""); })
      || list.find(function (v) { return /^en[-_]gb/i.test(v.lang || ""); })
      || list.find(function (v) { return String(v.lang || "").toLowerCase().indexOf(base) === 0; })
      || null;
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
    const value = String(text == null ? "" : text);
    if (!value) {
      if (opts.onFail) opts.onFail("empty");
      return false;
    }

    let busy = false;
    try { busy = Boolean(synth.speaking || synth.pending); } catch (e) { /* ignore */ }
    cancel();
    resume();
    refresh();

    let settled = false;
    let started = false;
    let ended = false;
    let startTimer = 0;
    let endTimer = 0;

    function clearTimers() {
      if (startTimer) {
        window.clearTimeout(startTimer);
        startTimer = 0;
      }
      if (endTimer) {
        window.clearTimeout(endTimer);
        endTimer = 0;
      }
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
      endTimer = window.setTimeout(deliverEnd, opts.endTimeout || 3000);
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
    cancel: cancel,
    refresh: refresh,
    hasEnglishVoice: function () { return Boolean(pickVoice("en-US")); }
  };

  hookVoices();
  refresh();
})();
