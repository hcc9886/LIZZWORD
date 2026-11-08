/* ============================================================
   LIZZWORD · 有效学习计时（独立模块）
   ------------------------------------------------------------
   问题：主页面原来用「开始时间戳 + 完成时 Date.now() 相减」算耗时，
   切后台、锁屏、回首页、关标签、刷新期间的时间都会被算进去。
   本模块改为「只累计可见且在学/复习视图内的活跃段」：
     - 本段时长只用 performance.now() 差值，不受系统时间调整影响；
     - 落盘只存毫秒差值（learnElapsedMs / reviewSession.elapsedMs），
       通过调用方传入的 save 回调写入，模块本身不直接碰 localStorage；
     - 页面隐藏 / pagehide / freeze 时暂停并结算，可见 / bfcache 恢复时继续；
     - 刷新或重开页面不沿用旧活跃段，关闭期间的时间不会被补进来。

   用法（在 loadState 之后、renderAll 之前调用一次）：
     window.LZStudyTimer.attach({
       getState: () => state,
       save: saveState,
       isStudyView: () => viewMode === "study",
       isReviewView: () => viewMode === "review"
     });

   约定状态字段：
     state.learnStartedMs        非 0 表示当前有活跃段（仅作标记，不参与时长计算）
     state.learnElapsedMs        已结算的新学有效毫秒数
     reviewSession.startMs       同上，复习活跃段标记
     reviewSession.elapsedMs     已结算的复习有效毫秒数
   ============================================================ */
(function () {
  "use strict";

  const api = {};

  let ctx = null;           // { getState, save, isStudyView, isReviewView }
  let attached = false;
  let learnSegPerf = null;  // 新学活跃段起点（performance.now），null = 当前无活跃段
  let reviewSegPerf = null; // 复习活跃段起点（performance.now），null = 当前无活跃段

  function now() {
    // 计时只认 performance.now()（单调递增，不受用户改系统时间影响）
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }

  function getState() {
    try {
      return ctx && typeof ctx.getState === "function" ? ctx.getState() : null;
    } catch (error) {
      return null;
    }
  }

  function persist() {
    if (ctx && typeof ctx.save === "function") ctx.save();
  }

  function visible() {
    if (typeof document === "undefined") return true;
    if (document.visibilityState) return document.visibilityState !== "hidden";
    return document.hidden !== true;
  }

  function reviewSession() {
    const state = getState();
    return state && state.reviewSession && typeof state.reviewSession === "object"
      ? state.reviewSession
      : null;
  }

  /* ---------- 新学 ---------- */

  function pauseLearn() {
    const state = getState();
    if (!state || !state.learnStartedMs) return Number(state && state.learnElapsedMs) || 0;

    const segment = learnSegPerf == null ? 0 : Math.max(0, now() - learnSegPerf);
    state.learnElapsedMs = (Number(state.learnElapsedMs) || 0) + segment;
    state.learnStartedMs = 0;
    learnSegPerf = null;
    persist();
    return state.learnElapsedMs;
  }

  function resumeLearn() {
    const state = getState();
    if (!state || state.learnStartedMs) return false;
    if (state.learnDebug || state.stage === "done") return false;
    if (!visible()) return false;
    if (!ctx || typeof ctx.isStudyView !== "function" || !ctx.isStudyView()) return false;
    if (!Array.isArray(state.learnWords) || !state.learnWords.length) return false;

    // 这里的非 0 值只是“有活跃段”的持久化标记，时长一律用 performance.now() 差值
    state.learnStartedMs = Date.now();
    learnSegPerf = now();
    persist();
    return true;
  }

  function learnDurationNow() {
    const state = getState();
    if (!state || state.learnDebug) return null;
    const base = Number(state.learnElapsedMs) || 0;
    const live = state.learnStartedMs && learnSegPerf != null ? Math.max(0, now() - learnSegPerf) : 0;
    return base + live;
  }

  /* ---------- 复习 ---------- */

  function pauseReview() {
    const session = reviewSession();
    if (!session || !session.startMs) return Number(session && session.elapsedMs) || 0;

    const segment = reviewSegPerf == null ? 0 : Math.max(0, now() - reviewSegPerf);
    session.elapsedMs = (Number(session.elapsedMs) || 0) + segment;
    session.startMs = 0;
    reviewSegPerf = null;
    persist();
    return session.elapsedMs;
  }

  function resumeReview() {
    const session = reviewSession();
    if (!session || session.startMs) return false;
    if (session.debug || session.summary) return false;
    if (!visible()) return false;
    if (!ctx || typeof ctx.isReviewView !== "function" || !ctx.isReviewView()) return false;

    session.startMs = Date.now();
    reviewSegPerf = now();
    persist();
    return true;
  }

  function reviewDurationNow() {
    const session = reviewSession();
    if (!session || session.debug) return null;
    const base = Number(session.elapsedMs) || 0;
    const live = session.startMs && reviewSegPerf != null ? Math.max(0, now() - reviewSegPerf) : 0;
    return base + live;
  }

  /* ---------- 页面生命周期 ---------- */

  function pauseAll() {
    pauseLearn();
    pauseReview();
  }

  function resumeAll() {
    resumeLearn();
    resumeReview();
  }

  function onVisibilityChange() {
    if (typeof document === "undefined") return;
    if (document.visibilityState === "hidden" || document.hidden === true) pauseAll();
    else resumeAll();
  }

  function onPageHide() {
    pauseAll();
  }

  function onPageShow(event) {
    // 只有从 bfcache 恢复才需要继续；正常加载由进入学习/复习视图时 resume
    if (event && event.persisted) resumeAll();
  }

  function onFreeze() {
    pauseAll();
  }

  // 刷新/重开后，落盘的“活跃段”没有对应的 performance 起点，一律丢弃；
  // 已结算的 elapsedMs 保留，因此关闭页面期间的时间永远不会被补进来。
  function dropStaleSegments() {
    const state = getState();
    if (!state) return;

    let changed = false;
    if (state.learnStartedMs && learnSegPerf == null) {
      state.learnStartedMs = 0;
      changed = true;
    }
    if (typeof state.learnElapsedMs !== "number" || !isFinite(state.learnElapsedMs) || state.learnElapsedMs < 0) {
      state.learnElapsedMs = Math.max(0, Number(state.learnElapsedMs) || 0);
      changed = true;
    }

    const session = state.reviewSession;
    if (session && typeof session === "object") {
      if (session.startMs && reviewSegPerf == null) {
        session.startMs = 0;
        changed = true;
      }
      if (typeof session.elapsedMs !== "number" || !isFinite(session.elapsedMs) || session.elapsedMs < 0) {
        session.elapsedMs = Math.max(0, Number(session.elapsedMs) || 0);
        changed = true;
      }
    }

    if (changed) persist();
  }

  function attach(options) {
    const opts = options || {};
    if (typeof opts.getState !== "function") {
      throw new TypeError("LZStudyTimer.attach 需要 getState 回调");
    }

    ctx = {
      getState: opts.getState,
      save: typeof opts.save === "function" ? opts.save : function () {},
      isStudyView: typeof opts.isStudyView === "function" ? opts.isStudyView : function () { return false; },
      isReviewView: typeof opts.isReviewView === "function" ? opts.isReviewView : function () { return false; }
    };

    if (!attached) {
      attached = true;
      if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
        document.addEventListener("visibilitychange", onVisibilityChange);
        document.addEventListener("freeze", onFreeze);
      }
      if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
        window.addEventListener("pagehide", onPageHide);
        window.addEventListener("pageshow", onPageShow);
      }
    }

    dropStaleSegments();
    return api;
  }

  api.attach = attach;
  api.pauseLearn = pauseLearn;
  api.resumeLearn = resumeLearn;
  api.pauseReview = pauseReview;
  api.resumeReview = resumeReview;
  api.learnDurationNow = learnDurationNow;
  api.reviewDurationNow = reviewDurationNow;

  if (typeof window !== "undefined") window.LZStudyTimer = api;
})();
