/* ============================================================
   Lizz · 碗点击喂食
   - 点击碗不会触发狐狸本体的连点计数
   - 用“今天背过的 10 个新词”换 1 次投喂机会
   - 小卡非模态、9 秒自动收起，不打断背词主流程
   - 库存无上限，背得越多碗里叠得越多；Lizz 自己一天最多吃 12 块
   ============================================================ */
(function () {
  "use strict";

  const S = window.LIZZWORD_LIZZ_STATE;
  const SHOP = window.LIZZWORD_LIZZ_SHOP;
  if (!S || !SHOP) {
    console.warn("[Lizz] 喂食模块需要 lizz-state.js、lizz-shop.js");
    return;
  }

  let widget = null;
  let bowl = null;
  let card = null;
  let closeTimer = null;

  const FEED_LINES = [
    "谢谢…我会慢慢吃的，不会一口吞掉。",
    "（小心地咬了一小口）…好吃。",
    "这个，是给我的吗？那、那我收下了。",
    "嗯…吃完就有力气陪你多背几个词了。",
    "我舍不得一次吃完…先留一半。"
  ];

  function randomLine() {
    return FEED_LINES[Math.floor(Math.random() * FEED_LINES.length)];
  }

  function attach(target) {
    const host = target || document.getElementById("lzLizz");
    if (!host || host.dataset.feedBound === "1") {
      if (host) refreshBadge();
      return;
    }
    widget = host;
    bowl = widget.querySelector(".lz-lizz-bowl");
    if (!bowl) return;

    widget.dataset.feedBound = "1";
    bowl.removeAttribute("aria-hidden");
    bowl.setAttribute("role", "button");
    bowl.setAttribute("tabindex", "0");
    bowl.setAttribute("aria-label", "给 Lizz 一份小点心（用今天背过的单词换）");

    let badge = bowl.querySelector(".lz-bowl-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "lz-bowl-badge";
      badge.setAttribute("aria-hidden", "true");
      bowl.appendChild(badge);
    }

    bowl.addEventListener("click", onBowlClick);
    bowl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        openCard();
      }
    });

    refreshBadge();
  }

  function refreshBadge() {
    if (!widget) widget = document.getElementById("lzLizz");
    if (!widget) return;
    if (!bowl) bowl = widget.querySelector(".lz-lizz-bowl");
    if (!bowl) return;
    const badge = bowl.querySelector(".lz-bowl-badge");
    if (!badge) return;

    let status;
    try {
      status = SHOP.getFeedStatus();
    } catch (error) {
      return;
    }
    if (status.canFeed) {
      badge.hidden = false;
      badge.textContent = `🍪${status.available}`;
      badge.classList.add("is-on");
    } else {
      badge.hidden = true;
      badge.textContent = "";
      badge.classList.remove("is-on");
    }
  }

  function onBowlClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (card) {
      closeCard();
      return;
    }
    openCard();
  }

  function openCard() {
    closeCard();
    if (!widget) widget = document.getElementById("lzLizz");
    if (!widget) return;

    const status = SHOP.getFeedStatus();
    let body = "";
    let actionLabel = "喂给它";
    let disabled = false;

    if (status.available <= 0) {
      body = `<p class="lz-feed-text">今天已经背了 <b>${status.counted}</b> 个新词。再背 <b>${status.needMore}</b> 个，就能换一份小点心。</p>`;
      actionLabel = `还差 ${status.needMore} 个词`;
      disabled = true;
    } else {
      body = `<p class="lz-feed-text">用今天背过的 <b>${SHOP.FEED_WORDS}</b> 个新词，换一份小点心喂给 Lizz？</p>
        <p class="lz-feed-sub">今日还能换 <b>${status.available}</b> 次 · 碗里已有 ${status.food} 块（背得越多她越开心）</p>`;
    }

    card = document.createElement("div");
    card.className = "lz-feed-card";
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", "给 Lizz 喂食");
    card.innerHTML = `
      <div class="lz-feed-head"><span aria-hidden="true">🍪</span><b>给 Lizz 的小点心</b></div>
      ${body}
      <div class="lz-feed-actions">
        <button type="button" class="lz-feed-yes"${disabled ? " disabled" : ""}>${actionLabel}</button>
        <button type="button" class="lz-feed-no">下次吧</button>
      </div>`;

    widget.appendChild(card);
    widget.classList.add("is-feed-open");
    card.addEventListener("click", (event) => event.stopPropagation());

    const yesBtn = card.querySelector(".lz-feed-yes");
    const noBtn = card.querySelector(".lz-feed-no");
    if (yesBtn && !disabled) yesBtn.addEventListener("click", doFeed);
    if (noBtn) noBtn.addEventListener("click", closeCard);

    window.requestAnimationFrame(() => card && card.classList.add("is-open"));
    closeTimer = window.setTimeout(closeCard, 9000);
  }

  function closeCard() {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (!card) return;
    const old = card;
    card = null;
    if (widget) widget.classList.remove("is-feed-open");
    old.classList.remove("is-open");
    window.setTimeout(() => old.remove(), 180);
  }

  function doFeed() {
    const result = SHOP.feed();
    closeCard();
    refreshBadge();
    if (!result.ok) return;

    if (window.LIZZWORD_LIZZ) {
      if (typeof window.LIZZWORD_LIZZ.syncFromStorage === "function") {
        window.LIZZWORD_LIZZ.syncFromStorage({ animate: true });
      }
      if (typeof window.LIZZWORD_LIZZ.celebrate === "function") {
        window.LIZZWORD_LIZZ.celebrate(randomLine());
      }
    }
  }

  function onDocumentClick(event) {
    if (!card) return;
    if (card.contains(event.target) || (bowl && bowl.contains(event.target))) return;
    closeCard();
  }

  function init() {
    document.addEventListener("lizzword:avatar-ready", (event) => {
      attach(event && event.detail ? event.detail.widget : null);
    });
    document.addEventListener("lizzword:shop-changed", refreshBadge);
    document.addEventListener("click", onDocumentClick);

    if (document.getElementById("lzLizz")) attach(null);
  }

  window.LIZZWORD_LIZZ_FEED = {
    attach,
    refresh: refreshBadge
  };

  init();
})();
