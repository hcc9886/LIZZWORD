/* ============================================================
   Lizz 角色 · 教程编排 · 主界面角落常驻
   - 教程由 Lizz 自我介绍后带入
   - 点一下：随机颜文字（30 种）
   - 连点 3 下：躲起来，背完 10 个单词后回到主界面
   - 连点 10 下：消失到第二天（本地日期）
   - 状态写在 lizzword_lizz_v1，绝不改动 lizzword_state_v1 的既有字段
   - 形象：内置简笔小狐狸 SVG；启用图片槽位后优先显示 books/lizz/lizz.png
   ============================================================ */
(function () {
  "use strict";

  const S = window.LIZZWORD_LIZZ_STATE;
  const TUT = window.LIZZWORD_TUTORIAL;
  if (!S || !TUT) {
    console.warn("[Lizz] 依赖模块未加载：请先引入 lizz-state.js 与 tutorial-flow.js");
    return;
  }

  // 图片槽位默认关闭，避免 file:// 下 lizz.png 不存在时控制台报 404；
  // 用 LIZZWORD_LIZZ.usePhoto() 永久启用，或 ?lizz-photo=1 临时启用。
  const DEFAULT_PHOTO_URL = S.DEFAULT_PHOTO_URL || "books/lizz/lizz.png";
  const PHOTO_URL = typeof S.photoUrl === "function" ? S.photoUrl() : "";

  const BURST_IDLE_MS = 1100;
  const SOFT_RULE_MS = 3800;
  const GONE_RULE_MS = 3200;
  const FADE_MS = 560;
  const TUTORIAL_DELAY_MS = 380;

  let state = null;
  let widget = null;
  let bubble = null;
  let bubbleTimer = null;
  let burst = 0;
  let burstTimer = null;
  let locked = false;
  let hiding = false;
  let tickTimer = null;
  let initialized = false;
  let autoTimer = null;
  let pendingBubble = null;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function randomOf(list) {
    if (!list || !list.length) return "";
    return list[Math.floor(Math.random() * list.length)];
  }

  /* ============================================================
     小狐狸 / 图片槽位
     ============================================================ */
  function buildWidget() {
    if (widget) return widget;
    const el = document.createElement("div");
    el.className = "lz-lizz";
    el.id = "lzLizz";
    el.hidden = true;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "Lizz，一只害羞的小狐狸，点我一下");
    el.innerHTML = `
      <div class="lz-lizz-bubble" id="lzLizzBubble" role="status" aria-live="polite" hidden></div>
      <div class="lz-lizz-avatar">
        ${PHOTO_URL ? `<img class="lz-lizz-photo" src="${esc(PHOTO_URL)}" alt="Lizz" hidden>` : ""}
        ${S.FOX_SVG || ""}
      </div>`;
    document.body.appendChild(el);
    widget = el;
    bubble = el.querySelector("#lzLizzBubble");

    const photo = el.querySelector(".lz-lizz-photo");
    if (photo) bindPhoto(el, photo);

    el.addEventListener("click", onCharacterClick);
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onCharacterClick();
      }
    });
    return el;
  }

  function bindPhoto(host, photo) {
    photo.addEventListener("load", () => {
      if (photo.naturalWidth > 0) {
        host.classList.add("has-photo");
        photo.hidden = false;
      }
    });
    photo.addEventListener("error", () => {
      host.classList.remove("has-photo");
      photo.hidden = true;
    });
  }

  /* 启用图片槽位：把 books/lizz/lizz.png 换成 Lizz 的形象（永久记住） */
  function usePhoto(url) {
    const target = String(url || DEFAULT_PHOTO_URL);
    try { window.localStorage.setItem(S.PHOTO_KEY, target); } catch (error) { /* 忽略 */ }
    buildWidget();
    const holder = widget.querySelector(".lz-lizz-avatar");
    let photo = holder.querySelector(".lz-lizz-photo");
    if (!photo) {
      photo = document.createElement("img");
      photo.className = "lz-lizz-photo";
      photo.alt = "Lizz";
      photo.hidden = true;
      holder.insertBefore(photo, holder.firstChild);
      bindPhoto(widget, photo);
    }
    widget.classList.remove("has-photo");
    photo.hidden = true;
    photo.src = target;
    return target;
  }

  /* 关掉图片槽位，回到内置小狐狸 */
  function hidePhoto() {
    try { window.localStorage.removeItem(S.PHOTO_KEY); } catch (error) { /* 忽略 */ }
    if (!widget) return;
    const photo = widget.querySelector(".lz-lizz-photo");
    if (photo) {
      photo.hidden = true;
      photo.removeAttribute("src");
    }
    widget.classList.remove("has-photo");
  }

  function showWidget() {
    if (!state || !state.tutorialDone || state.mode !== "active" || TUT.isOpen()) return;
    if (!appHomeVisible()) return;
    buildWidget();
    if (!widget.hidden) return;
    widget.hidden = false;
    void widget.offsetWidth;
    widget.classList.add("is-in");
    locked = false;
    if (pendingBubble) {
      const pending = pendingBubble;
      pendingBubble = null;
      renderRuleBubble(pending.lines, pending.duration, pending.face);
    }
  }

  function hideWidget() {
    if (!widget) return;
    widget.classList.remove("is-in", "is-vanishing");
    widget.hidden = true;
    if (bubble) {
      bubble.hidden = true;
      bubble.innerHTML = "";
      bubble.classList.remove("is-wide", "is-pop");
    }
    if (bubbleTimer) {
      clearTimeout(bubbleTimer);
      bubbleTimer = null;
    }
  }

  function appHomeVisible() {
    const home = document.getElementById("view-home");
    if (!home) return true;
    if (home.hidden) return false;
    const style = window.getComputedStyle(home);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function syncVisibility() {
    if (!state) return;
    if (hiding) return;
    const shouldShow = state.tutorialDone && state.mode === "active" && !TUT.isOpen() && appHomeVisible();
    if (shouldShow) showWidget();
    else hideWidget();
  }

  /* ============================================================
     气泡
     ============================================================ */
  function showBubbleHTML(html, duration, wide) {
    buildWidget();
    if (!bubble) return;
    bubble.innerHTML = html;
    bubble.hidden = false;
    bubble.classList.toggle("is-wide", Boolean(wide));
    bubble.classList.remove("is-pop");
    void bubble.offsetWidth;
    bubble.classList.add("is-pop");
    if (bubbleTimer) clearTimeout(bubbleTimer);
    bubbleTimer = null;
    if (duration) {
      bubbleTimer = setTimeout(() => {
        if (bubble) {
          bubble.hidden = true;
          bubble.classList.remove("is-wide", "is-pop");
        }
        bubbleTimer = null;
      }, duration);
    }
  }

  function faceBubble(duration) {
    const face = S.pickFace(state, Math.random);
    const line = Math.random() < 0.28 ? randomOf(S.LINES.click) : "";
    showBubbleHTML(
      `<span class="lz-bubble-face">${esc(face)}</span>${line ? `<span class="lz-bubble-line">${esc(line)}</span>` : ""}`,
      duration || 2600,
      false
    );
  }

  function linesBubble(lines, duration) {
    showBubbleHTML(
      `<span class="lz-bubble-face">${esc("(´･_･`)")}</span><span class="lz-bubble-line lz-bubble-rule">${(lines || []).map((line) => esc(line)).join("<br>")}</span>`,
      duration,
      true
    );
  }

  function renderRuleBubble(lines, duration, face) {
    showBubbleHTML(
      `<span class="lz-bubble-face">${esc(face)}</span><span class="lz-bubble-line lz-bubble-rule">${(lines || []).map((line) => esc(line)).join("<br>")}</span>`,
      duration,
      true
    );
  }

  /* 不在主界面时先存着，等 Lizz 真正可见再冒泡 */
  function ruleBubble(lines, duration) {
    const face = S.pickFace(state, Math.random);
    if (!widget || widget.hidden || !appHomeVisible() || TUT.isOpen()) {
      pendingBubble = { lines: (lines || []).slice(), duration: duration, face: face };
      return;
    }
    renderRuleBubble(lines, duration, face);
  }

  /* ============================================================
     点击：一下颜文字 / 连点 3 下 / 连点 10 下
     ============================================================ */
  function onCharacterClick() {
    if (!state || !state.tutorialDone || state.mode !== "active" || TUT.isOpen() || hiding) return;
    if (widget && widget.hidden) return;
    if (locked) return;

    burst += 1;
    faceBubble(2400);
    if (burstTimer) clearTimeout(burstTimer);

    if (burst >= 10) {
      // 到 10 下就锁定，留一点时间让最后一个颜文字显示，然后彻底不见
      locked = true;
      burstTimer = setTimeout(resolveBurst, 520);
    } else {
      burstTimer = setTimeout(resolveBurst, BURST_IDLE_MS);
    }
  }

  function resolveBurst() {
    const count = burst;
    burst = 0;
    burstTimer = null;
    if (count >= 10) {
      beginGone();
      return;
    }
    if (count >= 3) {
      beginSoftHide();
      return;
    }
    locked = false;
  }

  function beginSoftHide() {
    if (!state || hiding) return;
    hiding = true;
    locked = true;
    if (burstTimer) {
      clearTimeout(burstTimer);
      burstTimer = null;
    }
    burst = 0;
    state = S.setMode(state, "hidden", { softHideCount: (state.softHideCount || 0) + 1 });
    linesBubble(S.LINES.softHide, SOFT_RULE_MS);
    setTimeout(() => vanish(), SOFT_RULE_MS);
  }

  function beginGone() {
    if (!state || hiding) return;
    hiding = true;
    locked = true;
    if (burstTimer) {
      clearTimeout(burstTimer);
      burstTimer = null;
    }
    burst = 0;
    state = S.setMode(state, "gone", { goneCount: (state.goneCount || 0) + 1 });
    linesBubble(S.LINES.gone, GONE_RULE_MS);
    setTimeout(() => vanish(), GONE_RULE_MS);
  }

  function vanish() {
    if (!widget) {
      hiding = false;
      return;
    }
    if (bubbleTimer) {
      clearTimeout(bubbleTimer);
      bubbleTimer = null;
    }
    widget.classList.add("is-vanishing");
    setTimeout(() => {
      widget.hidden = true;
      widget.classList.remove("is-vanishing", "is-in");
      if (bubble) {
        bubble.hidden = true;
        bubble.innerHTML = "";
        bubble.classList.remove("is-wide", "is-pop");
      }
      hiding = false;
      locked = false;
    }, FADE_MS);
  }

  function onReturned() {
    hiding = false;
    locked = false;
    syncVisibility();
    ruleBubble(S.LINES.returned, 3800);
  }

  /* ============================================================
     教程
     ============================================================ */
  function startTutorial(force) {
    if (!state) state = S.load();
    if (TUT.isOpen()) return true;
    if (!force && state.tutorialDone) return false;
    if (state.mode !== "active") return false;
    hiding = false;
    locked = false;
    hideWidget();
    TUT.open({
      onFinish: handleTutorialFinish,
      onSkip: handleTutorialSkip
    });
    return TUT.isOpen();
  }

  function handleTutorialFinish() {
    if (!state) state = S.load();
    state = S.setMode(state, "active");
    state.tutorialDone = true;
    state.tutorialFinishedAt = new Date().toISOString();
    state.introSeen = true;
    S.save(state);
    syncVisibility();
    ruleBubble(S.LINES.stay, 4200);
  }

  function handleTutorialSkip() {
    if (!state) state = S.load();
    state = S.setMode(state, "active");
    state.tutorialDone = true;
    state.tutorialSkippedAt = new Date().toISOString();
    S.save(state);
    syncVisibility();
    ruleBubble(S.LINES.skip, 3800);
  }

  /* ============================================================
     轮询：软隐藏后等 10 词；彻底不见后等第二天
     ============================================================ */
  function tick() {
    if (!state) return;
    if (state.mode === "hidden" || state.mode === "gone") {
      const before = state.mode;
      state = S.load();
      if (before !== "active" && state.mode === "active") {
        onReturned();
        return;
      }
    }
    syncVisibility();
  }

  /* ============================================================
     初始化
     ============================================================ */
  function init(options) {
    const opts = options || {};
    if (initialized) {
      syncVisibility();
      return state;
    }
    initialized = true;
    state = S.load();
    buildWidget();

    if (state.tutorialDone) {
      syncVisibility();
    } else if (opts.autoTutorial !== false) {
      if (autoTimer) clearTimeout(autoTimer);
      autoTimer = setTimeout(() => {
        autoTimer = null;
        startTutorial(false);
      }, opts.delay == null ? TUTORIAL_DELAY_MS : Number(opts.delay) || 0);
    }

    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(tick, 700);
    return state;
  }

  function reset(options) {
    if (TUT.isOpen()) TUT.close();
    hiding = false;
    locked = false;
    burst = 0;
    if (burstTimer) {
      clearTimeout(burstTimer);
      burstTimer = null;
    }
    try {
      window.localStorage.removeItem(S.KEY);
    } catch (error) {
      /* ignore */
    }
    hideWidget();
    state = S.load();
    initialized = true;
    if (options && options.reload && window.location && window.location.reload) {
      window.location.reload();
    }
    return state;
  }

  const api = {
    init,
    startTutorial,
    skipTutorial: () => {
      if (TUT.isOpen()) TUT.skip();
      else return false;
      return true;
    },
    reset,
    getState: () => state,
    isVisible: () => Boolean(widget && !widget.hidden),
    usePhoto,
    hidePhoto,
    photoUrl: () => (typeof S.photoUrl === "function" ? S.photoUrl() : ""),
    version: "1.0.1",
    _test: {
      click: onCharacterClick,
      resolveBurst,
      tick,
      syncVisibility,
      getBurst: () => burst,
      isLocked: () => locked,
      isHiding: () => hiding,
      userIdle: () => {
        if (burstTimer) clearTimeout(burstTimer);
        burstTimer = null;
      }
    }
  };

  window.LIZZWORD_LIZZ = api;

  function boot() {
    if (!initialized) init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    // 稍等一拍，让主页面先完成自己的首次渲染
    setTimeout(boot, 0);
  }
})();
