/* ============================================================
   LIZZWORD · 权益分层（免费 / Plus）
   - 前端只负责「展示 + 引导」，真正的权益判定必须由服务端下发
     （Supabase profiles.plan），这里预留 applyServerProfile()
   - 本地只存一个 7 天全功能试用，避免新用户一进来就被墙挡住
   - 免费：6 本基础书 + 每天 20 个新词；Plus：全部词书 + 不限新词
   ============================================================ */
(function (global) {
  "use strict";

  // 免费：零基础整本 + 任选一本基础书整本（默认来自用户选择，未选时给 zero-basic）
  const FREE_COMPLETE_BOOKS = ["zero-basic"];
  // 可试学（受每日 20 新词限制）的书：除这些之外的书需要 Plus
  const FREE_TRIAL_BOOKS = [
    "shanghai-primary", "middle", "daily", "cet4", "ielts", "toefl-core-5000",
    "ket-pet", "new-concept", "zhonggaozhi", "ab", "coca", "pets",
    "zhuanshengben", "zikao", "self-study", "gaokao", "cet6", "sat",
    "fce", "bec", "pte", "study-abroad", "kaoyan", "english-major",
    "medical", "business-law", "affix-roots", "collocation", "confusables"
  ];
  const TRIAL_DAYS = 8;
  const FREE_DAILY_NEW = 50;
  const PLUS_DAILY_NEW = Infinity;
  const PLAN_KEY = "lizzword_plan_v1";

  function read() {
    try {
      const raw = global.localStorage && global.localStorage.getItem(PLAN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function write(data) {
    try { global.localStorage.setItem(PLAN_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    return data;
  }

  function ensureTrial() {
    const current = read();
    if (current && current.plan) return current;
    const startedAt = new Date().toISOString();
    return write({ plan: "trial", startedAt, expiresAt: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString() });
  }

  function state() {
    const data = ensureTrial();
    const expired = data.forever ? false : (data.expiresAt ? Date.now() > new Date(data.expiresAt).getTime() : false);
    const plan = expired && data.plan === "trial" ? "free" : data.plan;
    const left = expired || !data.expiresAt ? 0 : Math.max(0, Math.ceil((new Date(data.expiresAt) - Date.now()) / 86400000));
    return { plan, forever: Boolean(data.forever), expiresAt: data.expiresAt || "", trialDaysLeft: left };
  }

  function isPlus() {
    const plan = state().plan;
    return plan === "plus" || plan === "pro" || plan === "team" || plan === "trial";
  }

  function canOpenBook(bookId) {
    if (isPlus()) return true;
    if (FREE_COMPLETE_BOOKS.indexOf(bookId) >= 0) return true;
    return FREE_TRIAL_BOOKS.indexOf(bookId) >= 0;
  }

  // 免费用户的书是否「完整解锁」（不受每日 20 词限制）
  function isBookComplete(bookId) {
    if (isPlus()) return true;
    const chosen = readChosenBook();
    return FREE_COMPLETE_BOOKS.indexOf(bookId) >= 0 || chosen === bookId;
  }

  function readChosenBook() {
    try { return global.localStorage.getItem("lizzword_free_book_v1") || ""; } catch (e) { return ""; }
  }

  function chooseFreeBook(bookId) {
    try { global.localStorage.setItem("lizzword_free_book_v1", String(bookId)); } catch (e) { /* ignore */ }
    return bookId;
  }

  function dailyNewLimit() {
    return isPlus() ? PLUS_DAILY_NEW : FREE_DAILY_NEW;
  }

  // 服务端下发后用这个覆盖本地状态（真正可信的权益来源）
  function applyServerProfile(profile) {
    if (!profile || !profile.plan) return state();
    return write({
      plan: profile.plan,
      expiresAt: profile.planExpiresAt || profile.expiresAt || "",
      startedAt: new Date().toISOString(),
      source: "server"
    });
  }

  // 内测邀请码：一码一人一次，兑换后按天数延长 Plus
  // Pro 原价 258；完整学完一本词书后可领 198 折扣价（一次机会）
  const PRO_PRICE = 258;
  const PRO_DISCOUNT_PRICE = 198;
  const PRO_DISCOUNT_KEY = "lizzword_pro_discount_v1";

  function proDiscountState() {
    try {
      const raw = global.localStorage.getItem(PRO_DISCOUNT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function markBookCompleted(bookId) {
    try {
      const data = proDiscountState() || {};
      data.books = data.books || [];
      if (data.books.indexOf(bookId) < 0) data.books.push(bookId);
      data.updatedAt = new Date().toISOString();
      global.localStorage.setItem(PRO_DISCOUNT_KEY, JSON.stringify(data));
      return data;
    } catch (e) { return null; }
  }

  function proPrice() {
    const data = proDiscountState();
    return data && Array.isArray(data.books) && data.books.length ? PRO_DISCOUNT_PRICE : PRO_PRICE;
  }

  const INVITE_CODES = {
    // 永久内测码
    "wansuiwansuiwanwansui1313113": { plan: "pro", days: 0, forever: true, label: "内测永久版" },
    // 一年内测码
    "nulixuexiya2027": { plan: "plus", days: 365, label: "内测一年版" },
    // 一月内测码
    "lizzzhaohaoyon!!!": { plan: "plus", days: 30, label: "内测一月版" },
    // 早期公开码（保留兼容）
    LIZZBETA: { plan: "plus", days: 30, label: "内测体验 30 天" },
    TRAE2026: { plan: "plus", days: 30, label: "内测体验 30 天" },
    DEEPSEEK: { plan: "plus", days: 30, label: "内测体验 30 天" }
  };

  function redeemCode(rawCode) {
    const code = String(rawCode || "").trim().toUpperCase();
    if (!code) return { ok: false, message: "请输入邀请码" };
    let entry = INVITE_CODES[code];
    if (!entry) {
      // 兼容大小写：所有码按大写再匹配一次
      for (const key of Object.keys(INVITE_CODES)) {
        if (key.toUpperCase() === code) { entry = INVITE_CODES[key]; break; }
      }
    }
    if (!entry) return { ok: false, message: "邀请码无效或已过期" };
    try {
      if (global.localStorage.getItem("lizzword_invite_used_" + code)) {
        return { ok: false, message: "这个邀请码已经在本机兑换过了" };
      }
      const current = state();
      if (entry.forever) {
        write({ plan: entry.plan, startedAt: new Date().toISOString(), expiresAt: "", forever: true, source: "invite:" + code });
        global.localStorage.setItem("lizzword_invite_used_" + code, "1");
        return { ok: true, message: entry.label + "已开通（永久有效）" };
      }
      const base = current.plan === "plus" || current.plan === "pro" || current.plan === "team"
        ? Math.max(Date.now(), new Date(current.expiresAt || 0).getTime() || 0)
        : Date.now();
      const expiresAt = new Date(base + entry.days * 86400000).toISOString();
      write({ plan: entry.plan, startedAt: new Date().toISOString(), expiresAt, source: "invite:" + code });
      global.localStorage.setItem("lizzword_invite_used_" + code, "1");
      return { ok: true, message: entry.label + "已开通" };
    } catch (e) {
      return { ok: false, message: "兑换失败，请稍后重试" };
    }
  }

  function openPaywall(bookName) {
    const existing = document.getElementById("paywallOverlay");
    if (existing) existing.remove();
    const overlay = document.createElement("div");
    overlay.id = "paywallOverlay";
    overlay.className = "paywall-overlay";
    overlay.innerHTML = `
      <div class="paywall-card" role="dialog" aria-modal="true" aria-label="升级 Plus">
        <p class="paywall-badge">LIZZWORD Plus</p>
        <h2 class="paywall-title">这本《${escapeHtml(bookName || "词书")}》属于 Plus</h2>
        <p class="paywall-sub">免费版可以完整学完 1 本（零基础整本免费），每天 50 个新词；Plus 解锁全部 30 本、每天 40 个新词、计划与跨端同步，22 个字段所有词条都可见。</p>
        <ul class="paywall-list">
          <li>全部 30 本词书：雅思 / 考研 / 专四专八 / 医护 / 商务法律 …</li>
          <li>新词不限量，考试倒计时自动排计划</li>
          <li>跟读评分、离线整书包、跨设备同步</li>
        </ul>
        <div class="paywall-actions">
          <button type="button" class="btn-ghost" data-paywall-close>先看看免费书</button>
          <button type="button" class="btn-primary" data-paywall-buy>了解 Plus（¥12/月起）</button>
        </div>
        <p class="paywall-note">正式支付需要登录并由服务端校验权益；当前为预览版本。</p>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest("[data-paywall-close]")) overlay.remove();
      if (event.target.closest("[data-paywall-buy]")) {
        overlay.remove();
        if (global.LZToast) global.LZToast("支付通道尚未接入：先在设置里看方案说明。");
      }
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function injectStyle() {
    if (document.getElementById("paywallStyle")) return;
    const style = document.createElement("style");
    style.id = "paywallStyle";
    style.textContent = `
      .paywall-overlay { position: fixed; inset: 0; z-index: 95; background: rgba(17,24,39,.5); display: flex; align-items: center; justify-content: center; padding: 18px; }
      .paywall-card { width: min(420px, 100%); background: #fff; border-radius: 18px; padding: 22px; box-shadow: 0 18px 50px rgba(0,0,0,.25); }
      .paywall-badge { display: inline-block; margin: 0 0 10px; padding: 3px 10px; border-radius: 999px; background: #eef4ff; color: #3157d5; font-size: .76rem; }
      .paywall-title { margin: 0 0 8px; font-size: 1.1rem; }
      .paywall-sub { margin: 0 0 12px; font-size: .86rem; color: #4b5563; line-height: 1.6; }
      .paywall-list { margin: 0 0 14px; padding-left: 18px; font-size: .84rem; color: #374151; line-height: 1.8; }
      .paywall-actions { display: flex; gap: 10px; justify-content: flex-end; }
      .paywall-note { margin: 12px 0 0; font-size: .74rem; color: #9ca3af; }
    `;
    document.head.appendChild(style);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectStyle);
    else injectStyle();
  }

  global.LZEntitlements = {
    PRO_PRICE,
    PRO_DISCOUNT_PRICE,
    proPrice,
    markBookCompleted,
    proDiscountState,
    INVITE_CODES,
    redeemCode,
    FREE_DAILY_NEW,
    PLUS_DAILY_NEW,
    FREE_COMPLETE_BOOKS,
    FREE_TRIAL_BOOKS,
    isBookComplete,
    chooseFreeBook,
    readChosenBook,
    FREE_DAILY_NEW,
    TRIAL_DAYS,
    state,
    isPlus,
    canOpenBook,
    dailyNewLimit,
    applyServerProfile,
    openPaywall
  };
})(typeof window !== "undefined" ? window : globalThis);
