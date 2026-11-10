/* ============================================================
   Lizz · 积分商店（装扮 / 积分 / 持久化）
   - 积分：每背完 10 个新词 +10；当天全部复习完成 +10
   - 100 件装扮（50 配饰 + 50 套衣服），购买后立刻戴到角落的小狐狸身上
   - 类别 / 路线 / 稀有度三层筛选 + 分页，避免一次渲染 100 张卡
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
  const PAGE_SIZE = 18;          // 每页卡片数，控制 390px 下的渲染量

  let lastTickAt = 0;
  let panel = null;
  let activeCategory = "all";    // all | accessory | outfit | wings | handheld | owned
  let activeRarity = "all";      // all | common | rare | epic | legendary
  let activeRoute = "all";       // all | school | daily | glam | abstract（仅衣服）
  let pageIndex = 0;
  let pendingBuyId = "";
  let pendingTimer = null;
  let lastFocus = null;

  const SLOT_KEYS = ["accessory", "outfit", "wings", "handheld", "expression", "skin"];

  function todayKey() {
    return S.dateKeyOf();
  }

  function clampInt(value, min, max) {
    const n = Math.floor(Number(value) || 0);
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  // 六个部位各自独立；旧存档里的 equipped 字符串按物品类别迁移到对应槽
  function normalizeSlots(src, owned) {
    const slots = { accessory: "", outfit: "", wings: "", handheld: "", expression: "", skin: "" };
    const accept = (slot, id) => {
      const key = String(id || "");
      if (!owned.includes(key)) return;
      const item = ACC.byId.get(key);
      if (!item || item.category !== slot) return;
      slots[slot] = key;
    };
    if (src.slots && typeof src.slots === "object") {
      SLOT_KEYS.forEach((slot) => accept(slot, src.slots[slot]));
    } else if (typeof src.equipped === "string" && src.equipped) {
      const item = ACC.byId.get(src.equipped);
      if (item) accept(item.category, src.equipped);
    }
    return slots;
  }

  // 保留 equipped 字符串镜像，兼容只认识旧字段的云同步逻辑
  function mirrorEquipped(slots) {
    return slots.accessory || slots.outfit || slots.wings || slots.handheld || slots.expression || slots.skin || "";
  }

  function normalizeShop(raw) {
    const src = raw && typeof raw === "object" ? raw : {};
    const owned = Array.isArray(src.owned)
      ? Array.from(new Set(src.owned.map((id) => String(id || "")).filter((id) => ACC.byId.has(id))))
      : [];
    const slots = normalizeSlots(src, owned);
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
      slots,
      equipped: mirrorEquipped(slots),
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
      slots: shop.slots,
      wearing: SLOT_KEYS.filter((slot) => shop.slots[slot]).length,
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
    shop.slots[item.category] = item.id;
    shop.equipped = mirrorEquipped(shop.slots);
    writeShop(shop);
    applyAccessory();
    notifyChanged();
    return { ok: true, item };
  }

  function equipItem(id) {
    const item = ACC.byId.get(String(id || ""));
    if (!item) return false;
    const shop = readShop();
    if (!shop.owned.includes(item.id)) return false;
    shop.slots[item.category] = item.id;
    shop.equipped = mirrorEquipped(shop.slots);
    writeShop(shop);
    applyAccessory();
    notifyChanged();
    return true;
  }

  // 传部位名只摘该部位；不传则四个部位一起摘
  function unequipItem(slot) {
    const shop = readShop();
    if (typeof slot === "string" && shop.slots[slot]) {
      shop.slots[slot] = "";
    } else if (typeof slot !== "string") {
      SLOT_KEYS.forEach((key) => { shop.slots[key] = ""; });
    } else {
      return false;
    }
    shop.equipped = mirrorEquipped(shop.slots);
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
    // 库存无上限：永远可以继续投喂叠加
    const food = Math.max(0, Math.floor(Number(lizz.food) || 0));
    const room = Infinity;
    const canFeed = available > 0;
    return {
      available,
      used,
      credits,
      counted,
      food,
      cap: Infinity,
      room,
      needMore: Math.max(0, (used + 1) * FEED_WORDS - counted),
      canFeed,
      reason: available <= 0 ? "empty" : "ok"
    };
  }

  function feedLizz() {
    const before = getFeedStatus();
    if (!before.canFeed) return { ok: false, ...before };

    let nextFood = 0;
    S.update((state) => {
      // 库存无上限：只叠加，不再封顶
      state.food = Math.max(0, Math.floor(Number(state.food) || 0)) + 1;
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
  function layerSVG(id, slot) {
    const item = ACC.byId.get(String(id || ""));
    if (!item) return "";
    return `<svg class="lz-acc-svg lz-acc-${slot}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${item.svg}</svg>`;
  }

  // 从后到前：翅膀 → 身体（衣服基座）→ 手持物 → 表情 → 头部配饰
  // 肤色不占绘制层，直接写进狐狸本体的 CSS 变量
  function layersHTML(slots) {
    return ["wings", "outfit", "handheld", "expression", "accessory"]
      .map((slot) => (slots[slot] ? layerSVG(slots[slot], slot) : ""))
      .join("");
  }

  // 把肤色调色板写到承载狐狸的容器上；摘下时移除变量，回到默认橘色
  function applySkin(root, skinItem) {
    if (!root) return;
    const palette = skinItem && skinItem.palette;
    if (palette) {
      root.style.setProperty("--lz-skin-fur", palette.fur);
      root.style.setProperty("--lz-skin-inner", palette.inner);
      root.style.setProperty("--lz-skin-shadow", palette.shadow);
      root.classList.add("lz-has-skin");
    } else {
      root.style.removeProperty("--lz-skin-fur");
      root.style.removeProperty("--lz-skin-inner");
      root.style.removeProperty("--lz-skin-shadow");
      root.classList.remove("lz-has-skin");
    }
  }

  function applyAccessory() {
    const shop = readShop();
    const html = layersHTML(shop.slots);
    const skinItem = ACC.byId.get(shop.slots.skin) || null;
    const holders = document.querySelectorAll("#lzLizzAccessory");
    Array.prototype.forEach.call(holders, (holder) => {
      holder.innerHTML = html;
      holder.classList.toggle("is-on", Boolean(html));
      applySkin(holder.closest(".lz-lizz-figure"), skinItem);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".lz-shop-bigfox"), (root) => applySkin(root, skinItem));
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
          <div class="lz-shop-owned"><span>已收集</span><b id="lzShopOwned">0/${ACC.items.length}</b></div>
          <div class="lz-shop-earn" id="lzShopEarn">今日已赚 0</div>
        </div>

        <div class="lz-shop-preview">
          <div class="lz-shop-bigfox">
            ${S.FOX_SVG}
            <div class="lz-shop-bigacc" id="lzShopBigAcc" aria-hidden="true"></div>
          </div>
          <div class="lz-shop-current">
            <p>Lizz 现在戴着</p>
            <div class="lz-shop-wearing" id="lzShopWearing"></div>
          </div>
        </div>

        <div class="lz-shop-filters" id="lzShopCats" role="group" aria-label="装扮类别"></div>
        <div class="lz-shop-filters" id="lzShopRarities" role="group" aria-label="稀有度筛选"></div>
        <div class="lz-shop-filters" id="lzShopRoutes" role="group" aria-label="衣服路线" hidden></div>
        <div class="lz-shop-grid" id="lzShopGrid"></div>
        <div class="lz-shop-pager" id="lzShopPager" hidden></div>
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
    const focusKey = focusSelectorOf(document.activeElement);
    const shop = readShop();
    const pointsEl = panel.querySelector("#lzShopPoints");
    const ownedEl = panel.querySelector("#lzShopOwned");
    const earnEl = panel.querySelector("#lzShopEarn");
    const wearingEl = panel.querySelector("#lzShopWearing");
    const bigAcc = panel.querySelector("#lzShopBigAcc");

    if (pointsEl) pointsEl.textContent = String(shop.points);
    if (ownedEl) ownedEl.textContent = `${shop.owned.length}/${ACC.items.length}`;
    if (earnEl) {
      const earned = todayEarned(shop);
      earnEl.textContent = earned > 0 ? `今日已赚 +${earned}` : "今日已赚 0";
    }

    if (wearingEl) {
      wearingEl.innerHTML = SLOT_KEYS.map((slot) => {
        const item = ACC.byId.get(shop.slots[slot]);
        const label = ACC.CATEGORY_LABELS[slot];
        return `<div class="lz-shop-wear">
          <span class="lz-shop-wear-slot">${label}</span>
          <b class="lz-shop-wear-name${item ? "" : " is-empty"}" title="${item ? item.name : ""}">${item ? item.name : "未佩戴"}</b>
          ${item ? `<button type="button" class="lz-shop-unequip" data-shop-unequip="${slot}" aria-label="摘下${label}：${item.name}">×</button>` : ""}
        </div>`;
      }).join("");
    }
    if (bigAcc) bigAcc.innerHTML = layersHTML(shop.slots);
    applySkin(panel.querySelector(".lz-shop-bigfox"), ACC.byId.get(shop.slots.skin) || null);

    renderFilters(shop);
    renderGrid(shop);
    if (focusKey) {
      const back = panel.querySelector(focusKey);
      if (back && !back.disabled) {
        back.focus({ preventScroll: true });
      } else {
        // 翻到最后一页时“下一页”会变成 disabled，焦点退回仍可用的翻页键 / 卡片
        const fallback = panel.querySelector(".lz-shop-page-btn:not([disabled])") || panel.querySelector("[data-shop-item]");
        if (fallback) fallback.focus({ preventScroll: true });
      }
    }
  }

  // 重绘后把焦点还给同一个筛选按钮，避免积分刷新时键盘焦点被吃掉
  function focusSelectorOf(el) {
    if (!el || !panel || !panel.contains(el) || typeof el.getAttribute !== "function") return "";
    const pairs = ["data-shop-cat", "data-shop-rarity", "data-shop-route", "data-shop-page", "data-shop-unequip", "data-shop-item"];
    for (let i = 0; i < pairs.length; i += 1) {
      const value = el.getAttribute(pairs[i]);
      if (value !== null) return `[${pairs[i]}="${value}"]`;
    }
    return "";
  }

  function shopChip(attr, key, label, count, active) {
    return `<button type="button" class="lz-shop-chip${active ? " is-active" : ""}" ${attr}="${key}" aria-pressed="${active}">${label}<span>${count}</span></button>`;
  }

  // 只应用「类别 + 路线」两层筛选，稀有度计数要用这个基数
  function baseItems(shop) {
    let list = ACC.items.slice();
    if (activeCategory === "owned") {
      list = list.filter((item) => shop.owned.includes(item.id));
    } else if (activeCategory !== "all") {
      list = list.filter((item) => item.category === activeCategory);
    }
    if (activeCategory === "outfit" && activeRoute !== "all") {
      list = list.filter((item) => item.route === activeRoute);
    }
    return list;
  }

  function visibleItems(shop) {
    const list = baseItems(shop);
    if (activeRarity === "all") return list;
    return list.filter((item) => item.rarity === activeRarity);
  }

  function renderFilters(shop) {
    const catWrap = panel.querySelector("#lzShopCats");
    const rarityWrap = panel.querySelector("#lzShopRarities");
    const routeWrap = panel.querySelector("#lzShopRoutes");
    const base = baseItems(shop);

    if (catWrap) {
      const catCounts = {
        all: ACC.items.length,
        owned: shop.owned.length
      };
      ["accessory", "outfit", "wings", "handheld", "expression", "skin"].forEach((key) => {
        catCounts[key] = ACC.items.filter((item) => item.category === key).length;
      });
      const catKeys = ["all", "accessory", "outfit", "wings", "handheld", "expression", "skin", "owned"];
      catWrap.innerHTML = catKeys.map((key) => shopChip(
        "data-shop-cat",
        key,
        key === "all" ? "全部" : (key === "owned" ? "已拥有" : ACC.CATEGORY_LABELS[key]),
        catCounts[key],
        activeCategory === key
      )).join("");
    }

    if (rarityWrap) {
      const rarityCounts = { all: base.length };
      base.forEach((item) => {
        rarityCounts[item.rarity] = (rarityCounts[item.rarity] || 0) + 1;
      });
      const rarityKeys = ["all", "common", "rare", "epic", "legendary"];
      rarityWrap.innerHTML = rarityKeys.map((key) => shopChip(
        "data-shop-rarity",
        key,
        key === "all" ? "不限稀有度" : ACC.RARITY[key].label,
        rarityCounts[key] || 0,
        activeRarity === key
      )).join("");
    }

    if (routeWrap) {
      const showRoutes = activeCategory === "outfit";
      routeWrap.hidden = !showRoutes;
      if (showRoutes) {
        const outfits = ACC.items.filter((item) => item.category === "outfit");
        const routeCounts = { all: outfits.length };
        outfits.forEach((item) => {
          routeCounts[item.route] = (routeCounts[item.route] || 0) + 1;
        });
        const routeKeys = ["all", "school", "daily", "glam", "abstract"];
        routeWrap.innerHTML = routeKeys.map((key) => shopChip(
          "data-shop-route",
          key,
          key === "all" ? "全部路线" : ACC.ROUTES[key],
          routeCounts[key] || 0,
          activeRoute === key
        )).join("");
      } else {
        routeWrap.innerHTML = "";
      }
    }
  }

  function itemAction(item, shop) {
    const owned = shop.owned.includes(item.id);
    const equipped = shop.slots[item.category] === item.id;
    if (equipped) return { text: "佩戴中 · 摘下", cls: "is-equipped" };
    if (owned) return { text: "戴上", cls: "is-owned" };
    if (pendingBuyId === item.id) return { text: `确认兑换 · ${item.price}`, cls: "is-pending" };
    if (shop.points < item.price) return { text: `还差 ${item.price - shop.points} 分`, cls: "is-locked" };
    return { text: `兑换 · ${item.price}`, cls: "" };
  }

  function renderGrid(shop) {
    const grid = panel.querySelector("#lzShopGrid");
    const pager = panel.querySelector("#lzShopPager");
    if (!grid) return;

    const list = visibleItems(shop);
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    pageIndex = Math.min(Math.max(pageIndex, 0), pages - 1);
    const start = pageIndex * PAGE_SIZE;
    const pageItems = list.slice(start, start + PAGE_SIZE);

    if (!list.length) {
      grid.innerHTML = `<p class="lz-shop-empty">这里还空着。换一个筛选，或者背几组单词把第一件装扮带回家吧。</p>`;
      if (pager) {
        pager.hidden = true;
        pager.innerHTML = "";
      }
      return;
    }

    grid.innerHTML = pageItems.map((item) => {
      const rarity = ACC.RARITY[item.rarity];
      const owned = shop.owned.includes(item.id);
      const equipped = shop.slots[item.category] === item.id;
      const action = itemAction(item, shop);
      const routeText = item.category === "outfit" && item.route ? ` · ${ACC.ROUTES[item.route]}` : "";
      const statusText = equipped ? " · 佩戴中" : (owned ? " · 已拥有" : "");
      const meta = `${rarity.label}${routeText}${statusText}`;
      const classes = [
        "lz-shop-card",
        `rarity-${item.rarity}`,
        owned ? "is-owned" : "",
        equipped ? "is-equipped" : "",
        action.cls
      ].filter(Boolean).join(" ");
      return `<button type="button" class="${classes}" data-shop-item="${item.id}" title="${item.hint}">
        <span class="lz-shop-thumb">
          <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${ACC.thumbOf(item)}</svg>
        </span>
        <span class="lz-shop-info">
          <span class="lz-shop-name">${item.name}</span>
          <span class="lz-shop-rarity">${meta}</span>
        </span>
        <span class="lz-shop-action">${action.text}</span>
      </button>`;
    }).join("");

    if (pager) {
      if (pages <= 1) {
        pager.hidden = true;
        pager.innerHTML = "";
      } else {
        pager.hidden = false;
        pager.innerHTML = `
          <button type="button" class="lz-shop-page-btn" data-shop-page="-1"${pageIndex === 0 ? " disabled" : ""}>上一页</button>
          <span class="lz-shop-page-num">第 ${pageIndex + 1} / ${pages} 页 · 共 ${list.length} 件</span>
          <button type="button" class="lz-shop-page-btn" data-shop-page="1"${pageIndex >= pages - 1 ? " disabled" : ""}>下一页</button>`;
      }
    }
  }

  function onPanelClick(event) {
    const closeTarget = event.target.closest("[data-shop-close]");
    if (closeTarget) {
      close();
      return;
    }

    const catBtn = event.target.closest("[data-shop-cat]");
    if (catBtn) {
      activeCategory = catBtn.getAttribute("data-shop-cat") || "all";
      activeRoute = "all";
      pageIndex = 0;
      pendingBuyId = "";
      render();
      return;
    }

    const rarityBtn = event.target.closest("[data-shop-rarity]");
    if (rarityBtn) {
      activeRarity = rarityBtn.getAttribute("data-shop-rarity") || "all";
      pageIndex = 0;
      pendingBuyId = "";
      render();
      return;
    }

    const routeBtn = event.target.closest("[data-shop-route]");
    if (routeBtn) {
      activeRoute = routeBtn.getAttribute("data-shop-route") || "all";
      pageIndex = 0;
      pendingBuyId = "";
      render();
      return;
    }

    const pageBtn = event.target.closest("[data-shop-page]");
    if (pageBtn && !pageBtn.disabled) {
      pageIndex += Number(pageBtn.getAttribute("data-shop-page")) || 0;
      pendingBuyId = "";
      render();
      const grid = panel.querySelector("#lzShopGrid");
      if (grid) grid.scrollIntoView({ block: "nearest" });
      return;
    }

    const unequipBtn = event.target.closest("[data-shop-unequip]");
    if (unequipBtn) {
      unequipItem(unequipBtn.getAttribute("data-shop-unequip"));
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

    if (shop.slots[item.category] === item.id) {
      unequipItem(item.category);
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
  let openFrame = null;
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
    if (openFrame) window.cancelAnimationFrame(openFrame);
    openFrame = window.requestAnimationFrame(() => {
      openFrame = null;
      if (!panel || panel.hidden) return;
      panel.classList.add("is-open");
    });
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
    if (openFrame) {
      window.cancelAnimationFrame(openFrame);
      openFrame = null;
    }
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
