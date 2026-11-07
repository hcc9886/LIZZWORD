/* ============================================================
   Lizz · 积分商店（装扮 / 积分 / 持久化）
   - 积分：每背完 10 个新词 +10；当天全部复习完成 +10
   - 20 套装扮，购买后立刻戴到角落的小狐狸身上
   - 状态写在 lizzword_lizz_v1.shop，读盘 → 修改 → 立即写盘，避免旧状态覆盖
   - 支持 ?lizz-shop=1 自动打开，便于本地预览
   ============================================================ */
(function () {
  "use strict";

  const S = window.LIZZWORD_LIZZ_STATE;
  const ACC = window.LIZZWORD_LIZZ_ACCESSORIES;
  if (!S || !ACC) {
    console.warn("[Lizz] 商店需要先加载 lizz-state.js 与 lizz-accessories.js");
    return;
  }

  const WORD_UNIT = 10;          // 每 10 个新词
  const WORD_POINTS = 10;        // 每单元积分
  const REVIEW_POINTS = 10;      // 当天复习完成积分
  const FEED_WORDS = 10;         // 每 10 个新词换 1 次喂食
  const MAX_LEDGER = 30;

  let lastTickAt = 0;
  let panel = null;
  let activeFilter = "all";
  let pendingBuyId = "";
  let pendingTimer = null;
  let lastFocus = null;

  function todayKey() {
    return S.dateKeyOf();
  }

  function clampInt(value, min, max) {
    const n = Math.floor(Number(value) || 0);
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function normalizeShop(raw) {
    const src = raw && typeof raw === "object" ? raw : {};
    const owned = Array.isArray(src.owned)
      ? Array.from(new Set(src.owned.map((id) => String(id || "")).filter((id) => ACC.byId.has(id))))
      : [];
    const equipped = (typeof src.equipped === "string" && owned.includes(src.equipped))
      ? src.equipped
      : "";
    const words = src.words && typeof src.words === "object" ? src.words : {};
    const review = src.review && typeof src.review === "object" ? src.review : {};
    const feed = src.feed && typeof src.feed === "object" ? src.feed : {};
    const ledger = Array.isArray(src.ledger)
      ? src.ledger
        .filter((row) => row && typeof row === "object" && Number(row.amount) > 0)
        .slice(-MAX_LEDGER)
      : [];
    return {
      points: clampInt(src.points, 0, 999999),
      owned,
      equipped,
      words: {
        date: typeof words.date === "string" ? words.date : "",
        lastWords: clampInt(words.lastWords, 0, 999999),
        counted: clampInt(words.counted, 0, 999999),
        awarded: clampInt(words.awarded, 0, 999999)
      },
      review: {
        lastAwardDate: typeof review.lastAwardDate === "string" ? review.lastAwardDate : ""
      },
      feed: {
        date: typeof feed.date === "string" ? feed.date : "",
        used: clampInt(feed.used, 0, 999999)
      },
      ledger
    };
  }

  function readFull() {
    try {
      const raw = window.localStorage.getItem(S.KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (error) {
      /* 存档损坏时按空对象处理 */
    }
    return {};
  }

  function readShop() {
    return normalizeShop(readFull().shop);
  }

  function writeShop(shop) {
    const full = readFull();
    full.v = S.VERSION;
    full.shop = normalizeShop(shop);
    full.updatedAt = new Date().toISOString();
    try {
      window.localStorage.setItem(S.KEY, JSON.stringify(full));
    } catch (error) {
      /* 存储被禁用时，本次会话仍可继续 */
    }
    return full.shop;
  }

  function readApp() {
    try {
      const raw = window.localStorage.getItem(S.APP_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (error) {
      /* ignore */
    }
    return null;
  }

  function shopSummary() {
    const shop = readShop();
    return {
      points: shop.points,
      owned: shop.owned.length,
      total: ACC.items.length,
      equipped: shop.equipped,
      todayEarned: todayEarned(shop)
    };
  }

  function todayEarned(shop) {
    const today = todayKey();
    return shop.ledger.reduce((sum, row) => sum + (row.date === today ? Number(row.amount) || 0 : 0), 0);
  }

  function pushLedger(shop, type, amount) {
    shop.ledger.push({
      at: Date.now(),
      date: todayKey(),
      type,
      amount
    });
    if (shop.ledger.length > MAX_LEDGER) shop.ledger = shop.ledger.slice(-MAX_LEDGER);
  }

  /* ===== 积分引擎 ===== */
  function tick(force) {
    const now = Date.now();
    if (!force && now - lastTickAt < 900) return null;
    lastTickAt = now;

    const app = readApp();
    const shop = readShop();
    const today = todayKey();
    let changed = false;
    let earned = 0;

    // 新学词：按 wordsToday 的真实增量结算，调试会话不计数
    const appDate = app && typeof app.groupStatsDate === "string" && app.groupStatsDate
      ? app.groupStatsDate
      : today;
    const wordsToday = clampInt(app && app.wordsToday, 0, 999999);

    if (!shop.words.date || shop.words.date !== appDate) {
      shop.words = { date: appDate, lastWords: wordsToday, counted: 0, awarded: 0 };
      changed = true;
    } else {
      const delta = wordsToday - shop.words.lastWords;
      if (delta > 0) {
        shop.words.lastWords = wordsToday;
        if (!(app && app.learnDebug)) shop.words.counted += delta;
        changed = true;
      } else if (delta < 0) {
        // 同一天里进度被重置：只校准游标，不回退已结算的积分
        shop.words.lastWords = wordsToday;
        changed = true;
      }
    }

    const units = Math.floor(shop.words.counted / WORD_UNIT);
    if (units > shop.words.awarded) {
      const gain = (units - shop.words.awarded) * WORD_POINTS;
      shop.words.awarded = units;
      shop.points += gain;
      pushLedger(shop, "words", gain);
      earned += gain;
      changed = true;
    }

    // 当天复习：summary 已生成 + 确实有到期词 + 会话属于今天
    const session = app && app.reviewSession;
    const reviewDone = Boolean(
      session &&
      session.date === today &&
      session.summary &&
      Array.isArray(session.due) &&
      session.due.length > 0
    );
    if (reviewDone && shop.review.lastAwardDate !== today) {
      shop.review.lastAwardDate = today;
      shop.points += REVIEW_POINTS;
      pushLedger(shop, "review", REVIEW_POINTS);
      earned += REVIEW_POINTS;
      changed = true;
    }

    if (changed) {
      writeShop(shop);
      notifyChanged();
      if (earned > 0) showPointsToast(earned);
    }
    return { earned, shop };
  }

  function notifyChanged() {
    try {
      document.dispatchEvent(new CustomEvent("lizzword:shop-changed", {
        detail: shopSummary()
      }));
    } catch (error) {
      /* ignore */
    }
    if (panel && !panel.hidden) render();
  }

  function showPointsToast(amount) {
    if (!amount) return;
    const lizzState = S.load();
    if (!lizzState.tutorialDone) return;
    const toast = document.createElement("div");
    toast.className = "lz-point-toast";
    toast.textContent = `+${amount} 积分`;
    document.body.appendChild(toast);
    window.setTimeout(() => {
      toast.classList.add("is-out");
      window.setTimeout(() => toast.remove(), 380);
    }, 1300);
  }

  /* ===== 购买 / 佩戴 ===== */
  function buyItem(id) {
    const item = ACC.byId.get(String(id || ""));
    if (!item) return { ok: false, reason: "unknown" };
    const shop = readShop();
    if (shop.owned.includes(item.id)) return { ok: false, reason: "owned" };
    if (shop.points < item.price) return { ok: false, reason: "points", need: item.price - shop.points };

    shop.points -= item.price;
    shop.owned.push(item.id);
    shop.equipped = item.id;
    writeShop(shop);
    applyAccessory();
    notifyChanged();
    return { ok: true, item };
  }

  function equipItem(id) {
    const shop = readShop();
    if (!shop.owned.includes(id)) return false;
    shop.equipped = id;
    writeShop(shop);
    applyAccessory();
    notifyChanged();
    return true;
  }

  function unequipItem() {
    const shop = readShop();
    shop.equipped = "";
    writeShop(shop);
    applyAccessory();
    notifyChanged();
    return true;
  }

  /* ===== 喂食 ===== */
  function getFeedStatus() {
    tick(true);
    const shop = readShop();
    const today = todayKey();
    const counted = shop.words.date === today ? shop.words.counted : 0;
    const credits = Math.floor(counted / FEED_WORDS);
    const used = shop.feed.date === today ? shop.feed.used : 0;
    const available = Math.max(0, credits - used);
    const lizz = S.load();
    const food = clampInt(lizz.food, 0, S.FOOD_CAP);
    const room = Math.max(0, S.FOOD_CAP - food);
    const canFeed = available > 0 && room > 0;
    return {
      available,
      used,
      credits,
      counted,
      food,
      cap: S.FOOD_CAP,
      room,
      needMore: Math.max(0, (used + 1) * FEED_WORDS - counted),
      canFeed,
      reason: room <= 0 ? "full" : (available <= 0 ? "empty" : "ok")
    };
  }

  function feedLizz() {
    const before = getFeedStatus();
    if (!before.canFeed) return { ok: false, ...before };

    let nextFood = 0;
    S.update((state) => {
      state.food = Math.min(S.FOOD_CAP, clampInt(state.food, 0, S.FOOD_CAP) + 1);
      state.foodReacted = state.food;
      const shop = normalizeShop(state.shop);
      const today = todayKey();
      if (shop.feed.date !== today) shop.feed = { date: today, used: 0 };
      shop.feed.used += 1;
      state.shop = shop;
      nextFood = state.food;
    });

    notifyChanged();
    return { ok: true, food: nextFood };
  }

  /* ===== 角落狐狸佩戴 ===== */
  function accessorySVG(id) {
    const item = ACC.byId.get(String(id || ""));
    if (!item) return "";
    return `<svg class="lz-acc-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${item.svg}</svg>`;
  }

  function applyAccessory() {
    const shop = readShop();
    const holders = document.querySelectorAll("#lzLizzAccessory");
    Array.prototype.forEach.call(holders, (holder) => {
      holder.innerHTML = shop.equipped ? accessorySVG(shop.equipped) : "";
      holder.classList.toggle("is-on", Boolean(shop.equipped));
    });
    if (panel && !panel.hidden) render();
  }

  /* ===== 商店界面 ===== */
  function ensurePanel() {
    if (panel) return panel;

    panel = document.createElement("div");
    panel.className = "lz-shop";
    panel.id = "lzShop";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="lz-shop-backdrop" data-shop-close></div>
      <div class="lz-shop-shell" role="dialog" aria-modal="true" aria-labelledby="lzShopTitle">
        <header class="lz-shop-top">
          <div>
            <p class="lz-shop-kicker">LIZZ WARDROBE</p>
            <h2 class="lz-shop-title" id="lzShopTitle">Lizz 的小衣橱</h2>
          </div>
          <button type="button" class="lz-shop-close" data-shop-close aria-label="关闭商店">×</button>
        </header>

        <div class="lz-shop-wallet">
          <div class="lz-shop-balance"><span>积分</span><b id="lzShopPoints">0</b></div>
          <div class="lz-shop-owned"><span>已收集</span><b id="lzShopOwned">0/20</b></div>
          <div class="lz-shop-earn" id="lzShopEarn">今日已赚 0</div>
        </div>

        <div class="lz-shop-preview">
          <div class="lz-shop-bigfox">
            ${S.FOX_SVG}
            <div class="lz-shop-bigacc" id="lzShopBigAcc" aria-hidden="true"></div>
          </div>
          <div class="lz-shop-current">
            <p>Lizz 现在戴着</p>
            <b id="lzShopEquippedName">什么也没戴</b>
            <button type="button" class="lz-shop-unequip" id="lzShopUnequip" hidden>摘下</button>
          </div>
        </div>

        <div class="lz-shop-filters" id="lzShopFilters" role="group" aria-label="装扮筛选"></div>
        <div class="lz-shop-grid" id="lzShopGrid"></div>
        <p class="lz-shop-foot">
          背完 10 个新词 +10 积分 · 当天全部复习完成 +10 积分<br>
          积分与已购装扮只保存在本机浏览器，不会上传。
        </p>
      </div>`;

    document.body.appendChild(panel);
    panel.addEventListener("click", onPanelClick);
    return panel;
  }

  function render() {
    if (!panel) return;
    const shop = readShop();
    const pointsEl = panel.querySelector("#lzShopPoints");
    const ownedEl = panel.querySelector("#lzShopOwned");
    const earnEl = panel.querySelector("#lzShopEarn");
    const nameEl = panel.querySelector("#lzShopEquippedName");
    const bigAcc = panel.querySelector("#lzShopBigAcc");
    const unequipBtn = panel.querySelector("#lzShopUnequip");

    if (pointsEl) pointsEl.textContent = String(shop.points);
    if (ownedEl) ownedEl.textContent = `${shop.owned.length}/${ACC.items.length}`;
    if (earnEl) {
      const earned = todayEarned(shop);
      earnEl.textContent = earned > 0 ? `今日已赚 +${earned}` : "今日已赚 0";
    }

    const equippedItem = ACC.byId.get(shop.equipped);
    if (nameEl) nameEl.textContent = equippedItem ? equippedItem.name : "什么也没戴";
    if (bigAcc) bigAcc.innerHTML = shop.equipped ? accessorySVG(shop.equipped) : "";
    if (unequipBtn) unequipBtn.hidden = !equippedItem;

    renderFilters(shop);
    renderGrid(shop);
  }

  function filterLabel(key) {
    if (key === "all") return "全部";
    if (key === "owned") return "已拥有";
    return ACC.RARITY[key].label;
  }

  function filterCount(key, shop) {
    if (key === "all") return ACC.items.length;
    if (key === "owned") return shop.owned.length;
    return ACC.items.filter((item) => item.rarity === key).length;
  }

  function renderFilters(shop) {
    const wrap = panel.querySelector("#lzShopFilters");
    if (!wrap) return;
    const keys = ["all", "common", "rare", "epic", "legendary", "owned"];
    wrap.innerHTML = keys.map((key) => {
      const active = activeFilter === key;
      return `<button type="button" class="lz-shop-chip${active ? " is-active" : ""}" data-shop-filter="${key}" aria-pressed="${active}">
        ${filterLabel(key)}<span>${filterCount(key, shop)}</span>
      </button>`;
    }).join("");
  }

  function itemAction(item, shop) {
    const owned = shop.owned.includes(item.id);
    const equipped = shop.equipped === item.id;
    if (equipped) return { text: "佩戴中 · 摘下", cls: "is-equipped" };
    if (owned) return { text: "戴上", cls: "is-owned" };
    if (pendingBuyId === item.id) return { text: `确认兑换 · ${item.price}`, cls: "is-pending" };
    if (shop.points < item.price) return { text: `还差 ${item.price - shop.points} 分`, cls: "is-locked" };
    return { text: `兑换 · ${item.price}`, cls: "" };
  }

  function renderGrid(shop) {
    const grid = panel.querySelector("#lzShopGrid");
    if (!grid) return;

    let items = ACC.items.slice();
    if (activeFilter === "owned") {
      items = items.filter((item) => shop.owned.includes(item.id));
    } else if (activeFilter !== "all") {
      items = items.filter((item) => item.rarity === activeFilter);
    }

    if (!items.length) {
      grid.innerHTML = `<p class="lz-shop-empty">这里还空着。背几组单词，把第一件装扮带回家吧。</p>`;
      return;
    }

    grid.innerHTML = items.map((item) => {
      const rarity = ACC.RARITY[item.rarity];
      const owned = shop.owned.includes(item.id);
      const equipped = shop.equipped === item.id;
      const action = itemAction(item, shop);
      const classes = [
        "lz-shop-card",
        `rarity-${item.rarity}`,
        owned ? "is-owned" : "",
        equipped ? "is-equipped" : "",
        action.cls
      ].filter(Boolean).join(" ");
      return `<button type="button" class="${classes}" data-shop-item="${item.id}" title="${item.hint}">
        <span class="lz-shop-thumb">
          <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${ACC.headFragment}${item.svg}</svg>
        </span>
        <span class="lz-shop-info">
          <span class="lz-shop-name">${item.name}</span>
          <span class="lz-shop-rarity">${rarity.label}</span>
        </span>
        <span class="lz-shop-action">${action.text}</span>
      </button>`;
    }).join("");
  }

  function onPanelClick(event) {
    const closeTarget = event.target.closest("[data-shop-close]");
    if (closeTarget) {
      close();
      return;
    }

    const filterBtn = event.target.closest("[data-shop-filter]");
    if (filterBtn) {
      activeFilter = filterBtn.getAttribute("data-shop-filter") || "all";
      pendingBuyId = "";
      render();
      return;
    }

    if (event.target.closest("#lzShopUnequip")) {
      unequipItem();
      return;
    }

    const card = event.target.closest("[data-shop-item]");
    if (card) {
      handleCard(card.getAttribute("data-shop-item"));
    }
  }

  function handleCard(id) {
    const item = ACC.byId.get(String(id || ""));
    if (!item) return;
    const shop = readShop();

    if (shop.equipped === item.id) {
      unequipItem();
      return;
    }
    if (shop.owned.includes(item.id)) {
      equipItem(item.id);
      return;
    }
    if (shop.points < item.price) {
      flashNeedPoints(item);
      return;
    }
    if (pendingBuyId !== item.id) {
      pendingBuyId = item.id;
      if (pendingTimer) window.clearTimeout(pendingTimer);
      render();
      pendingTimer = window.setTimeout(() => {
        pendingBuyId = "";
        render();
      }, 3500);
      return;
    }

    if (pendingTimer) window.clearTimeout(pendingTimer);
    pendingBuyId = "";
    const result = buyItem(item.id);
    if (result.ok) {
      render();
      showShopToast(`兑换成功，Lizz 戴上了「${item.name}」`);
    }
  }

  function flashNeedPoints(item) {
    const shop = readShop();
    const need = item.price - shop.points;
    showShopToast(`还差 ${need} 积分，再背 ${Math.ceil(need / WORD_POINTS) * WORD_UNIT} 个新词就够了`);
    const card = panel && panel.querySelector(`[data-shop-item="${item.id}"]`);
    if (card) {
      card.classList.add("is-shake");
      window.setTimeout(() => card.classList.remove("is-shake"), 420);
    }
  }

  let shopToastTimer = null;
  function showShopToast(text) {
    if (!panel) return;
    let toast = panel.querySelector(".lz-shop-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "lz-shop-toast";
      panel.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add("is-on");
    if (shopToastTimer) window.clearTimeout(shopToastTimer);
    shopToastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 2400);
  }

  function onKeydown(event) {
    if (event.key === "Escape" && panel && !panel.hidden) {
      close();
    }
  }

  function open() {
    tick(true);
    ensurePanel();
    lastFocus = document.activeElement;
    render();
    panel.hidden = false;
    document.body.classList.add("lz-shop-open");
    window.requestAnimationFrame(() => panel.classList.add("is-open"));
    document.addEventListener("keydown", onKeydown);
    const closeBtn = panel.querySelector(".lz-shop-close");
    if (closeBtn) closeBtn.focus();
    try {
      document.dispatchEvent(new CustomEvent("lizzword:shop-opened"));
    } catch (error) {
      /* ignore */
    }
  }

  function close() {
    if (!panel || panel.hidden) return;
    panel.classList.remove("is-open");
    document.body.classList.remove("lz-shop-open");
    pendingBuyId = "";
    if (pendingTimer) window.clearTimeout(pendingTimer);
    window.setTimeout(() => {
      if (panel && !panel.classList.contains("is-open")) panel.hidden = true;
    }, 180);
    document.removeEventListener("keydown", onKeydown);
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    lastFocus = null;
  }

  function toggle() {
    if (panel && !panel.hidden) close();
    else open();
  }

  function isOpen() {
    return Boolean(panel && !panel.hidden);
  }

  /* ===== 初始化 ===== */
  function init() {
    document.addEventListener("lizzword:avatar-ready", () => applyAccessory());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") tick(true);
    });
    // 页面启动时先跑一次，避免首屏已经有一组进度却迟迟不计分
    tick(true);
    window.setInterval(() => tick(false), 1000);
    applyAccessory();

    try {
      const params = new window.URLSearchParams(window.location.search);
      if (params.get("lizz-shop") === "1") {
        window.setTimeout(open, 650);
      }
    } catch (error) {
      /* 老浏览器忽略 */
    }
  }

  window.LIZZWORD_LIZZ_SHOP = {
    open,
    close,
    toggle,
    isOpen,
    buy: buyItem,
    equip: equipItem,
    unequip: unequipItem,
    getState: readShop,
    getSummary: shopSummary,
    summaryHTML() {
      const summary = shopSummary();
      return `积分 ${summary.points} · 装扮 ${summary.owned}/${summary.total}`;
    },
    getFeedStatus,
    feed: feedLizz,
    applyAccessory,
    refresh: () => tick(true),
    items: ACC.items,
    RARITY: ACC.RARITY,
    FEED_WORDS
  };

  init();
})();
