/* ============================================================
   LIZZWORD · 权益分层（免费 / Plus）
   - 前端只负责「展示 + 引导」，真正的权益判定必须由服务端下发
     （Supabase profiles.plan），这里预留 applyServerProfile()
   - 本地只存一个 7 天全功能试用，避免新用户一进来就被墙挡住
   - 免费：6 本基础书 + 每天 20 个新词；Plus：全部词书 + 不限新词
   ============================================================ */
(function (global) {
  "use strict";

  const FREE_BOOKS = ["toefl-core-5000", "shanghai-primary", "cet4", "ielts", "middle", "daily"];
  const TRIAL_DAYS = 7;
  const FREE_DAILY_NEW = 20;
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
    const expired = data.expiresAt ? Date.now() > new Date(data.expiresAt).getTime() : false;
    const plan = expired && data.plan === "trial" ? "free" : data.plan;
    return { plan, expiresAt: data.expiresAt || "", trialDaysLeft: expired ? 0 : Math.max(0, Math.ceil((new Date(data.expiresAt) - Date.now()) / 86400000)) };
  }

  function isPlus() {
    const plan = state().plan;
    return plan === "plus" || plan === "pro" || plan === "trial";
  }

  function canOpenBook(bookId) {
    if (isPlus()) return true;
    return FREE_BOOKS.indexOf(bookId) >= 0;
  }

  function dailyNewLimit() {
    return isPlus() ? Infinity : FREE_DAILY_NEW;
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
        <p class="paywall-sub">免费版可以完整学完 6 本基础书，每天 20 个新词；Plus 解锁全部 30 本、不限新词、计划与跨端同步。</p>
        <ul class="paywall-list">
          <li>全部 30 本词书：雅思 / 考研 / 专四专八 / 医护 / 商务法律 …</li>
          <li>每日新词不限量，考试倒计时自动排计划</li>
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
    FREE_BOOKS,
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
