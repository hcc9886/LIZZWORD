/* ============================================================
   LIZZWORD · 背景主题（白天/夜间护眼配色，可自选）
   - 选择存 localStorage: lizzword:theme_v1，跨刷新与跨页面保留
   - auto：06:00–17:59 用护眼米黄纸色，18:00–05:59 用夜间深色
   - 颜色变量全部在 theme.css，这里只负责切换 html[data-theme]
   ============================================================ */
(function () {
  "use strict";

  const KEY = "lizzword:theme_v1";
  const CHOICES = [
    { id: "auto", label: "自动（白天护眼 · 夜间深色）" },
    { id: "light", label: "白天 · 清爽白" },
    { id: "paper", label: "护眼 · 米黄纸色" },
    { id: "green", label: "护眼 · 豆沙绿" },
    { id: "dark", label: "夜间 · 深色" }
  ];
  const IDS = CHOICES.map((c) => c.id);
  // 各主题下的页面底色，同步给浏览器地址栏/状态栏
  const PAGE_BG = { light: "#f3f6fa", paper: "#f5f0e3", green: "#e4f0dd", dark: "#171a22" };
  // 白天沿用页面自己写的底色（主站是冷灰，小游戏是暖米色）
  const metaTag = document.querySelector('meta[name="theme-color"]');
  const LIGHT_BG = (metaTag && metaTag.getAttribute("content")) || PAGE_BG.light;

  let timer = null;

  function readChoice() {
    try {
      const raw = window.localStorage.getItem(KEY);
      return IDS.includes(raw) ? raw : "auto";
    } catch (error) {
      return "auto";
    }
  }

  function writeChoice(id) {
    try { window.localStorage.setItem(KEY, id); } catch (error) { /* 存储不可用时仅本次会话生效 */ }
  }

  function isDaytime(date) {
    const h = (date || new Date()).getHours();
    return h >= 6 && h < 18;
  }

  function resolve(choice) {
    if (choice !== "auto") return choice;
    return isDaytime() ? "paper" : "dark";
  }

  function apply(choice) {
    const theme = resolve(choice);
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? LIGHT_BG : (PAGE_BG[theme] || LIGHT_BG));
    try {
      document.dispatchEvent(new CustomEvent("lizzword:theme-changed", { detail: { choice, theme } }));
    } catch (error) { /* ignore */ }
    return theme;
  }

  function syncPickers() {
    const choice = readChoice();
    document.querySelectorAll("[data-theme-mount] select").forEach((sel) => {
      if (sel.value !== choice) sel.value = choice;
    });
  }

  function setChoice(id) {
    const next = IDS.includes(id) ? id : "auto";
    writeChoice(next);
    apply(next);
    syncPickers();
    schedule();
    return next;
  }

  function mount(el) {
    if (!el || el.querySelector("select")) return;
    const choice = readChoice();
    const label = document.createElement("label");
    label.className = "theme-pick";
    const span = document.createElement("span");
    span.textContent = "背景";
    const sel = document.createElement("select");
    sel.setAttribute("aria-label", "背景颜色");
    CHOICES.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.label;
      sel.appendChild(opt);
    });
    sel.value = choice;
    sel.addEventListener("change", () => setChoice(sel.value));
    label.appendChild(span);
    label.appendChild(sel);
    el.appendChild(label);
  }

  function mountAll() {
    document.querySelectorAll("[data-theme-mount]").forEach(mount);
  }

  // auto 模式下开着页面跨过了 6 点/18 点也要跟着换
  function schedule() {
    if (timer) window.clearTimeout(timer);
    timer = null;
    if (readChoice() !== "auto") return;
    const now = new Date();
    const next = new Date(now);
    next.setMinutes(0, 0, 0);
    next.setHours(now.getHours() + 1);
    timer = window.setTimeout(() => {
      apply(readChoice());
      schedule();
    }, Math.max(1000, next.getTime() - now.getTime()));
  }

  function refresh() {
    apply(readChoice());
    syncPickers();
    schedule();
  }

  window.LIZZWORD_THEME = {
    KEY,
    CHOICES,
    get: readChoice,
    set: setChoice,
    resolved: () => resolve(readChoice()),
    isDaytime,
    mount,
    refresh
  };

  apply(readChoice());
  schedule();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh();
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll);
  } else {
    mountAll();
  }
})();