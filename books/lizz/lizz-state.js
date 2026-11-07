/* ============================================================
   Lizz · 独立状态与视觉资源
   - localStorage key: lizzword_lizz_v1（不改动 lizzword_state_v1 的任何字段）
   - “第二天”按本地日期判断
   - 30 种颜文字与 Lizz 台词
   - 内置简笔小狐狸 SVG（不新增图片文件；仍保留 lizz.png 替换槽位）
   ============================================================ */
(function () {
  "use strict";

  const KEY = "lizzword_lizz_v1";
  const APP_KEY = "lizzword_state_v1";
  const PHOTO_KEY = "lizzword_lizz_photo_v1";
  const VERSION = 1;

  /* ===== 图片替换槽位 =====
     默认不加载 books/lizz/lizz.png：file:// 下文件不存在时，<img> 会在控制台留下
     一条 “ERR_FILE_NOT_FOUND” 红色报错。放好图片后执行一次
     LIZZWORD_LIZZ.usePhoto() 即可永久启用；也可用 ?lizz-photo=1 临时启用。 */
  const DEFAULT_PHOTO_URL = (function () {
    try {
      const src = document.currentScript && document.currentScript.src ? document.currentScript.src : "";
      return src ? src.replace(/[^\/]*$/, "lizz.png") : "books/lizz/lizz.png";
    } catch (error) {
      return "books/lizz/lizz.png";
    }
  })();

  function photoUrl() {
    try {
      const stored = window.localStorage.getItem(PHOTO_KEY);
      if (stored) return stored;
    } catch (error) { /* 本地存储不可用时保持默认 */ }
    if (window.LIZZWORD_LIZZ_PHOTO === true) return DEFAULT_PHOTO_URL;
    try {
      if (new URLSearchParams(window.location.search).get("lizz-photo") === "1") return DEFAULT_PHOTO_URL;
    } catch (error) { /* 非标准环境忽略 */ }
    return "";
  }

  /* ===== 30 种颜文字 ===== */
  const FACES = [
    "(￣▽￣)",
    "(*¯︶¯*)",
    "（＾∇＾）",
    "(ﾟoﾟ;;",
    "(´･ω･`)",
    "(๑•̀ㅂ•́)و",
    "(＾▽＾)",
    "(￣ω￣)",
    "(´｡• ᵕ •｡`)",
    "(・∀・)",
    "(￣ε￣)",
    "(｡•́︿•̀｡)",
    "(⌒▽⌒)",
    "(´-ω-`)",
    "(≧∇≦)",
    "(；´д｀)",
    "(￣^￣)ゞ",
    "(´,,•ω•,,)",
    "(｡>﹏<｡)",
    "(￣▽￣)ゞ",
    "(•‿•)",
    "(´･_･`)",
    "(＠_＠;)",
    "(￣～￣;)",
    "(Ｔ▽Ｔ)",
    "(￣︶￣)",
    "(๑>؂<๑)",
    "(｡ì _ í｡)",
    "(￣Д￣)ﾉ",
    "(´；ω；`)"
  ];

  /* ===== Lizz 台词（社恐 INFJ 语气） ===== */
  const LINES = {
    intro: [
      "那个…我、我叫 Lizz。",
      "我不太会跟人说话，也不太会看气氛…但我想把这一遍讲清楚。",
      "我们从最简单的三个词开始，好吗？就 hello、bye、love。"
    ],
    introButton: "嗯…开始吧",
    correct: [
      "嗯…对了。",
      "哦…这个你记住了。",
      "你比我稳。我刚刚还有点紧张。",
      "对…对的。慢慢来就好。"
    ],
    wrong: [
      "啊…没关系，我、我也常记错。",
      "先看清正确答案，我们再来一次。",
      "别急…这个词会重新走一遍，我陪着你。"
    ],
    skip: [
      "好…那我先退到一边。想继续的时候再叫我。",
      "没事的，跳过也可以。我就在角落待着。"
    ],
    finish: [
      "走完了…！",
      "五步都走完了。你比我想的厉害。",
      "以后我就待在左下角。点我一下，我会冒个颜文字。"
    ],
    groupPraise: [
      "你、你学完了…！我一直在这边看着。",
      "这一组结束了…你比刚才稳多了。真的。",
      "完成了…我、我有点替你高兴。",
      "你坚持下来了…我在角落里记着呢。",
      "一组学完啦…我、我想给你鼓个掌。",
      "刚才你特别专注…我都不敢出声。"
    ],
    groupThanks: [
      "谢谢你…愿意让我待在旁边。下一组，我还在。",
      "被你想起来…我很开心。我们一点点继续，好吗？",
      "谢谢你还点了我一下…我会一直陪着的。",
      "这声谢谢…我收下了。你慢慢学，不用急。",
      "你愿意继续，我就愿意等。下一组见，好吗？",
      "谢谢你…今天也辛苦了。再来一点点就好。"
    ],
    softHide: [
      "我…先躲起来。",
      "你背完 10 个单词，我就会回到主界面。真的，10 个。"
    ],
    gone: [
      "这次…我要消失到明天。",
      "明天我才会回来。别、别忘了我。"
    ],
    returned: [
      "我…我回来了。",
      "你背完了。我看见了。"
    ],
    stay: [
      "以后我就待在左下角。",
      "点我一下就好。"
    ],
    click: [
      "……",
      "嗯？",
      "别、别一直点…",
      "我在。"
    ]
  };

  /* ===== 内置简笔小狐狸（一只耳朵立着、一只耳朵塌着） ===== */
  const FOX_SVG = `
    <svg viewBox="0 0 100 100" class="lz-fox-svg" role="img" aria-label="Lizz，一只害羞的小狐狸">
      <ellipse class="lz-fox-shadow" cx="50" cy="93" rx="21" ry="3.5" fill="#e3eaf4"/>

      <!-- 尾巴：从身体右侧长出来，向上卷 -->
      <path class="lz-fox-tail" d="M59 83c6 9 17 12 25 8 6-3 7-10 3-14-3-3-8-2-8 2 0 3 3 5 6 4" fill="#f4b26f" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>

      <!-- 身体：坐姿，底部圆润 -->
      <path class="lz-fox-body" d="M40 57c-6 4-8 14-8 23 0 8 7 12 18 12s18-4 18-12c0-9-2-19-8-23z" fill="#f4b26f" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
      <path d="M44 66c0 12 2 20 6 20s6-8 6-20c0-5-12-5-12 0z" fill="#fff"/>
      <ellipse cx="41" cy="91" rx="5.5" ry="3" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.8"/>
      <ellipse cx="59" cy="91" rx="5.5" ry="3" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.8"/>

      <!-- 耳朵：左耳立着，右耳软软地塌下去 -->
      <path class="lz-fox-ear-up" d="M31 24Q27 14 31 4Q38 10 46 19Z" fill="#f4b26f" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
      <path d="M31 18Q29 12 31 8Q35 11 40 15Z" fill="#ffe3cb"/>
      <path class="lz-fox-ear-droop" d="M65 21Q76 24 79 33Q82 41 78 45Q73 48 70 42Q67 34 68 27Q65 24 65 21Z" fill="#f4b26f" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
      <path d="M69 26Q75 30 76 36Q77 41 74 41Q70 37 69 30Z" fill="#ffe3cb"/>

      <!-- 头 -->
      <circle class="lz-fox-head" cx="50" cy="38" r="21" fill="#f4b26f" stroke="#4a3b32" stroke-width="2"/>
      <ellipse cx="50" cy="48" rx="13" ry="9.5" fill="#fff"/>

      <!-- 怯生生的眉眼 -->
      <path d="M36 31q3-3 7-1M64 31q-3-3-7-1" fill="none" stroke="#4a3b32" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
      <circle cx="41.5" cy="37" r="2.6" fill="#4a3b32"/>
      <circle cx="58.5" cy="37" r="2.6" fill="#4a3b32"/>
      <circle cx="42.4" cy="36.1" r=".9" fill="#fff"/>
      <circle cx="59.4" cy="36.1" r=".9" fill="#fff"/>
      <ellipse cx="33" cy="45" rx="4" ry="2.4" fill="#f7b2b2" opacity=".8"/>
      <ellipse cx="67" cy="45" rx="4" ry="2.4" fill="#f7b2b2" opacity=".8"/>
      <path d="M47.6 45.5h4.8l-2.4 2.8z" fill="#4a3b32"/>
      <path d="M48.4 50.5q1.6 2.4 3.2 0" fill="none" stroke="#4a3b32" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;

  window.LIZZWORD_LIZZ_FOX_SVG = FOX_SVG;

  /* ===== 简笔小碗 =====
     默认是空的；每完成一组学习加一份食物（上限 FOOD_CAP 份，点击不消耗）。
     碗里最多显示 3 份，超出部分只记在状态里。 */
  const FOOD_CAP = 5;
  const BOWL_SVG = `
    <svg viewBox="0 0 48 34" class="lz-bowl-svg" role="img" aria-label="Lizz 的小碗">
      <ellipse cx="24" cy="31" rx="15" ry="2.6" fill="#e8edf6"/>
      <path d="M6 12h36c0 9-7 15-18 15S6 21 6 12z" fill="#fffaf2" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
      <g class="lz-food lz-food-1" transform="translate(9 6)">
        <path d="M0 3c2.4-3.6 6.2-3.6 8.6 0-2.4 3.6-6.2 3.6-8.6 0z" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M0 3l-3.2-2.2v4.4z" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.5" stroke-linejoin="round"/>
        <circle cx="6" cy="2.1" r=".65" fill="#4a3b32"/>
      </g>
      <g class="lz-food lz-food-2" transform="translate(18 5)">
        <path d="M0 3c2.4-3.6 6.2-3.6 8.6 0-2.4 3.6-6.2 3.6-8.6 0z" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M0 3l-3.2-2.2v4.4z" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.5" stroke-linejoin="round"/>
        <circle cx="6" cy="2.1" r=".65" fill="#4a3b32"/>
      </g>
      <g class="lz-food lz-food-3" transform="translate(27 6.6)">
        <path d="M0 3c2.4-3.6 6.2-3.6 8.6 0-2.4 3.6-6.2 3.6-8.6 0z" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M0 3l-3.2-2.2v4.4z" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.5" stroke-linejoin="round"/>
        <circle cx="6" cy="2.1" r=".65" fill="#4a3b32"/>
      </g>
      <ellipse cx="24" cy="12" rx="18" ry="4.6" fill="#fffaf2" stroke="#4a3b32" stroke-width="2"/>
    </svg>`;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function dateKeyOf(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function tomorrowKey() {
    const now = new Date();
    return dateKeyOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  }

  function baseState() {
    return {
      v: VERSION,
      tutorialDone: false,
      tutorialSkippedAt: "",
      tutorialFinishedAt: "",
      introSeen: false,
      mode: "active",          // active | hidden（背完 10 词回来） | gone（第二天回来）
      hiddenAt: "",
      hiddenBaseline: null,    // { date, groupsToday, wordsToday }
      goneUntil: "",
      lastFace: -1,
      softHideCount: 0,
      goneCount: 0,
      food: 0,                 // 碗里食物份数（0–FOOD_CAP，点击不消耗）
      groupSeen: null,         // { date, groupsToday }：识别“又完成了一组”
      thanksPending: false,    // 完成一组后等用户点一下道谢
      praiseAt: "",
      lastPraise: -1,
      lastThanks: -1,
      updatedAt: ""
    };
  }

  function normalizeBaseline(value) {
    if (!value || typeof value !== "object") return null;
    return {
      date: typeof value.date === "string" ? value.date : "",
      groupsToday: Number(value.groupsToday) || 0,
      wordsToday: Number(value.wordsToday) || 0
    };
  }

  function normalizeGroupSeen(value) {
    if (!value || typeof value !== "object") return null;
    if (typeof value.date !== "string" || !value.date) return null;
    return {
      date: value.date,
      groupsToday: Number(value.groupsToday) || 0
    };
  }

  /* 只读主应用进度，绝不写 lizzword_state_v1 */
  function readAppProgress() {
    try {
      const raw = window.localStorage.getItem(APP_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return {
        date: typeof parsed.groupStatsDate === "string" ? parsed.groupStatsDate : "",
        groupsToday: Number(parsed.groupsToday) || 0,
        wordsToday: Number(parsed.wordsToday) || 0
      };
    } catch (error) {
      return null;
    }
  }

  /* 软隐藏后：从躲起来那一刻算，背完 10 个词才回来 */
  function shouldReturn(state) {
    const p = readAppProgress();
    const b = state.hiddenBaseline;
    if (!p) return false;
    const today = dateKeyOf();
    if (b && p.date === b.date) {
      return p.date === today && p.wordsToday - b.wordsToday >= 10;
    }
    // 跨天后：主应用进度已切到新的一天，要求当天累计 ≥ 10
    return p.date === today && p.wordsToday >= 10;
  }

  function persist(state) {
    state.updatedAt = new Date().toISOString();
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
      /* 隐私模式或存储被禁用时，至少让本次会话继续可用 */
    }
    return state;
  }

  function load() {
    let parsed = null;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) parsed = JSON.parse(raw);
    } catch (error) {
      parsed = null;
    }

    const state = Object.assign(baseState(), parsed && typeof parsed === "object" ? parsed : {});
    state.v = VERSION;
    state.tutorialDone = Boolean(state.tutorialDone);
    state.introSeen = Boolean(state.introSeen);
    state.tutorialSkippedAt = typeof state.tutorialSkippedAt === "string" ? state.tutorialSkippedAt : "";
    state.tutorialFinishedAt = typeof state.tutorialFinishedAt === "string" ? state.tutorialFinishedAt : "";
    state.hiddenAt = typeof state.hiddenAt === "string" ? state.hiddenAt : "";
    state.goneUntil = typeof state.goneUntil === "string" ? state.goneUntil : "";
    state.lastFace = Number.isInteger(state.lastFace) ? state.lastFace : -1;
    state.softHideCount = Number(state.softHideCount) || 0;
    state.goneCount = Number(state.goneCount) || 0;
    state.hiddenBaseline = normalizeBaseline(state.hiddenBaseline);
    state.food = Math.min(FOOD_CAP, Math.max(0, Number(state.food) || 0));
    state.groupSeen = normalizeGroupSeen(state.groupSeen);
    state.thanksPending = Boolean(state.thanksPending);
    state.praiseAt = typeof state.praiseAt === "string" ? state.praiseAt : "";
    state.lastPraise = Number.isInteger(state.lastPraise) ? state.lastPraise : -1;
    state.lastThanks = Number.isInteger(state.lastThanks) ? state.lastThanks : -1;
    if (!["active", "hidden", "gone"].includes(state.mode)) state.mode = "active";

    let changed = false;
    const today = dateKeyOf();

    // 彻底不见：第二天（本地日期）自动回来
    if (state.mode === "gone") {
      if (!state.goneUntil || today >= state.goneUntil) {
        state.mode = "active";
        state.goneUntil = "";
        changed = true;
      }
    }

    // 软隐藏：只有背完 10 个词才回来
    if (state.mode === "hidden") {
      if (shouldReturn(state)) {
        state.mode = "active";
        state.hiddenBaseline = null;
        state.hiddenAt = "";
        changed = true;
      }
    }

    if (changed) persist(state);
    return state;
  }

  function save(state) {
    return persist(state);
  }

  function setMode(state, mode, extra) {
    state.mode = mode;
    if (mode === "active") {
      state.hiddenAt = "";
      state.hiddenBaseline = null;
      state.goneUntil = "";
    }
    if (mode === "hidden") {
      state.hiddenAt = new Date().toISOString();
      const p = readAppProgress();
      state.hiddenBaseline = {
        date: p && p.date ? p.date : dateKeyOf(),
        groupsToday: p ? p.groupsToday : 0,
        wordsToday: p ? p.wordsToday : 0
      };
    }
    if (mode === "gone") {
      state.hiddenAt = new Date().toISOString();
      state.hiddenBaseline = null;
      state.goneUntil = tomorrowKey();
    }
    if (extra && typeof extra === "object") Object.assign(state, extra);
    return persist(state);
  }

  function pickFace(state, random) {
    if (state.lastFace < 0 || state.lastFace >= FACES.length) {
      state.lastFace = Math.floor((random || Math.random)() * FACES.length);
    } else {
      // 避免连续两次同一个颜文字
      const offset = 1 + Math.floor((random || Math.random)() * (FACES.length - 1));
      state.lastFace = (state.lastFace + offset) % FACES.length;
    }
    persist(state);
    return FACES[state.lastFace];
  }

  window.LIZZWORD_LIZZ_STATE = {
    KEY,
    APP_KEY,
    PHOTO_KEY,
    DEFAULT_PHOTO_URL,
    VERSION,
    FACES,
    LINES,
    FOX_SVG,
    BOWL_SVG,
    FOOD_CAP,
    dateKeyOf,
    tomorrowKey,
    readAppProgress,
    shouldReturn,
    load,
    save,
    setMode,
    pickFace,
    photoUrl
  };
})();
