/* ============================================================
   LIZZWORD · 学习事件（本地埋点 + 周报复用）
   事件结构：{ t: 类型, at: ISO 时间, ...字段 }
   只存最近 3000 条，超出自动丢弃最旧的。
   ============================================================ */
(function (global) {
  "use strict";

  const KEY = "lizzword_events_v1";
  const MAX = 3000;

  function read() {
    try {
      const raw = global.localStorage && global.localStorage.getItem(KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function write(list) {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
    } catch (e) { /* 存储满时静默丢弃 */ }
  }

  function track(type, payload) {
    if (!type) return null;
    const event = Object.assign({ t: String(type), at: new Date().toISOString() }, payload || {});
    const list = read();
    list.push(event);
    write(list);
    return event;
  }

  function dayKey(iso) {
    return String(iso || "").slice(0, 10);
  }

  function summary(days) {
    const span = Number(days) || 7;
    const since = Date.now() - span * 86400000;
    const list = read().filter((event) => {
      const time = new Date(event.at).getTime();
      return Number.isFinite(time) && time >= since;
    });
    const byDay = {};
    const byType = {};
    let answers = 0;
    let correct = 0;
    for (const event of list) {
      const key = dayKey(event.at);
      byDay[key] = (byDay[key] || 0) + 1;
      byType[event.t] = (byType[event.t] || 0) + 1;
      if (event.t === "answer") {
        answers += 1;
        if (event.correct) correct += 1;
      }
    }
    return {
      total: list.length,
      byDay,
      byType,
      answers,
      correct,
      accuracy: answers ? Math.round((correct / answers) * 100) : 0,
      days: span
    };
  }

  global.LZEvents = { KEY, track, summary, read };
})(typeof window !== "undefined" ? window : globalThis);
