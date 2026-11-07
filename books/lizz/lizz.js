/* ============================================================
   Lizz 角色 · 教程编排 · 主界面角落常驻
   - 教程由 Lizz 自我介绍后带入
   - 点一下：随机颜文字（30 种）；碗里有食物时先星星眼再傲娇一句
   - 连点 25 下：躲起来，背完 10 个单词后悄悄回来
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
  const EXIT_CLICKS = 25;          // 连点 25 次才离开（旧的 3 次 / 10 次判断已作废）
  const SOFT_RULE_MS = 3800;
  const FADE_MS = 560;
  const TUTORIAL_DELAY_MS = 380;
  const SECRET_WINDOW_MS = 2600;   // “偷偷回来”后的反应窗口，期间不叠加大声夸奖
  const STAR_EYES_MS = 1600;       // 星星眼持续时间

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
  let vanishTimer = null;
  let vanishHideTimer = null;
  let starTimer = null;
  let tsundereTimer = null;
  let secretReactTimer = null;
  let secretUntil = 0;

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
      </div>
      <div class="lz-lizz-bowl" aria-hidden="true" data-food="0">${S.BOWL_SVG || ""}</div>`;
    document.body.appendChild(el);
    widget = el;
    bubble = el.querySelector("#lzLizzBubble");
    renderFood(false);

    const photo = el.querySelector(".lz-lizz-photo");
    if (photo) bindPhoto(el, photo);

    el.addEventListener("click", onCharacterClick);
    el.addEventListener("animationend", (event) => {
      if (event.animationName === "lz-lizz-secret-in") el.classList.remove("is-secret-in");
    });
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

  function playSecretIn() {
    if (!widget) return;
    widget.classList.remove("is-vanishing", "is-in", "is-secret-in");
    void widget.offsetWidth;
    widget.classList.add("is-secret-in");
  }

  function showWidget(secret) {
    if (!state || !state.tutorialDone || state.mode !== "active" || TUT.isOpen()) return;
    if (!appVisibleForLizz()) return;
    buildWidget();
    if (!widget.hidden) {
      // 正在“离开”的淡出中途被召回：撤掉淡出，改用悄悄淡入
      if (secret) playSecretIn();
      return;
    }
    widget.hidden = false;
    widget.classList.remove("is-in", "is-secret-in");
    void widget.offsetWidth;
    // 偷偷回来：慢淡入 + 很小的上浮，不冒“我回来了”的提示
    widget.classList.add(secret ? "is-secret-in" : "is-in");
    locked = false;
    if (pendingBubble) {
      const pending = pendingBubble;
      pendingBubble = null;
      renderRuleBubble(pending.lines, pending.duration, pending.face);
    }
  }

  function hideWidget() {
    if (!widget) return;
    if (vanishTimer) {
      clearTimeout(vanishTimer);
      vanishTimer = null;
    }
    if (vanishHideTimer) {
      clearTimeout(vanishHideTimer);
      vanishHideTimer = null;
    }
    if (starTimer) { clearTimeout(starTimer); starTimer = null; }
    if (tsundereTimer) { clearTimeout(tsundereTimer); tsundereTimer = null; }
    if (secretReactTimer) { clearTimeout(secretReactTimer); secretReactTimer = null; }
    widget.classList.remove("is-in", "is-vanishing", "is-secret-in", "is-star-eyes");
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

  /* 完成页（“学习完成”）也算主界面，Lizz 会在这里出现并夸奖 */
  function appDoneVisible() {
    const study = document.getElementById("view-study");
    if (!study || study.hidden) return false;
    const style = window.getComputedStyle(study);
    if (style.display === "none" || style.visibility === "hidden") return false;
    return Boolean(study.querySelector("[data-next-group]"));
  }

  function appVisibleForLizz() {
    return appHomeVisible() || appDoneVisible();
  }

  function syncVisibility(secret) {
    if (!state) return;
    if (hiding) return;
    const shouldShow = state.tutorialDone && state.mode === "active" && !TUT.isOpen() && appVisibleForLizz();
    if (shouldShow) showWidget(Boolean(secret));
    else hideWidget();
  }

  /* 碗里的食物：state.food 记份数（上限 S.FOOD_CAP），最多画 3 份 */
  function renderFood(animate) {
    if (!widget) return;
    const bowl = widget.querySelector(".lz-lizz-bowl");
    if (!bowl) return;
    const count = state ? Number(state.food) || 0 : 0;
    const shown = Math.min(3, count);
    bowl.setAttribute("data-food", String(count));
    Array.prototype.forEach.call(bowl.querySelectorAll(".lz-food"), (el, index) => {
      el.style.display = index >= shown ? "none" : "";
    });
    if (animate && shown > 0) {
      bowl.classList.remove("is-pop");
      void bowl.offsetWidth;
      bowl.classList.add("is-pop");
    }
  }

  /* 看到碗里的食物：先星星眼，紧接着弱弱地傲娇一句 */
  function starEyesReaction(bubbleDelay) {
    buildWidget();
    if (!widget) return;
    widget.classList.remove("is-star-eyes");
    void widget.offsetWidth;
    widget.classList.add("is-star-eyes");
    if (starTimer) clearTimeout(starTimer);
    starTimer = setTimeout(() => {
      starTimer = null;
      if (widget) widget.classList.remove("is-star-eyes");
    }, STAR_EYES_MS);
    if (tsundereTimer) clearTimeout(tsundereTimer);
    tsundereTimer = setTimeout(() => {
      tsundereTimer = null;
      if (!state || !widget || widget.hidden) return;
      const line = pickLine(S.LINES.tsundere, "lastTsundere");
      showBubbleHTML(
        `<span class="lz-bubble-face">${esc(S.pickFace(state, Math.random))}</span><span class="lz-bubble-line lz-bubble-rule">${esc(line)}</span>`,
        4600,
        true
      );
    }, bubbleDelay == null ? 620 : bubbleDelay);
  }

  /* 碗里有食物时：记账后延迟一点再冒星星眼（先看到碗，再“嘴硬”） */
  function celebrateFood(delay) {
    if (!state || Number(state.food) <= 0) return;
    state.foodReacted = Number(state.food) || 0;
    S.save(state);
    if (secretReactTimer) clearTimeout(secretReactTimer);
    secretReactTimer = setTimeout(() => {
      secretReactTimer = null;
      if (!state || state.mode !== "active" || !widget || widget.hidden || TUT.isOpen()) return;
      starEyesReaction(620);
    }, delay == null ? 450 : delay);
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
    if (!widget || widget.hidden || !appVisibleForLizz() || TUT.isOpen()) {
      pendingBubble = { lines: (lines || []).slice(), duration: duration, face: face };
      return;
    }
    renderRuleBubble(lines, duration, face);
  }

  /* ============================================================
     点击：一下颜文字 / 连点 25 下离开
     ============================================================ */
  function onCharacterClick() {
    if (!state || !state.tutorialDone || state.mode !== "active" || TUT.isOpen() || hiding) return;
    if (widget && widget.hidden) return;
    if (locked) return;

    burst += 1;
    if (state.thanksPending) {
      // 完成一组后的第一次点击：开心道谢 + 鼓励继续
      state.thanksPending = false;
      S.save(state);
      const line = pickLine(S.LINES.groupThanks, "lastThanks");
      showBubbleHTML(
        `<span class="lz-bubble-face">${esc(S.pickFace(state, Math.random))}</span><span class="lz-bubble-line lz-bubble-rule">${esc(line)}</span>`,
        4600,
        true
      );
    } else if (Number(state.food) > 0 && state.foodReacted !== Number(state.food)) {
      // 常驻状态下碗里有新食物：星星眼 + 傲娇（同一份食物只反应一次）
      celebrateFood(120);
    } else {
      faceBubble(2400);
    }
    if (burstTimer) clearTimeout(burstTimer);

    if (burst >= EXIT_CLICKS) {
      // 到 25 下就锁定，留一点时间让最后一个反应显示，再说规则并离开
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
    if (count >= EXIT_CLICKS) {
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
    vanishTimer = setTimeout(() => { vanishTimer = null; vanish(); }, SOFT_RULE_MS);
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
    vanishHideTimer = setTimeout(() => {
      vanishHideTimer = null;
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
    burst = 0;
    if (burstTimer) {
      clearTimeout(burstTimer);
      burstTimer = null;
    }
    if (vanishTimer) {
      clearTimeout(vanishTimer);
      vanishTimer = null;
    }
    if (vanishHideTimer) {
      clearTimeout(vanishHideTimer);
      vanishHideTimer = null;
    }
    secretUntil = Date.now() + SECRET_WINDOW_MS;
    // 悄悄回来：只做淡入，不弹“我回来了”的大提示
    syncVisibility(true);
    if (Number(state.food) > 0) celebrateFood(700);
  }

  /* ============================================================
     完成一组学习：沿用主页面 finishToday() 写入的 groupsToday 增量，
     不自己另造“完成”判定
     ============================================================ */
  function pickLine(list, field) {
    if (!list || !list.length) return "";
    let index = Math.floor(Math.random() * list.length);
    if (state[field] === index) index = (index + 1) % list.length;
    state[field] = index;
    S.save(state);
    return list[index];
  }

  function checkGroupProgress() {
    if (!state) return;
    const progress = S.readAppProgress();
    if (!progress || !progress.date) return;
    if (!state.groupSeen) {
      // 第一次挂载：只记基线，不为历史上的完成补夸奖
      state.groupSeen = { date: progress.date, groupsToday: progress.groupsToday };
      S.save(state);
      return;
    }
    if (state.groupSeen.date !== progress.date) {
      state.groupSeen = { date: progress.date, groupsToday: progress.groupsToday };
      S.save(state);
      return;
    }
    if (progress.groupsToday >= state.groupSeen.groupsToday + 1) {
      state.groupSeen.groupsToday = progress.groupsToday;
      onGroupCompleted();
    }
  }

  function onGroupCompleted() {
    if (!state) return;
    state.food = Math.min(S.FOOD_CAP, (Number(state.food) || 0) + 1);
    state.praiseAt = new Date().toISOString();
    const wasHidden = state.mode === "hidden";
    if (wasHidden) {
      // 隐藏态：完成一组就是“背完 10 个词”的兑现时机，悄悄回来
      state.mode = "active";
      state.hiddenAt = "";
      state.hiddenBaseline = null;
      secretUntil = Date.now() + SECRET_WINDOW_MS;
    }
    hiding = false;
    locked = false;
    burst = 0;
    if (burstTimer) {
      clearTimeout(burstTimer);
      burstTimer = null;
    }
    if (vanishTimer) {
      clearTimeout(vanishTimer);
      vanishTimer = null;
    }
    if (vanishHideTimer) {
      clearTimeout(vanishHideTimer);
      vanishHideTimer = null;
    }
    state.thanksPending = true;
    const secret = wasHidden || Date.now() < secretUntil;
    if (secret) state.foodReacted = state.food;
    S.save(state);
    renderFood(true);
    // 只有“本次真的从隐藏态回来”才重播偷偷淡入；已在场时不重复淡入
    syncVisibility(wasHidden);
    if (secret) {
      // 偷偷回来的同一刻不弹夸奖，先让“星星眼 + 我只是回来看看”演完
      celebrateFood(700);
    } else {
      ruleBubble([pickLine(S.LINES.groupPraise, "lastPraise")], 5200);
    }
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
     轮询：软隐藏后等背完 10 个词，再悄悄回来
     ============================================================ */
  function tick() {
    if (!state) return;
    if (state.mode === "hidden") {
      const before = state.mode;
      state = S.load();
      if (before !== "active" && state.mode === "active") {
        onReturned();
        return;
      }
    }
    checkGroupProgress();
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
    secretUntil = 0;
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
    version: "1.0.3",
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
