/* ============================================================
   LIZZWORD · 入门问卷（私人定制）
   - 首次进入弹 3 题，30 秒完成；可跳过
   - 结果存 localStorage: lizzword_profile_v1
   - 对外：LZOnboarding.load() / save() / open() / plan(stats)
   ============================================================ */
(function (global) {
  "use strict";

  const KEY = "lizzword_profile_v1";

  function load() {
    try {
      const raw = global.localStorage && global.localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : null;
    } catch (e) {
      return null;
    }
  }

  function save(profile) {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(profile));
    } catch (e) { /* ignore */ }
    return profile;
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  const GOAL_OPTIONS = [
    ["zero", "零基础，从最简单的开始"],
    ["exam_middle", "中高考"],
    ["exam_cet", "四六级"],
    ["exam_postgrad", "考研"],
    ["exam_ielts", "雅思 / 托福 / 留学"],
    ["work", "职场英语"],
    ["interest", "兴趣，随便学学"]
  ];

  const LEVEL_OPTIONS = [
    ["zero", "完全零基础"],
    ["some", "认得一些词"],
    ["sentence", "能读简单句子"],
    ["cet4", "四级水平"],
    ["cet6", "六级以上"]
  ];

  const PREF_OPTIONS = [
    ["picture", "看图记"],
    ["listen", "听声音"],
    ["spell", "动手拼"],
    ["example", "看例句"],
    ["root", "拆词根"],
    ["game", "玩小游戏"]
  ];

  function existingProfile() {
    return load();
  }

  function open(options) {
    const opts = options || {};
    const current = load() || {};
    const plan = global.LZPlan;
    const goals = (plan && plan.GOALS) || {};
    const overlay = document.createElement("div");
    overlay.className = "onboard-overlay";

    const goalOptions = GOAL_OPTIONS.map(([value, label]) => {
      const selected = current.goal === value ? " selected" : "";
      return `<option value="${esc(value)}"${selected}>${esc(label)}</option>`;
    }).join("");
    const levelOptions = LEVEL_OPTIONS.map(([value, label]) => {
      const selected = current.level === value ? " selected" : "";
      return `<option value="${esc(value)}"${selected}>${esc(label)}</option>`;
    }).join("");
    const prefOptions = PREF_OPTIONS.map(([value, label]) => {
      const on = Array.isArray(current.prefs) && current.prefs.indexOf(value) >= 0;
      return `<label class="onboard-chip"><input type="checkbox" value="${esc(value)}"${on ? " checked" : ""}> ${esc(label)}</label>`;
    }).join("");
    const minutes = [5, 10, 20, 30].map((value) => {
      const selected = Number(current.minutes || 10) === value ? " selected" : "";
      return `<option value="${value}"${selected}>${value} 分钟</option>`;
    }).join("");

    overlay.innerHTML = `
      <div class="onboard-card" role="dialog" aria-modal="true" aria-label="定制学习计划">
        <h2 class="onboard-title">30 秒定制你的学习计划</h2>
        <p class="onboard-sub">只问几件事，之后每天的任务卡会按你的情况来排。</p>
        <label class="onboard-field">你的目标是
          <select data-plan-goal>${goalOptions}</select>
        </label>
        <label class="onboard-field">每天能学多久
          <select data-plan-minutes>${minutes}</select>
        </label>
        <label class="onboard-field">现在的水平
          <select data-plan-level>${levelOptions}</select>
        </label>
        <div class="onboard-field">喜欢怎么学（可多选）
          <div class="onboard-chips">${prefOptions}</div>
        </div>
        <label class="onboard-field">考试日期（可选）
          <input type="date" data-plan-date value="${esc(current.examDate || "")}">
        </label>
        <div class="onboard-actions">
          <button type="button" class="btn-ghost" data-plan-skip>先随便看看</button>
          <button type="button" class="btn-primary" data-plan-save>生成我的计划</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const close = () => {
      overlay.remove();
      if (typeof opts.onClose === "function") opts.onClose();
    };

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });

    const saveBtn = overlay.querySelector("[data-plan-save]");
    saveBtn.addEventListener("click", () => {
      const prefs = [...overlay.querySelectorAll(".onboard-chips input:checked")].map((el) => el.value);
      const profile = {
        goal: overlay.querySelector("[data-plan-goal]").value,
        minutes: Number(overlay.querySelector("[data-plan-minutes]").value) || 10,
        level: overlay.querySelector("[data-plan-level]").value,
        prefs: prefs.length ? prefs : ["listen", "example"],
        examDate: overlay.querySelector("[data-plan-date]").value || "",
        reminder: true,
        createdAt: new Date().toISOString()
      };
      save(profile);
      close();
      if (typeof opts.onSave === "function") opts.onSave(profile);
    });

    overlay.querySelector("[data-plan-skip]").addEventListener("click", () => {
      if (!load()) {
        save({ goal: "interest", minutes: 10, level: "some", prefs: ["listen", "example"], examDate: "", reminder: true, skipped: true });
      }
      close();
      if (typeof opts.onSkip === "function") opts.onSkip();
    });
  }

  global.LZOnboarding = {
    KEY,
    load,
    save,
    open,
    hasProfile: () => Boolean(load())
  };
})(typeof window !== "undefined" ? window : globalThis);
